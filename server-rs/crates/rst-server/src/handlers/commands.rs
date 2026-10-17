//! Help command setting (template: `helpConfig` and `saveHelpConfig` in `server/index.ts`).

use axum::response::Response;
use rst_app::profile::ProfileError;
use serde_json::{Value, json};

use crate::clock::now_ms;
use crate::errors::{json, server_error, text};
use crate::handlers::{Call, read_body};

/// Larger bodies of the help form are refused
const HELP_LIMIT: usize = 512 * 1024;

/// `canChat`: may the Twitch login write to chat; `null` until the runtime knows it (package 35)
pub async fn help(call: Call<'_>) -> Response {
    let Some(id) = call.visitor.streamer.as_ref() else { return text(401, "unauthorized") };
    match call.app.command_service().help(id).await {
        Ok(help) => {
            let mut answer = json!(help);
            answer["canChat"] = Value::Null;
            json(&answer, 200)
        }
        Err(error) => server_error(&error.to_string()),
    }
}

pub async fn save(call: Call<'_>) -> Response {
    let app = call.app;
    let Some(id) = call.visitor.streamer.clone() else { return text(401, "unauthorized") };
    let actor = call.visitor.login.clone().unwrap_or_default();
    let Some(body) = read_body(call.request, HELP_LIMIT).await else { return text(413, "too-large") };
    let input = serde_json::from_slice::<Value>(&body).unwrap_or(Value::Null);
    match app.command_service().save_help(&id, &actor, &input, now_ms()).await {
        Ok(help) => json(&help, 200),
        Err(ProfileError::Invalid(_)) => text(400, "invalid-json"),
        Err(ProfileError::Vault(error)) => server_error(&error.to_string()),
    }
}
