//! Server-wide backups for admins (new, no Node template): list, create in the background, download, delete, upload
//! and restore. The id comes as `?id=`; only ids the server made are ever paths in the backup folder. A restore runs in
//! maintenance: every runtime stops, overlays answer 503, afterwards every allowed runtime starts again.

use std::collections::HashMap;
use std::sync::atomic::{AtomicBool, Ordering};

use axum::body::Body;
use axum::extract::Query;
use axum::http::{HeaderValue, header};
use axum::response::Response;
use http_body_util::BodyExt;
use rst_app::audit::AuditEntry;
use rst_app::backup::BackupError;
use rst_app::backup::schedule::BackupSchedule;
use rst_app::crypto::cipher::random_bytes;
use serde_json::json;
use tokio::io::AsyncWriteExt;
use tokio_util::io::ReaderStream;

use crate::clock::now_ms;
use crate::errors::{json, server_error, text};
use crate::handlers::{Call, read_body};

/// The schedule form is small
const SETTINGS_LIMIT: usize = 4 * 1024;

fn id_of(call: &Call<'_>) -> String {
    let query =
        Query::<HashMap<String, String>>::try_from_uri(call.request.uri()).map(|query| query.0).unwrap_or_default();
    query.get("id").map(|id| id.chars().take(64).collect()).unwrap_or_default()
}

fn actor(call: &Call<'_>) -> String {
    call.visitor.login.clone().unwrap_or_default()
}

/// The backups, newest first, and whether one is being written
pub async fn list(call: Call<'_>) -> Response {
    let backups = &call.app.backups;
    match backups.list().await {
        Ok(list) => json(&json!({ "running": backups.running(), "backups": list }), 200),
        Err(error) => server_error(&format!("{error:?}")),
    }
}

/// Starts a backup; the answer comes before it is written (`202`)
pub fn create(call: &Call<'_>) -> Response {
    let Ok(random) = random_bytes::<4>() else { return server_error("no random bytes for a backup id") };
    match call.app.backups.start(&actor(call), false, now_ms(), random) {
        Ok(id) => json(&json!({ "id": id }), 202),
        Err(error) => failed(&error),
    }
}

fn failed(error: &BackupError) -> Response {
    match error {
        BackupError::Busy => text(409, "backup-busy"),
        BackupError::Invalid(reason) => {
            eprintln!("Backup rejected: {reason}");
            text(400, "backup-invalid")
        }
        BackupError::NotFound => text(404, "not-found"),
        BackupError::Store(error) => server_error(&error.to_string()),
    }
}

/// Uploads an archive (streamed to disk, at most `BACKUP_UPLOAD_MB`); it only becomes a backup after the check
pub async fn upload(call: Call<'_>) -> Response {
    let (app, actor) = (call.app, actor(&call));
    let Ok(random) = random_bytes::<4>() else { return server_error("no random bytes for a backup id") };
    let (id, path) = app.backups.upload_target(now_ms(), random);
    if let Some(folder) = path.parent()
        && let Err(error) = tokio::fs::create_dir_all(folder).await
    {
        return server_error(&error.to_string());
    }
    let mut file = match tokio::fs::File::create(&path).await {
        Ok(file) => file,
        Err(error) => return server_error(&error.to_string()),
    };
    let mut body = call.request.into_body();
    let mut size: u64 = 0;
    let mut refusal = None;
    while let Some(frame) = body.frame().await {
        let Ok(frame) = frame else {
            refusal = Some(text(400, "upload-broken"));
            break;
        };
        let Some(chunk) = frame.data_ref() else { continue };
        size += chunk.len() as u64;
        if size > app.config.backup_upload_bytes {
            refusal = Some(text(413, "too-large"));
            break;
        }
        if let Err(error) = file.write_all(chunk).await {
            refusal = Some(server_error(&error.to_string()));
            break;
        }
    }
    let flushed = file.flush().await;
    drop(file);
    if let Some(refusal) = refusal.or_else(|| flushed.err().map(|error| server_error(&error.to_string()))) {
        let _ = tokio::fs::remove_file(&path).await;
        return refusal;
    }
    match app.backups.accept_upload(&actor, &id, now_ms()).await {
        Ok(info) => json(&info, 200),
        Err(error) => failed(&error),
    }
}

