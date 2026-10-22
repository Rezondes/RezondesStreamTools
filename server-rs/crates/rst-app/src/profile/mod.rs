//! Profile data of a streamer, encrypted in the vault (replaces `tokens.json`, `spotify.json`, `settings.json`,
//! `triggers.json`, `commands.json` and `minimes.json`). Everything passes the domain checks before it is stored,
//! so nothing invalid ever lands in the database.

use std::fmt;

use rst_domain::commands::{HelpConfig, default_help, to_help_config};
use rst_domain::identity::values::{Login, StreamerId};
use rst_domain::minimes::parse_minime_file;
use rst_domain::minimes::roster::MinimeState;
use rst_domain::settings::file::{SettingsFile, first_settings, parse_settings_file};
use rst_domain::spotify::SpotifyTokens;
use rst_domain::stats::StreamTally;
use rst_domain::triggers::{Trigger, compile};
use rst_domain::twitch::tokens::TwitchTokens;
use serde_json::Value;

use crate::ports::keys::KeyStore;
use crate::ports::records::RecordStore;
use crate::vault::{Vault, VaultError};

const TWITCH_TOKENS: &str = "twitch-tokens";
const SPOTIFY_TOKENS: &str = "spotify-tokens";
const SETTINGS: &str = "settings";
const TRIGGERS: &str = "triggers";
const HELP: &str = "help";
const MINIMES: &str = "minimes";
const STATS: &str = "stats";
const PANELS: &str = "panels";
/// At most this many panels; the dashboard draws them, the server only keeps them
pub const MAX_PANELS: usize = 20;

/// The panel list of the panel designer is kept as the dashboard sends it, as long as it is a list of at most
/// `MAX_PANELS` objects (the body size is limited by the handler)
fn check_panels(panels: &Value) -> Result<(), ProfileError> {
    match panels.as_array() {
        Some(list) if list.len() <= MAX_PANELS && list.iter().all(Value::is_object) => Ok(()),
        _ => Err(ProfileError::Invalid(vec!["panels".to_owned()])),
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ProfileError {
    /// The input does not pass the domain checks; the messages are for the editor
    Invalid(Vec<String>),
    Vault(VaultError),
}

impl fmt::Display for ProfileError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Invalid(errors) => write!(formatter, "invalid: {}", errors.join("; ")),
            Self::Vault(error) => error.fmt(formatter),
        }
    }
}

impl std::error::Error for ProfileError {}

impl From<VaultError> for ProfileError {
    fn from(error: VaultError) -> Self {
        Self::Vault(error)
    }
}

#[derive(Debug, Clone)]
pub struct Profile<S, K> {
    vault: Vault<S, K>,
}

impl<S: RecordStore, K: KeyStore> Profile<S, K> {
    pub const fn new(vault: Vault<S, K>) -> Self {
        Self { vault }
    }

    /// # Errors
    /// `Unreadable` after the streamer was shredded.
    pub async fn twitch_tokens(&self, id: &StreamerId) -> Result<Option<TwitchTokens>, VaultError> {
        self.vault.get_json(id, TWITCH_TOKENS, "").await
    }

    /// # Errors
    /// See [`Vault::put`].
    pub async fn save_twitch_tokens(&self, id: &StreamerId, tokens: &TwitchTokens, now: i64) -> Result<(), VaultError> {
        self.vault.put_json(id, TWITCH_TOKENS, "", tokens, now).await
    }

    /// # Errors
    /// When storing fails.
    pub async fn delete_twitch_tokens(&self, id: &StreamerId) -> Result<(), VaultError> {
        self.vault.delete(id, TWITCH_TOKENS, "").await.map(drop)
    }

    /// # Errors
    /// `Unreadable` after the streamer was shredded.
    pub async fn spotify_tokens(&self, id: &StreamerId) -> Result<Option<SpotifyTokens>, VaultError> {
        self.vault.get_json(id, SPOTIFY_TOKENS, "").await
    }

    /// # Errors
    /// See [`Vault::put`].
    pub async fn save_spotify_tokens(
        &self,
        id: &StreamerId,
        tokens: &SpotifyTokens,
        now: i64,
    ) -> Result<(), VaultError> {
        self.vault.put_json(id, SPOTIFY_TOKENS, "", tokens, now).await
    }

