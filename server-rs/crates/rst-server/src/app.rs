//! The HTTP server (template: `route` in `server/index.ts`): writing requests only from the own origin, routes from
//! the rights table, overlay URLs under `/s/<login>/`, otherwise the dashboard and tools from `DIST`. Every answer
//! carries `nosniff`; HTML may only be framed by the own origin.

use std::collections::BTreeMap;
use std::path::Path;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex, MutexGuard};

use axum::Router;
use axum::extract::{Request, State};
use axum::http::{HeaderValue, header};
use axum::response::Response;
use rst_app::access::admin::AccessAdmin;
use rst_app::backup::Backups;
use rst_app::backup::keys::run_key_backups;
use rst_app::channel::registry::Registry;
use rst_app::channel::runtime::{RuntimeSetup, StreamerRuntime, start_all};
use rst_app::commands::CommandService;
use rst_app::crypto::cipher::random_bytes;
use rst_app::events::Hubs;
use rst_app::identity::delete::StreamerDeletion;
use rst_app::identity::login::LoginFlow;
use rst_app::settings::SettingsService;
use rst_app::triggers::TriggerService;
use rst_domain::access::{Feature, is_admin};
use rst_domain::identity::oauth::LoginStates;
use rst_domain::identity::session::{OAUTH_STATE_SECONDS, is_secure_url};
use rst_domain::identity::values::StreamerId;
use rst_domain::media::library::UploadSlots;
use rst_domain::paths::StreamerPath;
use rst_domain::render::jobs::RenderJobs;
use rst_domain::spotify::redirect_uri;
use rst_infra::backup::archive::ZipBackups;
use rst_infra::backup::keys::FolderKeyBackups;
use rst_infra::db::sqlite_audit::SqliteAudit;
use rst_infra::db::sqlite_records::SqliteRecords;
use rst_infra::db::sqlite_server_settings::SqliteServerSettings;
use rst_infra::db::sqlite_sessions::SqliteSessions;
use rst_infra::db::sqlite_streamers::SqliteStreamers;
use rst_infra::files::encrypted::EncryptedFiles;
use rst_infra::keys::sqlite::SqliteKeyStore;
use rst_infra::render::ffmpeg::Ffmpeg;
use rst_infra::spotify::client::SpotifyClient;
use rst_infra::twitch::oauth::TwitchClient;
use rst_infra::websocket::WebSockets;

use crate::clock::now_ms;
use crate::config::ServerConfig;
use crate::errors::{server_error, text};
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

pub type AppStreamerDeletion<'a> =
    StreamerDeletion<'a, SqliteStreamers, SqliteRecords, SqliteKeyStore, SqliteSessions, EncryptedFiles, SqliteAudit>;

pub type AppRuntime = StreamerRuntime<TwitchClient, SqliteRecords, SqliteKeyStore, SpotifyClient>;
pub type AppCommands<'a> = CommandService<'a, SqliteRecords, SqliteKeyStore, SqliteAudit>;
pub type AppTriggers<'a> = TriggerService<'a, SqliteRecords, SqliteKeyStore, SqliteAudit>;
pub type AppSettings<'a> = SettingsService<'a, SqliteRecords, SqliteKeyStore, SqliteAudit>;

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
    pub hubs: Arc<Hubs>,
    pub sockets: Arc<WebSockets>,
    /// `None` without Spotify credentials
    pub spotify: Option<Arc<SpotifyClient>>,
    pub runtimes: Registry<AppRuntime>,
    pub backups: Backups<ZipBackups, SqliteAudit, SqliteKeyStore>,
    pub key_backups: FolderKeyBackups,
    /// During a restore overlays and the API of streamers answer 503
    pub maintenance: AtomicBool,
    twitch_states: Mutex<LoginStates<()>>,
    /// Spotify knows only one callback URL: the state says which streamer started the connection
    spotify_states: Mutex<LoginStates<StreamerId>>,
    uploads: Mutex<UploadSlots>,
    /// At most one render per streamer
    render_jobs: Mutex<RenderJobs>,
    pub ffmpeg: Ffmpeg,
}

/// A running upload of a streamer; dropping it frees the slot
pub struct UploadSlot<'a> {
    app: &'a App,
    login: String,
}

