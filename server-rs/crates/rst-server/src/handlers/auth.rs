//! Login, logout and the own account (template: `twitchLogin`, `twitchCallback`, `logout`, `me`,
//! `rotateOverlayKey` and `twitchDisconnect` in `server/index.ts`).

use std::collections::HashMap;

use axum::extract::Query;
use axum::http::header;
use axum::response::Response;
use rst_app::crypto::cipher::random_bytes;
use rst_app::crypto::to_hex;
use rst_app::identity::login::LoginOutcome;
use rst_domain::access::Feature;
use rst_domain::identity::oauth::same_browser;
use rst_domain::identity::session::{OAUTH_STATE_SECONDS, SESSION_DAYS, oauth_state_cookie, session_cookie};
use rst_domain::themes::registry::DEFAULT_THEME;
use serde_json::json;

use crate::clock::now_ms;
use crate::errors::{json, redirect, server_error, text};
use crate::guard::cookie;
use crate::handlers::Call;

/// Codes from the OAuth callback: `^[\w.~-]{1,1024}$`
pub(crate) fn is_oauth_code(code: &str) -> bool {
    (1..=1024).contains(&code.len()) && code.bytes().all(|byte| byte.is_ascii_alphanumeric() || b"_.~-".contains(&byte))
}

pub(crate) fn cookies(call: &Call<'_>) -> Option<String> {
    call.request.headers().get(header::COOKIE).and_then(|value| value.to_str().ok()).map(str::to_owned)
}

pub(crate) fn query(call: &Call<'_>) -> HashMap<String, String> {
    Query::<HashMap<String, String>>::try_from_uri(call.request.uri()).map(|query| query.0).unwrap_or_default()
}

/// The state cookie must be on the host Twitch redirects back to (`PUBLIC_URL`)
pub fn login(call: &Call<'_>) -> Response {
    let app = call.app;
    let host = call.request.headers().get(header::HOST).and_then(|value| value.to_str().ok()).unwrap_or_default();
    if !app.public_origin.ends_with(&format!("://{}", host.to_ascii_lowercase())) {
        return redirect(&format!("{}/auth/login", app.config.public_url), &[]);
    }
    let Ok(random) = random_bytes::<16>() else { return server_error("no random bytes for the OAuth state") };
    let state = to_hex(&random);
    app.twitch_states().add(&state, (), now_ms());
    match app.twitch.authorize_url(&state) {
        Ok(target) => redirect(&target, &[oauth_state_cookie(&state, app.secure, OAUTH_STATE_SECONDS)]),
        Err(error) => server_error(&error.to_string()),
    }
}

/// Exchange the code, check access, store, set the session; errors go as a code to the dashboard (`/?error=`)
pub async fn callback(call: Call<'_>) -> Response {
    let app = call.app;
    let parameters = query(&call);
    let code = parameters.get("code").map_or("", String::as_str);
    let state = parameters.get("state").map_or("", String::as_str);
    // Only in the browser that started the login (login CSRF); the state cookie is valid once
    let clear_state = oauth_state_cookie("", app.secure, 0);
    let header = cookies(&call);
    let browser = same_browser(cookie(header.as_deref(), "oauth_state").as_deref(), state);
    let taken = app.twitch_states().take(state, now_ms()).is_some();
    if !(browser && taken && is_oauth_code(code)) {
        return redirect("/?error=login-failed", &[clear_state]);
    }
    match app.login_flow().complete(&app.twitch, code, now_ms()).await {
        Ok(LoginOutcome::Session { streamer, token }) => {
            if let Err(error) = app.start_runtime(&streamer).await {
                eprintln!("Runtime after login did not start: {error}");
            }
            let session = session_cookie(&token.to_text(), app.secure, SESSION_DAYS * 86_400);
            redirect("/", &[clear_state, session])
        }
        Ok(refused) => redirect(&format!("/?error={}", refused.error().unwrap_or("login-failed")), &[clear_state]),
        Err(error) => server_error(&error.to_string()),
    }
}

/// Ends the session of the cookie; the overlays keep running
pub async fn logout(call: Call<'_>) -> Response {
    let header = cookies(&call);
    if let Err(error) = call.app.login_flow().logout(cookie(header.as_deref(), "sid").as_deref(), now_ms()).await {
        return server_error(&error.to_string());
    }
    with_cookie(json(&json!({ "ok": true }), 200), &session_cookie("", call.app.secure, 0))
}

/// The own account; `theme`: the dashboard looks like the active theme
pub async fn me(call: Call<'_>) -> Response {
    let app = call.app;
    let Some(id) = call.visitor.streamer.as_ref() else { return text(401, "unauthorized") };
    let theme = match app.stores.profile.settings(id).await {
        Ok(settings) => settings.map_or_else(|| DEFAULT_THEME.to_owned(), |settings| settings.theme),
        Err(error) => return server_error(&error.to_string()),
    };
    let Ok(random) = random_bytes::<16>() else { return server_error("no random bytes for the overlay key") };
    let overlay_key = match app.stores.overlay_keys.get(id, random, now_ms()).await {
        Ok(key) => key,
        Err(error) => return server_error(&error.to_string()),
    };
    let music = call.visitor.features.get(&Feature::Music) == Some(&true);
    // spotify: null = not set up or feature off, otherwise whether it is connected
    let spotify = (app.spotify.is_some() && music).then(|| app.spotify_connected(id));
    json(
        &json!({
            "login": call.visitor.login,
            "admin": call.visitor.admin,
            "live": app.events_live(id),
            "spotify": spotify,
            "features": call.visitor.features,
            "theme": theme,
            "overlayKey": overlay_key,
        }),
        200,
    )
}

/// New overlay key, e.g. when an OBS URL got into the wrong hands
pub async fn rotate_overlay_key(call: Call<'_>) -> Response {
    let Some(id) = call.visitor.streamer.as_ref() else { return text(401, "unauthorized") };
    let Ok(random) = random_bytes::<16>() else { return server_error("no random bytes for the overlay key") };
    match call.app.stores.overlay_keys.rotate(id, random, now_ms()).await {
        Ok(overlay_key) => {
            // Streams opened with the old key end; the overlays reconnect with the new one
            call.app.hubs.close(id);
            json(&json!({ "overlayKey": overlay_key }), 200)
        }
        Err(error) => server_error(&error.to_string()),
    }
}

/// Revoke and delete the Twitch tokens, end every session of the streamer
pub async fn disconnect(call: Call<'_>) -> Response {
    let app = call.app;
    let Some(id) = call.visitor.streamer.as_ref() else { return text(401, "unauthorized") };
    // Stop first and wait for a running token check, it may still save renewed tokens
    let runtime = app.runtimes.get(id);
    app.stop_runtime(id);
    if let Some(runtime) = runtime {
        runtime.keeper.idle().await;
    }
    let actor = call.visitor.login.as_deref().unwrap_or("unknown");
    if let Err(error) = app.login_flow().disconnect(&app.twitch, id, actor, now_ms()).await {
        return server_error(&error.to_string());
    }
    with_cookie(json(&json!({ "ok": true }), 200), &session_cookie("", app.secure, 0))
}

fn with_cookie(mut response: Response, value: &str) -> Response {
    if let Ok(value) = value.parse() {
        response.headers_mut().append(header::SET_COOKIE, value);
    }
    response
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn oauth_codes() {
        assert!(is_oauth_code("code-neo-7"));
        assert!(is_oauth_code("a.b~c_d"));
        assert!(!is_oauth_code(""));
        assert!(!is_oauth_code("a b"));
        assert!(!is_oauth_code(&"a".repeat(1025)));
    }
}
