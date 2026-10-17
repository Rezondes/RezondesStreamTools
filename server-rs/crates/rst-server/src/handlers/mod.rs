//! One handler per route (template: `HANDLERS` in `server/index.ts`). The match lists every route, so a new route
//! does not compile without a handler. Routes of later packages answer `501 not-implemented` until then.

use axum::extract::Request;
use axum::response::Response;

use crate::app::App;
pub mod auth;

use crate::errors::pending;
use crate::routes::{Route, Visitor};

/// What a handler gets: the server, the authorized caller and the request
pub struct Call<'app> {
    pub app: &'app App,
    pub visitor: Visitor,
    pub request: Request,
}

pub async fn handle(route: Route, call: Call<'_>) -> Response {
    match route {
        Route::AuthLogin => auth::login(&call),
        Route::AuthCallback => auth::callback(call).await,
        Route::AuthLogout => auth::logout(call).await,
        Route::Me => auth::me(call).await,
        Route::OverlayKey => auth::rotate_overlay_key(call).await,
        Route::TwitchDisconnect => auth::disconnect(call).await,
        Route::SpotifyCallback
        | Route::TestAlert
        | Route::TriggerConfig
        | Route::SaveTriggerConfig
        | Route::TriggerList
        | Route::FireTrigger
        | Route::MediaList
        | Route::UploadMedia
        | Route::DeleteMedia
        | Route::SpotifyLogin
        | Route::SpotifyDetails
        | Route::SpotifyLogout
        | Route::HelpConfig
        | Route::SaveHelpConfig
        | Route::Settings
        | Route::SaveSettings
        | Route::RenderStart
        | Route::RenderFrame
        | Route::RenderDone
        | Route::RenderCancel
        | Route::RenderFiles
        | Route::RenderFile
        | Route::AdminAccess
        | Route::SaveAdminAccess
        | Route::AdminStreamers => pending(),
    }
}
