//! Rendering of stinger and banners (template: `server/renderRoutes.ts`): the dashboard sends the frames as PNG, ffmpeg
//! builds `WebM` (stinger) or GIF with a still image (banners). Frames lie unencrypted in a temporary folder only until
//! ffmpeg is done and are deleted in any case; the results are stored encrypted. Every step checks the feature of the
//! clip again, so switching it off stops a running render.

use std::collections::{BTreeMap, HashMap};
use std::path::{Path, PathBuf};

use axum::extract::Query;
use axum::http::{HeaderValue, header};
use axum::response::Response;
use rst_app::crypto::cipher::random_bytes;
use rst_app::media::Shelf;
use rst_domain::access::Feature;
use rst_domain::identity::values::StreamerId;
use rst_domain::render::clips::{Clip, Format};
use rst_domain::render::ffmpeg::ffmpeg_args;
use rst_domain::render::jobs::{GIF_WARN_BYTES, MAX_FRAME_BYTES, RenderError};
use serde_json::json;

use crate::app::App;
use crate::clock::now_ms;
use crate::errors::{json, server_error, text};
use crate::handlers::{Call, read_body};
use crate::static_files::content_type;

fn query(call: &Call<'_>) -> HashMap<String, String> {
    Query::<HashMap<String, String>>::try_from_uri(call.request.uri()).map(|query| query.0).unwrap_or_default()
}

fn refused(error: RenderError) -> Response {
    let status = if matches!(error, RenderError::Limit | RenderError::TooLarge) { 400 } else { 409 };
    text(status, error.code())
}

/// Temporary folder of the streamer's render
fn folder(app: &App, id: &StreamerId) -> PathBuf {
    app.config.stores.render_temp.join(id.as_str())
}

async fn remove_folder(app: &App, id: &StreamerId) {
    if let Err(error) = tokio::fs::remove_dir_all(folder(app, id)).await
        && error.kind() != std::io::ErrorKind::NotFound
    {
        eprintln!("Deleting the render frames failed: {error}");
    }
}

fn allowed(call: &Call<'_>, clip: Clip) -> bool {
    call.visitor.features.get(&clip.feature()) == Some(&true)
}

/// The running render of a streamer whose feature was switched off ends here
async fn still_allowed(app: &App, features: &BTreeMap<Feature, bool>, id: &StreamerId) -> bool {
    let clip = app.render_jobs().clip(id.as_str(), now_ms());
    match clip {
        Some(clip) if features.get(&clip.feature()) != Some(&true) => {
            app.render_jobs().done(id.as_str());
            remove_folder(app, id).await;
            false
        }
        _ => true,
    }
}

pub async fn start(call: Call<'_>) -> Response {
    let Some(id) = call.visitor.streamer.clone() else { return text(401, "unauthorized") };
    let Some(clip) = query(&call).get("clip").and_then(|clip| Clip::parse(clip)) else {
        return text(400, "unknown-clip");
    };
    if !allowed(&call, clip) {
        return text(403, "feature-off");
    }
    if let Err(error) = call.app.render_jobs().start(id.as_str(), clip, now_ms()) {
        return refused(error);
    }
    remove_folder(call.app, &id).await;
    if let Err(error) = tokio::fs::create_dir_all(folder(call.app, &id)).await {
        call.app.render_jobs().done(id.as_str());
        return server_error(&error.to_string());
    }
    json(&json!({ "ok": true }), 200)
}

pub async fn frame(call: Call<'_>) -> Response {
    let Some(id) = call.visitor.streamer.clone() else { return text(401, "unauthorized") };
    if !still_allowed(call.app, &call.visitor.features, &id).await {
        return text(403, "feature-off");
    }
    let index = query(&call).get("i").and_then(|index| index.parse::<i64>().ok()).unwrap_or(-1);
    let app = call.app;
    let limit = usize::try_from(MAX_FRAME_BYTES).unwrap_or(usize::MAX);
    let Some(body) = read_body(call.request, limit).await else { return text(400, "too-large") };
    let bytes = u64::try_from(body.len()).unwrap_or(u64::MAX);
    if let Err(error) = app.render_jobs().frame(id.as_str(), index, bytes, now_ms()) {
        return refused(error);
    }
    match tokio::fs::write(folder(app, &id).join(format!("{index:04}.png")), &body).await {
        Ok(()) => json(&json!({ "ok": true }), 200),
        Err(error) => server_error(&error.to_string()),
    }
}

