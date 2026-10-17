//! One handler per route (template: `HANDLERS` in `server/index.ts`). The match lists every route, so a new route
//! does not compile without a handler. Routes of later packages answer `501 not-implemented` until then.

use axum::extract::Request;
use axum::response::Response;

use crate::app::App;
pub mod admin;
pub mod auth;
pub mod commands;
pub mod media;
pub mod overlay;
pub mod settings;
pub mod triggers;

use crate::errors::pending;
use crate::routes::{Route, Visitor};

/// What a handler gets: the server, the authorized caller and the request
pub struct Call<'app> {
    pub app: &'app App,
    pub visitor: Visitor,
    pub request: Request,
}

/// The request body up to `limit` bytes; `None` when it is larger (answer `413 too-large`)
pub async fn read_body(request: Request, limit: usize) -> Option<axum::body::Bytes> {
    axum::body::to_bytes(request.into_body(), limit).await.ok()
}

pub async fn handle(route: Route, call: Call<'_>) -> Response {
    match route {
        Route::AuthLogin => auth::login(&call),
        Route::AuthCallback => auth::callback(call).await,
        Route::AuthLogout => auth::logout(call).await,
        Route::Me => auth::me(call).await,
        Route::OverlayKey => auth::rotate_overlay_key(call).await,
        Route::TwitchDisconnect => auth::disconnect(call).await,
        Route::HelpConfig => commands::help(call).await,
        Route::SaveHelpConfig => commands::save(call).await,
        Route::TriggerConfig => triggers::config(call).await,
        Route::SaveTriggerConfig => triggers::save(call).await,
        Route::TriggerList => triggers::list(call).await,
        Route::FireTrigger => triggers::fire(call).await,
        Route::MediaList => media::list(call).await,
        Route::UploadMedia => media::upload(call).await,
        Route::DeleteMedia => media::delete(call).await,
        Route::SpotifyCallback
        | Route::TestAlert
        | Route::SpotifyLogin
        | Route::SpotifyDetails
        | Route::SpotifyLogout
        | Route::RenderStart
        | Route::RenderFrame
        | Route::RenderDone
        | Route::RenderCancel
        | Route::RenderFiles
        | Route::RenderFile => pending(),
        Route::Settings => settings::settings(call).await,
        Route::SaveSettings => settings::save(call).await,
        Route::Themes => settings::schemas(),
        Route::AdminAccess => admin::access(call).await,
        Route::SaveAdminAccess => admin::save_access(call).await,
        Route::AdminStreamers => admin::streamers(call).await,
        Route::AdminAudit => admin::audit(call).await,
    }
}
