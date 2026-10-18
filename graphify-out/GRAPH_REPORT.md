# Graph Report - RezondesStream  (2026-10-18)

## Corpus Check
- 514 files · ~273,320 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 23 file(s) not represented in the graph (top: .css 15, (none) 5, .toml 2)

## Summary
- 4634 nodes · 12627 edges · 200 communities (162 shown, 38 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 483 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1385e92a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Audit Log Ports
- Commands and Admin Access
- Audit Log and Records
- Minime Scene Behavior
- Shared Setting Fields
- Alert Scenes
- Encryption and File Cache
- Overlay Connection and Demo
- Twitch Login and Scopes
- Matrix Glyphs and Scenes
- Streamer Identity
- Access Policy Admin
- Rust Setting Field Builders
- Key Backups
- Build Scripts and Entry
- Backup Schedule
- Rust Minime Combat Fields
- TS Minime Fields
- Server Route Guards
- Screen Countdown and Quotes
- Dashboard Theme Settings
- Plantage Field Shapes
- KOTH Hill Shapes
- Streamer Runtime
- KOTH Rust Schema
- Rust Minime Variants
- Rust Minime Rules and ASCII
- Live Event Hubs
- Settings Validation
- Matrix Banners and Hash
- Urlaub Beach Shapes
- Spotify Client
- Server Settings Store
- Chat Command List
- Effects Overlay
- Backup Archives
- Server App Wiring
- HTTP Responses and Errors
- OAuth Callback
- Contract Test Cases
- Dashboard Admin
- Dashboard API Client
- Runtime Registry
- Minime Roster
- Minime Chat Commands
- channel minimes.rs
- rst-server routes.rs
- koth banners.ts
- urlaub settings.ts
- themes standard.rs
- settings file.rs
- dashboard obsSetup.ts
- keys sqlite.rs
- themes minime_fields.rs
- core settings.ts
- backup archive.rs
- handlers admin.rs
- urlaub banners.ts
- import mod.rs
- scenes Chat.tsx
- music mod.rs
- contract fakeProviders.ts
- dashboard eventLog.ts
- triggers pattern.rs
- profile mod.rs
- rst-domain paths.rs
- music music.ts
- chat events.rs
- themes schema.rs
- dashboard Scenery.tsx
- identity oauth.rs
- drills restore.ts
- crypto master.rs
- minimes rules.rs
- spotify mod.rs
- core commands.ts
- standard banners.ts
- channel help.rs
- db sqlite_streamers.rs
- themes registry.rs
- plantage stinger.ts
- themes generatedValues.check.ts
- channel triggers.rs
- media values.rs
- triggers mod.rs
- dashboard Render.tsx
- chat irc.rs
- ports socket.rs
- handlers render.rs
- backup schedule.rs
- dashboard Triggers.tsx
- channel token_keeper.rs
- media mod.rs
- minimes mod.rs
- twitch alerts.rs
- backup archive.rs
- plantage mangos.ts
- handlers events.rs
- identity session.rs
- dashboard SettingInput.tsx
- contract run.ts
- channel alerts.rs
- channel chat.rs
- rst-server config.rs
- themes audit.rs
- minimes roster.rs
- rst-server config.rs
- dashboard texts.de.check.ts
- tsconfig.json
- handlers media.rs
- package.json
- twitch eventsub.rs
- plantage banners.ts
- plans PLAN-MINIMES.md
- commands mod.rs
- identity sessions.rs
- music mod.rs
- CODING-RULES.md
- package.json
- scripts rust.ts
- render clips.rs
- koth soldiers.ts
- tests export_types.rs
- scripts rules.check.ts
- identity login.rs
- access mod.rs
- core emotes.ts
- README.md
- media library.rs
- package.json
- settings mod.rs
- RUST-PLAN.md
- plans PLAN-MINIMES.md
- rst-server main.rs
- cli import.rs
- minimes roster.rs
- triggers cooldowns.rs
- triggers mod.rs
- twitch alerts.rs
- plans PLAN-MINIMES.md
- ports backups.rs
- chat events.rs
- minimes roster.rs
- render jobs.rs
- tests keystore_contract.rs
- docker-compose.yml
- plans PLAN-MINIMES.md
- docs PLAN-URLAUB.md
- chat line.rs
- cli mod.rs
- core streamerPath.ts
- triggers schedule.rs
- RUST-PLAN.md
- drills sse-load.ts
- crypto lookup.rs
- render clips.rs
- twitch eventsub.rs
- DESIGN.md
- docs PLAN-KOTH.md
- workflows docker.yml
- api mod.rs
- plans PLAN-MINIMES.md
- THEMES.md
- scripts migrate.sh
- tests dependencies.rs
- vite.config.ts
- package.json
- rst-app Cargo.toml
- DESIGN.md
- docker-compose.public.yml
- THEMES.md
- DESIGN.md
- media lizard.gif
- docs DESIGN-STANDARD.md

## God Nodes (most connected - your core abstractions)
1. `StreamerId` - 266 edges
2. `StoreError` - 185 edges
3. `VaultError` - 105 edges
4. `ProviderError` - 71 edges
5. `Login` - 70 edges
6. `App` - 62 edges
7. `react` - 62 edges
8. `server_error()` - 54 edges
9. `DataKey` - 52 edges
10. `fillTemplate()` - 45 edges

## Surprising Connections (you probably didn't know these)
- `Fixed server protection limits (2000 colors, 2s save, 1min prune)` --semantically_similar_to--> `Overlays: everything configurable, no fixed value (rule 20)`  [INFERRED] [semantically similar]
  plans/PLAN-MINIMES.md → DESIGN.md
- `Core decides, theme shows (rule 16)` --semantically_similar_to--> `Shared logic in core, theme supplies look only`  [INFERRED] [semantically similar]
  plans/PLAN-MINIMES.md → THEMES.md
- `Move hash from matrix/stinger.ts to src/core/hash.ts` --semantically_similar_to--> `Shared logic in core, theme supplies look only`  [INFERRED] [semantically similar]
  src/themes/urlaub/docs/PLAN-URLAUB.md → THEMES.md
- `Soldier roles (assault, medic, MG, sniper, grenadier)` --implements--> `Minime variants (types instead of colors, minimeVariantFields)`  [INFERRED]
  src/themes/koth/docs/PLAN-KOTH.md → THEMES.md
- `Urlaub Package 1: Minime variants in core` --implements--> `Minime variants (types instead of colors, minimeVariantFields)`  [INFERRED]
  src/themes/urlaub/docs/PLAN-URLAUB.md → THEMES.md

## Import Cycles
- 1-file cycle: `server-rs/crates/rst-domain/src/identity/values.rs -> server-rs/crates/rst-domain/src/identity/values.rs`
- 1-file cycle: `server-rs/crates/rst-domain/src/triggers/pattern.rs -> server-rs/crates/rst-domain/src/triggers/pattern.rs`
- 2-file cycle: `server-rs/crates/rst-server/src/app.rs -> server-rs/crates/rst-server/src/handlers/mod.rs -> server-rs/crates/rst-server/src/app.rs`
- 2-file cycle: `server-rs/crates/rst-infra/src/backup/archive.rs -> server-rs/crates/rst-infra/src/backup/restore.rs -> server-rs/crates/rst-infra/src/backup/archive.rs`
- 2-file cycle: `server-rs/crates/rst-domain/src/themes/matrix.rs -> server-rs/crates/rst-domain/src/themes/registry.rs -> server-rs/crates/rst-domain/src/themes/matrix.rs`
- 2-file cycle: `server-rs/crates/rst-domain/src/themes/plantage.rs -> server-rs/crates/rst-domain/src/themes/registry.rs -> server-rs/crates/rst-domain/src/themes/plantage.rs`
- 2-file cycle: `server-rs/crates/rst-domain/src/themes/koth.rs -> server-rs/crates/rst-domain/src/themes/registry.rs -> server-rs/crates/rst-domain/src/themes/koth.rs`
- 2-file cycle: `server-rs/crates/rst-domain/src/themes/registry.rs -> server-rs/crates/rst-domain/src/themes/standard.rs -> server-rs/crates/rst-domain/src/themes/registry.rs`
- 2-file cycle: `server-rs/crates/rst-domain/src/themes/registry.rs -> server-rs/crates/rst-domain/src/themes/urlaub.rs -> server-rs/crates/rst-domain/src/themes/registry.rs`
- 3-file cycle: `server-rs/crates/rst-domain/src/themes/fixture.rs -> server-rs/crates/rst-domain/src/themes/registry.rs -> server-rs/crates/rst-domain/src/themes/matrix.rs -> server-rs/crates/rst-domain/src/themes/fixture.rs`
- 3-file cycle: `server-rs/crates/rst-domain/src/themes/fixture.rs -> server-rs/crates/rst-domain/src/themes/registry.rs -> server-rs/crates/rst-domain/src/themes/plantage.rs -> server-rs/crates/rst-domain/src/themes/fixture.rs`
- 3-file cycle: `server-rs/crates/rst-domain/src/themes/fixture.rs -> server-rs/crates/rst-domain/src/themes/registry.rs -> server-rs/crates/rst-domain/src/themes/koth.rs -> server-rs/crates/rst-domain/src/themes/fixture.rs`
- 3-file cycle: `server-rs/crates/rst-domain/src/themes/fixture.rs -> server-rs/crates/rst-domain/src/themes/registry.rs -> server-rs/crates/rst-domain/src/themes/standard.rs -> server-rs/crates/rst-domain/src/themes/fixture.rs`
- 3-file cycle: `server-rs/crates/rst-domain/src/themes/fixture.rs -> server-rs/crates/rst-domain/src/themes/registry.rs -> server-rs/crates/rst-domain/src/themes/urlaub.rs -> server-rs/crates/rst-domain/src/themes/fixture.rs`

## Hyperedges (group relationships)
- **Opt-in core minime extensions (variants, factions, combat, slots, hopping)** — themes_minime_variants, themes_minime_teams, themes_minime_combat, themes_minime_slots, themes_minime_hops, themes_minime_fields [EXTRACTED 1.00]
- **Rust server layer crates** — rust_plan_rst_domain, rust_plan_rst_app, rust_plan_rst_infra, rust_plan_rst_server [EXTRACTED 1.00]
- **Themes with soldier minimes using core combat** — src_themes_koth_docs_design_koth_soldier_minimes, src_themes_plantage_docs_design_plantage_mango_soldier_minimes, plans_plan_minimes_package_11_combat, plans_plan_minimes_combat_requires_medic [INFERRED 0.85]
- **Per-streamer encryption and key storage** — readme_key_store_encryption, rust_plan_crypto_shredding, rust_plan_key_backups, docker_compose_keys_volume [INFERRED 0.85]
- **Per-theme design docs following DESIGN.md axis decisions** — design_one_decision_per_axis, src_themes_standard_docs_design_standard_dashboard_skin, src_themes_matrix_docs_design_matrix_dashboard_skin, src_themes_urlaub_docs_design_urlaub_dashboard_skin, src_themes_plantage_docs_design_plantage_dashboard_skin, src_themes_koth_docs_design_koth_dashboard_skin [INFERRED 0.85]
- **Verification pipeline before publish** — _github_workflows_docker_verify_job, coding_rules_npm_run_verify, coding_rules_rules_check_script, readme_contract_tests, rust_plan_fake_providers [INFERRED 0.85]

## Communities (200 total, 38 thin omitted)

### Community 0 - "Audit Log Ports"
Cohesion: 0.03
Nodes (16): StoredEntry, FileStore, FileWriter, StoreError, RecordStore, StoredRecord, StreamerRepository, StreamerRow (+8 more)

### Community 1 - "Commands and Admin Access"
Cohesion: 0.04
Nodes (54): AccessAdmin, AccessAdmin<'_, R, S, K, Q, P, A>, AuditRow, json_of(), login(), raw(), revoked_access_ends_every_session_and_is_audited(), saving_at_once_never_mixes_two_changes() (+46 more)

### Community 2 - "Audit Log and Records"
Cohesion: 0.05
Nodes (33): is_key(), OverlayKeys<S, K>, vault_only(), library(), MediaEntry, MediaLibrary<S, K, F>, MediaOverview, neo() (+25 more)

### Community 3 - "Minime Scene Behavior"
Cohesion: 0.12
Nodes (30): MinimeSceneOptions, useMinimes(), advance(), Combat, MinimeStage, positionAt(), react(), advanceWithCombat() (+22 more)

### Community 4 - "Shared Setting Fields"
Cohesion: 0.04
Nodes (99): ALERT_SOUND_KEYS, alertSoundFields(), KINDS, sounds, values, KINDS, tier(), asciiText() (+91 more)

### Community 5 - "Alert Scenes"
Cohesion: 0.09
Nodes (46): alertQuote(), alertVars(), describeAlert(), lineKey(), useAlertSounds(), mediaUrl(), QueuedAlert, useAlerts() (+38 more)

### Community 6 - "Encryption and File Cache"
Cohesion: 0.06
Nodes (37): changed_data_wrong_owner_or_key_fail(), CryptoError, Decrypt, Encrypt, Random, KEY, NONCE_LEN, open() (+29 more)

### Community 7 - "Overlay Connection and Demo"
Cohesion: 0.08
Nodes (34): ServerStatus, EventFeed(), KINDS, time(), useEventLog(), add(), alertText(), many (+26 more)

### Community 8 - "Twitch Login and Scopes"
Cohesion: 0.04
Nodes (32): FakeTwitch, a_rejected_login_is_reported(), after_stop_nothing_is_saved_and_late_tokens_are_revoked(), Arc<FakeTwitch>, FakeTwitch, keeper(), simultaneous_checks_share_one_renewal(), TokenKeeper (+24 more)

### Community 9 - "Matrix Glyphs and Scenes"
Cohesion: 0.07
Nodes (41): emoji, standard, glyph(), GLYPHS, useDecode(), useNow(), TerminalTiming, useTerminal() (+33 more)

### Community 10 - "Streamer Identity"
Cohesion: 0.13
Nodes (16): a_rename_keeps_the_profile(), id(), list_leaves_out_shredded_streamers(), login(), PROFILE_KIND, register_and_find(), RegisterError, AccountChanged (+8 more)

### Community 11 - "Access Policy Admin"
Cohesion: 0.28
Nodes (13): admins(), allowlist_only_admins_and_listed_logins(), beta_policy(), initial_policy_allows_the_admins_and_everything(), levels_all_beta_off(), login(), logins(), open_registration_lets_everyone_in() (+5 more)

### Community 12 - "Rust Setting Field Builders"
Cohesion: 0.07
Nodes (47): ts_type(), ascii_art(), ascii_art_is_a_textarea_with_generator_flag(), choice(), color(), field(), FieldKind, Boolean (+39 more)

### Community 13 - "Key Backups"
Cohesion: 0.18
Nodes (7): copies_without_shredded_keys_and_deleted_after_thirty_days(), delete_waits_for_a_copy_held_open_by_another_process(), FolderKeyBackups, KEY_BACKUPS_VAR, DELETE_ATTEMPTS, DELETE_PAUSE, remove_patiently()

### Community 14 - "Build Scripts and Entry"
Cohesion: 0.06
Nodes (42): ThemeValues, minimeTeamColorKey(), ClipName, RenderClip, fillTemplate(), ThemeModule, TROOPS, applySkin() (+34 more)

### Community 15 - "Backup Schedule"
Cohesion: 0.09
Nodes (17): BackupError, Busy, Invalid, NotFound, Store, Backups, backups(), Backups<B, A, K> (+9 more)

### Community 16 - "Rust Minime Combat Fields"
Cohesion: 0.07
Nodes (41): combat(), combat_fields_are_opt_in_without_medic_durations(), minime_aim_key(), minime_combat_fields(), minime_fire_key(), alerts(), ALERTS, BANNER (+33 more)

### Community 17 - "TS Minime Fields"
Cohesion: 0.05
Nodes (70): alertTextKeys, useInfoPage(), InfoValues, defaults, probe, COMBAT_SOUNDS, command(), hasMinimes() (+62 more)

### Community 18 - "Server Route Guards"
Cohesion: 0.22
Nodes (5): percent_decode(), resolve(), StaticError, BadEncoding, Forbidden

### Community 19 - "Screen Countdown and Quotes"
Cohesion: 0.19
Nodes (19): countdownEnd(), countdown(), rotating(), ScreenKind, shortClock(), STAGE, stageScale(), useScreen() (+11 more)

### Community 20 - "Dashboard Theme Settings"
Cohesion: 0.05
Nodes (63): figlet, bad, good, resolved, schema, checkValue(), isObject(), isText() (+55 more)

### Community 21 - "Plantage Field Shapes"
Cohesion: 0.08
Nodes (46): BIRD, shapes, star, circle(), CLOUD, CRATE, CRATES, Field() (+38 more)

### Community 22 - "KOTH Hill Shapes"
Cohesion: 0.11
Nodes (32): shapes, star, circle(), FLAG, HELI, ICON_NAMES, ICONS, NET (+24 more)

### Community 23 - "Streamer Runtime"
Cohesion: 0.05
Nodes (30): chat_lines_only_with_the_feature_moderation_always(), lines_become_events_ping_is_answered_and_the_chat_reconnects(), neo(), NEXT_ID, RECONNECT, relay(), MinimeRunner, id() (+22 more)

### Community 24 - "KOTH Rust Schema"
Cohesion: 0.08
Nodes (38): alerts(), ALERTS, BANNER, CAM, capital(), CHAT, chat_cam_music_fx(), fields() (+30 more)

### Community 25 - "Rust Minime Variants"
Cohesion: 0.09
Nodes (25): ALERTS, BANNER, BEACH, BEACH_THINGS, CAM, capital(), CHAT, fields() (+17 more)

### Community 26 - "Rust Minime Rules and ASCII"
Cohesion: 0.07
Nodes (28): ascii_text(), ROWS, alert_sound_fields(), badge_fields(), badge_texts_default_to_the_abbreviation(), one_sound_per_alert_kind_and_fade_out(), ALERTS, BANNER (+20 more)

### Community 27 - "Live Event Hubs"
Cohesion: 0.08
Nodes (18): alert(), at_most_fifty_streams_and_places_come_back(), CAPACITY, Channel, MAX_STREAMS, messages_reach_every_stream_of_the_streamer(), neo(), ServerMessage (+10 more)

### Community 28 - "Settings Validation"
Cohesion: 0.11
Nodes (31): check_lines(), check_media(), check_sound(), check_text(), check_value(), codes(), defaults_of_all_building_blocks_pass(), extensions() (+23 more)

### Community 29 - "Matrix Banners and Hash"
Cohesion: 0.23
Nodes (11): clamp01(), hash(), atCut, options, drawFlash(), drawLogo(), drawStinger(), FPS (+3 more)

### Community 30 - "Urlaub Beach Shapes"
Cohesion: 0.13
Nodes (28): Beach(), shapes, star, circle(), CLOUD, GULL, ICON_NAMES, ICONS (+20 more)

### Community 31 - "Spotify Client"
Cohesion: 0.05
Nodes (33): FakeSpotify, SpotifyPlayer<A, S, K>, Playing, Answer, Limited, Nothing, Unauthorized, SpotifyApi (+25 more)

### Community 32 - "Server Settings Store"
Cohesion: 0.10
Nodes (12): DATA_DB_VAR, migrations_twice(), open_data_db(), pragmas(), put_replaces_and_get_reads(), SqliteServerSettings, contract_tests!, sqlite() (+4 more)

### Community 33 - "Chat Command List"
Cohesion: 0.10
Nodes (32): command_list(), CommandItem, Help, Join, Leave, Look, Team, Trigger (+24 more)

### Community 34 - "Effects Overlay"
Cohesion: 0.16
Nodes (26): FX_KEYS, fxDefaults(), FxSettings, useFxItem(), useFxScene(), FxMedia(), ShownFx, useFx() (+18 more)

### Community 35 - "Backup Archives"
Cohesion: 0.13
Nodes (27): ArchiveError, Invalid, NotFound, Store, allowed_name(), bytes(), check(), Checked (+19 more)

### Community 36 - "Server App Wiring"
Cohesion: 0.05
Nodes (18): App, app(), call(), dispatch(), FRAME_CSP, headers(), maintenance_leaves_only_the_dashboard_and_the_admin_area(), origin_and_routes() (+10 more)

### Community 37 - "HTTP Responses and Errors"
Cohesion: 0.15
Nodes (23): json(), server_error(), status(), access(), ACCESS_LIMIT, audit(), AUDIT_LIMIT, delete_streamer() (+15 more)

### Community 38 - "OAuth Callback"
Cohesion: 0.10
Nodes (21): to_hex(), cookie(), cookies_http_only_lax_and_secure_with_https(), is_secure_url(), oauth_state_cookie(), OAUTH_STATE_SECONDS, session_cookie(), SESSION_DAYS (+13 more)

### Community 39 - "Contract Test Cases"
Cohesion: 0.16
Nodes (27): ACCOUNT_CASES, ALERT_CASES, Subscription, AUTH_CASES, BACKUP_CASES, Listing, CHAT_CASES, chatLine() (+19 more)

### Community 40 - "Dashboard Admin"
Cohesion: 0.04
Nodes (103): ERROR_CODES, ErrorCode, isErrorCode(), REQUEST_ERROR_CODES, SETTING_ERROR_CODES, MEDIA_KIND, accessLosses, losses (+95 more)

### Community 41 - "Dashboard API Client"
Cohesion: 0.12
Nodes (27): MinimeCombatScene, actorRun(), actorStyle(), MinimeAction, MinimeActor, shownRole(), actor, plan (+19 more)

### Community 42 - "Runtime Registry"
Cohesion: 0.11
Nodes (13): a_restart_stops_the_old_runtime(), Entries, Fake, held(), id(), locked_or_stopped_starts_are_discarded(), NEXT, nothing_to_start_and_runtimes_that_ended_themselves() (+5 more)

### Community 43 - "Minime Roster"
Cohesion: 0.13
Nodes (39): allowed_teams(), allowed_variants(), apply(), chat(), chat_keeps_alive_and_reacts(), color_cooldown_and_color_joins(), color_memory_is_limited(), disabled_team_is_reassigned() (+31 more)

### Community 44 - "Minime Chat Commands"
Cohesion: 0.10
Nodes (30): channels(), commands_at_the_start_case_insensitive(), find_variant(), has_role(), HEX, is_login(), join(), join_choice() (+22 more)

### Community 45 - "channel minimes.rs"
Cohesion: 0.13
Nodes (10): commands_change_the_list_saves_are_batched_and_survive_a_restart(), line(), MinimeRunner<S, K>, neo(), profile(), PRUNE_EVERY, Roster, rule_changes_take_effect_at_once_and_offline_clears() (+2 more)

### Community 46 - "rst-server routes.rs"
Cohesion: 0.11
Nodes (23): all_on(), authorize(), find(), Found, MethodNotAllowed, Route, Guard, Admin (+15 more)

### Community 47 - "koth banners.ts"
Cohesion: 0.19
Nodes (9): battlefield(), centered(), gradient, options, drawKothOfflineBanner(), drawKothProfileBanner(), KothBannerOptions, PEAKS (+1 more)

### Community 48 - "urlaub settings.ts"
Cohesion: 0.15
Nodes (13): screenScenes(), FieldBase, MinimeVariantInfo, SCENE_SIZES, SCENES, ThemeView, kothView, matrixView (+5 more)

### Community 49 - "themes standard.rs"
Cohesion: 0.11
Nodes (23): alerts(), ALERTS, BANNER, CAM, CHAT, chat_cam_music(), FONTS, FX (+15 more)

### Community 50 - "settings file.rs"
Cohesion: 0.13
Nodes (26): broken_unknown_and_renamed_files(), current_id(), default_theme(), first_login_personalizes_every_theme(), first_settings(), minime_rules_from_the_chosen_theme(), minime_rules_of(), OLD_DEFAULTS (+18 more)

### Community 51 - "dashboard obsSetup.ts"
Cohesion: 0.12
Nodes (25): OBS_SCENES, importViaWebSocket(), ObsError, ObsImport(), ObsMessage, browserSettings(), collection, layout (+17 more)

### Community 52 - "keys sqlite.rs"
Cohesion: 0.05
Nodes (29): AccessSettings<P>, initial_policy_then_the_saved_one(), KEY, login(), aad(), AuditEntry, AuditLog<A, K>, entries_are_ciphertext_and_unreadable_after_shred() (+21 more)

### Community 53 - "themes minime_fields.rs"
Cohesion: 0.10
Nodes (27): color_themes_get_base_and_color_fields(), COMBAT_SOUNDS, feature_fields_match_the_typescript_fixture(), MEDIC, minime_base_fields(), minime_color_fields(), MINIME_COMBAT, MINIME_COMMANDS (+19 more)

### Community 54 - "core settings.ts"
Cohesion: 0.11
Nodes (7): SessionStore, SqliteSessions, audit_appends_and_lists_newest_first(), database(), id(), sessions_find_delete_and_expire(), sessions_go_with_their_streamer()

### Community 55 - "backup archive.rs"
Cohesion: 0.09
Nodes (15): ARCHIVE_FORMAT, BACKUPS_VAR, bytes(), copy_hashed(), entries(), EXTENSION, forged(), number() (+7 more)

### Community 56 - "handlers admin.rs"
Cohesion: 0.12
Nodes (15): help(), HELP_LIMIT, save(), Call, handle(), read_body(), save(), schemas() (+7 more)

### Community 57 - "urlaub banners.ts"
Cohesion: 0.24
Nodes (9): beach(), centered(), gradient, options, drawUrlaubOfflineBanner(), drawUrlaubProfileBanner(), palm(), Size (+1 more)

### Community 58 - "import mod.rs"
Cohesion: 0.17
Nodes (18): random_bytes(), random(), broken_files(), fixture(), fixture_roundtrip(), id_of(), idempotent(), importer() (+10 more)

### Community 59 - "scenes Chat.tsx"
Cohesion: 0.25
Nodes (13): badgeLabel(), MessageParts(), useChat(), Part, Chat(), Row(), Chat(), Row() (+5 more)

### Community 60 - "music mod.rs"
Cohesion: 0.13
Nodes (12): answer(), DEFAULT_LIFETIME_S, neo(), NOW, now(), Player, polls_only_with_an_open_overlay_and_pauses_after_429(), RENEW_EARLY_MS (+4 more)

### Community 61 - "contract fakeProviders.ts"
Cohesion: 0.13
Nodes (24): bearer(), Answer, connect(), masked, nextMessage(), control(), FakeProviders, frame() (+16 more)

### Community 62 - "dashboard eventLog.ts"
Cohesion: 0.16
Nodes (22): seedOf(), area(), at(), actor(), demoTeams, STAGE, still, freeSlot() (+14 more)

### Community 63 - "triggers pattern.rs"
Cohesion: 0.10
Nodes (16): linear(), MAX_PATTERN, Pattern, pattern(), PatternError, Invalid, TooLong, Unsupported (+8 more)

### Community 64 - "profile mod.rs"
Cohesion: 0.08
Nodes (23): CommandService, CommandService<'_, S, K, A>, help_setting_and_public_list_by_features(), neo(), public_commands(), after_shred(), defaults_before_the_first_save(), filled() (+15 more)

### Community 65 - "rst-domain paths.rs"
Cohesion: 0.11
Nodes (14): encoded_slash_stays_one_part_and_is_no_media_name(), is_scene_file(), OverlayRoute, Commands, Events, Media, Scene, Settings (+6 more)

### Community 66 - "music music.ts"
Cohesion: 0.15
Nodes (19): react, useMusic(), Marquee(), Props, song, marqueeSeconds(), MusicState, nowPlaying() (+11 more)

### Community 67 - "chat events.rs"
Cohesion: 0.11
Nodes (25): ACTION_END, ACTION_START, alert(), amount(), badge(), CHAT_CHEERMOTE, chat_events(), chat_with_badges_and_emotes() (+17 more)

### Community 68 - "themes schema.rs"
Cohesion: 0.15
Nodes (12): SceneName, Alerts, .ALL, Brb, Cam, Chat, Ending, Fx (+4 more)

### Community 69 - "dashboard Scenery.tsx"
Cohesion: 0.07
Nodes (36): MinimeVariantSet, scenes, schema, withMinimes, cssVariables(), isScene(), OWN_SCENES, resolveScene() (+28 more)

### Community 70 - "identity oauth.rs"
Cohesion: 0.20
Nodes (7): a_state_returns_its_value_once_and_expires(), above_the_limit_the_oldest_drop_out(), LoginStates, LoginStates<V>, NOW, Pending, same_browser()

### Community 71 - "drills restore.ts"
Cohesion: 0.19
Nodes (21): expect(), request(), setAccess(), backup(), drill(), main(), post(), state() (+13 more)

### Community 72 - "crypto master.rs"
Cohesion: 0.12
Nodes (10): accepts_32_bytes_in_base64(), debug_never_shows_the_key(), derived_keys_depend_on_purpose_and_master(), encoded(), MASTER_KEY_VAR, MasterKey, MasterKeyError, Missing (+2 more)

### Community 73 - "minimes rules.rs"
Cohesion: 0.17
Nodes (18): command(), defaults_without_saved_values(), factions_only_with_variants_and_variant_names_first(), flag(), invalid_values_give_the_defaults(), minime_rules(), MinimeCommands, MinimeRules (+10 more)

### Community 74 - "spotify mod.rs"
Cohesion: 0.20
Nodes (16): splitWords(), channelEmotes(), connect(), events(), fanout, fetchSettings(), loginFromQuery, serverStatus() (+8 more)

### Community 75 - "core commands.ts"
Cohesion: 0.15
Nodes (17): army, HELP, list, roles, teams, TRIGGERS, CommandItem, commandList (+9 more)

### Community 76 - "standard banners.ts"
Cohesion: 0.36
Nodes (8): bar(), base(), blob(), options, drawStandardOfflineBanner(), drawStandardProfileBanner(), StandardBannerOptions, write()

### Community 77 - "channel help.rs"
Cohesion: 0.19
Nodes (7): a_missing_scope_is_remembered_and_the_config_can_change(), help(), HelpResponder, line(), lock(), replies_once_per_cooldown_and_ignores_its_echo(), ChatLine

### Community 78 - "db sqlite_streamers.rs"
Cohesion: 0.16
Nodes (10): EncodeError, Failed, Missing, TimedOut, exit_codes_time_limit_and_a_missing_program(), Ffmpeg, FFMPEG_VAR, LIMIT (+2 more)

### Community 79 - "themes registry.rs"
Cohesion: 0.17
Nodes (16): built_in_themes_pass(), assert_same_as_fixture(), assert_same_fields(), normalize(), SAMPLE_LOGINS, samples(), take_fields(), DEFAULT_THEME (+8 more)

### Community 80 - "plantage stinger.ts"
Cohesion: 0.16
Nodes (15): easeIn(), easeInOut(), atCut, bare, early, first, options, second (+7 more)

### Community 81 - "themes generatedValues.check.ts"
Cohesion: 0.11
Nodes (11): SoundValue, MatrixValues, StandardValues, UrlaubValues, bannerOptions, clips, matrixClips(), audit (+3 more)

### Community 82 - "channel triggers.rs"
Cohesion: 0.17
Nodes (6): EVERY_MS, KeyBackupStore, MemoryKeyBackups, one_copy_a_day_and_none_older_than_thirty_days(), RETENTION_MS, run_key_backups()

### Community 83 - "media values.rs"
Cohesion: 0.09
Nodes (6): InvalidValue, string_value!, is_word(), MEDIA_EXTENSIONS, MEDIA_STEM_MAX, OutputName

### Community 84 - "triggers mod.rs"
Cohesion: 0.21
Nodes (17): check(), check_action(), compile(), Compiled, compiled_triggers_match_chat_lines(), CompiledTrigger, good(), limits() (+9 more)

### Community 85 - "dashboard Render.tsx"
Cohesion: 0.14
Nodes (15): cat, extra, kappa, splitEmotes(), Handlers, demo(), DEMO_FIRST_LOGIN, demoMinimes() (+7 more)

### Community 86 - "chat irc.rs"
Cohesion: 0.12
Nodes (22): emote_positions(), emote_ranges(), emote_url(), EmoteRange, garbage_never_panics(), IRC_URL, kappa(), parse_irc() (+14 more)

### Community 88 - "handlers render.rs"
Cohesion: 0.21
Nodes (18): now_ms(), text(), me(), rotate_overlay_key(), allowed(), cancel(), done(), encode() (+10 more)

### Community 89 - "backup schedule.rs"
Cohesion: 0.16
Nodes (12): atCut, before, first, options, plain, second, FLAG, FPS (+4 more)

### Community 90 - "dashboard Triggers.tsx"
Cohesion: 0.21
Nodes (11): atCut, first, options, second, crest(), drawPalm(), drawUrlaubStinger(), FPS (+3 more)

### Community 91 - "channel token_keeper.rs"
Cohesion: 0.25
Nodes (4): MinimeVariantInfo, MinimeVariantSet, SceneSize, ThemeSchema

### Community 92 - "media mod.rs"
Cohesion: 0.18
Nodes (3): LOGIN_MAX, streamer_id_is_hex_of_16_bytes(), USER_ID_MAX

### Community 93 - "minimes mod.rs"
Cohesion: 0.14
Nodes (19): chat_lines_become_events(), entry(), factions_in_the_file_round_trip_and_old_files_have_none(), is_color(), is_login(), is_variant(), line(), MAX_ROSTER (+11 more)

### Community 94 - "twitch alerts.rs"
Cohesion: 0.23
Nodes (10): Alert, alert(), EVENT_CHEERMOTE, message_text(), number(), sample_alert(), string(), tier() (+2 more)

### Community 95 - "backup archive.rs"
Cohesion: 0.22
Nodes (7): is_backup_id(), archive_with_all_rows_and_files_matching_checksums_and_no_plaintext(), count(), filled(), parse_id(), restore_brings_back_the_state_and_skips_streamers_without_a_key(), ZipBackups

### Community 96 - "plantage mangos.ts"
Cohesion: 0.25
Nodes (8): atCut, options, stripes, drawStandardStinger(), FPS, HEIGHT, StandardStingerOptions, WIDTH

### Community 97 - "handlers events.rs"
Cohesion: 0.15
Nodes (5): data(), PING, running(), stream(), test_alert()

### Community 98 - "identity session.rs"
Cohesion: 0.11
Nodes (9): LoginOutcome, AccountChanged, Failed, NotAllowed, Session, debug_hides_the_token(), SessionHash, SessionToken (+1 more)

### Community 100 - "contract run.ts"
Cohesion: 0.19
Nodes (15): freePort(), main(), report(), runCase(), serverEnv(), ServerUnderTest, startServer(), waitForServer() (+7 more)

### Community 101 - "channel alerts.rs"
Cohesion: 0.18
Nodes (9): follow(), frame(), KEEPALIVE_GRACE, listen(), RETRY, session(), silence_beyond_the_keepalive_starts_again_and_subscribes_anew(), subscribes_after_welcome_and_keeps_the_subscriptions_on_reconnect() (+1 more)

### Community 102 - "channel chat.rs"
Cohesion: 0.40
Nodes (3): listen(), session(), anonymous_login()

### Community 103 - "rst-server config.rs"
Cohesion: 0.11
Nodes (10): DATA_DIR_VAR, DEFAULT_BACKUP_UPLOAD_MB, DEFAULT_DATA_DIR, DEFAULT_MEDIA_MB, DEFAULT_PORT, FILES_VAR, KEY, OAuthApp (+2 more)

### Community 104 - "themes audit.rs"
Cohesion: 0.16
Nodes (7): audit(), FX_KEYS, personalize(), reports_every_kind_of_problem(), values_object(), info_fields(), INFO_GROUP

### Community 105 - "minimes roster.rs"
Cohesion: 0.24
Nodes (9): Minimes Package 1: Minime rules (parseColor, parseCommand, applyMinime), Minimes Package 8: Hopping in core, current_id theme id migration (suedfrucht to urlaub, starter to standard), hopPlan(durationMs, hopMs) jump plan, Urlaub Package 1: Minime variants in core, Urlaub Package 2: Theme Suedfrucht (fruit minimes), Urlaub Package 3: Rename suedfrucht to urlaub, Urlaub Package 4: Beach-thing minimes replace fruits (+1 more)

### Community 106 - "rst-server config.rs"
Cohesion: 0.23
Nodes (9): cache_bytes(), ConfigError, Invalid, MasterKey, Missing, lookup(), server(), server_defaults_and_values() (+1 more)

### Community 107 - "dashboard texts.de.check.ts"
Cohesion: 0.12
Nodes (19): features, standard, FEATURES_FILE, featuresText(), FIXTURES, fixtureText(), main(), SAMPLE_LOGINS (+11 more)

### Community 108 - "tsconfig.json"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, jsx, lib, module, moduleResolution, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 109 - "handlers media.rs"
Cohesion: 0.25
Nodes (10): MediaName, SANDBOX_CSP, audit(), delete(), deliver(), list(), MEDIA_LIMIT, name_of() (+2 more)

### Community 110 - "package.json"
Cohesion: 0.15
Nodes (14): name, private, type, version, eslint, @eslint/js, eslint-plugin-react-hooks, globals (+6 more)

### Community 111 - "twitch eventsub.rs"
Cohesion: 0.20
Nodes (10): DEFAULT_KEEPALIVE_SECONDS, EventSubError, NoMetadata, NotJson, is_twitch_reconnect_url(), parse(), parse_message(), subscriptions() (+2 more)

### Community 112 - "plantage banners.ts"
Cohesion: 0.21
Nodes (9): centered(), gradient, options, drawPlantageOfflineBanner(), drawPlantageProfileBanner(), field(), PlantageBannerOptions, Size (+1 more)

### Community 113 - "plans PLAN-MINIMES.md"
Cohesion: 0.29
Nodes (3): Minimes Package 3: Server runtime (minimes.json, SSE), Minime state on server (data/streamers/<login>/minimes.json), scripts/rules.check.ts automatic theme rules

### Community 114 - "commands mod.rs"
Cohesion: 0.53
Nodes (9): blink(), drawOfflineBanner(), drawProfileBanner(), frame(), logo(), rain(), scanlines(), text() (+1 more)

### Community 115 - "identity sessions.rs"
Cohesion: 0.23
Nodes (6): a_session_resolves_until_it_expires(), log_out_and_disconnect_end_sessions_at_once(), neo(), only_the_hash_is_stored(), SESSION_MS, Sessions<P>

### Community 116 - "music mod.rs"
Cohesion: 0.20
Nodes (6): Call, empty, full, options, quiet, values

### Community 117 - "CODING-RULES.md"
Cohesion: 0.19
Nodes (10): Coding and layout rules, npm run verify, Review checklist, scripts/rules.check.ts rule script, Matrix-Theme, Plan: ein Server, mehrere Streamer, Themes, Einstellungs-Schema, Themes (standard, matrix, urlaub, plantage, koth) (+2 more)

### Community 118 - "package.json"
Cohesion: 0.14
Nodes (14): scripts, build, check, contract, dev, gen:types, lint, prepare (+6 more)

### Community 119 - "scripts rust.ts"
Cohesion: 0.23
Nodes (10): BUILD, exe, home, plain, COMMANDS, findCargo(), GEN_TYPES, main() (+2 more)

### Community 120 - "render clips.rs"
Cohesion: 0.07
Nodes (26): OUTPUT_NAMES, Clip, .ALL, Offline, Profile, Stinger, Format, Gif (+18 more)

### Community 121 - "koth soldiers.ts"
Cohesion: 0.31
Nodes (6): AccessPolicy, is_admin(), Registration, Allowlist, Open, revoked_logins()

### Community 122 - "tests export_types.rs"
Cohesion: 0.24
Nodes (10): actual(), differences(), expected(), generated_dir(), generated_files_are_current(), HEADER, KEEP, read_tree() (+2 more)

### Community 123 - "scripts rules.check.ts"
Cohesion: 0.11
Nodes (10): HookInput, input, AUTHORING_TYPES, BAG_NAME_EXCEPTIONS, EM_DASH, failures, files, GENERATED_TYPES (+2 more)

### Community 124 - "identity login.rs"
Cohesion: 0.33
Nodes (5): CHAT_SCOPE, only_complete_tokens(), SCOPES, to_tokens(), tokens()

### Community 125 - "access mod.rs"
Cohesion: 0.17
Nodes (11): Feature, Alerts, .ALL, Banners, Chat, Fx, Minimes, Music (+3 more)

### Community 126 - "core emotes.ts"
Cohesion: 0.21
Nodes (12): bttv(), BttvEmote, BttvUser, EmoteEntry, ffz(), FfzEmote, json(), loadEmotes() (+4 more)

### Community 127 - "README.md"
Cohesion: 0.18
Nodes (11): index.html app entry (/src/main.tsx), Chat-Trigger, Dashboard, Zugang und Funktionsstufen (off/beta/all), Minimes, Overlay-Schluessel (?key=), Overlay-Szenen /s/<login>/<scene>, RST - Rezondes Stream Tools (+3 more)

### Community 128 - "media library.rs"
Cohesion: 0.20
Nodes (4): MB, one_upload_per_streamer(), triggers_using(), UploadSlots

### Community 129 - "package.json"
Cohesion: 0.17
Nodes (12): devDependencies, eslint, @eslint/js, eslint-plugin-react-hooks, globals, @types/node, @types/react, @types/react-dom (+4 more)

### Community 130 - "settings mod.rs"
Cohesion: 0.14
Nodes (7): neo(), save_checks_chooses_and_audits(), SaveError, Invalid, Vault, SettingsService, SettingsService<'_, S, K, A>

### Community 131 - "RUST-PLAN.md"
Cohesion: 0.24
Nodes (5): Backups, Audit-Log, Schluessel-Backups (30 days), Package 45: Umstieg (Node server removed), Plan: Rust-Server als einzige Source of Truth

### Community 132 - "plans PLAN-MINIMES.md"
Cohesion: 0.22
Nodes (11): DESIGN.md: Design principles, PLAN-MINIMES.md: Minimes plan, Minimes Package 7: Docs, DESIGN-KOTH.md: King of the Hill design, PLAN-KOTH.md: King of the Hill plan, DESIGN-MATRIX.md: Matrix design, DESIGN-PLANTAGE.md: Suedfrucht-Plantage design, PLAN-PLANTAGE.md: Suedfrucht-Plantage plan (+3 more)

### Community 133 - "rst-server main.rs"
Cohesion: 0.33
Nodes (6): import(), main(), run(), SCHEDULE_EVERY, serve(), USAGE

### Community 134 - "cli import.rs"
Cohesion: 0.29
Nodes (5): profile_folders(), config(), imports_the_fixture_twice_into_sqlite(), run(), StoreConfig

### Community 135 - "minimes roster.rs"
Cohesion: 0.18
Nodes (11): MinimeEvent, Ban, Chat, Clear, Color, Join, Kick, Leave (+3 more)

### Community 136 - "triggers cooldowns.rs"
Cohesion: 0.22
Nodes (3): Cooldowns, millis(), PRUNE_EVERY_MS

### Community 137 - "triggers mod.rs"
Cohesion: 0.18
Nodes (11): ActionKind, Media, Text, FxAction, FxEvent, FxPosition, Named, Point (+3 more)

### Community 138 - "twitch alerts.rs"
Cohesion: 0.18
Nodes (10): AlertKind, .ALL, Cheer, Follow, Gift, Hype, Raid, Redeem (+2 more)

### Community 139 - "plans PLAN-MINIMES.md"
Cohesion: 0.32
Nodes (5): Minimes Package 11: Combat (minimeCombat.ts), Minimes Package 12: Fixed slots, KOTH Package 1: Theme King of the Hill, Soldier roles (assault, medic, MG, sniper, grenadier), Plantage Package 1: Theme Suedfrucht-Plantage

### Community 141 - "chat events.rs"
Cohesion: 0.29
Nodes (3): cookie(), HOME, percent_decode()

### Community 143 - "render jobs.rs"
Cohesion: 0.48
Nodes (5): Ghost(), Glyphs(), Minimes(), Shape(), Sleep()

### Community 144 - "tests keystore_contract.rs"
Cohesion: 0.42
Nodes (8): contract(), keys_survive_a_restart_and_need_the_right_master(), rewrap_keeps_data_readable(), separate_file(), shred_makes_data_unreadable(), sqlite(), sqlite_passes_the_contract(), streamer()

### Community 145 - "docker-compose.yml"
Cohesion: 0.22
Nodes (8): keys volume (/keys), overlays service, overlays public override (no ports, https PUBLIC_URL), tokens volume (/data), Schluesselspeicher und Verschluesselung (RST_MASTER_KEY, keys.db), Umstieg vom Node-Server (rst import, scripts/migrate.sh), rst import (Package 24), Non-media fixture file in import test data

### Community 146 - "plans PLAN-MINIMES.md"
Cohesion: 0.22
Nodes (6): Stinger and banners as pure functions of time, Minime action catalog (name, durationMs, weight), KOTH smoke grenade stinger with flag change, Matrix columns stinger with decrypting logo, Plantage falling mango stinger, Urlaub wave stinger

### Community 147 - "docs PLAN-URLAUB.md"
Cohesion: 0.33
Nodes (8): KOTH soldier minimes (helmet, faction uniform, role weapon), Mango soldier minimes (helmet, role weapon, core hopping), Urlaub beach-thing minimes (16 types with faces, core hopping), Minime combat (minimeCombatFields, COMBAT_ACTIONS), Hopping in core (minimeHops.ts, hopStyle, minime-hop), Fixed slots (minimePlacement = slots), Minime variants (types instead of colors, minimeVariantFields), withDefaults for core field defaults

### Community 148 - "chat line.rs"
Cohesion: 0.50
Nodes (4): MEDIA_CASES, refusedWhileBusy(), slowUpload(), upload()

### Community 149 - "cli mod.rs"
Cohesion: 0.25
Nodes (6): Command, Import, Serve, Usage, Version, parse()

### Community 150 - "core streamerPath.ts"
Cohesion: 0.33
Nodes (8): checkMedia(), base(), traversal, decodeAll(), isLogin(), isMediaName(), parse(), StreamerPath

### Community 151 - "triggers schedule.rs"
Cohesion: 0.39
Nodes (4): action(), actions_follow_each_other_and_together_joins_the_previous(), DEFAULT_DURATION, schedule()

### Community 152 - "RUST-PLAN.md"
Cohesion: 0.43
Nodes (4): rst-app crate, rst-domain crate, rst-infra crate, rst-server crate (binary rst)

### Community 153 - "drills sse-load.ts"
Cohesion: 0.40
Nodes (4): FeatureLevel, All, Beta, Off

### Community 156 - "twitch eventsub.rs"
Cohesion: 0.25
Nodes (7): EventSubMessage, Alert, Ignored, Offline, Reconnect, Revocation, Welcome

### Community 158 - "docs PLAN-KOTH.md"
Cohesion: 0.29
Nodes (6): Minimes Package 10: Factions, Minimes Package 9: Remove TS mirror of minime rules, KOTH hill holder display (flag in faction color), KOTH factions BLUFOR, OPFOR, INDFOR, normalizeName (lowercase, umlauts, no spaces/hyphens), Minime factions (minimeTeams, shownTeam, teamCounts)

### Community 161 - "workflows docker.yml"
Cohesion: 0.40
Nodes (6): Docker-Image Workflow, image job (ghcr.io publish), verify job (npm run verify + contract), npm run contract, Vertragstests (Package 4), Fake-Provider Twitch/Spotify (Package 3)

### Community 163 - "plans PLAN-MINIMES.md"
Cohesion: 0.40
Nodes (5): Minimes Package 4: Behavior and hook (minimeBehavior, useMinimes), Minimes Package 5: Matrix ghost base form, Minimes Package 6: Matrix ghost idle animations, Matrix neon ghost minimes (hoodie, glyph jet), useMinimes({ catalog, reaction, widthPx })

### Community 164 - "THEMES.md"
Cohesion: 0.40
Nodes (5): Minimes Package 2: Scene, feature and settings (readMinimeOptions, hasMinimes), DESIGN-STANDARD.md: Standard design, Standard theme has no minimes, MINIME_FIELDS / MINIME_BASE_FIELDS (minimeFields.ts), Scene inheritance from standard theme

### Community 165 - "scripts migrate.sh"
Cohesion: 0.53
Nodes (5): as_root(), fail(), MSYS_NO_PATHCONV, migrate.sh script, step()

### Community 167 - "tests dependencies.rs"
Cohesion: 0.40
Nodes (4): dependencies(), domain_has_no_io_dependencies(), FORBIDDEN, MANIFEST

### Community 168 - "vite.config.ts"
Cohesion: 0.40
Nodes (3): vite, @vitejs/plugin-react, SCENES

### Community 169 - "package.json"
Cohesion: 0.50
Nodes (4): dependencies, figlet, react, react-dom

### Community 170 - "rst-app Cargo.toml"
Cohesion: 1.00
Nodes (4): rst-app, rst-domain, rst-infra, rst-server

### Community 172 - "docker-compose.public.yml"
Cohesion: 1.00
Nodes (3): caddy service, Package 12: Deployment (Caddy, HTTPS), Oeffentlicher Betrieb (Caddy, HTTPS)

### Community 173 - "THEMES.md"
Cohesion: 0.67
Nodes (3): Theme folder structure (settings.ts, use<Id>.ts, index.tsx, render.ts, theme.css, scenes), ThemeModule (THEME_MODULES in registry.ts), ThemeView (THEME_VIEWS in scenes.tsx)

## Ambiguous Edges - Review These
- `Non-media fixture file in import test data` → `rst import (Package 24)`  [AMBIGUOUS]
  server-rs/crates/rst-app/tests/fixtures/data/streamers/neo/media/notes.txt · relation: conceptually_related_to

## Knowledge Gaps
- **209 isolated node(s):** `AccountChanged`, `Vault`, `MasterKey`, `All`, `Beta` (+204 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1312 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **38 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `scripts` connect `package.json` to `package.json`?**
  _High betweenness centrality (0.432) - this node is a cross-community bridge._
- **What connects `AccountChanged`, `Vault`, `MasterKey` to the rest of the system?**
  _209 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Audit Log Ports` be split into smaller, more focused modules?**
  _Cohesion score 0.03238095238095238 - nodes in this community are weakly interconnected._
- **Why does `check` connect `package.json` to `backup archive.rs`?**
  _High betweenness centrality (0.431) - this node is a cross-community bridge._
- **Should `Commands and Admin Access` be split into smaller, more focused modules?**
  _Cohesion score 0.044798113763631006 - nodes in this community are weakly interconnected._
- **Why does `react` connect `music music.ts` to `Minime Scene Behavior`, `Alert Scenes`, `Overlay Connection and Demo`, `Matrix Glyphs and Scenes`, `Build Scripts and Entry`, `render jobs.rs`, `Screen Countdown and Quotes`, `Dashboard Theme Settings`, `Plantage Field Shapes`, `KOTH Hill Shapes`, `Urlaub Beach Shapes`, `Effects Overlay`, `Dashboard Admin`, `Dashboard API Client`, `urlaub settings.ts`, `dashboard obsSetup.ts`, `scenes Chat.tsx`, `dashboard Scenery.tsx`, `spotify mod.rs`, `core commands.ts`, `package.json`?**
  _High betweenness centrality (0.373) - this node is a cross-community bridge._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Non-media fixture file in import test data` and `rst import (Package 24)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._