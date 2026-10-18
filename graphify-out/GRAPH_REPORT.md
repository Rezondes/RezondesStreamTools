# Graph Report - RezondesStream  (2026-10-18)

## Corpus Check
- 514 files · ~275,257 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 23 file(s) not represented in the graph (top: .css 15, (none) 5, .toml 2)

## Summary
- 4645 nodes · 12649 edges · 197 communities (161 shown, 36 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 483 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2e5ba939`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Audit Log Ports
- Commands and Admin Access
- Audit Log and Records
- koth/scenes/Minimes.tsx
- Shared Setting Fields
- Alert Scenes
- Encryption and File Cache
- eventLog.ts
- Twitch Login and Scopes
- useMatrix
- Streamer Identity
- Access Policy Admin
- Rust Setting Field Builders
- Key Backups
- ref_node_assert
- Backup Schedule
- Rust Minime Combat Fields
- TS Minime Fields
- Server Route Guards
- matrix/scenes/Screen.tsx
- Dashboard Theme Settings
- Plantage Field Shapes
- KOTH Hill Shapes
- channel/triggers.rs
- KOTH Rust Schema
- Rust Minime Variants
- Rust Minime Rules and ASCII
- Live Event Hubs
- Settings Validation
- Matrix Banners and Hash
- Urlaub Beach Shapes
- rst-domain/src/spotify/mod.rs
- Server Settings Store
- Chat Command List
- Effects Overlay
- Backup Archives
- Server App Wiring
- handlers/backups.rs
- OAuth Callback
- client.ts
- Admin.tsx
- urlaub/scenes/Minimes.tsx
- Runtime Registry
- Minime Roster
- Minime Chat Commands
- channel minimes.rs
- rst-server routes.rs
- koth/render.ts
- urlaub settings.ts
- themes standard.rs
- settings file.rs
- dashboard obsSetup.ts
- backup/schedule.rs
- themes minime_fields.rs
- sessions_audit_contract.rs
- backup archive.rs
- server_error
- urlaub/render.ts
- import/mod.rs
- scenes Chat.tsx
- runtime.rs
- Triggers.tsx
- token_keeper.rs
- triggers pattern.rs
- public_commands
- rst-domain paths.rs
- music music.ts
- chat events.rs
- themes schema.rs
- theme.ts
- identity oauth.rs
- RecordStore
- crypto master.rs
- minimes rules.rs
- spotify mod.rs
- demo.ts
- standard/render.ts
- ChatLine
- db sqlite_streamers.rs
- themes registry.rs
- plantage stinger.ts
- themes generatedValues.check.ts
- channel triggers.rs
- media values.rs
- triggers mod.rs
- SqliteKeyStore
- chat irc.rs
- ports socket.rs
- handlers render.rs
- types.ts
- .start
- cipher.rs
- media mod.rs
- minimes mod.rs
- twitch alerts.rs
- backup archive.rs
- SettingInput.tsx
- handlers events.rs
- identity session.rs
- Render.tsx
- rst-app/src/media/mod.rs
- channel alerts.rs
- chat.rs
- rst-server config.rs
- themes audit.rs
- minimes roster.rs
- soldiers.ts
- texts.de.ts
- tsconfig.json
- mangos.ts
- package.json
- twitch eventsub.rs
- plantage banners.ts
- plans PLAN-MINIMES.md
- .complete
- identity sessions.rs
- music mod.rs
- CODING-RULES.md
- package.json
- IrcMessage
- render clips.rs
- koth soldiers.ts
- tests export_types.rs
- .replace
- MinimeCommand
- access mod.rs
- core emotes.ts
- README.md
- media library.rs
- package.json
- FxAction
- RUST-PLAN.md
- plans PLAN-MINIMES.md
- rst-server main.rs
- cli import.rs
- MinimeEvent
- triggers cooldowns.rs
- triggers mod.rs
- twitch alerts.rs
- plans PLAN-MINIMES.md
- ports backups.rs
- app.rs
- minimes roster.rs
- LoginOutcome
- tests keystore_contract.rs
- docker-compose.yml
- plans PLAN-MINIMES.md
- docs PLAN-URLAUB.md
- cli mod.rs
- core streamerPath.ts
- triggers schedule.rs
- RUST-PLAN.md
- drills sse-load.ts
- crypto lookup.rs
- render clips.rs
- DESIGN.md
- docs PLAN-KOTH.md
- workflows docker.yml
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
- `Soldier roles (assault, medic, MG, sniper, grenadier)` --implements--> `Minime variants (types instead of colors, minimeVariantFields)`  [INFERRED]
  src/themes/koth/docs/PLAN-KOTH.md → THEMES.md
- `Core decides, theme shows (rule 16)` --semantically_similar_to--> `Shared logic in core, theme supplies look only`  [INFERRED] [semantically similar]
  plans/PLAN-MINIMES.md → THEMES.md
- `Move hash from matrix/stinger.ts to src/core/hash.ts` --semantically_similar_to--> `Shared logic in core, theme supplies look only`  [INFERRED] [semantically similar]
  src/themes/urlaub/docs/PLAN-URLAUB.md → THEMES.md
- `Minimes Package 8: Hopping in core` --implements--> `Hopping in core (minimeHops.ts, hopStyle, minime-hop)`  [INFERRED]
  plans/PLAN-MINIMES.md → THEMES.md

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

## Communities (197 total, 36 thin omitted)

### Community 0 - "Audit Log Ports"
Cohesion: 0.03
Nodes (17): StoredEntry, FileStore, FileWriter, StoreError, SessionStore, SocketConnector, StreamerRepository, StreamerRow (+9 more)

### Community 1 - "Commands and Admin Access"
Cohesion: 0.05
Nodes (52): AccessAdmin, login(), raw(), revoked_access_ends_every_session_and_is_audited(), saving_at_once_never_mixes_two_changes(), streamer_rows(), World, AccessSettings (+44 more)

### Community 2 - "Audit Log and Records"
Cohesion: 0.05
Nodes (32): AccessAdmin<'_, R, S, K, Q, P, A>, AuditRow, json_of(), StreamerRow, aad(), AuditLog<A, K>, is_key(), OverlayKeys<S, K> (+24 more)

### Community 3 - "koth/scenes/Minimes.tsx"
Cohesion: 0.06
Nodes (76): DEMO_FIRST_LOGIN, seedOf(), MinimeCombatScene, MinimeSceneOptions, useMinimes(), actorRun(), actorStyle(), advance() (+68 more)

### Community 4 - "Shared Setting Fields"
Cohesion: 0.04
Nodes (89): alertSoundFields(), BADGE_KEYS, badgeFields(), labels, KEYS, asciiArt(), defaults, fields (+81 more)

### Community 5 - "Alert Scenes"
Cohesion: 0.06
Nodes (69): ALERT_SOUND_KEYS, alertQuote(), alertTextKeys, alertVars(), KINDS, sounds, values, describeAlert() (+61 more)

### Community 6 - "Encryption and File Cache"
Cohesion: 0.08
Nodes (26): aad(), an_unfinished_write_leaves_nothing_behind(), BLOCK, BlockReader, Cache, cache_holds_at_most_its_limit_and_gives_the_same_bytes(), cut_reordered_or_foreign_blocks_fail(), DEFAULT_CACHE_MB (+18 more)

### Community 7 - "eventLog.ts"
Cohesion: 0.15
Nodes (19): EventFeed(), KINDS, time(), useEventLog(), add(), alertText(), many, one (+11 more)

### Community 8 - "Twitch Login and Scopes"
Cohesion: 0.04
Nodes (30): FakeTwitch, Arc<FakeTwitch>, FakeTwitch, StreamerDeletion<'_, R, S, K, P, F, A>, the_streamer_is_gone_with_sessions_key_rows_and_files(), FakeTwitch, FakeSpotify, Playing (+22 more)

### Community 9 - "useMatrix"
Cohesion: 0.14
Nodes (21): emoji, standard, glyph(), GLYPHS, useDecode(), useNow(), decodeFrame(), Drop (+13 more)

### Community 10 - "Streamer Identity"
Cohesion: 0.07
Nodes (20): a_rename_keeps_the_profile(), id(), list_leaves_out_shredded_streamers(), login(), PROFILE_KIND, register_and_find(), RegisterError, AccountChanged (+12 more)

### Community 11 - "Access Policy Admin"
Cohesion: 0.30
Nodes (13): admins(), allowlist_only_admins_and_listed_logins(), beta_policy(), initial_policy_allows_the_admins_and_everything(), levels_all_beta_off(), login(), logins(), open_registration_lets_everyone_in() (+5 more)

### Community 12 - "Rust Setting Field Builders"
Cohesion: 0.07
Nodes (47): ts_type(), ascii_art(), ascii_art_is_a_textarea_with_generator_flag(), choice(), color(), field(), FieldKind, Boolean (+39 more)

### Community 13 - "Key Backups"
Cohesion: 0.19
Nodes (7): copies_without_shredded_keys_and_deleted_after_thirty_days(), delete_waits_for_a_copy_held_open_by_another_process(), FolderKeyBackups, KEY_BACKUPS_VAR, DELETE_ATTEMPTS, DELETE_PAUSE, remove_patiently()

### Community 14 - "ref_node_assert"
Cohesion: 0.04
Nodes (52): figlet, HookInput, input, features, standard, FEATURES_FILE, featuresText(), FIXTURES (+44 more)

### Community 15 - "Backup Schedule"
Cohesion: 0.09
Nodes (19): BackupError, Busy, Invalid, NotFound, Store, Backups, backups(), Backups<B, A, K> (+11 more)

### Community 16 - "Rust Minime Combat Fields"
Cohesion: 0.07
Nodes (41): combat(), combat_fields_are_opt_in_without_medic_durations(), minime_aim_key(), minime_combat_fields(), minime_fire_key(), alerts(), ALERTS, BANNER (+33 more)

### Community 17 - "TS Minime Fields"
Cohesion: 0.07
Nodes (51): sound(), defaults, probe, COMBAT_SOUNDS, command(), hasMinimes(), MEDIC, MINIME_BASE_FIELDS (+43 more)

### Community 18 - "Server Route Guards"
Cohesion: 0.24
Nodes (5): percent_decode(), resolve(), StaticError, BadEncoding, Forbidden

### Community 19 - "matrix/scenes/Screen.tsx"
Cohesion: 0.10
Nodes (36): TerminalTiming, useTerminal(), clock(), countdownEnd(), countdown(), rotating(), ScreenKind, shortClock() (+28 more)

### Community 20 - "Dashboard Theme Settings"
Cohesion: 0.08
Nodes (38): PREVIEW, SettingValues, ScenePreview(), changedKeys(), fromServer, keysIn(), schema, scoped (+30 more)

### Community 21 - "Plantage Field Shapes"
Cohesion: 0.09
Nodes (37): BIRD, Blob, blobs(), shapes, star, circle(), CRATES, DEPTHS (+29 more)

### Community 22 - "KOTH Hill Shapes"
Cohesion: 0.13
Nodes (24): shapes, star, circle(), FLAG, HELI, ICON_NAMES, IconName, ICONS (+16 more)

### Community 23 - "channel/triggers.rs"
Cohesion: 0.20
Nodes (9): compiled(), fire_ignores_the_cooldown_and_replace_takes_effect(), line(), lock(), matching_lines_fire_in_the_planned_order_with_cooldowns(), neo(), rules(), TriggerRunner (+1 more)

### Community 24 - "KOTH Rust Schema"
Cohesion: 0.08
Nodes (38): alerts(), ALERTS, BANNER, CAM, capital(), CHAT, chat_cam_music_fx(), fields() (+30 more)

### Community 25 - "Rust Minime Variants"
Cohesion: 0.06
Nodes (26): one_readonly_key_per_field_with_its_type(), values_type(), ALERTS, BANNER, BEACH, BEACH_THINGS, CAM, capital() (+18 more)

### Community 26 - "Rust Minime Rules and ASCII"
Cohesion: 0.07
Nodes (28): ascii_text(), ROWS, alert_sound_fields(), badge_fields(), badge_texts_default_to_the_abbreviation(), one_sound_per_alert_kind_and_fade_out(), ALERTS, BANNER (+20 more)

### Community 27 - "Live Event Hubs"
Cohesion: 0.08
Nodes (19): alert(), at_most_fifty_streams_and_places_come_back(), CAPACITY, Channel, Hubs, MAX_STREAMS, messages_reach_every_stream_of_the_streamer(), neo() (+11 more)

### Community 28 - "Settings Validation"
Cohesion: 0.11
Nodes (31): check_lines(), check_media(), check_sound(), check_text(), check_value(), codes(), defaults_of_all_building_blocks_pass(), extensions() (+23 more)

### Community 29 - "Matrix Banners and Hash"
Cohesion: 0.16
Nodes (24): clamp01(), hash(), bannerOptions, blink(), drawOfflineBanner(), drawProfileBanner(), frame(), logo() (+16 more)

### Community 30 - "Urlaub Beach Shapes"
Cohesion: 0.12
Nodes (28): Beach(), shapes, star, circle(), CLOUD, GULL, ICON_NAMES, IconName (+20 more)

### Community 31 - "rst-domain/src/spotify/mod.rs"
Cohesion: 0.08
Nodes (24): export_all(), export_config(), Player, SpotifyPlayer<A, S, K>, callback_has_session(), changed(), changes_worth_sending(), millis() (+16 more)

### Community 32 - "Server Settings Store"
Cohesion: 0.14
Nodes (9): DATA_DB_VAR, migrations_twice(), open_data_db(), pragmas(), put_replaces_and_get_reads(), SqliteServerSettings, no_plaintext_in_file(), row() (+1 more)

### Community 33 - "Chat Command List"
Cohesion: 0.07
Nodes (38): a_missing_scope_is_remembered_and_the_config_can_change(), help(), HelpResponder, line(), lock(), replies_once_per_cooldown_and_ignores_its_echo(), command_list(), CommandItem (+30 more)

### Community 34 - "Effects Overlay"
Cohesion: 0.15
Nodes (27): FX_KEYS, fxDefaults(), FxSettings, useFxItem(), useFxScene(), FxMedia(), ShownFx, useFx() (+19 more)

### Community 35 - "Backup Archives"
Cohesion: 0.13
Nodes (29): ArchiveError, Invalid, NotFound, Store, ARCHIVE_FORMAT, allowed_name(), bytes(), check() (+21 more)

### Community 36 - "Server App Wiring"
Cohesion: 0.07
Nodes (5): start_all(), App, UploadSlot, serve(), streamer()

### Community 37 - "handlers/backups.rs"
Cohesion: 0.28
Nodes (14): now_ms(), actor(), create(), delete(), download(), failed(), id_of(), list() (+6 more)

### Community 38 - "OAuth Callback"
Cohesion: 0.10
Nodes (22): random_bytes(), to_hex(), cookie(), cookies_http_only_lax_and_secure_with_https(), is_secure_url(), oauth_state_cookie(), OAUTH_STATE_SECONDS, session_cookie() (+14 more)

### Community 39 - "client.ts"
Cohesion: 0.05
Nodes (91): ACCOUNT_CASES, ALERT_CASES, Subscription, AUTH_CASES, BACKUP_CASES, Listing, CHAT_CASES, chatLine() (+83 more)

### Community 40 - "Admin.tsx"
Cohesion: 0.09
Nodes (44): isErrorCode(), AccessDraft, AccessForm(), Admin(), BackupListing, BackupRow, Backups(), BackupSchedule (+36 more)

### Community 41 - "urlaub/scenes/Minimes.tsx"
Cohesion: 0.17
Nodes (15): actor, plan, hopPlan(), hopStyle(), BeachThing(), BEACH_THINGS, BeachThing, names (+7 more)

### Community 42 - "Runtime Registry"
Cohesion: 0.11
Nodes (13): a_restart_stops_the_old_runtime(), Entries, Fake, held(), id(), locked_or_stopped_starts_are_discarded(), NEXT, nothing_to_start_and_runtimes_that_ended_themselves() (+5 more)

### Community 43 - "Minime Roster"
Cohesion: 0.15
Nodes (29): allowed_teams(), allowed_variants(), apply(), chat(), color_memory_is_limited(), entry(), join(), join_leave_and_come_back_with_the_remembered_color() (+21 more)

### Community 44 - "Minime Chat Commands"
Cohesion: 0.15
Nodes (21): channels(), commands_at_the_start_case_insensitive(), find_variant(), has_role(), HEX, is_login(), join_choice(), join_reads_role_and_faction_in_any_order() (+13 more)

### Community 45 - "channel minimes.rs"
Cohesion: 0.13
Nodes (11): commands_change_the_list_saves_are_batched_and_survive_a_restart(), line(), MinimeRunner, MinimeRunner<S, K>, neo(), profile(), PRUNE_EVERY, Roster (+3 more)

### Community 46 - "rst-server routes.rs"
Cohesion: 0.10
Nodes (26): Call, handle(), read_body(), all_on(), authorize(), find(), Found, MethodNotAllowed (+18 more)

### Community 47 - "koth/render.ts"
Cohesion: 0.10
Nodes (23): battlefield(), centered(), gradient, options, drawKothOfflineBanner(), drawKothProfileBanner(), KothBannerOptions, PEAKS (+15 more)

### Community 48 - "urlaub settings.ts"
Cohesion: 0.14
Nodes (13): screenScenes(), ThemeView, kothView, Screen, matrixView, Screen, plantageView, Screen (+5 more)

### Community 49 - "themes standard.rs"
Cohesion: 0.10
Nodes (23): alerts(), ALERTS, BANNER, CAM, CHAT, chat_cam_music(), FONTS, FX (+15 more)

### Community 50 - "settings file.rs"
Cohesion: 0.14
Nodes (25): broken_unknown_and_renamed_files(), current_id(), default_theme(), first_login_personalizes_every_theme(), first_settings(), minime_rules_from_the_chosen_theme(), minime_rules_of(), OLD_DEFAULTS (+17 more)

### Community 51 - "dashboard obsSetup.ts"
Cohesion: 0.12
Nodes (26): OBS_SCENES, Act, importViaWebSocket(), ObsError, ObsImport(), ObsMessage, browserSettings(), collection (+18 more)

### Community 52 - "backup/schedule.rs"
Cohesion: 0.12
Nodes (10): backup(), BackupSchedule, HOUR_MS, KEY, MAX_INTERVAL_HOURS, MAX_KEEP, off_never_due_on_after_the_interval(), only_old_automatic_backups_are_surplus() (+2 more)

### Community 53 - "themes minime_fields.rs"
Cohesion: 0.11
Nodes (29): color_themes_get_base_and_color_fields(), COMBAT_SOUNDS, feature_fields_match_the_typescript_fixture(), has_minimes(), MEDIC, minime_base_fields(), minime_color_fields(), MINIME_COMBAT (+21 more)

### Community 54 - "sessions_audit_contract.rs"
Cohesion: 0.29
Nodes (5): audit_appends_and_lists_newest_first(), database(), id(), sessions_find_delete_and_expire(), sessions_go_with_their_streamer()

### Community 55 - "backup archive.rs"
Cohesion: 0.11
Nodes (11): BACKUPS_VAR, bytes(), copy_hashed(), EXTENSION, number(), PARTIAL, Table, text() (+3 more)

### Community 56 - "server_error"
Cohesion: 0.11
Nodes (32): MediaName, json(), server_error(), text(), access(), ACCESS_LIMIT, audit(), AUDIT_LIMIT (+24 more)

### Community 57 - "urlaub/render.ts"
Cohesion: 0.12
Nodes (22): beach(), centered(), gradient, options, drawUrlaubOfflineBanner(), drawUrlaubProfileBanner(), palm(), Size (+14 more)

### Community 58 - "import/mod.rs"
Cohesion: 0.06
Nodes (38): broken_files(), fixture(), fixture_roundtrip(), id_of(), idempotent(), importer(), Importer<R, S, K, F, P>, ImportReport (+30 more)

### Community 59 - "scenes Chat.tsx"
Cohesion: 0.23
Nodes (15): badgeLabel(), MessageParts(), useChat(), ChatMessage, Part, Chat(), Row(), useKoth() (+7 more)

### Community 60 - "runtime.rs"
Cohesion: 0.07
Nodes (21): a_rejected_login_ends_the_runtime_and_deletes_the_tokens(), broken_profile_does_not_block(), chat_lines_fire_triggers_and_the_help_reply_without_its_echo(), id(), login(), profile_with_tokens(), RESTART_PAUSE, setup() (+13 more)

### Community 61 - "Triggers.tsx"
Cohesion: 0.11
Nodes (27): deleteMedia(), loadMedia(), uploadMedia(), Media(), megabytes(), Preview(), ActionRow(), ActionTiming() (+19 more)

### Community 62 - "token_keeper.rs"
Cohesion: 0.15
Nodes (12): a_rejected_login_is_reported(), after_stop_nothing_is_saved_and_late_tokens_are_revoked(), FakeTwitch, keeper(), simultaneous_checks_share_one_renewal(), TokenKeeper, TokenKeeper<T, S, K>, tokens() (+4 more)

### Community 63 - "triggers pattern.rs"
Cohesion: 0.10
Nodes (16): linear(), MAX_PATTERN, Pattern, pattern(), PatternError, Invalid, TooLong, Unsupported (+8 more)

### Community 64 - "public_commands"
Cohesion: 0.19
Nodes (5): CommandService, CommandService<'_, S, K, A>, help_setting_and_public_list_by_features(), neo(), public_commands()

### Community 65 - "rst-domain paths.rs"
Cohesion: 0.13
Nodes (13): encoded_slash_stays_one_part_and_is_no_media_name(), is_scene_file(), OverlayRoute, Commands, Events, Media, Scene, Settings (+5 more)

### Community 66 - "music music.ts"
Cohesion: 0.12
Nodes (33): react, useMusic(), Marquee(), Props, song, marqueeSeconds(), MusicState, nowPlaying() (+25 more)

### Community 67 - "chat events.rs"
Cohesion: 0.14
Nodes (18): ACTION_END, ACTION_START, alert(), CHAT_CHEERMOTE, chat_with_badges_and_emotes(), ChatMessage, ChatRemoval, events() (+10 more)

### Community 68 - "themes schema.rs"
Cohesion: 0.10
Nodes (16): MinimeVariantInfo, MinimeVariantSet, SceneName, Alerts, .ALL, Brb, Cam, Chat (+8 more)

### Community 69 - "theme.ts"
Cohesion: 0.06
Nodes (44): ThemeValues, bad, good, resolved, schema, checkMedia(), checkValue(), isObject() (+36 more)

### Community 70 - "identity oauth.rs"
Cohesion: 0.20
Nodes (7): a_state_returns_its_value_once_and_expires(), above_the_limit_the_oldest_drop_out(), LoginStates, LoginStates<V>, NOW, Pending, same_browser()

### Community 71 - "RecordStore"
Cohesion: 0.12
Nodes (6): RecordStore, StoredRecord, SqliteRecords, contract_tests!, sqlite(), streamer()

### Community 72 - "crypto master.rs"
Cohesion: 0.13
Nodes (9): accepts_32_bytes_in_base64(), debug_never_shows_the_key(), derived_keys_depend_on_purpose_and_master(), encoded(), MASTER_KEY_VAR, MasterKeyError, Missing, NotBase64 (+1 more)

### Community 73 - "minimes rules.rs"
Cohesion: 0.17
Nodes (18): command(), defaults_without_saved_values(), factions_only_with_variants_and_variant_names_first(), flag(), invalid_values_give_the_defaults(), minime_rules(), MinimeCommands, MinimeRules (+10 more)

### Community 74 - "spotify mod.rs"
Cohesion: 0.12
Nodes (26): splitWords(), channelEmotes(), connect(), events(), fanout, fetchSettings(), loginFromQuery, serverStatus() (+18 more)

### Community 75 - "demo.ts"
Cohesion: 0.07
Nodes (35): cat, extra, kappa, splitEmotes(), army, HELP, list, roles (+27 more)

### Community 76 - "standard/render.ts"
Cohesion: 0.17
Nodes (17): bar(), base(), blob(), options, drawStandardOfflineBanner(), drawStandardProfileBanner(), StandardBannerOptions, write() (+9 more)

### Community 77 - "ChatLine"
Cohesion: 0.36
Nodes (7): emote_ranges(), EmoteRange, banned_login(), ChatLine, emote_positions(), roles_color_and_display_name(), to_chat_line()

### Community 78 - "db sqlite_streamers.rs"
Cohesion: 0.16
Nodes (10): EncodeError, Failed, Missing, TimedOut, exit_codes_time_limit_and_a_missing_program(), Ffmpeg, FFMPEG_VAR, LIMIT (+2 more)

### Community 79 - "themes registry.rs"
Cohesion: 0.17
Nodes (16): built_in_themes_pass(), assert_same_as_fixture(), assert_same_fields(), normalize(), SAMPLE_LOGINS, samples(), take_fields(), DEFAULT_THEME (+8 more)

### Community 80 - "plantage stinger.ts"
Cohesion: 0.15
Nodes (17): easeIn(), easeInOut(), clips, plantageClips(), atCut, bare, early, first (+9 more)

### Community 81 - "themes generatedValues.check.ts"
Cohesion: 0.17
Nodes (6): SettingValue, SoundValue, MatrixValues, PlantageValues, StandardValues, UrlaubValues

### Community 82 - "channel triggers.rs"
Cohesion: 0.18
Nodes (6): EVERY_MS, KeyBackupStore, MemoryKeyBackups, one_copy_a_day_and_none_older_than_thirty_days(), RETENTION_MS, run_key_backups()

### Community 83 - "media values.rs"
Cohesion: 0.10
Nodes (6): InvalidValue, string_value!, is_word(), MEDIA_EXTENSIONS, MEDIA_STEM_MAX, OutputName

### Community 84 - "triggers mod.rs"
Cohesion: 0.22
Nodes (14): check(), check_action(), compile(), Compiled, compiled_triggers_match_chat_lines(), good(), limits(), MAX_ACTION_SECONDS (+6 more)

### Community 85 - "SqliteKeyStore"
Cohesion: 0.13
Nodes (5): MasterKey, KEYS_DB_VAR, now_ms(), SqliteKeyStore, unwrap_key()

### Community 86 - "chat irc.rs"
Cohesion: 0.15
Nodes (16): emote_positions(), emote_url(), garbage_never_panics(), IRC_URL, kappa(), parse_irc(), parses_tags_prefix_command_and_trailing(), Part (+8 more)

### Community 87 - "ports socket.rs"
Cohesion: 0.14
Nodes (3): TextSocket, WebSockets, WebSocketText

### Community 88 - "handlers render.rs"
Cohesion: 0.26
Nodes (15): allowed(), cancel(), done(), encode(), file(), files(), folder(), frame() (+7 more)

### Community 89 - "types.ts"
Cohesion: 0.18
Nodes (11): ServerStatus, ActionKind, ChatRemoval, FxAction, FxEvent, FxPosition, Minime, NamedPosition (+3 more)

### Community 90 - ".start"
Cohesion: 0.20
Nodes (8): panic_is_contained(), RuntimeSetup, Shared, Shared<T, S, K>, StreamerRuntime, StreamerRuntime<T, S, K, P>, subscribe_all(), supervise()

### Community 91 - "cipher.rs"
Cohesion: 0.14
Nodes (12): changed_data_wrong_owner_or_key_fail(), CryptoError, Decrypt, Encrypt, Random, KEY, NONCE_LEN, open() (+4 more)

### Community 92 - "media mod.rs"
Cohesion: 0.18
Nodes (3): LOGIN_MAX, streamer_id_is_hex_of_16_bytes(), USER_ID_MAX

### Community 93 - "minimes mod.rs"
Cohesion: 0.18
Nodes (16): chat_lines_become_events(), entry(), factions_in_the_file_round_trip_and_old_files_have_none(), is_color(), is_login(), is_variant(), line(), MAX_ROSTER (+8 more)

### Community 94 - "twitch alerts.rs"
Cohesion: 0.23
Nodes (10): Alert, alert(), EVENT_CHEERMOTE, message_text(), number(), sample_alert(), string(), tier() (+2 more)

### Community 95 - "backup archive.rs"
Cohesion: 0.19
Nodes (9): archive_with_all_rows_and_files_matching_checksums_and_no_plaintext(), count(), entries(), filled(), forged(), parse_id(), restore_brings_back_the_state_and_skips_streamers_without_a_key(), tampered_uploads_are_rejected_and_change_nothing() (+1 more)

### Community 96 - "SettingInput.tsx"
Cohesion: 0.17
Nodes (16): MEDIA_KIND, AsciiGenerator(), ASCII_FONTS, AsciiFont, asciiLogo(), FONTS, AsciiGenerator, asText() (+8 more)

### Community 97 - "handlers events.rs"
Cohesion: 0.11
Nodes (6): PRUNE_EVERY_MS, data(), PING, running(), stream(), test_alert()

### Community 98 - "identity session.rs"
Cohesion: 0.17
Nodes (4): debug_hides_the_token(), SessionHash, SessionToken, token_text_and_hash_are_deterministic()

### Community 99 - "Render.tsx"
Cohesion: 0.19
Nodes (16): ClipName, RenderClip, ClipPreview(), ClipSettings(), Render(), RenderedFile, RenderedFiles(), SettingsFile (+8 more)

### Community 100 - "rst-app/src/media/mod.rs"
Cohesion: 0.22
Nodes (7): library(), MediaEntry, MediaLibrary, MediaOverview, neo(), store_error(), store_list_read_replace_and_delete()

### Community 101 - "channel alerts.rs"
Cohesion: 0.18
Nodes (9): follow(), frame(), KEEPALIVE_GRACE, listen(), RETRY, session(), silence_beyond_the_keepalive_starts_again_and_subscribes_anew(), subscribes_after_welcome_and_keeps_the_subscriptions_on_reconnect() (+1 more)

### Community 102 - "chat.rs"
Cohesion: 0.18
Nodes (9): chat_lines_only_with_the_feature_moderation_always(), lines_become_events_ping_is_answered_and_the_chat_reconnects(), listen(), neo(), NEXT_ID, RECONNECT, relay(), session() (+1 more)

### Community 103 - "rst-server config.rs"
Cohesion: 0.09
Nodes (19): cache_bytes(), ConfigError, Invalid, MasterKey, Missing, DATA_DIR_VAR, DEFAULT_BACKUP_UPLOAD_MB, DEFAULT_DATA_DIR (+11 more)

### Community 104 - "themes audit.rs"
Cohesion: 0.17
Nodes (7): audit(), FX_KEYS, personalize(), reports_every_kind_of_problem(), values_object(), info_fields(), INFO_GROUP

### Community 105 - "minimes roster.rs"
Cohesion: 0.24
Nodes (9): Minimes Package 1: Minime rules (parseColor, parseCommand, applyMinime), Minimes Package 8: Hopping in core, current_id theme id migration (suedfrucht to urlaub, starter to standard), hopPlan(durationMs, hopMs) jump plan, Urlaub Package 1: Minime variants in core, Urlaub Package 2: Theme Suedfrucht (fruit minimes), Urlaub Package 3: Rename suedfrucht to urlaub, Urlaub Package 4: Beach-thing minimes replace fruits (+1 more)

### Community 106 - "soldiers.ts"
Cohesion: 0.25
Nodes (11): Soldier(), names, EXPLOSIVE, findRole(), hillState, Role, ROLE_IDS, ROLE_SET (+3 more)

### Community 107 - "texts.de.ts"
Cohesion: 0.09
Nodes (23): ERROR_CODES, ErrorCode, REQUEST_ERROR_CODES, SETTING_ERROR_CODES, accessLosses, losses, next, saved (+15 more)

### Community 108 - "tsconfig.json"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, jsx, lib, module, moduleResolution, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 109 - "mangos.ts"
Cohesion: 0.27
Nodes (10): Mango(), names, EXPLOSIVE, findRole(), MANGO, Role, ROLE_IDS, ROLE_SET (+2 more)

### Community 110 - "package.json"
Cohesion: 0.15
Nodes (14): name, private, type, version, eslint, @eslint/js, eslint-plugin-react-hooks, globals (+6 more)

### Community 111 - "twitch eventsub.rs"
Cohesion: 0.13
Nodes (17): DEFAULT_KEEPALIVE_SECONDS, EventSubError, NoMetadata, NotJson, EventSubMessage, Alert, Ignored, Offline (+9 more)

### Community 112 - "plantage banners.ts"
Cohesion: 0.21
Nodes (9): centered(), gradient, options, drawPlantageOfflineBanner(), drawPlantageProfileBanner(), field(), PlantageBannerOptions, Size (+1 more)

### Community 113 - "plans PLAN-MINIMES.md"
Cohesion: 0.29
Nodes (3): Minimes Package 3: Server runtime (minimes.json, SSE), Minime state on server (data/streamers/<login>/minimes.json), scripts/rules.check.ts automatic theme rules

### Community 114 - ".complete"
Cohesion: 0.33
Nodes (5): entry(), first_login_creates_streamer_settings_key_and_session(), LoginFlow<'_, R, S, K, Q, P, A>, logout_and_disconnect_end_sessions(), random()

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

### Community 119 - "IrcMessage"
Cohesion: 0.31
Nodes (7): amount(), badge(), chat_events(), notice_alert(), tag_or(), to_irc_events(), IrcMessage

### Community 120 - "render clips.rs"
Cohesion: 0.07
Nodes (26): OUTPUT_NAMES, Clip, .ALL, Offline, Profile, Stinger, Format, Gif (+18 more)

### Community 121 - "koth soldiers.ts"
Cohesion: 0.23
Nodes (8): AccessPolicy, is_admin(), Registration, Allowlist, Open, revoked_logins(), Login, StreamerPath

### Community 122 - "tests export_types.rs"
Cohesion: 0.30
Nodes (9): actual(), differences(), expected(), generated_dir(), generated_files_are_current(), HEADER, KEEP, read_tree() (+1 more)

### Community 123 - ".replace"
Cohesion: 0.39
Nodes (3): AccessSettings<P>, initial_policy_then_the_saved_one(), login()

### Community 124 - "MinimeCommand"
Cohesion: 0.22
Nodes (9): join(), MinimeCommand, Color, Join, Kick, Leave, Team, Variant (+1 more)

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

### Community 130 - "FxAction"
Cohesion: 0.29
Nodes (7): ActionKind, Media, Text, FxAction, FxEvent, Trigger, When

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
Cohesion: 0.33
Nodes (5): profile_folders(), config(), imports_the_fixture_twice_into_sqlite(), run(), StoreConfig

### Community 135 - "MinimeEvent"
Cohesion: 0.13
Nodes (24): chat_keeps_alive_and_reacts(), color_cooldown_and_color_joins(), disabled_team_is_reassigned(), full_list_replaces_or_rejects(), join_picks_smallest_team(), kick_ban_and_clear(), MinimeEvent, Ban (+16 more)

### Community 137 - "triggers mod.rs"
Cohesion: 0.33
Nodes (6): FxPosition, Named, Point, NamedPosition, Center, Random

### Community 138 - "twitch alerts.rs"
Cohesion: 0.18
Nodes (10): AlertKind, .ALL, Cheer, Follow, Gift, Hype, Raid, Redeem (+2 more)

### Community 139 - "plans PLAN-MINIMES.md"
Cohesion: 0.32
Nodes (5): Minimes Package 11: Combat (minimeCombat.ts), Minimes Package 12: Fixed slots, KOTH Package 1: Theme King of the Hill, Soldier roles (assault, medic, MG, sniper, grenadier), Plantage Package 1: Theme Suedfrucht-Plantage

### Community 141 - "app.rs"
Cohesion: 0.06
Nodes (19): app(), call(), dispatch(), FRAME_CSP, headers(), maintenance_leaves_only_the_dashboard_and_the_admin_area(), origin_and_routes(), PENDING_LOGINS (+11 more)

### Community 143 - "LoginOutcome"
Cohesion: 0.33
Nodes (5): LoginOutcome, AccountChanged, Failed, NotAllowed, Session

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

### Community 149 - "cli mod.rs"
Cohesion: 0.25
Nodes (6): Command, Import, Serve, Usage, Version, parse()

### Community 150 - "core streamerPath.ts"
Cohesion: 0.39
Nodes (7): base(), traversal, decodeAll(), isLogin(), isMediaName(), parse(), StreamerPath

### Community 151 - "triggers schedule.rs"
Cohesion: 0.39
Nodes (4): action(), actions_follow_each_other_and_together_joins_the_previous(), DEFAULT_DURATION, schedule()

### Community 152 - "RUST-PLAN.md"
Cohesion: 0.43
Nodes (4): rst-app crate, rst-domain crate, rst-infra crate, rst-server crate (binary rst)

### Community 153 - "drills sse-load.ts"
Cohesion: 0.40
Nodes (4): FeatureLevel, All, Beta, Off

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
- **209 isolated node(s):** `AccountChanged`, `Vault`, `MasterKey`, `eslint`, `@types/node` (+204 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1316 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **36 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `scripts` connect `package.json` to `package.json`?**
  _High betweenness centrality (0.449) - this node is a cross-community bridge._
- **What connects `AccountChanged`, `Vault`, `MasterKey` to the rest of the system?**
  _209 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Audit Log Ports` be split into smaller, more focused modules?**
  _Cohesion score 0.031246094238220223 - nodes in this community are weakly interconnected._
- **Why does `check` connect `package.json` to `backup archive.rs`?**
  _High betweenness centrality (0.448) - this node is a cross-community bridge._
- **Should `Commands and Admin Access` be split into smaller, more focused modules?**
  _Cohesion score 0.04508050089445438 - nodes in this community are weakly interconnected._
- **Why does `react` connect `music music.ts` to `koth/scenes/Minimes.tsx`, `Alert Scenes`, `eventLog.ts`, `useMatrix`, `matrix/scenes/Screen.tsx`, `Dashboard Theme Settings`, `Plantage Field Shapes`, `KOTH Hill Shapes`, `Urlaub Beach Shapes`, `Effects Overlay`, `Admin.tsx`, `urlaub/scenes/Minimes.tsx`, `urlaub settings.ts`, `dashboard obsSetup.ts`, `scenes Chat.tsx`, `Triggers.tsx`, `theme.ts`, `spotify mod.rs`, `demo.ts`, `SettingInput.tsx`, `Render.tsx`, `package.json`?**
  _High betweenness centrality (0.408) - this node is a cross-community bridge._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Non-media fixture file in import test data` and `rst import (Package 24)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._