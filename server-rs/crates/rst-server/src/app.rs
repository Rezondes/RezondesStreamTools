//! The HTTP server (template: `route` in `server/index.ts`): writing requests only from the own origin, routes from
//! the rights table, overlay URLs under `/s/<login>/`, otherwise the dashboard and tools from `DIST`. Every answer
//! carries `nosniff`; HTML may only be framed by the own origin.

use std::path::Path;
use std::sync::{Arc, Mutex, MutexGuard};

use axum::Router;
use axum::extract::{Request, State};
use axum::http::{HeaderValue, header};
use axum::response::Response;
use rst_app::access::admin::AccessAdmin;
use rst_app::identity::login::LoginFlow;
use rst_domain::access::is_admin;
use rst_domain::identity::oauth::LoginStates;
use rst_domain::identity::session::{OAUTH_STATE_SECONDS, is_secure_url};
use rst_domain::identity::values::Login;
use rst_domain::paths::{OverlayRoute, StreamerPath};
use rst_infra::db::sqlite_audit::SqliteAudit;
use rst_infra::db::sqlite_records::SqliteRecords;
use rst_infra::db::sqlite_server_settings::SqliteServerSettings;
use rst_infra::db::sqlite_sessions::SqliteSessions;
use rst_infra::db::sqlite_streamers::SqliteStreamers;
use rst_infra::keys::sqlite::SqliteKeyStore;
use rst_infra::twitch::oauth::TwitchClient;

use crate::clock::now_ms;
use crate::config::ServerConfig;
use crate::errors::{pending, server_error, text};
use crate::guard::{cookie, origin_of, same_origin};
use crate::handlers::{Call, handle};
use crate::routes::{Found, Visitor, authorize, find};
use crate::static_files::{content_type, resolve};
use crate::wiring::Stores;

/// Media opened directly (e.g. an uploaded SVG) must not run scripts
pub const SANDBOX_CSP: &str =
    "sandbox; default-src 'none'; img-src 'self' data:; media-src 'self'; style-src 'unsafe-inline'";
const FRAME_CSP: &str = "frame-ancestors 'self'";

pub type AppAccessAdmin<'a> =
    AccessAdmin<'a, SqliteStreamers, SqliteRecords, SqliteKeyStore, SqliteSessions, SqliteServerSettings, SqliteAudit>;

pub type AppLoginFlow<'a> =
    LoginFlow<'a, SqliteStreamers, SqliteRecords, SqliteKeyStore, SqliteSessions, SqliteServerSettings, SqliteAudit>;

/// Pending Twitch logins: at most this many, each valid for 10 minutes
const PENDING_LOGINS: usize = 1000;

pub struct App {
    pub config: ServerConfig,
    pub public_origin: String,
    /// Cookies only over HTTPS when the public URL is HTTPS
    pub secure: bool,
    pub stores: Stores,
    pub twitch: TwitchClient,
    twitch_states: Mutex<LoginStates<()>>,
}

impl App {
    #[must_use]
    pub fn new(config: ServerConfig, stores: Stores) -> Self {
        let redirect = format!("{}/auth/callback", config.public_url);
        let twitch = TwitchClient::new(
            &config.twitch.client_id,
            &config.twitch.client_secret,
            &redirect,
            &config.providers.twitch_id,
            &config.providers.twitch_api,
        );
        Self {
            public_origin: origin_of(&config.public_url),
            secure: is_secure_url(&config.public_url),
            twitch,
            twitch_states: Mutex::new(LoginStates::new(OAUTH_STATE_SECONDS * 1000, PENDING_LOGINS)),
            config,
            stores,
        }
    }