    /// # Errors
    /// When storing fails.
    pub async fn delete_spotify_tokens(&self, id: &StreamerId) -> Result<(), VaultError> {
        self.vault.delete(id, SPOTIFY_TOKENS, "").await.map(drop)
    }

    /// The stored settings brought into valid shape; `None` before the first login
    ///
    /// # Errors
    /// `Unreadable` after the streamer was shredded.
    pub async fn settings(&self, id: &StreamerId) -> Result<Option<SettingsFile>, VaultError> {
        let raw: Option<Value> = self.vault.get_json(id, SETTINGS, "").await?;
        Ok(raw.as_ref().map(parse_settings_file))
    }

    /// Stores settings from [`rst_domain::settings::file::update_settings`]; they are normalized once more
    ///
    /// # Errors
    /// See [`Vault::put`].
    pub async fn save_settings(&self, id: &StreamerId, file: &SettingsFile, now: i64) -> Result<(), VaultError> {
        let raw =
            serde_json::to_value(file).map_err(|error| VaultError::Store(crate::ports::StoreError::new(error)))?;
        self.vault.put_json(id, SETTINGS, "", &parse_settings_file(&raw), now).await
    }

    /// Creates the first settings from the login; `true` if they were new, existing ones stay
    ///
    /// # Errors
    /// As [`Self::settings`].
    pub async fn ensure_settings(&self, id: &StreamerId, login: &Login, now: i64) -> Result<bool, VaultError> {
        if self.settings(id).await?.is_some() {
            return Ok(false);
        }
        self.save_settings(id, &first_settings(login), now).await?;
        Ok(true)
    }

    /// # Errors
    /// `Unreadable` after the streamer was shredded.
    pub async fn triggers(&self, id: &StreamerId) -> Result<Vec<Trigger>, VaultError> {
        Ok(self.vault.get_json(id, TRIGGERS, "").await?.unwrap_or_default())
    }

    /// Checks the rules from the editor and stores them only when all are valid
    ///
    /// # Errors
    /// `Invalid` with the messages of the check, otherwise as [`Vault::put`].
    pub async fn save_triggers(&self, id: &StreamerId, raw: &[Value], now: i64) -> Result<Vec<Trigger>, ProfileError> {
        let compiled = compile(raw);
        if !compiled.errors.is_empty() {
            return Err(ProfileError::Invalid(compiled.errors));
        }
        let triggers: Vec<Trigger> = compiled.triggers.into_iter().map(|compiled| compiled.trigger).collect();
        self.vault.put_json(id, TRIGGERS, "", &triggers, now).await?;
        Ok(triggers)
    }

    /// Without a stored or with an invalid help setting the default applies
    ///
    /// # Errors
    /// `Unreadable` after the streamer was shredded.
    pub async fn help(&self, id: &StreamerId) -> Result<HelpConfig, VaultError> {
        let raw: Option<Value> = self.vault.get_json(id, HELP, "").await?;
        Ok(raw.as_ref().and_then(to_help_config).unwrap_or_else(default_help))
    }

    /// # Errors
    /// `Invalid` when the setting breaks the rules, otherwise as [`Vault::put`].
    pub async fn save_help(&self, id: &StreamerId, help: &HelpConfig, now: i64) -> Result<HelpConfig, ProfileError> {
        let checked = serde_json::to_value(help)
            .ok()
            .as_ref()
            .and_then(to_help_config)
            .ok_or_else(|| ProfileError::Invalid(vec!["help".to_owned()]))?;
        self.vault.put_json(id, HELP, "", &checked, now).await?;
        Ok(checked)
    }

    /// The minime list; empty before the first save
    ///
    /// # Errors
    /// `Unreadable` after the streamer was shredded.
    pub async fn minimes(&self, id: &StreamerId) -> Result<MinimeState, VaultError> {
        let raw: Option<Value> = self.vault.get_json(id, MINIMES, "").await?;
        Ok(raw.as_ref().map(parse_minime_file).unwrap_or_default())
    }

    /// # Errors
    /// See [`Vault::put`].
    pub async fn save_minimes(&self, id: &StreamerId, state: &MinimeState, now: i64) -> Result<(), VaultError> {
        self.vault.put_json(id, MINIMES, "", state, now).await
    }

