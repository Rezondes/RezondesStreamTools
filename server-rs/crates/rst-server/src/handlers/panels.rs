//! Panel designer: the panel list of a streamer as the dashboard sends it; the dashboard draws and saves the pictures.

use axum::response::Response;
use rst_app::profile::ProfileError;
use serde_json::{Value, json};

use crate::clock::now_ms;
use crate::errors::{json, server_error, text};
use crate::handlers::{Call, read_body};

/// Larger bodies are refused; pictures in the panels are embedded, so it is roomier than other editors
const PANELS_LIMIT: usize = 8 * 1024 * 1024;

pub async fn list(call: Call<'_>) -> Response {
    let Some(id) = call.visitor.streamer.as_ref() else { return text(401, "unauthorized") };
    match call.app.stores.profile.panels(id).await {
        Ok(panels) => json(&json!({ "panels": panels }), 200),
        Err(error) => server_error(&error.to_string()),
    }
}

pub async fn save(call: Call<'_>) -> Response {
    let app = call.app;
    let Some(id) = call.visitor.streamer.clone() else { return text(401, "unauthorized") };
    let Some(body) = read_body(call.request, PANELS_LIMIT).await else { return text(413, "too-large") };
    let input = serde_json::from_slice::<Value>(&body).unwrap_or(Value::Null);
    match app.stores.profile.save_panels(&id, input.get("panels").unwrap_or(&Value::Null), now_ms()).await {
        Ok(()) => json(&json!({ "ok": true }), 200),
        Err(ProfileError::Invalid(errors)) => json(&errors, 400),
        Err(ProfileError::Vault(error)) => server_error(&error.to_string()),
    }
}
