# Graph Report - RezondesStream  (2026-10-20)

## Corpus Check
- 558 files · ~327,493 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 26 file(s) not represented in the graph (top: .css 17, (none) 5, .toml 2)

## Summary
- 5182 nodes · 14106 edges · 220 communities (182 shown, 38 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 550 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `727025f2`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- session.rs
- super
- rst-app/src/backup/keys.rs
- profile/mod.rs
- koth/settings.ts
- fillTemplate
- matrix/scenes/Music.tsx
- types.ts
- ProviderError
- fakeProviders.ts
- identity/streamers.rs
- minimeCombat.check.ts
- Rust Setting Field Builders
- koth/scenes/Screen.tsx
- SqliteKeyStore
- Backup Schedule
- Rust Minime Combat Fields
- minimeFields.ts
- ProviderError
- plantage/scenes/Alerts.tsx
- import/mod.rs
- profile/mod.rs
- hill.ts
- channel/triggers.rs
- KOTH Rust Schema
- Rust Minime Variants
- Rust Minime Rules and ASCII
- bears/scenes/Alerts.tsx
- Settings Validation
- streamerPath.ts
- Urlaub Beach Shapes
- app.rs
- texts.de.ts
- rst-domain/src/commands/mod.rs
- Effects Overlay
- Backup Archives
- run.ts
- server_error
- OAuth Callback
- request
- Admin.tsx
- paint.ts
- Runtime Registry
- roster.rs
- Minime Chat Commands
- minimes.rs
- rst-server routes.rs
- koth/banners.ts
- pattern.rs
- themes standard.rs
- settings file.rs
- dashboard obsSetup.ts
- ThemeSettings.tsx
- themes minime_fields.rs
- rig.ts
- archive.rs
- json
- urlaub/banners.ts
- rst-app/src/media/mod.rs
- irc.rs
- music/mod.rs
- beachThings.ts
- rst-app/src/commands/mod.rs
- media/values.rs
- minimeStack.check.ts
- rst-domain/src/access/mod.rs
- useMatrix
- chat/events.rs
- rst-domain/src/spotify/mod.rs
- World.tsx
- identity/oauth.rs
- cooldowns.rs
- config.rs
- Triggers.tsx
- paths.rs
- koth/scenes/Minimes.tsx
- standard/render.ts
- client.ts
- SettingInput.tsx
- Theme
- ZipBackups
- plantage/banners.ts
- backup/schedule.rs
- rst-infra/src/render/ffmpeg.rs
- src/events.rs
- overlay_key.rs
- StreamerId
- ports socket.rs
- handlers render.rs
- rules.rs
- ServerConfig
- encrypted.rs
- theme.ts
- minimes mod.rs
- twitch alerts.rs
- minimeBehavior.ts
- hash
- handlers events.rs
- rst-domain/src/triggers/mod.rs
- connection.ts
- eventLog.ts
- channel alerts.rs
- useMinimes.ts
- SceneName
- SqliteKeyStore
- Plan: Theme "Bärenbande"
- errorCodes.ts
- ref_node_assert
- tsconfig.json
- restore.ts
- package.json
- twitch eventsub.rs
- bears.rs
- plantage/stinger.ts
- minimeCombat.ts
- koth/stinger.check.ts
- urlaub/stinger.ts
- CODING-RULES.md
- package.json
- rust.ts
- Clip
- SceneName
- export_types.rs
- identity/values.rs
- Package 3: Stinger und Banner
- MinimeEvent
- standard/stinger.ts
- README.md
- Package 8: Szenen-Korrekturen
- package.json
- SpotifyPlayer<A, S, K>
- RUST-PLAN.md
- plans PLAN-MINIMES.md
- main.rs
- rules.check.ts
- media.rs
- matrix/banners.ts
- matrix/banners.check.ts
- twitch alerts.rs
- Minimes Package 4: Behavior and hook (minimeBehavior, useMinimes)
- BackupStore
- SessionToken
- minimes roster.rs
- SpotifyPlayer
- MasterKeyError
- docker-compose.yml
- Stinger and banners as pure functions of time
- Minimes Package 11: Combat (minimeCombat.ts)
- Minime factions (minimeTeams, shownTeam, teamCounts)
- path
- mangos.ts
- triggers/schedule.rs
- RUST-PLAN.md
- icons.ts
- master.rs
- render clips.rs
- runtime.rs
- DESIGN.md
- SoundValue
- start
- clips.rs
- MinimeRules
- bears/scenes/Minimes.tsx
- scripts migrate.sh
- tests dependencies.rs
- vite.config.ts
- package.json
- rst-app Cargo.toml
- DESIGN.md
- Package 1: Grundlage und Vollbild-Szenen
- THEMES.md
- DESIGN.md
- media lizard.gif
- docs DESIGN-STANDARD.md
- Plan: Theme "Bärenbande"
- theme.ts
- EventSubMessage
- emotes.ts
- Dashboard.tsx
- library.rs
- client.rs
- IrcMessage
- Package 5: Bärentürme der Minimes
- Package 9: Welt-Modell
- Package 10: Stinger mit Vorhang
- FxAction
- RenderJobs
- themes/audit.rs
- Package 6: Rig-Modell der Bären
- Command
- help.rs
- Format
- koth/scenes/Minimes.tsx
- pathbuf

## God Nodes (most connected - your core abstractions)
1. `StreamerId` - 266 edges
2. `StoreError` - 185 edges
3. `VaultError` - 105 edges
4. `Login` - 74 edges
5. `ProviderError` - 71 edges
6. `react` - 70 edges
7. `App` - 62 edges
8. `server_error()` - 54 edges
9. `DataKey` - 52 edges
10. `fillTemplate()` - 51 edges

## Surprising Connections (you probably didn't know these)
- `Annahmen` --references--> `ThemeView`  [INFERRED]
  plans/PLAN-SCENES.md → src/core/theme.ts
- `Plan: Szenen ohne Vererbung` --references--> `resolveScene()`  [INFERRED]
  plans/PLAN-SCENES.md → src/core/themeRuntime.ts
- `Acceptance Criteria` --references--> `clipsFor()`  [INFERRED]
  plans/PLAN-SCENES.md → src/themes/renderers.ts
- `Plan: Szenen ohne Vererbung` --references--> `clipsFor()`  [INFERRED]
  plans/PLAN-SCENES.md → src/themes/renderers.ts
- `Tests (TDD)` --references--> `hasMinimes()`  [INFERRED]
  src/themes/bears/docs/PLAN-BEARS.md → src/core/minimeFields.ts

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

## Communities (220 total, 38 thin omitted)

### Community 0 - "session.rs"
Cohesion: 0.14
Nodes (7): cookies_http_only_lax_and_secure_with_https(), is_secure_url(), OAUTH_STATE_SECONDS, SESSION_DAYS, HOME, origin_of(), same_origin()

### Community 1 - "super"
Cohesion: 0.06
Nodes (39): AccessAdmin, login(), raw(), revoked_access_ends_every_session_and_is_audited(), saving_at_once_never_mixes_two_changes(), streamer_rows(), World, AccessSettings (+31 more)

### Community 2 - "rst-app/src/backup/keys.rs"
Cohesion: 0.17
Nodes (6): EVERY_MS, KeyBackupStore, MemoryKeyBackups, one_copy_a_day_and_none_older_than_thirty_days(), RETENTION_MS, run_key_backups()

### Community 3 - "profile/mod.rs"
Cohesion: 0.09
Nodes (22): vault_only(), after_shred(), defaults_before_the_first_save(), filled(), HELP, invalid_input_never_lands_in_the_store(), lizard(), MINIMES (+14 more)

### Community 4 - "koth/settings.ts"
Cohesion: 0.04
Nodes (76): figlet, asciiText(), GLYPHS, BADGE_KEYS, badgeFields(), labels, KEYS, asciiArt() (+68 more)

### Community 5 - "fillTemplate"
Cohesion: 0.06
Nodes (75): ALERT_SOUND_KEYS, alertQuote(), alertSoundFields(), alertTextKeys, alertVars(), KINDS, sounds, values (+67 more)

### Community 6 - "matrix/scenes/Music.tsx"
Cohesion: 0.12
Nodes (26): connect(), useMusic(), useNow(), Marquee(), Props, song, marqueeSeconds(), MusicState (+18 more)

### Community 7 - "types.ts"
Cohesion: 0.12
Nodes (25): badgeLabel(), MessageParts(), useChat(), ActionKind, ChatMessage, ChatRemoval, FxEvent, FxPosition (+17 more)

### Community 8 - "ProviderError"
Cohesion: 0.04
Nodes (33): FakeTwitch, a_rejected_login_is_reported(), after_stop_nothing_is_saved_and_late_tokens_are_revoked(), Arc<FakeTwitch>, CHECK_SECONDS, FakeTwitch, keeper(), simultaneous_checks_share_one_renewal() (+25 more)

### Community 9 - "fakeProviders.ts"
Cohesion: 0.15
Nodes (21): bearer(), Answer, connect(), masked, nextMessage(), control(), frame(), helix() (+13 more)

### Community 10 - "identity/streamers.rs"
Cohesion: 0.09
Nodes (21): a_rename_keeps_the_profile(), id(), list_leaves_out_shredded_streamers(), login(), PROFILE_KIND, register_and_find(), RegisterError, AccountChanged (+13 more)

### Community 11 - "minimeCombat.check.ts"
Cohesion: 0.15
Nodes (11): cast, find(), options(), own, stage, themes, combatCast, CombatOptions (+3 more)

### Community 12 - "Rust Setting Field Builders"
Cohesion: 0.07
Nodes (47): ts_type(), ascii_art(), ascii_art_is_a_textarea_with_generator_flag(), choice(), color(), field(), FieldKind, Boolean (+39 more)

### Community 13 - "koth/scenes/Screen.tsx"
Cohesion: 0.17
Nodes (23): countdownEnd(), countdown(), rotating(), ScreenKind, shortClock(), STAGE, stageScale(), useScreen() (+15 more)

### Community 14 - "SqliteKeyStore"
Cohesion: 0.06
Nodes (20): StreamerRepository, StreamerRow, DATA_DB_VAR, migrations_twice(), open_data_db(), pragmas(), put_replaces_and_get_reads(), SqliteServerSettings (+12 more)

### Community 15 - "Backup Schedule"
Cohesion: 0.09
Nodes (18): BackupError, Busy, Invalid, NotFound, Store, Backups, backups(), Backups<B, A, K> (+10 more)

### Community 16 - "Rust Minime Combat Fields"
Cohesion: 0.08
Nodes (40): combat(), combat_fields_are_opt_in_without_medic_durations(), minime_aim_key(), minime_combat_fields(), minime_fire_key(), alerts(), ALERTS, BANNER (+32 more)

### Community 17 - "minimeFields.ts"
Cohesion: 0.04
Nodes (84): key(), features, standard, FEATURES_FILE, featuresText(), FIXTURES, fixtureText(), main() (+76 more)

### Community 18 - "ProviderError"
Cohesion: 0.13
Nodes (9): FakeSpotify, Playing, Answer, Limited, Nothing, Unauthorized, SpotifyApi, TokenAnswer (+1 more)

### Community 19 - "plantage/scenes/Alerts.tsx"
Cohesion: 0.10
Nodes (36): Blob, blobs(), shapes, star, circle(), Cloud(), Crate(), CRATES (+28 more)

### Community 20 - "import/mod.rs"
Cohesion: 0.11
Nodes (25): ScheduleSettings, broken_files(), fixture(), fixture_roundtrip(), id_of(), idempotent(), importer(), Importer<R, S, K, F, P> (+17 more)

### Community 21 - "profile/mod.rs"
Cohesion: 0.05
Nodes (29): AccessAdmin<'_, R, S, K, Q, P, A>, AuditRow, json_of(), aad(), AuditLog<A, K>, MediaLibrary<S, K, F>, Shelf, Media (+21 more)

### Community 22 - "hill.ts"
Cohesion: 0.13
Nodes (24): shapes, star, circle(), FLAG, HELI, ICON_NAMES, IconName, ICONS (+16 more)

### Community 23 - "channel/triggers.rs"
Cohesion: 0.21
Nodes (8): compiled(), fire_ignores_the_cooldown_and_replace_takes_effect(), line(), lock(), matching_lines_fire_in_the_planned_order_with_cooldowns(), neo(), rules(), TriggerRunner

### Community 24 - "KOTH Rust Schema"
Cohesion: 0.08
Nodes (38): alerts(), ALERTS, BANNER, CAM, capital(), CHAT, chat_cam_music_fx(), fields() (+30 more)

### Community 25 - "Rust Minime Variants"
Cohesion: 0.07
Nodes (27): one_readonly_key_per_field_with_its_type(), values_type(), ALERTS, BANNER, BEACH, BEACH_THINGS, CAM, capital() (+19 more)

### Community 26 - "Rust Minime Rules and ASCII"
Cohesion: 0.07
Nodes (26): ascii_text(), ROWS, alert_sound_fields(), badge_fields(), badge_texts_default_to_the_abbreviation(), one_sound_per_alert_kind_and_fade_out(), ALERTS, BANNER (+18 more)

### Community 27 - "bears/scenes/Alerts.tsx"
Cohesion: 0.14
Nodes (29): BearId, TOWER, Hero(), Props, IconName, IconShape(), Screen, PoseName (+21 more)

### Community 28 - "Settings Validation"
Cohesion: 0.11
Nodes (31): check_lines(), check_media(), check_sound(), check_text(), check_value(), codes(), defaults_of_all_building_blocks_pass(), extensions() (+23 more)

### Community 29 - "streamerPath.ts"
Cohesion: 0.39
Nodes (7): base(), traversal, decodeAll(), isLogin(), isMediaName(), parse(), StreamerPath

### Community 30 - "Urlaub Beach Shapes"
Cohesion: 0.12
Nodes (30): useCover(), Beach(), shapes, star, circle(), CLOUD, GULL, ICON_NAMES (+22 more)

### Community 31 - "app.rs"
Cohesion: 0.05
Nodes (16): App, app(), call(), dispatch(), FRAME_CSP, headers(), maintenance_leaves_only_the_dashboard_and_the_admin_area(), origin_and_routes() (+8 more)

### Community 32 - "texts.de.ts"
Cohesion: 0.15
Nodes (15): PREVIEW, accessLosses, losses, next, saved, hasLosses(), removed(), confirmLosses() (+7 more)

### Community 33 - "rst-domain/src/commands/mod.rs"
Cohesion: 0.10
Nodes (32): command_list(), CommandItem, Help, Join, Leave, Look, Team, Trigger (+24 more)

### Community 34 - "Effects Overlay"
Cohesion: 0.15
Nodes (29): FX_KEYS, fxDefaults(), FxSettings, useFxItem(), useFxScene(), FxMedia(), ShownFx, useFx() (+21 more)

### Community 35 - "Backup Archives"
Cohesion: 0.13
Nodes (27): ArchiveError, Invalid, NotFound, Store, allowed_name(), bytes(), check(), Checked (+19 more)

### Community 36 - "run.ts"
Cohesion: 0.17
Nodes (17): drill(), main(), memoryMb(), read(), Reader, silentClient(), readBody(), startFakeProviders() (+9 more)

### Community 37 - "server_error"
Cohesion: 0.30
Nodes (14): server_error(), actor(), create(), delete(), download(), failed(), id_of(), list() (+6 more)

### Community 38 - "OAuth Callback"
Cohesion: 0.13
Nodes (22): to_hex(), cookie(), oauth_state_cookie(), session_cookie(), now_ms(), redirect(), cookie(), percent_decode() (+14 more)

### Community 39 - "request"
Cohesion: 0.16
Nodes (24): ACCOUNT_CASES, ALERT_CASES, Subscription, BACKUP_CASES, Listing, CHAT_CASES, chatLine(), DATA_CASES (+16 more)

### Community 40 - "Admin.tsx"
Cohesion: 0.11
Nodes (38): isErrorCode(), AccessDraft, AccessForm(), Admin(), BackupListing, BackupRow, Backups(), BackupSchedule (+30 more)

### Community 41 - "paint.ts"
Cohesion: 0.06
Nodes (69): BearsValues, ASLEEP, AWAKE, BearsBannerOptions, card(), drawBearsOfflineBanner(), drawBearsProfileBanner(), EVENING (+61 more)

### Community 42 - "Runtime Registry"
Cohesion: 0.11
Nodes (13): a_restart_stops_the_old_runtime(), Entries, Fake, held(), id(), locked_or_stopped_starts_are_discarded(), NEXT, nothing_to_start_and_runtimes_that_ended_themselves() (+5 more)

### Community 43 - "roster.rs"
Cohesion: 0.17
Nodes (34): commands_at_the_start_case_insensitive(), parse_color(), rules(), team_rules(), apply(), chat(), chat_keeps_alive_and_reacts(), color_cooldown_and_color_joins() (+26 more)

### Community 44 - "Minime Chat Commands"
Cohesion: 0.10
Nodes (25): find_variant(), has_role(), HEX, is_login(), join(), join_choice(), join_reads_role_and_faction_in_any_order(), MinimeCommand (+17 more)

### Community 45 - "minimes.rs"
Cohesion: 0.14
Nodes (11): commands_change_the_list_saves_are_batched_and_survive_a_restart(), line(), MinimeRunner, MinimeRunner<S, K>, neo(), profile(), PRUNE_EVERY, Roster (+3 more)

### Community 46 - "rst-server routes.rs"
Cohesion: 0.11
Nodes (23): all_on(), authorize(), find(), Found, MethodNotAllowed, Route, Guard, Admin (+15 more)

### Community 47 - "koth/banners.ts"
Cohesion: 0.19
Nodes (9): battlefield(), centered(), gradient, options, drawKothOfflineBanner(), drawKothProfileBanner(), KothBannerOptions, PEAKS (+1 more)

### Community 48 - "pattern.rs"
Cohesion: 0.10
Nodes (16): linear(), MAX_PATTERN, Pattern, pattern(), PatternError, Invalid, TooLong, Unsupported (+8 more)

### Community 49 - "themes standard.rs"
Cohesion: 0.10
Nodes (23): alerts(), ALERTS, BANNER, CAM, CHAT, chat_cam_music(), FONTS, FX (+15 more)

### Community 50 - "settings file.rs"
Cohesion: 0.14
Nodes (26): broken_unknown_and_renamed_files(), current_id(), default_theme(), first_login_personalizes_every_theme(), first_settings(), minime_rules_from_the_chosen_theme(), minime_rules_of(), OLD_DEFAULTS (+18 more)

### Community 51 - "dashboard obsSetup.ts"
Cohesion: 0.12
Nodes (25): OBS_SCENES, importViaWebSocket(), ObsError, ObsImport(), ObsMessage, browserSettings(), collection, layout (+17 more)

### Community 52 - "ThemeSettings.tsx"
Cohesion: 0.13
Nodes (30): ScenePreview(), changedKeys(), fromServer, keysIn(), schema, scoped, screens, values (+22 more)

### Community 53 - "themes minime_fields.rs"
Cohesion: 0.10
Nodes (35): bears(), color_themes_get_base_and_color_fields(), COMBAT_SOUNDS, default_of(), feature_fields_match_the_typescript_fixture(), MEDIC, minime_base_fields(), minime_color_fields() (+27 more)

### Community 54 - "rig.ts"
Cohesion: 0.04
Nodes (74): BearChoice, BodyShape, CLOSED_MOUTH, CUP_FAR, CUP_NEAR, EAR_CENTERS, FOUR_BACK_LINE, FOUR_BODY (+66 more)

### Community 55 - "archive.rs"
Cohesion: 0.09
Nodes (16): ARCHIVE_FORMAT, BACKUPS_VAR, bytes(), copy_hashed(), count(), entries(), EXTENSION, forged() (+8 more)

### Community 56 - "json"
Cohesion: 0.10
Nodes (23): json(), access(), ACCESS_LIMIT, audit(), AUDIT_LIMIT, delete_streamer(), save_access(), streamers() (+15 more)

### Community 57 - "urlaub/banners.ts"
Cohesion: 0.24
Nodes (9): beach(), centered(), gradient, options, drawUrlaubOfflineBanner(), drawUrlaubProfileBanner(), palm(), Size (+1 more)

### Community 58 - "rst-app/src/media/mod.rs"
Cohesion: 0.15
Nodes (8): Importer, library(), MediaEntry, MediaLibrary, MediaOverview, neo(), store_error(), store_list_read_replace_and_delete()

### Community 59 - "irc.rs"
Cohesion: 0.12
Nodes (21): emote_positions(), emote_ranges(), emote_url(), EmoteRange, garbage_never_panics(), IRC_URL, kappa(), parse_irc() (+13 more)

### Community 60 - "music/mod.rs"
Cohesion: 0.08
Nodes (9): NEXT_ID, RECONNECT, DEFAULT_LIFETIME_S, NOW, Player, RENEW_EARLY_MS, SocketConnector, TextSocket (+1 more)

### Community 61 - "beachThings.ts"
Cohesion: 0.29
Nodes (8): BeachThing(), BEACH_THINGS, BeachThing, names, findThing(), THING_IDS, THING_SET, ThingPart

### Community 62 - "rst-app/src/commands/mod.rs"
Cohesion: 0.19
Nodes (5): CommandService, CommandService<'_, S, K, A>, help_setting_and_public_list_by_features(), neo(), public_commands()

### Community 63 - "media/values.rs"
Cohesion: 0.10
Nodes (5): InvalidValue, is_word(), MEDIA_EXTENSIONS, MEDIA_STEM_MAX, OutputName

### Community 64 - "minimeStack.check.ts"
Cohesion: 0.13
Nodes (19): useTowers(), Tower, advanceStacks(), find(), options(), stage, themes, landOffset() (+11 more)

### Community 65 - "rst-domain/src/access/mod.rs"
Cohesion: 0.08
Nodes (35): StreamerRow, AccessPolicy, admins(), allowlist_only_admins_and_listed_logins(), beta_policy(), Feature, Alerts, .ALL (+27 more)

### Community 66 - "useMatrix"
Cohesion: 0.08
Nodes (38): emoji, standard, glyph(), GLYPHS, useDecode(), TerminalTiming, useTerminal(), decodeFrame() (+30 more)

### Community 67 - "chat/events.rs"
Cohesion: 0.14
Nodes (18): ACTION_END, ACTION_START, alert(), CHAT_CHEERMOTE, chat_with_badges_and_emotes(), ChatMessage, ChatRemoval, events() (+10 more)

### Community 68 - "rst-domain/src/spotify/mod.rs"
Cohesion: 0.18
Nodes (18): callback_has_session(), changed(), changes_worth_sending(), millis(), only_complete_tokens_with_expiry(), origin(), POLL_MS, progress_moves_only_while_playing() (+10 more)

### Community 69 - "World.tsx"
Cohesion: 0.08
Nodes (37): alongGround(), Baked(), Block, blockBase(), BRIDGE, bridgeShapes(), bridge, cells (+29 more)

### Community 70 - "identity/oauth.rs"
Cohesion: 0.20
Nodes (7): a_state_returns_its_value_once_and_expires(), above_the_limit_the_oldest_drop_out(), LoginStates, LoginStates<V>, NOW, Pending, same_browser()

### Community 71 - "cooldowns.rs"
Cohesion: 0.22
Nodes (3): Cooldowns, millis(), PRUNE_EVERY_MS

### Community 72 - "config.rs"
Cohesion: 0.12
Nodes (7): DATA_DIR_VAR, DEFAULT_BACKUP_UPLOAD_MB, DEFAULT_DATA_DIR, DEFAULT_MEDIA_MB, DEFAULT_PORT, FILES_VAR, KEY

### Community 73 - "Triggers.tsx"
Cohesion: 0.11
Nodes (27): deleteMedia(), loadMedia(), uploadMedia(), Media(), megabytes(), Preview(), ActionRow(), ActionTiming() (+19 more)

### Community 74 - "paths.rs"
Cohesion: 0.11
Nodes (14): encoded_slash_stays_one_part_and_is_no_media_name(), is_scene_file(), OverlayRoute, Commands, Events, Media, Scene, Settings (+6 more)

### Community 75 - "koth/scenes/Minimes.tsx"
Cohesion: 0.05
Nodes (53): cat, extra, kappa, splitEmotes(), army, HELP, list, roles (+45 more)

### Community 76 - "standard/render.ts"
Cohesion: 0.22
Nodes (12): bar(), base(), blob(), options, drawStandardOfflineBanner(), drawStandardProfileBanner(), StandardBannerOptions, write() (+4 more)

### Community 77 - "client.ts"
Cohesion: 0.16
Nodes (15): AUTH_CASES, ME, cookie(), Init, location(), login(), STRANGER, Streamer (+7 more)

### Community 78 - "SettingInput.tsx"
Cohesion: 0.18
Nodes (15): MEDIA_KIND, AsciiGenerator(), ASCII_FONTS, AsciiFont, asciiLogo(), FONTS, AsciiGenerator, asText() (+7 more)

### Community 79 - "Theme"
Cohesion: 0.11
Nodes (21): export_all(), export_config(), assert_same_as_fixture(), assert_same_fields(), normalize(), SAMPLE_LOGINS, samples(), take_fields() (+13 more)

### Community 80 - "ZipBackups"
Cohesion: 0.24
Nodes (6): archive_with_all_rows_and_files_matching_checksums_and_no_plaintext(), filled(), parse_id(), restore_brings_back_the_state_and_skips_streamers_without_a_key(), tampered_uploads_are_rejected_and_change_nothing(), ZipBackups

### Community 81 - "plantage/banners.ts"
Cohesion: 0.16
Nodes (16): centered(), gradient, options, crateSign(), CROWN, disc(), drawPlantageOfflineBanner(), drawPlantageProfileBanner() (+8 more)

### Community 82 - "backup/schedule.rs"
Cohesion: 0.14
Nodes (10): backup(), BackupSchedule, HOUR_MS, KEY, MAX_INTERVAL_HOURS, MAX_KEEP, off_never_due_on_after_the_interval(), only_old_automatic_backups_are_surplus() (+2 more)

### Community 83 - "rst-infra/src/render/ffmpeg.rs"
Cohesion: 0.16
Nodes (10): EncodeError, Failed, Missing, TimedOut, exit_codes_time_limit_and_a_missing_program(), Ffmpeg, FFMPEG_VAR, LIMIT (+2 more)

### Community 84 - "src/events.rs"
Cohesion: 0.08
Nodes (19): alert(), at_most_fifty_streams_and_places_come_back(), CAPACITY, Channel, Hubs, MAX_STREAMS, messages_reach_every_stream_of_the_streamer(), neo() (+11 more)

### Community 85 - "overlay_key.rs"
Cohesion: 0.12
Nodes (11): created_once_then_the_same(), import_takes_only_valid_keys(), is_key(), keys(), KIND, matches_only_the_current_key(), neo(), OverlayKeys (+3 more)

### Community 86 - "StreamerId"
Cohesion: 0.03
Nodes (16): StoredEntry, FileStore, FileWriter, StoreError, RecordStore, StoredRecord, SessionStore, lock() (+8 more)

### Community 88 - "handlers render.rs"
Cohesion: 0.29
Nodes (15): text(), allowed(), cancel(), done(), encode(), file(), files(), folder() (+7 more)

### Community 89 - "rules.rs"
Cohesion: 0.17
Nodes (18): command(), defaults_without_saved_values(), factions_only_with_variants_and_variant_names_first(), flag(), invalid_values_give_the_defaults(), minime_rules(), MinimeCommands, MinimeRules (+10 more)

### Community 90 - "ServerConfig"
Cohesion: 0.19
Nodes (12): cache_bytes(), ConfigError, Invalid, MasterKey, Missing, lookup(), OAuthApp, ProviderUrls (+4 more)

### Community 91 - "encrypted.rs"
Cohesion: 0.08
Nodes (27): open_block(), aad(), an_unfinished_write_leaves_nothing_behind(), BLOCK, BlockReader, Cache, cache_holds_at_most_its_limit_and_gives_the_same_bytes(), cut_reordered_or_foreign_blocks_fail() (+19 more)

### Community 92 - "theme.ts"
Cohesion: 0.14
Nodes (16): react, screenScenes(), ThemeView, bearsView, kothView, Screen, matrixView, Screen (+8 more)

### Community 93 - "minimes mod.rs"
Cohesion: 0.18
Nodes (16): chat_lines_become_events(), entry(), factions_in_the_file_round_trip_and_old_files_have_none(), is_color(), is_login(), is_variant(), line(), MAX_ROSTER (+8 more)

### Community 94 - "twitch alerts.rs"
Cohesion: 0.23
Nodes (10): Alert, alert(), EVENT_CHEERMOTE, message_text(), number(), sample_alert(), string(), tier() (+2 more)

### Community 95 - "minimeBehavior.ts"
Cohesion: 0.15
Nodes (20): area(), actor(), demoTeams, STAGE, still, Combat, freeSlot(), MinimeSlots (+12 more)

### Community 96 - "hash"
Cohesion: 0.20
Nodes (15): clamp01(), hash(), seedOf(), bannerOptions, matrixClips(), atCut, options, drawFlash() (+7 more)

### Community 97 - "handlers events.rs"
Cohesion: 0.15
Nodes (5): data(), PING, running(), stream(), test_alert()

### Community 98 - "rst-domain/src/triggers/mod.rs"
Cohesion: 0.16
Nodes (22): ActionKind, Media, Text, check(), check_action(), compile(), Compiled, compiled_triggers_match_chat_lines() (+14 more)

### Community 99 - "connection.ts"
Cohesion: 0.10
Nodes (37): splitWords(), channelEmotes(), events(), fanout, fetchCommands(), fetchSettings(), Handlers, loginFromQuery (+29 more)

### Community 100 - "eventLog.ts"
Cohesion: 0.15
Nodes (19): EventFeed(), KINDS, time(), useEventLog(), add(), alertText(), many, one (+11 more)

### Community 101 - "channel alerts.rs"
Cohesion: 0.18
Nodes (9): follow(), frame(), KEEPALIVE_GRACE, listen(), RETRY, session(), silence_beyond_the_keepalive_starts_again_and_subscribes_anew(), subscribes_after_welcome_and_keeps_the_subscriptions_on_reconnect() (+1 more)

### Community 102 - "useMinimes.ts"
Cohesion: 0.22
Nodes (12): earliest(), Fights, MinimeSceneOptions, Scene, Towers, useMinimes(), nextEnd(), CombatSound (+4 more)

### Community 103 - "SceneName"
Cohesion: 0.10
Nodes (16): MinimeVariantInfo, MinimeVariantSet, SceneName, Alerts, .ALL, Brb, Cam, Chat (+8 more)

### Community 104 - "SqliteKeyStore"
Cohesion: 0.06
Nodes (30): AccessSettings<P>, initial_policy_then_the_saved_one(), KEY, login(), changed_data_wrong_owner_or_key_fail(), CryptoError, Decrypt, Encrypt (+22 more)

### Community 105 - "Plan: Theme "Bärenbande""
Cohesion: 0.33
Nodes (7): Acceptance Criteria, Gestaltung, Out of Scope, Package 2: Overlays, Tests (TDD), Umsetzungsschritte, point()

### Community 106 - "errorCodes.ts"
Cohesion: 0.15
Nodes (11): ERROR_CODES, ErrorCode, REQUEST_ERROR_CODES, SETTING_ERROR_CODES, codeArms, handlers, missing, rust (+3 more)

### Community 107 - "ref_node_assert"
Cohesion: 0.09
Nodes (22): arcs(), gradient, [, profile, offline], recorder(), BEAR_CHOICES, BEAR_IDS, minimesCss, clips (+14 more)

### Community 108 - "tsconfig.json"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, jsx, lib, module, moduleResolution, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 109 - "restore.ts"
Cohesion: 0.28
Nodes (13): expect(), setAccess(), backup(), drill(), main(), post(), state(), trigger() (+5 more)

### Community 110 - "package.json"
Cohesion: 0.15
Nodes (14): name, private, type, version, eslint, @eslint/js, eslint-plugin-react-hooks, globals (+6 more)

### Community 111 - "twitch eventsub.rs"
Cohesion: 0.20
Nodes (10): DEFAULT_KEEPALIVE_SECONDS, EventSubError, NoMetadata, NotJson, is_twitch_reconnect_url(), parse(), parse_message(), subscriptions() (+2 more)

### Community 112 - "bears.rs"
Cohesion: 0.09
Nodes (27): ALERTS, BANNER, BEAR_IDS, BEARS, bears(), CAM, capital(), CHAT (+19 more)

### Community 113 - "plantage/stinger.ts"
Cohesion: 0.15
Nodes (17): easeIn(), easeInOut(), atCut, bare, early, first, gradient, options (+9 more)

### Community 114 - "minimeCombat.ts"
Cohesion: 0.28
Nodes (15): tick(), advance(), at(), nextAction(), positionAt(), advanceWithCombat(), begin(), Cast (+7 more)

### Community 115 - "koth/stinger.check.ts"
Cohesion: 0.16
Nodes (12): atCut, before, first, options, plain, second, FLAG, FPS (+4 more)

### Community 116 - "urlaub/stinger.ts"
Cohesion: 0.21
Nodes (11): atCut, first, options, second, crest(), drawPalm(), drawUrlaubStinger(), FPS (+3 more)

### Community 117 - "CODING-RULES.md"
Cohesion: 0.19
Nodes (10): Coding and layout rules, npm run verify, Review checklist, scripts/rules.check.ts rule script, Matrix-Theme, Plan: ein Server, mehrere Streamer, Themes, Einstellungs-Schema, Themes (standard, matrix, urlaub, plantage, koth) (+2 more)

### Community 118 - "package.json"
Cohesion: 0.14
Nodes (14): scripts, build, check, contract, dev, gen:types, lint, prepare (+6 more)

### Community 119 - "rust.ts"
Cohesion: 0.23
Nodes (10): BUILD, exe, home, plain, COMMANDS, findCargo(), GEN_TYPES, main() (+2 more)

### Community 120 - "Clip"
Cohesion: 0.16
Nodes (10): Clip, .ALL, Offline, Profile, Stinger, Finished, GIF_WARN_BYTES, MAX_FRAME_BYTES (+2 more)

### Community 121 - "SceneName"
Cohesion: 0.26
Nodes (6): MediaKind, MinimeVariantInfo, MinimeVariantSet, SceneName, SettingField, Unit

### Community 122 - "export_types.rs"
Cohesion: 0.30
Nodes (9): actual(), differences(), expected(), generated_dir(), generated_files_are_current(), HEADER, KEEP, read_tree() (+1 more)

### Community 123 - "identity/values.rs"
Cohesion: 0.17
Nodes (4): LOGIN_MAX, string_value!, streamer_id_is_hex_of_16_bytes(), USER_ID_MAX

### Community 124 - "Package 3: Stinger und Banner"
Cohesion: 0.29
Nodes (7): Acceptance Criteria, Einstellungen (neue Gruppen), Gestaltung, Kontext, Out of Scope, Package 3: Stinger und Banner, Tests (TDD)

### Community 125 - "MinimeEvent"
Cohesion: 0.18
Nodes (11): MinimeEvent, Ban, Chat, Clear, Color, Join, Kick, Leave (+3 more)

### Community 126 - "standard/stinger.ts"
Cohesion: 0.25
Nodes (8): atCut, options, stripes, drawStandardStinger(), FPS, HEIGHT, StandardStingerOptions, WIDTH

### Community 127 - "README.md"
Cohesion: 0.18
Nodes (11): index.html app entry (/src/main.tsx), Chat-Trigger, Dashboard, Zugang und Funktionsstufen (off/beta/all), Minimes, Overlay-Schluessel (?key=), Overlay-Szenen /s/<login>/<scene>, RST - Rezondes Stream Tools (+3 more)

### Community 128 - "Package 8: Szenen-Korrekturen"
Cohesion: 0.33
Nodes (6): Acceptance Criteria, Gestaltung, Kontext, Out of Scope, Package 8: Szenen-Korrekturen, Tests (TDD)

### Community 129 - "package.json"
Cohesion: 0.17
Nodes (12): devDependencies, eslint, @eslint/js, eslint-plugin-react-hooks, globals, @types/node, @types/react, @types/react-dom (+4 more)

### Community 131 - "RUST-PLAN.md"
Cohesion: 0.19
Nodes (8): Backups, npm run contract, Audit-Log, Vertragstests (Package 4), Fake-Provider Twitch/Spotify (Package 3), Schluessel-Backups (30 days), Package 45: Umstieg (Node server removed), Plan: Rust-Server als einzige Source of Truth

### Community 132 - "plans PLAN-MINIMES.md"
Cohesion: 0.12
Nodes (20): DESIGN.md: Design principles, PLAN-MINIMES.md: Minimes plan, Minimes Package 7: Docs, Annahmen, Plan: Szenen ohne Vererbung, Überblick, Bildsprache: zwei Ebenen, Dashboard-Skin (`data-skin="bears"`) (+12 more)

### Community 133 - "main.rs"
Cohesion: 0.33
Nodes (6): import(), main(), run(), SCHEDULE_EVERY, serve(), USAGE

### Community 134 - "rules.check.ts"
Cohesion: 0.11
Nodes (10): HookInput, input, AUTHORING_TYPES, BAG_NAME_EXCEPTIONS, EM_DASH, failures, files, GENERATED_TYPES (+2 more)

### Community 135 - "media.rs"
Cohesion: 0.15
Nodes (11): MediaName, SANDBOX_CSP, status(), audit(), delete(), deliver(), list(), MEDIA_LIMIT (+3 more)

### Community 136 - "matrix/banners.ts"
Cohesion: 0.53
Nodes (9): blink(), drawOfflineBanner(), drawProfileBanner(), frame(), logo(), rain(), scanlines(), text() (+1 more)

### Community 137 - "matrix/banners.check.ts"
Cohesion: 0.20
Nodes (6): Call, empty, full, options, quiet, values

### Community 138 - "twitch alerts.rs"
Cohesion: 0.18
Nodes (10): AlertKind, .ALL, Cheer, Follow, Gift, Hype, Raid, Redeem (+2 more)

### Community 139 - "Minimes Package 4: Behavior and hook (minimeBehavior, useMinimes)"
Cohesion: 0.12
Nodes (14): Minimes Package 1: Minime rules (parseColor, parseCommand, applyMinime), Minimes Package 2: Scene, feature and settings (readMinimeOptions, hasMinimes), Minimes Package 3: Server runtime (minimes.json, SSE), Minimes Package 4: Behavior and hook (minimeBehavior, useMinimes), Minimes Package 5: Matrix ghost base form, Minimes Package 6: Matrix ghost idle animations, Minime state on server (data/streamers/<login>/minimes.json), Matrix neon ghost minimes (hoodie, glyph jet) (+6 more)

### Community 141 - "SessionToken"
Cohesion: 0.08
Nodes (15): LoginOutcome, AccountChanged, Failed, NotAllowed, Session, a_session_resolves_until_it_expires(), log_out_and_disconnect_end_sessions_at_once(), neo() (+7 more)

### Community 144 - "MasterKeyError"
Cohesion: 0.25
Nodes (4): MasterKeyError, Missing, NotBase64, WrongLength

### Community 145 - "docker-compose.yml"
Cohesion: 0.15
Nodes (14): Docker-Image Workflow, image job (ghcr.io publish), verify job (npm run verify + contract), keys volume (/keys), overlays service, caddy service, overlays public override (no ports, https PUBLIC_URL), tokens volume (/data) (+6 more)

### Community 146 - "Stinger and banners as pure functions of time"
Cohesion: 0.22
Nodes (6): Stinger and banners as pure functions of time, Minime action catalog (name, durationMs, weight), KOTH smoke grenade stinger with flag change, Matrix columns stinger with decrypting logo, Plantage falling mango stinger, Urlaub wave stinger

### Community 147 - "Minimes Package 11: Combat (minimeCombat.ts)"
Cohesion: 0.12
Nodes (21): Minimes Package 11: Combat (minimeCombat.ts), Minimes Package 12: Fixed slots, Minimes Package 8: Hopping in core, KOTH soldier minimes (helmet, faction uniform, role weapon), KOTH Package 1: Theme King of the Hill, Soldier roles (assault, medic, MG, sniper, grenadier), Mango soldier minimes (helmet, role weapon, core hopping), Plantage Package 1: Theme Suedfrucht-Plantage (+13 more)

### Community 148 - "Minime factions (minimeTeams, shownTeam, teamCounts)"
Cohesion: 0.29
Nodes (6): Minimes Package 10: Factions, Minimes Package 9: Remove TS mirror of minime rules, KOTH hill holder display (flag in faction color), KOTH factions BLUFOR, OPFOR, INDFOR, normalizeName (lowercase, umlauts, no spaces/hyphens), Minime factions (minimeTeams, shownTeam, teamCounts)

### Community 149 - "path"
Cohesion: 0.18
Nodes (7): copies_without_shredded_keys_and_deleted_after_thirty_days(), delete_waits_for_a_copy_held_open_by_another_process(), FolderKeyBackups, KEY_BACKUPS_VAR, DELETE_ATTEMPTS, DELETE_PAUSE, remove_patiently()

### Community 150 - "mangos.ts"
Cohesion: 0.27
Nodes (10): Mango(), names, EXPLOSIVE, findRole(), MANGO, Role, ROLE_IDS, ROLE_SET (+2 more)

### Community 151 - "triggers/schedule.rs"
Cohesion: 0.39
Nodes (4): action(), actions_follow_each_other_and_together_joins_the_previous(), DEFAULT_DURATION, schedule()

### Community 152 - "RUST-PLAN.md"
Cohesion: 0.43
Nodes (4): rst-app crate, rst-domain crate, rst-infra crate, rst-server crate (binary rst)

### Community 153 - "icons.ts"
Cohesion: 0.36
Nodes (6): dot(), oval(), Icon, ICON_NAMES, ICONS, paw()

### Community 154 - "master.rs"
Cohesion: 0.19
Nodes (5): accepts_32_bytes_in_base64(), debug_never_shows_the_key(), derived_keys_depend_on_purpose_and_master(), encoded(), MASTER_KEY_VAR

### Community 156 - "runtime.rs"
Cohesion: 0.10
Nodes (18): a_rejected_login_ends_the_runtime_and_deletes_the_tokens(), broken_profile_does_not_block(), chat_lines_fire_triggers_and_the_help_reply_without_its_echo(), id(), login(), panic_is_contained(), profile_with_tokens(), RESTART_PAUSE (+10 more)

### Community 158 - "SoundValue"
Cohesion: 0.18
Nodes (5): SettingValue, SoundValue, MatrixValues, StandardValues, UrlaubValues

### Community 161 - "start"
Cohesion: 0.38
Nodes (6): answer(), neo(), polls_only_with_an_open_overlay_and_pauses_after_429(), renewals_share_one_request_and_late_answers_after_logout_are_dropped(), song(), start()

### Community 163 - "MinimeRules"
Cohesion: 0.20
Nodes (12): allowed_teams(), allowed_variants(), entry(), millis(), Minime, MinimeEntry, prune(), remember() (+4 more)

### Community 164 - "bears/scenes/Minimes.tsx"
Cohesion: 0.05
Nodes (53): MinimeStackScene, shownVariant(), COMBAT_ACTIONS, STACK_ACTIONS, Bear(), BearFigure(), BodyBlob(), FigureProps (+45 more)

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

### Community 172 - "Package 1: Grundlage und Vollbild-Szenen"
Cohesion: 0.29
Nodes (7): Acceptance Criteria, Einstellungen (Schema `settings.ts`, Gruppen dieses Packages), Gestaltung, Out of Scope, Package 1: Grundlage und Vollbild-Szenen, Tests (TDD), Umsetzungsschritte

### Community 173 - "THEMES.md"
Cohesion: 0.67
Nodes (3): Theme folder structure (settings.ts, use<Id>.ts, index.tsx, render.ts, theme.css, scenes), ThemeModule (THEME_MODULES in registry.ts), ThemeView (THEME_VIEWS in scenes.tsx)

### Community 200 - "Plan: Theme "Bärenbande""
Cohesion: 0.67
Nodes (3): Annahmen, Plan: Theme "Bärenbande", Überblick

### Community 202 - "theme.ts"
Cohesion: 0.04
Nodes (81): Acceptance Criteria, Kontext, Out of Scope, Package 1: Szenen und Clips ohne Vererbung, Tests (TDD), Umsetzungsschritte, ThemeValues, ClipName (+73 more)

### Community 212 - "EventSubMessage"
Cohesion: 0.25
Nodes (7): EventSubMessage, Alert, Ignored, Offline, Reconnect, Revocation, Welcome

### Community 216 - "emotes.ts"
Cohesion: 0.21
Nodes (12): bttv(), BttvEmote, BttvUser, EmoteEntry, ffz(), FfzEmote, json(), loadEmotes() (+4 more)

### Community 217 - "Dashboard.tsx"
Cohesion: 0.21
Nodes (12): loadAccount(), Connections(), SpotifyStatus(), Act, Content(), Dashboard(), visible, Me (+4 more)

### Community 218 - "library.rs"
Cohesion: 0.20
Nodes (4): MB, one_upload_per_streamer(), triggers_using(), UploadSlots

### Community 219 - "client.rs"
Cohesion: 0.19
Nodes (4): DEFAULT_RETRY_S, login_url_with_scopes_redirect_and_state(), SpotifyClient, text()

### Community 220 - "IrcMessage"
Cohesion: 0.13
Nodes (16): chat_lines_only_with_the_feature_moderation_always(), lines_become_events_ping_is_answered_and_the_chat_reconnects(), listen(), neo(), relay(), session(), amount(), badge() (+8 more)

### Community 222 - "Package 5: Bärentürme der Minimes"
Cohesion: 0.29
Nodes (7): Acceptance Criteria, Einstellungen (neue Gruppen), Gestaltung, Kontext, Out of Scope, Package 5: Bärentürme der Minimes, Tests (TDD)

### Community 224 - "Package 9: Welt-Modell"
Cohesion: 0.29
Nodes (7): Acceptance Criteria, Einstellungen, Gestaltung, Kontext, Out of Scope, Package 9: Welt-Modell, Tests (TDD)

### Community 226 - "Package 10: Stinger mit Vorhang"
Cohesion: 0.29
Nodes (7): Acceptance Criteria, Einstellungen (Gruppe "Stinger"), Gestaltung, Kontext, Out of Scope, Package 10: Stinger mit Vorhang, Tests (TDD)

### Community 227 - "FxAction"
Cohesion: 0.33
Nodes (6): FxPosition, Named, Point, NamedPosition, Center, Random

### Community 229 - "RenderJobs"
Cohesion: 0.21
Nodes (8): encoding_answers_busy_until_done(), Job, RenderError, Busy, Limit, NotStarted, TooLarge, RenderJobs

### Community 231 - "themes/audit.rs"
Cohesion: 0.13
Nodes (8): audit(), built_in_themes_pass(), FX_KEYS, personalize(), reports_every_kind_of_problem(), values_object(), info_fields(), INFO_GROUP

### Community 235 - "Package 6: Rig-Modell der Bären"
Cohesion: 0.29
Nodes (7): Acceptance Criteria, Einstellungen, Gestaltung, Kontext, Out of Scope, Package 6: Rig-Modell der Bären, Tests (TDD)

### Community 239 - "Command"
Cohesion: 0.25
Nodes (6): Command, Import, Serve, Usage, Version, parse()

### Community 243 - "help.rs"
Cohesion: 0.19
Nodes (7): a_missing_scope_is_remembered_and_the_config_can_change(), help(), HelpResponder, line(), lock(), replies_once_per_cooldown_and_ignores_its_echo(), ChatLine

### Community 244 - "Format"
Cohesion: 0.36
Nodes (6): Format, Gif, Webm, ffmpeg_args(), gif_with_own_palette_and_endless_loop(), webm_with_alpha()

### Community 246 - "koth/scenes/Minimes.tsx"
Cohesion: 0.12
Nodes (24): MinimeCombatScene, actorRun(), actorStyle(), MinimeAction, MinimeActor, actor, plan, hopPlan() (+16 more)

### Community 247 - "pathbuf"
Cohesion: 0.22
Nodes (5): percent_decode(), resolve(), StaticError, BadEncoding, Forbidden

## Ambiguous Edges - Review These
- `Non-media fixture file in import test data` → `rst import (Package 24)`  [AMBIGUOUS]
  server-rs/crates/rst-app/tests/fixtures/data/streamers/neo/media/notes.txt · relation: conceptually_related_to

## Knowledge Gaps
- **207 isolated node(s):** `@types/node`, `@types/react`, `@types/react-dom`, `eslint`, `typescript` (+202 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1538 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **38 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `scripts` connect `package.json` to `package.json`?**
  _High betweenness centrality (0.313) - this node is a cross-community bridge._
- **What connects `@types/node`, `@types/react`, `@types/react-dom` to the rest of the system?**
  _207 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `session.rs` be split into smaller, more focused modules?**
  _Cohesion score 0.14166666666666666 - nodes in this community are weakly interconnected._
- **Why does `check` connect `package.json` to `archive.rs`?**
  _High betweenness centrality (0.312) - this node is a cross-community bridge._
- **Should `super` be split into smaller, more focused modules?**
  _Cohesion score 0.055166217430368376 - nodes in this community are weakly interconnected._
- **Why does `react` connect `theme.ts` to `fillTemplate`, `matrix/scenes/Music.tsx`, `types.ts`, `koth/scenes/Screen.tsx`, `plantage/scenes/Alerts.tsx`, `hill.ts`, `bears/scenes/Alerts.tsx`, `Urlaub Beach Shapes`, `texts.de.ts`, `Effects Overlay`, `bears/scenes/Minimes.tsx`, `Admin.tsx`, `dashboard obsSetup.ts`, `ThemeSettings.tsx`, `useMatrix`, `World.tsx`, `Triggers.tsx`, `theme.ts`, `koth/scenes/Minimes.tsx`, `SettingInput.tsx`, `Dashboard.tsx`, `connection.ts`, `eventLog.ts`, `useMinimes.ts`, `package.json`, `koth/scenes/Minimes.tsx`?**
  _High betweenness centrality (0.298) - this node is a cross-community bridge._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Non-media fixture file in import test data` and `rst import (Package 24)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._