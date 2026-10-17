//! The live stream of a streamer (template: `events` in `server/index.ts`, `openStream` in `server/streamHub.ts`):
//! overlays only with the secret overlay key (`?key=`), the event log of the dashboard (`?log`) only with the session
//! of the same streamer, so strangers cannot take up slots. On connect the stream gets the current track and the
//! minimes right away; a comment line every 25 s keeps it open through proxies and OBS.

use std::collections::HashMap;
use std::convert::Infallible;
use std::time::Duration;

use axum::extract::Query;
use axum::http::Uri;
use axum::response::sse::{Event, KeepAlive, Sse};
use axum::response::{IntoResponse, Response};
use futures_util::stream::{self, StreamExt};
use rst_app::events::ServerMessage;
use rst_domain::identity::values::StreamerId;
use rst_domain::twitch::alerts::{AlertKind, sample_alert};
use serde_json::json;

use crate::app::App;
use crate::clock::now_ms;
use crate::errors::{json, text};
use crate::guard::cookie;
use crate::handlers::Call;

const PING: Duration = Duration::from_secs(25);

/// A streamer is running when the registry holds a runtime for them
fn running(app: &App, id: &StreamerId) -> bool {
    app.runtimes.get(id).is_some()
}

fn data(message: &ServerMessage) -> Event {
    Event::default().data(serde_json::to_string(message).unwrap_or_default())
}

/// `/s/<login>/events`
pub async fn stream(app: &App, id: &StreamerId, uri: &Uri, cookies: Option<&str>) -> Response {
    if !running(app, id) {
        return text(404, "not-running");
    }
    let query = Query::<HashMap<String, String>>::try_from_uri(uri).map(|query| query.0).unwrap_or_default();
    let watcher = query.contains_key("log");
    let allowed = if watcher {
        let session = cookie(cookies, "sid");
        matches!(app.stores.sessions.resolve(session.as_deref(), now_ms()).await, Ok(Some(owner)) if owner == *id)
    } else {
        let key = query.get("key").map_or("", String::as_str);
        app.stores.overlay_keys.matches(id, key).await.unwrap_or(false)
    };
    if !allowed {
        return text(403, "forbidden");
    }
    let Some(subscription) = app.hubs.subscribe(id, watcher) else { return text(503, "unavailable") };
    let runtime = app.runtimes.get(id);
    let minimes = runtime.as_ref().and_then(|runtime| runtime.minimes.as_ref().map(|minimes| minimes.current()));
    let track = runtime.as_ref().and_then(|runtime| runtime.spotify.as_ref().and_then(|spotify| spotify.current()));
    let mut first = vec![Event::default().comment("connected"), data(&ServerMessage::Music { track })];
    first.extend(minimes.map(|minimes| data(&ServerMessage::Minimes { minimes })));
    let live = stream::unfold(subscription, |mut subscription| async move {
        let message = subscription.next().await?;
        Some((Event::default().data(&*message), subscription))
    });
    let events = stream::iter(first).chain(live).map(Ok::<Event, Infallible>);
    Sse::new(events).keep_alive(KeepAlive::new().interval(PING).text("ping")).into_response()
}

/// Test buttons of the dashboard: one sample alert per kind
pub fn test_alert(call: &Call<'_>) -> Response {
    let app = call.app;
    let Some(id) = call.visitor.streamer.as_ref() else { return text(401, "unauthorized") };
    let query =
        Query::<HashMap<String, String>>::try_from_uri(call.request.uri()).map(|query| query.0).unwrap_or_default();
    let Some(kind) = query.get("kind").and_then(|kind| AlertKind::parse(kind)) else {
        return text(400, "unknown-kind");
    };
    if !running(app, id) {
        return text(409, "not-connected");
    }
    app.hubs.emit(id, &ServerMessage::Alert { alert: sample_alert(kind) });
    json(&json!({ "ok": true }), 200)
}