impl Drop for UploadSlot<'_> {
    fn drop(&mut self) {
        self.app.uploads().release(&self.login);
    }
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
        let spotify = config.spotify.as_ref().zip(redirect_uri(&config.public_url)).map(|(app, redirect)| {
            Arc::new(SpotifyClient::new(
                &app.client_id,
                &app.client_secret,
                &redirect,
                &config.providers.spotify_accounts,
                &config.providers.spotify_api,
            ))
        });
        let archives = ZipBackups::new(stores.pool.clone(), &config.stores.files, &config.stores.backups);
        let backups = Backups::new(archives, stores.audit.clone(), stores.keys.clone());
        let key_backups = FolderKeyBackups::new(stores.keys.clone(), &config.stores.key_backups);
        Self {
            backups,
            key_backups,
            maintenance: AtomicBool::new(false),
            spotify,
            spotify_states: Mutex::new(LoginStates::new(OAUTH_STATE_SECONDS * 1000, PENDING_LOGINS)),
            public_origin: origin_of(&config.public_url),
            secure: is_secure_url(&config.public_url),
            twitch,
            hubs: Arc::new(Hubs::default()),
            sockets: Arc::new(WebSockets),
            runtimes: Registry::default(),
            twitch_states: Mutex::new(LoginStates::new(OAUTH_STATE_SECONDS * 1000, PENDING_LOGINS)),
            uploads: Mutex::new(UploadSlots::default()),
            render_jobs: Mutex::default(),
            ffmpeg: Ffmpeg::from_env(),
            config,
            stores,
        }
    }

    pub fn twitch_states(&self) -> MutexGuard<'_, LoginStates<()>> {
        self.twitch_states.lock().unwrap_or_else(std::sync::PoisonError::into_inner)
    }

    pub fn render_jobs(&self) -> MutexGuard<'_, RenderJobs> {
        self.render_jobs.lock().unwrap_or_else(std::sync::PoisonError::into_inner)
    }

    pub fn spotify_states(&self) -> MutexGuard<'_, LoginStates<StreamerId>> {
        self.spotify_states.lock().unwrap_or_else(std::sync::PoisonError::into_inner)
    }

    #[must_use]
    pub fn streamer_deletion(&self) -> AppStreamerDeletion<'_> {
        let stores = &self.stores;
        StreamerDeletion {
            streamers: &stores.streamers,
            sessions: &stores.sessions,
            profile: &stores.profile,
            media: &stores.media,
            audit: &stores.audit,
        }
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

    #[must_use]
    pub fn settings_service(&self) -> AppSettings<'_> {
        SettingsService { profile: &self.stores.profile, audit: &self.stores.audit }
    }

    /// (Re)starts the runtime of a streamer with tokens who may use the server; `false` when none runs
    ///
    /// # Errors
    /// When the profile cannot be read.
    pub async fn start_runtime(&self, id: &StreamerId) -> Result<bool, String> {
        let login = self.stores.streamers.login_of(id).await.map_err(|error| error.to_string())?.ok_or("no profile")?;
        let admins = &self.config.admins;
        let create = async {
            let features = match self.stores.access.load(admins).await {
                Ok(policy) => policy.features(admins, &login),
                Err(error) => {
                    eprintln!("Access settings unreadable for {login}: {error}");
                    BTreeMap::new()
                }
            };
            let setup = RuntimeSetup {
                id: id.clone(),
                login: login.clone(),
                twitch: self.twitch.clone(),
                profile: self.stores.profile.clone(),
                sockets: Arc::clone(&self.sockets),
                irc_url: self.config.providers.twitch_irc.clone(),
                eventsub_url: self.config.providers.twitch_eventsub.clone(),
                link: format!("{}/s/{login}/", self.config.public_url),
                spotify: self.spotify.clone().filter(|_| features.get(&Feature::Music) == Some(&true)),
                hubs: Arc::clone(&self.hubs),
                features,
                now: now_ms,
            };
            StreamerRuntime::start(setup).await.unwrap_or_else(|error| {
                eprintln!("Runtime of {login} did not start: {error}");
                None
            })
        };
        let allowed =
            async { self.stores.access.load(admins).await.is_ok_and(|policy| policy.can_use(admins, &login)) };
        Ok(self.runtimes.start(id, create, allowed).await.is_some())
    }

    /// Whether the running player of the streamer has a Spotify login
    #[must_use]
    /// Whether the alerts of the streamer arrive right now (`EventSub` up and subscribed)
    pub fn events_live(&self, id: &StreamerId) -> bool {
        self.runtimes.get(id).is_some_and(|runtime| runtime.events_live())
    }

    pub fn spotify_connected(&self, id: &StreamerId) -> bool {
        self.runtimes
            .get(id)
            .and_then(|runtime| runtime.spotify.as_ref().map(|spotify| spotify.connected()))
            .unwrap_or(false)
    }

    /// The scheduled backups: automatic data backups as the admins set them, a key backup once a day
    pub async fn run_schedules(&self) {
        match self.stores.schedule.load().await {
            Ok(schedule) => {
                let random = random_bytes::<4>().unwrap_or_default();
                if let Err(error) = self.backups.run_schedule(&schedule, now_ms(), random).await {
                    eprintln!("Scheduled backup failed: {error:?}");
                }
            }
            Err(error) => eprintln!("Backup schedule unreadable: {error}"),
        }
        if let Err(error) = run_key_backups(&self.key_backups, now_ms()).await {
            eprintln!("Key backup failed: {error}");
        }
    }

    /// Stops every runtime and closes every stream, e.g. before a restore
    pub fn stop_all_runtimes(&self) {
        for id in self.runtimes.ids() {
            self.stop_runtime(&id);
        }
        self.runtimes.stop_all();
    }

    /// Stops the runtime and closes every open stream of the streamer
    pub fn stop_runtime(&self, id: &StreamerId) {
        self.runtimes.stop(id);
        self.hubs.close(id);
    }

    /// After changed access or feature levels: every allowed streamer restarts, the others stop
    pub async fn restart_all(&self) -> usize {
        let ids = match self.stores.streamers.list().await {
            Ok(streamers) => streamers.into_iter().filter_map(|streamer| streamer.id).collect(),
            Err(error) => {
                eprintln!("Listing the streamers failed: {error}");
                Vec::new()
            }
        };
        start_all(ids, |id| async move {
            let running = self.start_runtime(&id).await?;
            if !running {
                self.stop_runtime(&id);
            }
            Ok(running)
        })
        .await
    }

    #[must_use]
    pub fn command_service(&self) -> AppCommands<'_> {
        CommandService { profile: &self.stores.profile, audit: &self.stores.audit }
    }

    #[must_use]
    pub fn trigger_service(&self) -> AppTriggers<'_> {
        TriggerService { profile: &self.stores.profile, audit: &self.stores.audit }
    }

    fn uploads(&self) -> MutexGuard<'_, UploadSlots> {
        self.uploads.lock().unwrap_or_else(std::sync::PoisonError::into_inner)
    }

    /// The upload slot of the streamer; `None` while another upload of theirs runs
    pub fn upload_slot(&self, login: &str) -> Option<UploadSlot<'_>> {
        self.uploads().take(login).then(|| UploadSlot { app: self, login: login.to_owned() })
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
    // A restore replaces the data: only the admin area stays reachable meanwhile
    let api = path.starts_with("/api/") && !path.starts_with("/api/admin/");
    let streamer_path = api || ["/s/", "/auth/", "/spotify/"].iter().any(|prefix| path.starts_with(prefix));
    if streamer_path && app.maintenance.load(Ordering::SeqCst) {
        return text(503, "maintenance");
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
        let cookies = request.headers().get(header::COOKIE).and_then(|value| value.to_str().ok());
        return match StreamerPath::parse(&path) {
            Some(streamer) => crate::handlers::overlay::serve(app, &streamer, request.uri(), cookies).await,
            None => text(404, "not-found"),
        };
    }
    serve_static(&app.config.dist, if path == "/" { "/index.html" } else { &path }, false).await
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
            render_temp: folder.join("render-tmp"),
            backups: folder.join("backups"),
            key_backups: folder.join("key-backups"),
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
            backup_upload_bytes: 1024 * 1024,
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

    #[tokio::test]
    async fn maintenance_leaves_only_the_dashboard_and_the_admin_area() {
        let folder = tempfile::tempdir().expect("temp folder");
        let app = app(folder.path()).await;
        app.maintenance.store(true, Ordering::SeqCst);
        for path in ["/s/nobody/alerts", "/api/me", "/auth/login", "/spotify/callback"] {
            assert_eq!(call(&app, "GET", path, None).await.2, "maintenance", "{path}");
        }
        assert_eq!(call(&app, "GET", "/", None).await.0, 200);
        assert_eq!(call(&app, "GET", "/api/admin/backups", None).await.2, "unauthorized");
        app.maintenance.store(false, Ordering::SeqCst);
        assert_eq!(call(&app, "GET", "/api/me", None).await.2, "unauthorized");
    }
}
