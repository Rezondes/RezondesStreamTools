//! Import of the Node server's data folder (`rst import --from <DATA>`): `access.json` and every profile under
//! `streamers/<login>/` with tokens, Spotify, settings, triggers, help command, minimes, overlay key, media and
//! renders. Running it again changes nothing: known Twitch accounts keep their streamer, files of the same name and
//! size are skipped. Broken files and rules Rust cannot take over are reported, the rest is imported.
//!
//! One profile at a time is read into memory (media included), which is fine for a one-off import.

use std::collections::BTreeMap;
use std::fs;
use std::path::{Path, PathBuf};

use rst_domain::access::{AccessPolicy, RawAccess};
use rst_domain::commands::to_help_config;
use rst_domain::identity::values::{Login, StreamerId, TwitchUserId};
use rst_domain::media::values::{MediaName, OutputName};
use rst_domain::minimes::parse_minime_file;
use rst_domain::settings::file::parse_settings_file;
use rst_domain::spotify;
use rst_domain::triggers::compile;
use rst_domain::twitch::tokens::to_tokens;
use serde_json::Value;

use crate::access::AccessSettings;
use crate::channel::overlay_key::OverlayKeys;
use crate::crypto::cipher::random_bytes;
use crate::identity::streamers::Streamers;
use crate::media::{MediaLibrary, Shelf};
use crate::ports::StoreError;
use crate::ports::files::FileStore;
use crate::ports::keys::KeyStore;
use crate::ports::records::RecordStore;
use crate::ports::server_settings::ServerSettingsStore;
use crate::ports::streamers::StreamerRepository;
use crate::profile::{Profile, ProfileError};
use crate::vault::VaultError;

/// A profile folder of the Node server as read from disk
#[derive(Debug, Clone, Default)]
pub struct LegacyProfile {
    /// Name of the folder (the login)
    pub folder: String,
    /// JSON files by file name
    pub files: BTreeMap<String, Vec<u8>>,
    pub overlay_key: Option<String>,
    pub media: Vec<(String, Vec<u8>)>,
    pub render: Vec<(String, Vec<u8>)>,
}

/// Files of a folder by name; a missing folder has none
fn read_folder(folder: &Path) -> std::io::Result<Vec<(String, Vec<u8>)>> {
    let Ok(entries) = fs::read_dir(folder) else { return Ok(Vec::new()) };
    let mut files = Vec::new();
    for entry in entries {
        let entry = entry?;
        if entry.file_type()?.is_file() {
            files.push((entry.file_name().to_string_lossy().into_owned(), fs::read(entry.path())?));
        }
    }
    files.sort();
    Ok(files)
}

/// # Errors
/// When a file cannot be read.
pub fn read_profile(folder: &Path) -> std::io::Result<LegacyProfile> {
    let files = read_folder(folder)?
        .into_iter()
        .filter(|(name, _)| Path::new(name).extension().is_some_and(|extension| extension == "json"))
        .collect();
    let overlay_key = fs::read_to_string(folder.join("overlay.key")).ok().map(|key| key.trim().to_owned());
    Ok(LegacyProfile {
        folder: folder.file_name().map(|name| name.to_string_lossy().into_owned()).unwrap_or_default(),
        files,
        overlay_key,
        media: read_folder(&folder.join("media"))?,
        render: read_folder(&folder.join("render"))?,
    })
}

/// The profile folders under `<data>/streamers`, sorted
///
/// # Errors
/// When the folder cannot be listed.
pub fn profile_folders(data: &Path) -> std::io::Result<Vec<PathBuf>> {
    let Ok(entries) = fs::read_dir(data.join("streamers")) else { return Ok(Vec::new()) };
    let mut folders = Vec::new();
    for entry in entries {
        let entry = entry?;
        if entry.file_type()?.is_dir() {
            folders.push(entry.path());
        }
    }
    folders.sort();
    Ok(folders)
}

/// What the import did; with problems the command ends with an error code
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct ImportReport {
    pub imported: Vec<String>,
    pub problems: Vec<String>,
}

impl ImportReport {
    #[must_use]
    pub fn complete(&self) -> bool {
        self.problems.is_empty()
    }
}