    pub fn twitch_states(&self) -> MutexGuard<'_, LoginStates<()>> {
        self.twitch_states.lock().unwrap_or_else(std::sync::PoisonError::into_inner)
    }

    #[must_use]
    pub fn access_admin(&self) -> AppAccessAdmin<'_> {
        let stores = &self.stores;
        AccessAdmin {
            access: &stores.access,
            audit: &stores.audit,
            sessions: &stores.sessions,
            streamers: &stores.streamers,
            profile: &stores.profile,
            admins: &self.config.admins,
        }
    }

    #[must_use]
    pub fn login_flow(&self) -> AppLoginFlow<'_> {
        let stores = &self.stores;
        LoginFlow {
            streamers: &stores.streamers,
            profile: &stores.profile,
            sessions: &stores.sessions,
            overlay_keys: &stores.overlay_keys,
            access: &stores.access,
            audit: &stores.audit,
            admins: &self.config.admins,
        }
    }

    /// Caller from the session cookie and what the access policy grants; no session = an empty visitor
    async fn visitor(&self, cookies: Option<&str>) -> Result<Visitor, String> {
        let session = cookie(cookies, "sid");
        let Some(streamer) =
            self.stores.sessions.resolve(session.as_deref(), now_ms()).await.map_err(|error| error.to_string())?
        else {
            return Ok(Visitor::default());
        };
        let Ok(Some(login)) = self.stores.streamers.login_of(&streamer).await else { return Ok(Visitor::default()) };
        let admins = &self.config.admins;
        let policy = self.stores.access.load(admins).await.map_err(|error| error.to_string())?;
        Ok(Visitor {
            allowed: policy.can_use(admins, &login),
            admin: is_admin(admins, &login),
            features: policy.features(admins, &login),
            login: Some(login.to_string()),
            streamer: Some(streamer),
        })
    }

    /// Whether `/s/<login>/` belongs to an enabled streamer
    async fn known(&self, login: &Login) -> Result<bool, String> {
        if self.stores.streamers.find_by_login(login).await.map_err(|error| error.to_string())?.is_none() {
            return Ok(false);
        }
        let policy = self.stores.access.load(&self.config.admins).await.map_err(|error| error.to_string())?;
        Ok(policy.can_use(&self.config.admins, login))
    }
}

pub fn router(app: Arc<App>) -> Router {
    Router::new().fallback(dispatch).with_state(app)
}

async fn dispatch(State(app): State<Arc<App>>, request: Request) -> Response {
    let mut response = route(&app, request).await;
    let headers = response.headers_mut();
    headers.insert(header::X_CONTENT_TYPE_OPTIONS, HeaderValue::from_static("nosniff"));
    let html = headers.get(header::CONTENT_TYPE).is_some_and(|value| value.as_bytes().starts_with(b"text/html"));
    if html && !headers.contains_key(header::CONTENT_SECURITY_POLICY) {
        headers.insert(header::CONTENT_SECURITY_POLICY, HeaderValue::from_static(FRAME_CSP));
    }
    response
}

async fn route(app: &App, request: Request) -> Response {
    let method = request.method().as_str().to_owned();
    let path = request.uri().path().to_owned();
    let origin = request.headers().get(header::ORIGIN).and_then(|value| value.to_str().ok());
    if !same_origin(&method, origin, &app.public_origin) {
        return text(403, "cross-origin");
    }
    match find(&method, &path) {
        Some(Found::MethodNotAllowed) => return text(405, "method-not-allowed"),
        Some(Found::Route(route)) => {
            let cookies =
                request.headers().get(header::COOKIE).and_then(|value| value.to_str().ok()).map(str::to_owned);
            let visitor = match app.visitor(cookies.as_deref()).await {
                Ok(visitor) => visitor,
                Err(error) => return server_error(&error),
            };
            if let Err(refusal) = authorize(route.guard(), &visitor) {
                return text(refusal.status(), refusal.code());
            }
            return handle(route, Call { app, visitor, request }).await;
        }
        None => {}
    }
    if method != "GET" && method != "HEAD" {
        return text(404, "not-found");
    }
    if path.starts_with("/s/") {
        return match StreamerPath::parse(&path) {
            Some(streamer) => overlay(app, &streamer).await,
            None => text(404, "not-found"),
        };
    }
    serve_static(&app.config.dist, if path == "/" { "/index.html" } else { &path }, false).await
}

async fn overlay(app: &App, path: &StreamerPath) -> Response {
    let Some(route) = OverlayRoute::from_segments(&path.segments) else { return text(404, "not-found") };
    match app.known(&path.login).await {
        Ok(true) => {}
        Ok(false) => return text(404, "not-found"),
        Err(error) => return server_error(&error),
    }
    match route {
        OverlayRoute::Scene(file) => serve_static(&app.config.dist, &format!("/{file}"), false).await,
        OverlayRoute::Status
        | OverlayRoute::Settings
        | OverlayRoute::Events
        | OverlayRoute::Commands
        | OverlayRoute::Media(_) => pending(),
    }
}

/// A file under `root`; `sandbox` for media that must not run scripts
pub async fn serve_static(root: &Path, path: &str, sandbox: bool) -> Response {
    let file = match resolve(root, path) {
        Ok(file) => file,
        Err(error) => return text(error.status(), error.code()),
    };
    let Ok(body) = tokio::fs::read(&file).await else { return text(404, "not-found") };
    let mut response = Response::new(body.into());
    let headers = response.headers_mut();
    headers.insert(header::CONTENT_TYPE, HeaderValue::from_static(content_type(&file)));
    if sandbox {
        headers.insert(header::CONTENT_SECURITY_POLICY, HeaderValue::from_static(SANDBOX_CSP));
    }
    response
}

