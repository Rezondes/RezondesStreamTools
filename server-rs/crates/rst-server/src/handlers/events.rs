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
use rst_app::events::{DashboardChange, ServerMessage};
use rst_domain::identity::values::StreamerId;
use rst_domain::twitch::alerts::{AlertKind, sample_alert};
use serde_json::json;
use tokio::sync::broadcast::error::RecvError;
use tokio::sync::watch;

use crate::app::App;
use crate::clock::now_ms;
use crate::errors::{json, server_error, text};
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
    let stats = runtime.as_ref().map(|runtime| runtime.stats.current());
    let mut first = vec![Event::default().comment("connected"), data(&ServerMessage::Music { track })];
    first.extend(minimes.map(|minimes| data(&ServerMessage::Minimes { minimes })));
    first.extend(stats.map(|stats| data(&ServerMessage::Stats { stats })));
    let live = stream::unfold(subscription, |mut subscription| async move {
        let message = subscription.next().await?;
        Some((Event::default().data(&*message), subscription))
    });
    let events = stream::iter(first).chain(live).map(Ok::<Event, Infallible>);
    Sse::new(events).keep_alive(KeepAlive::new().interval(PING).text("ping")).into_response()
}

/// `/api/dashboard/events`: what changed for the dashboard of the own streamer, one [`DashboardChange`] per message;
/// admins also hear about the backups. The dashboard loads that part again instead of asking every few seconds. A
/// dashboard that falls behind loses its stream and loads everything again when it reconnects.
pub fn dashboard(call: &Call<'_>) -> Response {
    let app = call.app;
    let Some(id) = call.visitor.streamer.as_ref() else { return text(401, "unauthorized") };
    let Some(changes) = app.hubs.watch_dashboard(id) else { return text(503, "unavailable") };
    let backups = call.visitor.admin.then(|| app.backups.changes());
    let first = stream::iter([Event::default().comment("connected")]);
    let next = stream::unfold((changes, backups), |(mut changes, mut backups)| async move {
        let change = tokio::select! {
            change = changes.recv() => match change {
                Ok(change) => change,
                Err(RecvError::Lagged(_) | RecvError::Closed) => return None,
            },
            () = backups_changed(&mut backups) => DashboardChange::Backups,
        };
        let event = Event::default().data(serde_json::to_string(&change).unwrap_or_default());
        Some((event, (changes, backups)))
    });
    let events = first.chain(next).map(Ok::<Event, Infallible>);
    Sse::new(events).keep_alive(KeepAlive::new().interval(PING).text("ping")).into_response()
}

/// Waits for the next change of the backups; without them (no admin) or once they are gone, forever
async fn backups_changed(backups: &mut Option<watch::Receiver<u64>>) {
    if let Some(receiver) = backups
        && receiver.changed().await.is_ok()
    {
        return;
    }
    std::future::pending::<()>().await;
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

/// Dashboard: the current stream stats of the own streamer, from the running runtime or else the stored count
pub async fn stats(call: Call<'_>) -> Response {
    let app = call.app;
    let Some(id) = call.visitor.streamer.as_ref() else { return text(401, "unauthorized") };
    if let Some(runtime) = app.runtimes.get(id) {
        return json(&runtime.stats.current(), 200);
    }
    match app.stores.profile.stats(id).await {
        Ok(tally) => json(&tally.snapshot(), 200),
        Err(error) => server_error(&error.to_string()),
    }
}

/// Dashboard: marks the stream of the own streamer live or ended by hand (RST only, Twitch is not touched), when the
/// server missed `stream.online` or `stream.offline`; the answer says whether it is live now. A running runtime sends the
/// stats; without one the stored count changes directly.
pub async fn toggle_live(call: Call<'_>) -> Response {
    let Some(id) = call.visitor.streamer.as_ref() else { return text(401, "unauthorized") };
    toggle_live_of(call.app, id).await
}

/// Live or ended by hand for one streamer; the dashboard of the streamer and the admin table both land here
pub async fn toggle_live_of(app: &App, id: &StreamerId) -> Response {
    if let Some(runtime) = app.runtimes.get(id) {
        return json(&json!({ "live": runtime.stats.toggle_live() }), 200);
    }
    let mut tally = match app.stores.profile.stats(id).await {
        Ok(tally) => tally,
        Err(error) => return server_error(&error.to_string()),
    };
    let live = tally.toggle_live(now_ms());
    match app.stores.profile.save_stats(id, &tally, now_ms()).await {
        Ok(()) => json(&json!({ "live": live }), 200),
        Err(error) => server_error(&error.to_string()),
    }
}

/// Dashboard: clears the stream stats of the own streamer. A running runtime stores and sends them at once; without
/// one the stored count is cleared directly.
pub async fn reset_stats(call: Call<'_>) -> Response {
    let app = call.app;
    let Some(id) = call.visitor.streamer.as_ref() else { return text(401, "unauthorized") };
    if let Some(runtime) = app.runtimes.get(id) {
        runtime.stats.reset().await;
        return json(&json!({ "ok": true }), 200);
    }
    let mut tally = match app.stores.profile.stats(id).await {
        Ok(tally) => tally,
        Err(error) => return server_error(&error.to_string()),
    };
    tally.reset(now_ms());
    match app.stores.profile.save_stats(id, &tally, now_ms()).await {
        Ok(()) => json(&json!({ "ok": true }), 200),
        Err(error) => server_error(&error.to_string()),
    }
}
