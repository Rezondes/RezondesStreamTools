//! Settings and themes of the own profile (template: `settings` and `saveSettingsRequest` in `server/index.ts`),
//! plus the schemas of all themes for the forms.

use axum::response::Response;
use rst_app::events::{DashboardChange, ServerMessage};
use rst_app::settings::SaveError;
use rst_domain::identity::values::Login;
use rst_domain::settings::file::minime_rules_of;
use rst_domain::themes::registry::themes;
use rst_domain::themes::schema::ThemeSchema;
use serde_json::{Value, json};

use crate::clock::now_ms;
use crate::errors::{json, server_error, text};
use crate::handlers::{Call, read_body};

/// Larger bodies of the settings form are refused
const SETTINGS_LIMIT: usize = 512 * 1024;

/// Chosen theme, stored values per theme and the available themes
pub async fn settings(call: Call<'_>) -> Response {
    let Some(id) = call.visitor.streamer.as_ref() else { return text(401, "unauthorized") };
    match call.app.settings_service().current(id).await {
        Ok(file) => {
            let list: Vec<Value> =
                themes().iter().map(|theme| json!({ "id": theme.schema.id, "name": theme.schema.name })).collect();
            json(&json!({ "theme": file.theme, "values": file.values, "themes": list }), 200)
        }
        Err(error) => server_error(&error.to_string()),
    }
}

/// Choose a theme and save its values; errors come as codes per field
pub async fn save(call: Call<'_>) -> Response {
    let app = call.app;
    let Some(id) = call.visitor.streamer.clone() else { return text(401, "unauthorized") };
    let actor = call.visitor.login.clone().unwrap_or_default();
    let Some(body) = read_body(call.request, SETTINGS_LIMIT).await else { return text(413, "too-large") };
    // Broken JSON is like a body without a theme: the answer names the field
    let input = serde_json::from_slice::<Value>(&body).unwrap_or(Value::Null);
    match app.settings_service().save(&id, &actor, &input, now_ms()).await {
        Ok(public) => {
            // Open overlays take over the values right away, without reloading
            app.hubs.emit(&id, &ServerMessage::Settings { settings: public.clone() });
            // The dashboard shows the chosen theme
            app.hubs.changed(&id, DashboardChange::Account);
            // Changed minime rules take effect at once
            if let Some(minimes) = app.runtimes.get(&id).and_then(|runtime| runtime.minimes.clone()) {
                match app.stores.profile.settings(&id).await {
                    Ok(file) => minimes.set_rules(file.as_ref().and_then(minime_rules_of)),
                    Err(error) => eprintln!("Reading the minime rules failed: {error}"),
                }
            }
            json(&public, 200)
        }
        Err(SaveError::Invalid(errors)) => json(&errors, 400),
        Err(SaveError::Vault(error)) => server_error(&error.to_string()),
    }
}

/// The schemas of all themes, as the forms build their fields from them; with the defaults of the logged-in streamer
/// (their channel name instead of the sample), so "reset" in the form goes back to their own values
pub fn schemas(call: &Call<'_>) -> Response {
    let login = call.visitor.login.as_deref().and_then(|login| Login::parse(login).ok());
    let list: Vec<ThemeSchema> = themes()
        .iter()
        .map(|theme| login.as_ref().map_or_else(|| theme.schema.clone(), |login| theme.schema_for(login)))
        .collect();
    json(&list, 200)
}
