//! One handler per route (template: `HANDLERS` in `server/index.ts`). The match lists every route, so a new route
//! does not compile without a handler.

use axum::extract::Request;
use axum::response::Response;

use crate::app::App;
pub mod admin;
pub mod auth;
pub mod backups;
pub mod commands;
pub mod events;
pub mod media;
pub mod music;
pub mod overlay;
pub mod panels;
pub mod render;
pub mod settings;
pub mod triggers;

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
        Route::SavePrefs => auth::save_prefs(call).await,
        Route::OverlayKey => auth::rotate_overlay_key(call).await,
        Route::TwitchDisconnect => auth::disconnect(call).await,
        Route::TestAlert => events::test_alert(&call),
        Route::Stats => events::stats(call).await,
        Route::StatsReset => events::reset_stats(call).await,
        Route::StatsLive => events::toggle_live(call).await,
        Route::HelpConfig => commands::help(call).await,
        Route::SaveHelpConfig => commands::save(call).await,
        Route::TriggerConfig => triggers::config(call).await,
        Route::SaveTriggerConfig => triggers::save(call).await,
        Route::TriggerList => triggers::list(call).await,
        Route::FireTrigger => triggers::fire(&call),
        Route::MediaList => media::list(call).await,
        Route::UploadMedia => media::upload(call).await,
        Route::DeleteMedia => media::delete(call).await,
        Route::SpotifyLogin => music::login(&call),
        Route::SpotifyCallback => music::callback(call).await,
        Route::SpotifyDetails => music::details(call).await,
        Route::SpotifyLogout => music::logout(call).await,
        Route::RenderStart => render::start(call).await,
        Route::RenderFrame => render::frame(call).await,
        Route::RenderDone => render::done(call).await,
        Route::RenderCancel => render::cancel(call).await,
        Route::RenderFiles => render::files(call).await,
        Route::RenderFile => render::file(call).await,
        Route::Settings => settings::settings(call).await,
        Route::SaveSettings => settings::save(call).await,
        Route::Themes => settings::schemas(&call),
        Route::Panels => panels::list(call).await,
        Route::SavePanels => panels::save(call).await,
        Route::AdminAccess => admin::access(call).await,
        Route::SaveAdminAccess => admin::save_access(call).await,
        Route::AdminStreamers => admin::streamers(call).await,
        Route::AdminAudit => admin::audit(call).await,
        Route::DeleteStreamer => admin::delete_streamer(call).await,
        Route::AdminBackups => backups::list(call).await,
        Route::CreateBackup => backups::create(&call),
        Route::DownloadBackup => backups::download(call).await,
        Route::DeleteBackup => backups::delete(call).await,
        Route::UploadBackup => backups::upload(call).await,
        Route::RestoreBackup => backups::restore(call).await,
        Route::BackupSettings => backups::settings(call).await,
        Route::SaveBackupSettings => backups::save_settings(call).await,
    }
}
