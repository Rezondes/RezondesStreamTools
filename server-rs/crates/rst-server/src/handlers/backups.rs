//! Server-wide backups for admins (new, no Node template): list, create in the background, download and delete.
//! The id comes as `?id=`; only ids the server made are ever paths in the backup folder.

use std::collections::HashMap;

use axum::body::Body;
use axum::extract::Query;
use axum::http::{HeaderValue, header};
use axum::response::Response;
use rst_app::backup::BackupError;
use rst_app::crypto::cipher::random_bytes;
use serde_json::json;
use tokio_util::io::ReaderStream;

use crate::clock::now_ms;
use crate::errors::{json, server_error, text};
use crate::handlers::Call;

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
        Err(BackupError::Busy) => text(409, "backup-busy"),
        Err(BackupError::Store(error)) => server_error(&error.to_string()),
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
