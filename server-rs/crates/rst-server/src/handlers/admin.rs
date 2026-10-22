//! Admin routes (template: `GET /api/admin/access`, `saveAccess` and `adminStreamers` in `server/index.ts`), plus the
//! audit log and deleting a streamer. Only admins get here (rights table).

use std::collections::HashMap;

use axum::extract::Query;
use axum::http::Uri;
use axum::response::Response;
use rst_app::events::DashboardChange;
use rst_domain::access::RawAccess;
use rst_domain::identity::values::{Login, StreamerId};
use serde_json::Value;

use crate::app::App;
use crate::clock::now_ms;
use crate::errors::{json, server_error, text};
use crate::handlers::{Call, events, read_body};

/// Larger bodies of the access form are refused
const ACCESS_LIMIT: usize = 64 * 1024;
/// Entries per audit page
const AUDIT_LIMIT: u32 = 200;

pub async fn access(call: Call<'_>) -> Response {
    match call.app.stores.access.load(&call.app.config.admins).await {
        Ok(policy) => json(&policy, 200),
        Err(error) => server_error(&error.to_string()),
    }
}

/// Saves the policy; whoever loses access loses every session at once
pub async fn save_access(call: Call<'_>) -> Response {
    let app = call.app;
    let actor = call.visitor.login.clone().unwrap_or_default();
    let Some(body) = read_body(call.request, ACCESS_LIMIT).await else { return text(413, "too-large") };
    let raw: Option<RawAccess> = match serde_json::from_slice::<Value>(&body) {
        Ok(value @ Value::Object(_)) => serde_json::from_value(value).ok(),
        _ => None,
    };
    let Some(raw) = raw else { return text(400, "invalid-json") };
    match app.access_admin().change(&raw, &actor, now_ms()).await {
        Ok((policy, revoked)) => {
            for login in &revoked {
                println!("Access revoked, sessions ended and runtime stopped: {login}");
            }
            // Changed feature levels apply to every runtime and every open dashboard
            app.restart_all().await;
            app.hubs.changed_everywhere(DashboardChange::Account);
            json(&policy, 200)
        }
        Err(error) => server_error(&error.to_string()),
    }
}

pub async fn streamers(call: Call<'_>) -> Response {
    let app = call.app;
    let running_stream_live = |id: &StreamerId| app.runtimes.get(id).map(|runtime| runtime.stats.live());
    match app.access_admin().streamers(|id| app.events_live(id), running_stream_live).await {
        Ok(rows) => json(&rows, 200),
        Err(error) => server_error(&error.to_string()),
    }
}

/// `?login=<login>`: entries of that streamer, otherwise the server-wide ones
pub async fn audit(call: Call<'_>) -> Response {
    let app = call.app;
    let query =
        Query::<HashMap<String, String>>::try_from_uri(call.request.uri()).map(|query| query.0).unwrap_or_default();
    let streamer = match query.get("login") {
        None => None,
        Some(login) => {
            let Ok(login) = Login::parse(login) else { return text(400, "invalid-login") };
            match app.stores.streamers.find_by_login(&login).await {
                Ok(Some(id)) => Some(id),
                Ok(None) => return text(404, "not-found"),
                Err(error) => return server_error(&error.to_string()),
            }
        }
    };
    match app.access_admin().audit(streamer.as_ref(), AUDIT_LIMIT).await {
        Ok(rows) => json(&rows, 200),
        Err(error) => server_error(&error.to_string()),
    }
}

/// The streamer of `?login=<login>`, or the error answer (boxed, an answer is large)
async fn streamer_of(app: &App, uri: &Uri) -> Result<(Login, StreamerId), Box<Response>> {
    let query = Query::<HashMap<String, String>>::try_from_uri(uri).map(|query| query.0).unwrap_or_default();
    let Some(login) = query.get("login").and_then(|login| Login::parse(login).ok()) else {
        return Err(Box::new(text(400, "invalid-login")));
    };
    match app.stores.streamers.find_by_login(&login).await {
        Ok(Some(id)) => Ok((login, id)),
        Ok(None) => Err(Box::new(text(404, "not-found"))),
        Err(error) => Err(Box::new(server_error(&error.to_string()))),
    }
}

/// `?login=<login>`: marks the stream of that streamer live or ended for RST, like the streamer does in the dashboard
pub async fn toggle_streamer_live(call: Call<'_>) -> Response {
    match streamer_of(call.app, call.request.uri()).await {
        Ok((_, id)) => events::toggle_live_of(call.app, &id).await,
        Err(answer) => *answer,
    }
}

/// `?login=<login>`: deletes the streamer for good; admins from `ADMINS` cannot be deleted
pub async fn delete_streamer(call: Call<'_>) -> Response {
    let app = call.app;
    let (login, id) = match streamer_of(app, call.request.uri()).await {
        Ok(found) => found,
        Err(answer) => return *answer,
    };
    if app.config.admins.contains(&login) {
        return text(400, "admin-protected");
    }
    // Stop first and wait for a running token check, it may still save renewed tokens
    let runtime = app.runtimes.get(&id);
    app.stop_runtime(&id);
    if let Some(runtime) = runtime {
        runtime.keeper.idle().await;
    }
    let actor = call.visitor.login.as_deref().unwrap_or("unknown");
    match app.streamer_deletion().delete(&app.twitch, &id, actor, now_ms()).await {
        Ok(()) => json(&serde_json::json!({ "ok": true }), 200),
        Err(error) => server_error(&error.to_string()),
    }
}
