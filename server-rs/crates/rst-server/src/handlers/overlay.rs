//! Public overlay URLs under `/s/<login>/` (template: `overlay` in `server/index.ts`): status, settings, scenes.
//! Unknown or locked logins are `404 not-found`. Events, commands and media follow with their packages.

use axum::http::Uri;
use axum::response::Response;
use rst_domain::access::{AccessPolicy, Feature};
use rst_domain::identity::values::{Login, StreamerId};
use rst_domain::paths::{OverlayRoute, StreamerPath};
use serde_json::json;

use crate::app::{App, serve_static};
use crate::errors::{json, server_error, text};

/// The streamer behind `/s/<login>/` with the policy, if they exist and may use the server
async fn streamer(app: &App, login: &Login) -> Result<Option<(StreamerId, AccessPolicy)>, String> {
    let Some(id) = app.stores.streamers.find_by_login(login).await.map_err(|error| error.to_string())? else {
        return Ok(None);
    };
    let policy = app.stores.access.load(&app.config.admins).await.map_err(|error| error.to_string())?;
    Ok(policy.can_use(&app.config.admins, login).then_some((id, policy)))
}

pub async fn serve(app: &App, path: &StreamerPath, uri: &Uri, cookies: Option<&str>) -> Response {
    let Some(route) = OverlayRoute::from_segments(&path.segments) else { return text(404, "not-found") };
    let (id, policy) = match streamer(app, &path.login).await {
        Ok(Some(found)) => found,
        Ok(None) => return text(404, "not-found"),
        Err(error) => return server_error(&error),
    };
    match route {
        OverlayRoute::Scene(file) => serve_static(&app.config.dist, &format!("/{file}"), false).await,
        OverlayRoute::Status => {
            let features = policy.features(&app.config.admins, &path.login);
            let music = features.get(&Feature::Music) == Some(&true);
            // spotify: null = not set up or feature off, otherwise whether it is connected (runtime, package 37)
            let spotify = (app.config.spotify.is_some() && music).then_some(false);
            json(&json!({ "login": path.login, "live": false, "spotify": spotify, "features": features }), 200)
        }
        OverlayRoute::Settings => match app.settings_service().public(&id).await {
            Ok(settings) => json(&settings, 200),
            Err(error) => server_error(&error.to_string()),
        },
        OverlayRoute::Media(name) => crate::handlers::media::deliver(app, &id, &name).await,
        OverlayRoute::Commands => {
            let features = policy.features(&app.config.admins, &path.login);
            match app.command_service().public(&id, &path.login, &features).await {
                Ok(list) => json(&list, 200),
                Err(error) => server_error(&error.to_string()),
            }
        }
        OverlayRoute::Events => crate::handlers::events::stream(app, &id, &path.login, &policy, uri, cookies).await,
    }
}
