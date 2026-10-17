//! Media of a streamer (template: `mediaList`, `uploadMedia`, `removeMedia` and the media part of `overlay` in
//! `server/index.ts`). Uploads stream into the encrypted file store and stop as soon as they pass the 50 MB limit or
//! the storage quota; only one upload per streamer runs at a time.

use std::collections::HashMap;

use axum::extract::Query;
use axum::http::{HeaderValue, header};
use axum::response::Response;
use http_body_util::BodyExt;
use rst_app::audit::AuditEntry;
use rst_app::crypto::cipher::random_bytes;
use rst_app::media::Shelf;
use rst_app::ports::files::FileWriter;
use rst_domain::identity::values::StreamerId;
use rst_domain::media::values::MediaName;
use serde_json::json;

use crate::app::{App, SANDBOX_CSP};
use crate::clock::now_ms;
use crate::errors::{json, server_error, text};
use crate::handlers::Call;
use crate::static_files::content_type;

/// One file at most this large
const MEDIA_LIMIT: u64 = 50 * 1024 * 1024;

fn name_of(call: &Call<'_>) -> Option<MediaName> {
    let query =
        Query::<HashMap<String, String>>::try_from_uri(call.request.uri()).map(|query| query.0).unwrap_or_default();
    query.get("name").and_then(|name| MediaName::parse(name).ok())
}

async fn audit(app: &App, id: &StreamerId, actor: &str, action: &str, after: serde_json::Value) {
    let entry = AuditEntry {
        id: 0,
        created_at: 0,
        actor: actor.to_owned(),
        action: action.to_owned(),
        before: None,
        after: Some(after),
    };
    if let Err(error) = app.stores.audit.append(Some(id), &entry, now_ms()).await {
        eprintln!("Audit entry {action} failed: {error}");
    }
}

/// Media with size and the triggers that use them, plus used and allowed storage
pub async fn list(call: Call<'_>) -> Response {
    let app = call.app;
    let Some(id) = call.visitor.streamer.as_ref() else { return text(401, "unauthorized") };
    let triggers = match app.trigger_service().rules(id).await {
        Ok(triggers) => triggers,
        Err(error) => return server_error(&error.to_string()),
    };
    match app.stores.media.overview(id, &triggers, app.config.media_quota_bytes).await {
        Ok(overview) => json(&overview, 200),
        Err(error) => server_error(&error.to_string()),
    }
}

pub async fn upload(call: Call<'_>) -> Response {
    let app = call.app;
    let Some(id) = call.visitor.streamer.clone() else { return text(401, "unauthorized") };
    let login = call.visitor.login.clone().unwrap_or_default();
    let Some(name) = name_of(&call) else { return text(400, "invalid-name") };
    let Some(_slot) = app.upload_slot(&login) else { return text(409, "upload-busy") };
    let media = &app.stores.media;
    let known = match media.list(&id, Shelf::Media).await {
        Ok(known) => known,
        Err(error) => return server_error(&error.to_string()),
    };
    let used: u64 = known.iter().map(|file| file.size).sum();
    let replaced = known.iter().find(|file| file.name == name.as_str()).map_or(0, |file| file.size);
    let allowed = app.config.media_quota_bytes.saturating_sub(used - replaced);
    let Ok(random) = random_bytes::<16>() else { return server_error("no random bytes for a file name") };
    let (mut writer, file) = match media.writer(&id, random).await {
        Ok(started) => started,
        Err(error) => return server_error(&error.to_string()),
    };
    let mut body = call.request.into_body();
    let mut size: u64 = 0;
    while let Some(frame) = body.frame().await {
        let Ok(frame) = frame else { return text(400, "upload-broken") };
        let Some(chunk) = frame.data_ref() else { continue };
        size += chunk.len() as u64;
        // An unfinished writer leaves nothing behind
        if size > MEDIA_LIMIT {
            return text(413, "too-large");
        }
        if size > allowed {
            return text(413, "quota-exceeded");
        }
        if let Err(error) = writer.write(chunk) {
            return server_error(&error.to_string());
        }
    }
    let written = match writer.finish() {
        Ok(written) => written,
        Err(error) => return server_error(&error.to_string()),
    };
    if let Err(error) = media.commit(&id, Shelf::Media, name.as_str(), file, written, now_ms()).await {
        return server_error(&error.to_string());
    }
    audit(app, &id, &login, "media.upload", json!({ "name": name, "size": written })).await;
    println!("Media uploaded by {login}: {name}");
    json(&json!({ "ok": true, "name": name }), 200)
}

pub async fn delete(call: Call<'_>) -> Response {
    let app = call.app;
    let Some(id) = call.visitor.streamer.clone() else { return text(401, "unauthorized") };
    let login = call.visitor.login.clone().unwrap_or_default();
    let Some(name) = name_of(&call) else { return text(400, "invalid-name") };
    match app.stores.media.delete(&id, Shelf::Media, name.as_str()).await {
        Ok(true) => {
            audit(app, &id, &login, "media.delete", json!({ "name": name })).await;
            json(&json!({ "ok": true }), 200)
        }
        Ok(false) => text(404, "not-found"),
        Err(error) => server_error(&error.to_string()),
    }
}

/// `/s/<login>/media/<name>`: decrypted, in a sandbox so an uploaded SVG cannot run scripts
pub async fn deliver(app: &App, id: &StreamerId, name: &MediaName) -> Response {
    match app.stores.media.read(id, Shelf::Media, name.as_str()).await {
        Ok(Some(data)) => {
            let mut response = Response::new(data.to_vec().into());
            let headers = response.headers_mut();
            headers.insert(
                header::CONTENT_TYPE,
                HeaderValue::from_static(content_type(std::path::Path::new(name.as_str()))),
            );
            headers.insert(header::CONTENT_SECURITY_POLICY, HeaderValue::from_static(SANDBOX_CSP));
            response
        }
        Ok(None) => text(404, "not-found"),
        Err(error) => server_error(&error.to_string()),
    }
}