#[cfg(test)]
mod tests {
    use axum::body::Body;
    use http_body_util::BodyExt;
    use rst_infra::crypto::master::MasterKey;
    use tower::ServiceExt;

    use super::*;
    use crate::config::{OAuthApp, ProviderUrls, StoreConfig};

    async fn app(folder: &Path) -> Arc<App> {
        let dist = folder.join("dist");
        std::fs::create_dir_all(&dist).expect("dist");
        std::fs::write(dist.join("index.html"), "<html>dashboard</html>").expect("index");
        std::fs::write(dist.join("alerts.html"), "<html>alerts</html>").expect("scene");
        std::fs::write(folder.join("secret.txt"), "secret").expect("secret");
        let stores = StoreConfig {
            data_db: folder.join("data.db"),
            keys_db: folder.join("keys.db"),
            files: folder.join("files"),
            file_cache_bytes: 0,
            master: MasterKey::from_bytes([3; 32]),
        };
        let opened = crate::wiring::open(&stores).await.expect("stores");
        let config = ServerConfig {
            stores,
            port: 0,
            public_url: "http://localhost:8089".to_owned(),
            dist,
            admins: Vec::new(),
            twitch: OAuthApp { client_id: "id".to_owned(), client_secret: "secret".to_owned() },
            spotify: None,
            media_quota_bytes: 1,
            providers: ProviderUrls::from_lookup(&|_| None),
        };
        Arc::new(App::new(config, opened))
    }

    async fn call(
        app: &Arc<App>,
        method: &str,
        uri: &str,
        origin: Option<&str>,
    ) -> (u16, Vec<(String, String)>, String) {
        let mut request = Request::builder().method(method).uri(uri);
        if let Some(origin) = origin {
            request = request.header("Origin", origin);
        }
        let response =
            router(Arc::clone(app)).oneshot(request.body(Body::empty()).expect("request")).await.expect("response");
        let status = response.status().as_u16();
        let headers = response
            .headers()
            .iter()
            .map(|(name, value)| (name.to_string(), value.to_str().unwrap_or_default().to_owned()))
            .collect();
        let body = response.into_body().collect().await.expect("body").to_bytes();
        (status, headers, String::from_utf8_lossy(&body).into_owned())
    }

    fn header<'a>(headers: &'a [(String, String)], name: &str) -> Option<&'a str> {
        headers.iter().find(|(key, _)| key == name).map(|(_, value)| value.as_str())
    }

    #[tokio::test]
    async fn headers() {
        let folder = tempfile::tempdir().expect("temp folder");
        let app = app(folder.path()).await;
        let (status, headers, body) = call(&app, "GET", "/", None).await;
        assert_eq!((status, body.as_str()), (200, "<html>dashboard</html>"));
        assert_eq!(header(&headers, "x-content-type-options"), Some("nosniff"));
        assert_eq!(header(&headers, "content-security-policy"), Some(FRAME_CSP));
        let (_, headers, _) = call(&app, "GET", "/api/me", None).await;
        assert_eq!(header(&headers, "x-content-type-options"), Some("nosniff"));
        assert_eq!(header(&headers, "content-security-policy"), None);
    }

    #[tokio::test]
    async fn origin_and_routes() {
        let folder = tempfile::tempdir().expect("temp folder");
        let app = app(folder.path()).await;
        assert_eq!(call(&app, "POST", "/auth/logout", Some("http://evil.example")).await.2, "cross-origin");
        assert_eq!(call(&app, "POST", "/auth/logout", None).await.0, 403);
        assert_eq!(call(&app, "POST", "/auth/logout", Some("http://localhost:8089")).await.0, 200);
        assert_eq!(call(&app, "GET", "/api/test", None).await.0, 405);
        let (status, _, body) = call(&app, "GET", "/api/me", None).await;
        assert_eq!((status, body.as_str()), (401, "unauthorized"));
        assert_eq!(call(&app, "POST", "/nothing", Some("http://localhost:8089")).await.0, 404);
    }

    #[tokio::test]
    async fn static_files_and_overlays() {
        let folder = tempfile::tempdir().expect("temp folder");
        let app = app(folder.path()).await;
        assert_eq!(call(&app, "GET", "/alerts.html", None).await.0, 200);
        assert_eq!(call(&app, "GET", "/missing.png", None).await.0, 404);
        assert_eq!(call(&app, "GET", "/%E0", None).await.0, 400);
        assert_eq!(call(&app, "GET", "/..%2Fsecret.txt", None).await.0, 403);
        assert_eq!(call(&app, "GET", "/s/nobody/alerts", None).await.0, 404);
        assert_eq!(call(&app, "GET", "/s/Not%20A%20Login/", None).await.0, 404);
    }
}