    /// The stream stats with the chatters; empty before the first save
    ///
    /// # Errors
    /// `Unreadable` after the streamer was shredded.
    pub async fn stats(&self, id: &StreamerId) -> Result<StreamTally, VaultError> {
        Ok(self.vault.get_json(id, STATS, "").await?.unwrap_or_default())
    }

    /// # Errors
    /// See [`Vault::put`].
    pub async fn save_stats(&self, id: &StreamerId, tally: &StreamTally, now: i64) -> Result<(), VaultError> {
        self.vault.put_json(id, STATS, "", tally, now).await
    }

    /// The panels of the panel designer; an empty list before the first save
    ///
    /// # Errors
    /// `Unreadable` after the streamer was shredded.
    pub async fn panels(&self, id: &StreamerId) -> Result<Value, VaultError> {
        Ok(self.vault.get_json(id, PANELS, "").await?.unwrap_or_else(|| Value::Array(Vec::new())))
    }

    /// # Errors
    /// `Invalid` when it is no list of at most `MAX_PANELS` objects, otherwise as [`Vault::put`].
    pub async fn save_panels(&self, id: &StreamerId, panels: &Value, now: i64) -> Result<(), ProfileError> {
        check_panels(panels)?;
        Ok(self.vault.put_json(id, PANELS, "", panels, now).await?)
    }
}

#[cfg(test)]
mod tests {
    use rst_domain::identity::values::TwitchUserId;
    use rst_domain::minimes::roster::MinimeEntry;
    use serde_json::json;

    use super::*;
    use crate::testing::{MemoryKeys, MemoryRecords};

    #[tokio::test]
    async fn panels_are_kept_as_a_list_of_objects() {
        let profile = profile();
        profile.vault.keys().create(&neo()).await.expect("key");
        assert_eq!(profile.panels(&neo()).await.expect("empty"), json!([]));
        let panels = json!([{ "name": "Über mich", "layers": [] }]);
        profile.save_panels(&neo(), &panels, 1).await.expect("save");
        assert_eq!(profile.panels(&neo()).await.expect("read"), panels);
        for wrong in [json!({}), json!([1]), Value::Array(vec![json!({}); MAX_PANELS + 1])] {
            assert!(matches!(profile.save_panels(&neo(), &wrong, 2).await, Err(ProfileError::Invalid(_))));
        }
        assert_eq!(profile.panels(&neo()).await.expect("unchanged"), panels);
    }

    fn profile() -> Profile<MemoryRecords, MemoryKeys> {
        Profile::new(Vault::new(MemoryRecords::default(), MemoryKeys::default()))
    }

    fn neo() -> StreamerId {
        StreamerId::from_bytes([1; 16])
    }

    fn twitch() -> TwitchTokens {
        TwitchTokens {
            access: "access-1".to_owned(),
            refresh: "refresh-1".to_owned(),
            user_id: TwitchUserId::parse("42").expect("user id"),
            login: Login::parse("neo").expect("login"),
        }
    }

    fn spotify() -> SpotifyTokens {
        SpotifyTokens { access: "spotify-access".to_owned(), refresh: "spotify-refresh".to_owned(), expires_at: 5 }
    }

    fn lizard() -> Value {
        json!({ "name": "lizard", "when": { "type": "word", "match": "lizard" }, "do": [{ "type": "text", "text": "LIZARD" }] })
    }

    fn state() -> MinimeState {
        MinimeState {
            roster: vec![MinimeEntry {
                login: "neo".to_owned(),
                user: "Neo".to_owned(),
                color: None,
                variant: Some("medic".to_owned()),
                team: Some("blau".to_owned()),
                last_seen: 1,
            }],
            ..MinimeState::default()
        }
    }

    async fn filled() -> Profile<MemoryRecords, MemoryKeys> {
        let profile = profile();
        profile.vault.keys().create(&neo()).await.expect("key");
        profile.save_twitch_tokens(&neo(), &twitch(), 1).await.expect("twitch");
        profile.save_spotify_tokens(&neo(), &spotify(), 1).await.expect("spotify");
        assert!(profile.ensure_settings(&neo(), &Login::parse("neo").expect("login"), 1).await.expect("settings"));
        profile.save_triggers(&neo(), &[lizard()], 1).await.expect("triggers");
        profile
            .save_help(&neo(), &HelpConfig { command: "!Hilfe".to_owned(), ..default_help() }, 1)
            .await
            .expect("help");
        profile.save_minimes(&neo(), &state(), 1).await.expect("minimes");
        profile
    }

