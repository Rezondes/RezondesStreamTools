//! Trigger editor (template: `triggerConfig`, `saveTriggerConfig`, `triggerList` and `fireTrigger` in
//! `server/index.ts`). Unlike the Node server the rules do not need a running Twitch connection; firing does.

use std::collections::HashMap;

use axum::extract::Query;
use axum::response::Response;
use rst_app::profile::ProfileError;
use serde_json::{Value, json};

use crate::clock::now_ms;
use crate::errors::{json, server_error, text};
use crate::handlers::{Call, read_body};

/// Larger bodies of the trigger editor are refused
const TRIGGER_LIMIT: usize = 1024 * 1024;

/// The rules as stored, for the editor
pub async fn config(call: Call<'_>) -> Response {
    let Some(id) = call.visitor.streamer.as_ref() else { return text(401, "unauthorized") };
    match call.app.trigger_service().rules(id).await {
        Ok(rules) => json(&json!({ "triggers": rules }), 200),
        Err(error) => server_error(&error.to_string()),
    }
}

/// The server checks the rules; on errors nothing changes and the messages come back
pub async fn save(call: Call<'_>) -> Response {
    let app = call.app;
    let Some(id) = call.visitor.streamer.clone() else { return text(401, "unauthorized") };
    let actor = call.visitor.login.clone().unwrap_or_default();
    let Some(body) = read_body(call.request, TRIGGER_LIMIT).await else { return text(413, "too-large") };
    let input = serde_json::from_slice::<Value>(&body).unwrap_or(Value::Null);
    let Some(list) = input.get("triggers").and_then(Value::as_array) else { return json(&["invalid-json"], 400) };
    match app.trigger_service().save(&id, &actor, list, now_ms()).await {
        Ok(saved) => {
            if let Some(triggers) = app.runtimes.get(&id).and_then(|runtime| runtime.triggers.clone()) {
                triggers.replace(&saved);
            }
            json(&json!({ "ok": true }), 200)
        }
        Err(ProfileError::Invalid(errors)) => json(&errors, 400),
        Err(ProfileError::Vault(error)) => server_error(&error.to_string()),
    }
}

pub async fn list(call: Call<'_>) -> Response {
    let Some(id) = call.visitor.streamer.as_ref() else { return text(401, "unauthorized") };
    match call.app.trigger_service().names(id).await {
        Ok(names) => json(&names, 200),
        Err(error) => server_error(&error.to_string()),
    }
}

/// Test button of the dashboard: fires without cooldown; needs the running runtime with triggers
pub fn fire(call: &Call<'_>) -> Response {
    let Some(id) = call.visitor.streamer.as_ref() else { return text(401, "unauthorized") };
    let query =
        Query::<HashMap<String, String>>::try_from_uri(call.request.uri()).map(|query| query.0).unwrap_or_default();
    let name: String = query.get("name").map(|name| name.chars().take(200).collect()).unwrap_or_default();
    let Some(triggers) = call.app.runtimes.get(id).and_then(|runtime| runtime.triggers.clone()) else {
        return text(409, "not-connected");
    };
    if triggers.fire(&name) { json(&json!({ "ok": true }), 200) } else { text(404, "unknown-trigger") }
}
