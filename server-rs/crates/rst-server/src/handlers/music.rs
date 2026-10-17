//! Spotify connection of a streamer (template: `spotifyLogin`, `spotifyCallback`, `spotifyDetails` and
//! `spotifyLogout` in `server/index.ts`). The callback is public, as Spotify knows only one URL; the state binds it
//! to the streamer who started, and where the callback carries the session cookie it must be the same streamer.

use axum::response::Response;
use rst_app::crypto::cipher::random_bytes;
use rst_app::crypto::to_hex;
use rst_domain::access::Feature;
use rst_domain::spotify::callback_has_session;
use serde_json::json;

use crate::clock::now_ms;
use crate::errors::{json, redirect, server_error, text};
use crate::guard::cookie;
use crate::handlers::Call;
use crate::handlers::auth::{cookies, is_oauth_code, query};

pub fn login(call: &Call<'_>) -> Response {
    let app = call.app;
    let Some(id) = call.visitor.streamer.clone() else { return text(401, "unauthorized") };
    let Some(spotify) = &app.spotify else { return text(409, "spotify-not-configured") };
    if app.runtimes.get(&id).and_then(|runtime| runtime.spotify.clone()).is_none() {
        return text(409, "not-connected");
    }
    let Ok(random) = random_bytes::<16>() else { return server_error("no random bytes for the OAuth state") };
    let state = to_hex(&random);
    app.spotify_states().add(&state, id, now_ms());
    match spotify.authorize_url(&state) {
        Ok(target) => redirect(&target, &[]),
        Err(error) => server_error(&error.to_string()),
    }
}

pub async fn callback(call: Call<'_>) -> Response {
    let app = call.app;
    let parameters = query(&call);
    let code = parameters.get("code").map_or("", String::as_str);
    let state = parameters.get("state").map_or("", String::as_str);
    let failed = || redirect(&format!("{}/?error=spotify-failed", app.config.public_url), &[]);
    let Some(id) = app.spotify_states().take(state, now_ms()) else { return failed() };
    // Public: only in the browser of the streamer who started (otherwise a foreign Spotify account gets attached)
    if callback_has_session(&app.config.public_url) {
        let header = cookies(&call);
        let session = cookie(header.as_deref(), "sid");
        if !matches!(app.stores.sessions.resolve(session.as_deref(), now_ms()).await, Ok(Some(owner)) if owner == id) {
            return failed();
        }
    }
    let admins = &app.config.admins;
    let music = match (app.stores.streamers.login_of(&id).await, app.stores.access.load(admins).await) {
        (Ok(Some(login)), Ok(policy)) => policy.features(admins, &login).get(&Feature::Music) == Some(&true),
        _ => false,
    };
    let Some(spotify) = app.runtimes.get(&id).and_then(|runtime| runtime.spotify.clone()).filter(|_| music) else {
        return failed();
    };
    if !is_oauth_code(code) {
        return failed();
    }
    match spotify.connect(code).await {
        Ok(true) => redirect(&format!("{}/", app.config.public_url), &[]),
        Ok(false) => failed(),
        Err(error) => {
            eprintln!("Spotify connect failed: {error}");
            failed()
        }
    }
}

/// Account, current track and polling status for the connection page; 409 without a Spotify login
pub async fn details(call: Call<'_>) -> Response {
    let Some(id) = call.visitor.streamer.as_ref() else { return text(401, "unauthorized") };
    let spotify = call.app.runtimes.get(id).and_then(|runtime| runtime.spotify.clone());
    match spotify.filter(|spotify| spotify.connected()) {
        Some(spotify) => json(&spotify.details().await, 200),
        None => text(409, "not-connected"),
    }
}

/// Really disconnects, also without a running player (music off, no runtime): the stored tokens are deleted
pub async fn logout(call: Call<'_>) -> Response {
    let app = call.app;
    let Some(id) = call.visitor.streamer.clone() else { return text(401, "unauthorized") };
    if let Some(spotify) = app.runtimes.get(&id).and_then(|runtime| runtime.spotify.clone())
        && let Err(error) = spotify.logout().await
    {
        return server_error(&error.to_string());
    }
    match app.stores.profile.delete_spotify_tokens(&id).await {
        Ok(()) => json(&json!({ "ok": true }), 200),
        Err(error) => server_error(&error.to_string()),
    }
}