fn random16() -> Result<[u8; 16], VaultError> {
    random_bytes().map_err(|error| VaultError::Store(StoreError::new(error)))
}

/// A JSON file of the profile; a broken one is reported
fn json_of(legacy: &LegacyProfile, name: &str, problems: &mut Vec<String>) -> Option<Value> {
    let bytes = legacy.files.get(name)?;
    serde_json::from_slice(bytes).map_err(|_| problems.push(format!("{name} is broken, not imported"))).ok()
}

fn vault_only(result: Result<(), ProfileError>) -> Result<(), VaultError> {
    match result {
        Err(ProfileError::Vault(error)) => Err(error),
        _ => Ok(()),
    }
}

pub struct Importer<R, S, K, F, P> {
    pub streamers: Streamers<R, S, K>,
    pub profile: Profile<S, K>,
    pub overlay_keys: OverlayKeys<S, K>,
    pub media: MediaLibrary<S, K, F>,
    pub access: AccessSettings<P>,
}

impl<R, S, K, F, P> Importer<R, S, K, F, P>
where
    R: StreamerRepository,
    S: RecordStore,
    K: KeyStore,
    F: FileStore,
    P: ServerSettingsStore,
{
    /// `access.json` becomes the access policy; without the file the saved policy stays
    ///
    /// # Errors
    /// When storing fails.
    pub async fn import_access(
        &self,
        raw: Option<&[u8]>,
        report: &mut ImportReport,
        now: i64,
    ) -> Result<(), VaultError> {
        let Some(raw) = raw else { return Ok(()) };
        match serde_json::from_slice::<RawAccess>(raw) {
            Ok(access) => {
                self.access.save(&AccessPolicy::sanitize(&access), now).await?;
                report.imported.push("access.json".to_owned());
            }
            Err(_) => report.problems.push("access.json: broken, not imported".to_owned()),
        }
        Ok(())
    }

    /// # Errors
    /// When storing fails; problems with the data itself land in the report.
    pub async fn import_profile(
        &self,
        legacy: &LegacyProfile,
        report: &mut ImportReport,
        now: i64,
    ) -> Result<(), VaultError> {
        let Ok(login) = Login::parse(&legacy.folder) else {
            report.problems.push(format!("{}: not a valid login, skipped", legacy.folder));
            return Ok(());
        };
        let mut problems = Vec::new();
        let result = self.import_streamer(&login, legacy, &mut problems, now).await;
        report.problems.extend(problems.into_iter().map(|text| format!("{login}: {text}")));
        if result? {
            report.imported.push(login.to_string());
        }
        Ok(())
    }

    /// `false` if the profile was skipped
    async fn import_streamer(
        &self,
        login: &Login,
        legacy: &LegacyProfile,
        problems: &mut Vec<String>,
        now: i64,
    ) -> Result<bool, VaultError> {
        let profile_file = json_of(legacy, "profile.json", problems);
        let tokens_file = json_of(legacy, "tokens.json", problems);
        let user_id = [&profile_file, &tokens_file]
            .into_iter()
            .flatten()
            .find_map(|file| file.get("userId").and_then(Value::as_str).and_then(|id| TwitchUserId::parse(id).ok()));
        let Some(user_id) = user_id else {
            problems.push("no Twitch user ID in profile.json or tokens.json, skipped".to_owned());
            return Ok(false);
        };
        let last_login =
            profile_file.as_ref().and_then(|file| file.get("lastLogin")).and_then(Value::as_i64).unwrap_or(now);
        let streamer =
            match self.streamers.register(&user_id, login, StreamerId::from_bytes(random16()?), last_login).await {
                Ok(streamer) => streamer,
                Err(error) => {
                    problems.push(format!("{}, skipped", error.code()));
                    return Ok(false);
                }
            };
        let id = streamer.id.unwrap_or_else(|| unreachable!("a registered streamer has an ID"));

        if let Some(file) = tokens_file {
            match to_tokens(&file) {
                Some(tokens) => self.profile.save_twitch_tokens(&id, &tokens, now).await?,
                None => problems.push("tokens.json has no valid tokens".to_owned()),
            }
        }
        if let Some(file) = json_of(legacy, "spotify.json", problems) {
            match spotify::to_tokens(&file) {
                Some(tokens) => self.profile.save_spotify_tokens(&id, &tokens, now).await?,
                None => problems.push("spotify.json has no valid tokens".to_owned()),
            }
        }
        match json_of(legacy, "settings.json", problems) {
            Some(file) => self.profile.save_settings(&id, &parse_settings_file(&file), now).await?,
            None => drop(self.profile.ensure_settings(&id, login, now).await?),
        }
        if let Some(file) = json_of(legacy, "triggers.json", problems) {
            let raw = file.get("triggers").and_then(Value::as_array).cloned().unwrap_or_default();
            let compiled = compile(&raw);
            problems.extend(compiled.errors.iter().map(|error| format!("triggers.json: {error}")));
            let valid: Vec<Value> =
                compiled.triggers.iter().filter_map(|compiled| serde_json::to_value(&compiled.trigger).ok()).collect();
            vault_only(self.profile.save_triggers(&id, &valid, now).await.map(drop))?;
        }
        if let Some(file) = json_of(legacy, "commands.json", problems) {
            match to_help_config(&file) {
                Some(help) => vault_only(self.profile.save_help(&id, &help, now).await.map(drop))?,
                None => problems.push("commands.json is not a valid help setting".to_owned()),
            }
        }
        if let Some(file) = json_of(legacy, "minimes.json", problems) {
            self.profile.save_minimes(&id, &parse_minime_file(&file), now).await?;
        }
        if let Some(key) = &legacy.overlay_key
            && !self.overlay_keys.set(&id, key, now).await?
        {
            problems.push("overlay.key is not a valid key".to_owned());
        }
        self.import_files(&id, Shelf::Media, &legacy.media, |name| MediaName::parse(name).is_ok(), problems, now)
            .await?;
        self.import_files(&id, Shelf::Render, &legacy.render, |name| OutputName::parse(name).is_ok(), problems, now)
            .await?;
        Ok(true)
    }

    async fn import_files(
        &self,
        id: &StreamerId,
        place: Shelf,
        files: &[(String, Vec<u8>)],
        valid: impl Fn(&str) -> bool,
        problems: &mut Vec<String>,
        now: i64,
    ) -> Result<(), VaultError> {
        let known = self.media.list(id, place).await?;
        for (name, data) in files {
            if !valid(name) {
                problems.push(format!("{name}: not a valid file name, not imported"));
            } else if !known.iter().any(|stored| stored.name == *name && stored.size == data.len() as u64) {
                self.media.store(id, place, name, data, random16()?, now).await?;
            }
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use rst_domain::access::Registration;

    use super::*;
    use crate::crypto::lookup::LookupKey;
    use crate::ports::keys::DataKey;
    use crate::testing::{MemoryFiles, MemoryKeys, MemoryRecords, MemoryServerSettings, MemoryStreamers};
    use crate::vault::Vault;

    type MemoryImporter = Importer<MemoryStreamers, MemoryRecords, MemoryKeys, MemoryFiles, MemoryServerSettings>;

    fn fixture() -> PathBuf {
        Path::new(env!("CARGO_MANIFEST_DIR")).join("tests/fixtures/data")
    }

    /// The importer and the stores to count what landed
    fn importer() -> (MemoryImporter, MemoryRecords, MemoryFiles) {
        let records = MemoryRecords::default();
        let files = MemoryFiles::default();
        let vault = Vault::new(records.clone(), MemoryKeys::default());
        let lookup = LookupKey::from_bytes([4; 32]);
        let importer = Importer {
            streamers: Streamers::new(MemoryStreamers::default(), vault.clone(), lookup.clone()),
            profile: Profile::new(vault.clone()),
            overlay_keys: OverlayKeys::new(vault.clone(), lookup),
            media: MediaLibrary::new(vault, files.clone()),
            access: AccessSettings::new(MemoryServerSettings::default(), DataKey::from_bytes([9; 32])),
        };
        (importer, records, files)
    }

    async fn run(importer: &MemoryImporter) -> ImportReport {
        let mut report = ImportReport::default();
        let access = fs::read(fixture().join("access.json")).ok();
        importer.import_access(access.as_deref(), &mut report, 1).await.expect("access");
        for folder in profile_folders(&fixture()).expect("folders") {
            let legacy = read_profile(&folder).expect("profile");
            importer.import_profile(&legacy, &mut report, 1).await.expect("import");
        }
        report
    }

    fn login(value: &str) -> Login {
        Login::parse(value).expect("login")
    }

    async fn id_of(importer: &MemoryImporter, value: &str) -> StreamerId {
        importer.streamers.find_by_login(&login(value)).await.expect("find").expect("streamer")
    }

    #[tokio::test]
    async fn fixture_roundtrip() {
        let (importer, _, _) = importer();
        run(&importer).await;
        let access = importer.access.load(&[]).await.expect("access");
        assert_eq!((access.registration, access.allowlist.len()), (Registration::Allowlist, 2));
        let neo = id_of(&importer, "neo").await;
        let tokens = importer.profile.twitch_tokens(&neo).await.expect("tokens");
        assert_eq!(tokens.map(|tokens| tokens.access), Some("access-1".to_owned()));
        assert!(importer.profile.spotify_tokens(&neo).await.expect("spotify").is_some());
        let settings = importer.profile.settings(&neo).await.expect("settings").expect("file");
        assert_eq!(settings.theme, "standard");
        assert_eq!(settings.values["standard"]["accent"], "#ff0000");
        let triggers = importer.profile.triggers(&neo).await.expect("triggers");
        assert_eq!(triggers.iter().map(|trigger| trigger.name.as_str()).collect::<Vec<_>>(), ["lizard"]);
        assert_eq!(importer.profile.help(&neo).await.expect("help").command, "!hilfe");
        assert_eq!(importer.profile.minimes(&neo).await.expect("minimes").roster.len(), 1);
        assert!(importer.overlay_keys.matches(&neo, "0123456789abcdef0123456789abcdef").await.expect("key"));
        let media = importer.media.read(&neo, Shelf::Media, "lizard.gif").await.expect("media").expect("file");
        assert_eq!(media.as_slice(), b"GIF89a-lizard");
        assert!(importer.media.read(&neo, Shelf::Render, "stinger.webm").await.expect("render").is_some());
    }

    #[tokio::test]
    async fn idempotent() {
        let (importer, records, files) = importer();
        run(&importer).await;
        let counts = (records.export_all().await.expect("export").len(), files.names());
        let streamers = importer.streamers.list().await.expect("list").len();
        run(&importer).await;
        assert_eq!((records.export_all().await.expect("export").len(), files.names()), counts);
        assert_eq!(importer.streamers.list().await.expect("list").len(), streamers);
    }

    #[tokio::test]
    async fn missing_user_id() {
        let (importer, _, _) = importer();
        let report = run(&importer).await;
        // trinity has no profile.json: the ID comes from tokens.json
        let trinity = id_of(&importer, "trinity").await;
        let profile = importer.streamers.profile(&trinity).await.expect("profile");
        assert_eq!(profile.map(|streamer| streamer.user_id.to_string()), Some("222".to_owned()));
        // ghost has neither: skipped with a message
        assert_eq!(importer.streamers.find_by_login(&login("ghost")).await.expect("find"), None);
        assert!(report.problems.iter().any(|problem| problem.starts_with("ghost: no Twitch user ID")));
    }

    #[tokio::test]
    async fn broken_files() {
        let (importer, _, _) = importer();
        let report = run(&importer).await;
        assert!(!report.complete());
        assert!(report.problems.iter().any(|problem| problem.starts_with("trinity: settings.json is broken")));
        assert!(
            report
                .problems
                .iter()
                .any(|problem| problem.starts_with("neo: triggers.json:") && problem.contains("Lookaround"))
        );
        assert!(report.problems.iter().any(|problem| problem.starts_with("neo: notes.txt: not a valid file name")));
        // The rest of trinity still arrived, with first settings instead of the broken ones
        let trinity = id_of(&importer, "trinity").await;
        assert!(importer.profile.twitch_tokens(&trinity).await.expect("tokens").is_some());
        assert_eq!(
            importer.profile.settings(&trinity).await.expect("settings").map(|file| file.theme),
            Some("standard".to_owned())
        );
        assert_eq!(report.imported, ["access.json", "neo", "trinity"]);
    }
}