/// Ends maintenance when the restore is over, also when it panics
struct Maintenance<'a>(&'a AtomicBool);

impl Drop for Maintenance<'_> {
    fn drop(&mut self) {
        self.0.store(false, Ordering::SeqCst);
    }
}

/// Restores a backup in maintenance; streamers without a data key are left out and named in the answer
pub async fn restore(call: Call<'_>) -> Response {
    let (app, id, actor) = (call.app, id_of(&call), actor(&call));
    // Another backup runs: nothing to stop and restart
    if app.backups.running() {
        return text(409, "backup-busy");
    }
    app.maintenance.store(true, Ordering::SeqCst);
    let _maintenance = Maintenance(&app.maintenance);
    app.stop_all_runtimes();
    let result = app.backups.restore(&actor, &id, now_ms()).await;
    let running = app.restart_all().await;
    eprintln!("Restore of {id} done, {running} runtimes running");
    match result {
        Ok(report) => json(&report, 200),
        Err(error) => failed(&error),
    }
}

pub async fn download(call: Call<'_>) -> Response {
    let (id, actor) = (id_of(&call), actor(&call));
    let path = match call.app.backups.download(&actor, &id, now_ms()).await {
        Ok(Some(path)) => path,
        Ok(None) => return text(404, "not-found"),
        Err(error) => return server_error(&format!("{error:?}")),
    };
    let file = match tokio::fs::File::open(&path).await {
        Ok(file) => file,
        Err(error) => return server_error(&error.to_string()),
    };
    let mut response = Response::new(Body::from_stream(ReaderStream::new(file)));
    let headers = response.headers_mut();
    headers.insert(header::CONTENT_TYPE, HeaderValue::from_static("application/zip"));
    if let Ok(value) = HeaderValue::from_str(&format!("attachment; filename=\"{id}.zip\"")) {
        headers.insert(header::CONTENT_DISPOSITION, value);
    }
    response
}

pub async fn delete(call: Call<'_>) -> Response {
    let (id, actor) = (id_of(&call), actor(&call));
    match call.app.backups.delete(&actor, &id, now_ms()).await {
        Ok(true) => json(&json!({ "ok": true }), 200),
        Ok(false) => text(404, "not-found"),
        Err(error) => server_error(&format!("{error:?}")),
    }
}

/// The schedule of the automatic backups
pub async fn settings(call: Call<'_>) -> Response {
    match call.app.stores.schedule.load().await {
        Ok(schedule) => json(&schedule, 200),
        Err(error) => server_error(&error.to_string()),
    }
}

/// Saves the schedule; values outside the limits are `400 invalid-json`
pub async fn save_settings(call: Call<'_>) -> Response {
    let (app, actor) = (call.app, actor(&call));
    let Some(body) = read_body(call.request, SETTINGS_LIMIT).await else { return text(413, "too-large") };
    let input = serde_json::from_slice(&body).unwrap_or(serde_json::Value::Null);
    let Some(schedule) = BackupSchedule::parse(&input) else { return text(400, "invalid-json") };
    let before = match app.stores.schedule.load().await {
        Ok(before) => before,
        Err(error) => return server_error(&error.to_string()),
    };
    let now = now_ms();
    if let Err(error) = app.stores.schedule.save(&schedule, now).await {
        return server_error(&error.to_string());
    }
    let entry = AuditEntry {
        id: 0,
        created_at: 0,
        actor,
        action: "backup.settings".to_owned(),
        before: Some(json!(before)),
        after: Some(json!(schedule)),
    };
    if let Err(error) = app.stores.audit.append(None, &entry, now).await {
        return server_error(&error.to_string());
    }
    json(&schedule, 200)
}