pub async fn done(call: Call<'_>) -> Response {
    let Some(id) = call.visitor.streamer.clone() else { return text(401, "unauthorized") };
    if !still_allowed(call.app, &call.visitor.features, &id).await {
        return text(403, "feature-off");
    }
    let fps = query(&call).get("fps").and_then(|fps| fps.parse::<i64>().ok()).unwrap_or(0);
    let job = match call.app.render_jobs().finish(id.as_str(), fps, now_ms()) {
        Ok(job) => job,
        Err(error) => return refused(error),
    };
    // The job stays taken until ffmpeg is done: never several ffmpeg runs for one streamer
    let response = encode(call.app, &id, job.clip, job.fps).await;
    remove_folder(call.app, &id).await;
    call.app.render_jobs().done(id.as_str());
    response
}

/// ffmpeg builds the clip in the temporary folder; the results are stored encrypted
async fn encode(app: &App, id: &StreamerId, clip: Clip, fps: u32) -> Response {
    let dir = folder(app, id);
    let names = clip.output_names();
    let target = dir.join(names[0]);
    let args = ffmpeg_args(clip.format(), fps, &dir.to_string_lossy(), &target.to_string_lossy());
    if let Err(error) = app.ffmpeg.run(&args).await {
        return text(500, error.code());
    }
    let mut outputs = vec![(names[0], target)];
    // Still image from the first frame for places where Twitch shows no animated GIF
    if let Some(still) = names.get(1) {
        outputs.push((still, dir.join("0000.png")));
    }
    let mut video_bytes = 0;
    for (name, path) in outputs {
        let data = match tokio::fs::read(&path).await {
            Ok(data) => data,
            Err(error) => return server_error(&error.to_string()),
        };
        let Ok(random) = random_bytes::<16>() else { return server_error("no random bytes for a file name") };
        match app.stores.media.store(id, Shelf::Render, name, &data, random, now_ms()).await {
            Ok(stored) if name == names[0] => video_bytes = stored.size,
            Ok(_) => {}
            Err(error) => return server_error(&error.to_string()),
        }
    }
    let too_large = clip.format() == Format::Gif && video_bytes > GIF_WARN_BYTES;
    json(&json!({ "files": names, "bytes": video_bytes, "tooLarge": too_large }), 200)
}

/// Cancel before encoding: releases the job and deletes the frames so far
pub async fn cancel(call: Call<'_>) -> Response {
    let Some(id) = call.visitor.streamer.clone() else { return text(401, "unauthorized") };
    if !call.app.render_jobs().cancel(id.as_str(), now_ms()) {
        return text(409, "render-busy");
    }
    remove_folder(call.app, &id).await;
    json(&json!({ "ok": true }), 200)
}

fn is_output_name(name: &str) -> bool {
    Clip::ALL.iter().any(|clip| clip.output_names().contains(&name))
}

/// The finished files with their size
pub async fn files(call: Call<'_>) -> Response {
    let Some(id) = call.visitor.streamer.as_ref() else { return text(401, "unauthorized") };
    match call.app.stores.media.list(id, Shelf::Render).await {
        Ok(stored) => {
            let list: Vec<_> = stored
                .iter()
                .filter(|file| is_output_name(&file.name))
                .map(|file| json!({ "name": file.name, "size": file.size }))
                .collect();
            json(&list, 200)
        }
        Err(error) => server_error(&error.to_string()),
    }
}

/// A finished file as a download
pub async fn file(call: Call<'_>) -> Response {
    let Some(id) = call.visitor.streamer.as_ref() else { return text(401, "unauthorized") };
    let name = query(&call).get("name").cloned().unwrap_or_default();
    if !is_output_name(&name) {
        return text(400, "invalid-name");
    }
    match call.app.stores.media.read(id, Shelf::Render, &name).await {
        Ok(Some(data)) => {
            let mut response = Response::new(data.to_vec().into());
            let headers = response.headers_mut();
            headers.insert(header::CONTENT_TYPE, HeaderValue::from_static(content_type(Path::new(&name))));
            if let Ok(value) = HeaderValue::from_str(&format!("attachment; filename=\"{name}\"")) {
                headers.insert(header::CONTENT_DISPOSITION, value);
            }
            response
        }
        Ok(None) => text(404, "not-found"),
        Err(error) => server_error(&error.to_string()),
    }
}