    #[tokio::test]
    async fn roundtrip() {
        let profile = filled().await;
        assert_eq!(profile.twitch_tokens(&neo()).await.expect("twitch"), Some(twitch()));
        assert_eq!(profile.spotify_tokens(&neo()).await.expect("spotify"), Some(spotify()));
        assert_eq!(
            profile.settings(&neo()).await.expect("settings").map(|file| file.theme),
            Some("standard".to_owned())
        );
        assert!(!profile.ensure_settings(&neo(), &Login::parse("smith").expect("login"), 2).await.expect("again"));
        assert_eq!(profile.triggers(&neo()).await.expect("triggers").len(), 1);
        assert_eq!(profile.help(&neo()).await.expect("help").command, "!hilfe");
        assert_eq!(profile.minimes(&neo()).await.expect("minimes"), state());
        profile.delete_twitch_tokens(&neo()).await.expect("delete");
        assert_eq!(profile.twitch_tokens(&neo()).await.expect("twitch"), None);
    }

    #[tokio::test]
    async fn stats_round_trip() {
        let profile = profile();
        profile.vault.keys().create(&neo()).await.expect("key");
        assert_eq!(profile.stats(&neo()).await.expect("empty"), StreamTally::default());
        let mut tally = StreamTally::default();
        tally.record_chat("smith", 3);
        profile.save_stats(&neo(), &tally, 4).await.expect("save");
        let mut again = profile.stats(&neo()).await.expect("stats");
        assert_eq!(again, tally);
        // The chatters survive the round trip: the same login does not count twice
        again.record_chat("Smith", 5);
        assert_eq!(again.snapshot().chatters, 1);
    }

    #[tokio::test]
    async fn defaults_before_the_first_save() {
        let profile = profile();
        profile.vault.keys().create(&neo()).await.expect("key");
        assert_eq!(profile.settings(&neo()).await.expect("settings"), None);
        assert!(profile.triggers(&neo()).await.expect("triggers").is_empty());
        assert_eq!(profile.help(&neo()).await.expect("help"), default_help());
        assert_eq!(profile.minimes(&neo()).await.expect("minimes"), MinimeState::default());
    }

    #[tokio::test]
    async fn invalid_input_never_lands_in_the_store() {
        let profile = profile();
        profile.vault.keys().create(&neo()).await.expect("key");
        let broken = json!({ "name": "", "when": { "type": "word", "match": "" }, "do": [] });
        assert!(matches!(profile.save_triggers(&neo(), &[lizard(), broken], 1).await, Err(ProfileError::Invalid(_))));
        let help = HelpConfig { command: "no command".to_owned(), ..default_help() };
        assert!(matches!(profile.save_help(&neo(), &help, 1).await, Err(ProfileError::Invalid(_))));
        assert!(profile.vault.records().export_all().await.expect("export").is_empty());
    }

    #[tokio::test]
    async fn after_shred() {
        let profile = filled().await;
        profile.vault.keys().shred(&neo()).await.expect("shred");
        assert_eq!(profile.twitch_tokens(&neo()).await, Err(VaultError::Unreadable));
        assert_eq!(profile.spotify_tokens(&neo()).await, Err(VaultError::Unreadable));
        assert_eq!(profile.settings(&neo()).await, Err(VaultError::Unreadable));
        assert_eq!(profile.triggers(&neo()).await, Err(VaultError::Unreadable));
        assert_eq!(profile.help(&neo()).await, Err(VaultError::Unreadable));
        assert_eq!(profile.minimes(&neo()).await, Err(VaultError::Unreadable));
    }

    #[tokio::test]
    async fn no_plaintext() {
        let profile = filled().await;
        let stored: Vec<u8> = profile
            .vault
            .records()
            .export_all()
            .await
            .expect("export")
            .into_iter()
            .flat_map(|record| record.ciphertext)
            .collect();
        for secret in [&b"access-1"[..], b"spotify-refresh", b"lizard", b"!hilfe", b"NEO"] {
            assert!(
                !stored.windows(secret.len()).any(|window| window == secret),
                "{}",
                String::from_utf8_lossy(secret)
            );
        }
    }
}
