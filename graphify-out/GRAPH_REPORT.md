# Graph Report - RezondesStream  (2026-10-21)

## Corpus Check
- 610 files · ~363,047 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 29 file(s) not represented in the graph (top: .css 19, (none) 6, .toml 2)

## Summary
- 5609 nodes · 15348 edges · 229 communities (189 shown, 40 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 610 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3bd585e5`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- open_data_db
- archive.rs
- strokes.ts
- react
- minimeFields.ts
- fillTemplate
- react
- playSound
- types.ts
- minimeFields.ts
- Login
- .replace
- Rust Setting Field Builders
- hash
- rst-domain/src/triggers/mod.rs
- Backup Schedule
- Rust Minime Combat Fields
- DataKey
- ProviderError
- audit/mod.rs
- monsters.ts
- vault.rs
- koth/scenes/Minimes.tsx
- channel/triggers.rs
- KOTH Rust Schema
- Rust Minime Variants
- Rust Minime Rules and ASCII
- bears/scenes/Alerts.tsx
- validate.rs
- pattern.rs
- Urlaub Beach Shapes
- app.rs
- auth.rs
- rst-domain/src/commands/mod.rs
- Effects Overlay
- restore.rs
- fakeProviders.ts
- server_error
- StreamerId
- request
- paint.ts
- bears/banners.ts
- Runtime Registry
- roster.rs
- Minime Chat Commands
- minimes.rs
- rst-server routes.rs
- koth/render.ts
- ProviderError
- themes standard.rs
- super
- dashboard obsSetup.ts
- ThemeSettings.tsx
- themes minime_fields.rs
- rig.ts
- fillTemplate
- import/mod.rs
- ref_node_assert
- rig.check.ts
- irc.rs
- music/mod.rs
- bears/stinger.ts
- Triggers.tsx
- media/values.rs
- StreamerId
- rst-domain/src/access/mod.rs
- validate.rs
- chat/events.rs
- rst-domain/src/spotify/mod.rs
- World.tsx
- identity/oauth.rs
- cooldowns.rs
- BackupStore
- Admin.tsx
- paths.rs
- App
- standard/render.ts
- KeyStore
- SettingInput.tsx
- Theme
- Dashboard.tsx
- plantage/banners.ts
- RecordStore
- rst-infra/src/render/ffmpeg.rs
- src/events.rs
- chance
- rst-app/src/settings/mod.rs
- ports socket.rs
- config.rs
- rules.rs
- ZipBackups
- encrypted.rs
- Plan: Theme-Einstellungen neu gestalten (Einfach und Erweitert)
- minimes mod.rs
- twitch alerts.rs
- chat.rs
- streamerPath.ts
- handlers events.rs
- commands.ts
- master.rs
- generatedValues.check.ts
- channel alerts.rs
- run.ts
- Backups
- duration
- Plan: Theme "Bärenbande"
- client.ts
- sceneNames
- tsconfig.json
- chaos.rs
- package.json
- twitch eventsub.rs
- bears.rs
- Render.tsx
- handlers/backups.rs
- swathes.ts
- CODING-RULES.md
- package.json
- beachThings.ts
- identity/sessions.rs
- themes/audit.rs
- export_types.rs
- token_keeper.rs
- useMinimes.ts
- render.rs
- rules.check.ts
- RST - Rezondes Stream Tools
- backup/schedule.rs
- package.json
- ServerConfig
- RUST-PLAN.md
- plans PLAN-MINIMES.md
- main.rs
- Plan: Theme "Chaos"
- media.rs
- restore.ts
- scribbles.ts
- twitch alerts.rs
- Minimes Package 2: Scene, feature and settings (readMinimeOptions, hasMinimes)
- rust.ts
- hill.ts
- minimes roster.rs
- public_commands
- MinimeRules
- theme_values.rs
- Stinger and banners as pure functions of time
- Minimes Package 11: Combat (minimeCombat.ts)
- twitch/oauth.rs
- bears/scenes/Minimes.tsx
- deserialize
- triggers/schedule.rs
- RUST-PLAN.md
- Neues Theme planen
- EventSubMessage
- render clips.rs
- runtime.rs
- DESIGN.md
- Package 3: Stinger und Banner
- chaos/paint.check.ts
- .complete
- Feature
- IrcMessage
- scripts migrate.sh
- tests dependencies.rs
- vite.config.ts
- package.json
- rst-app Cargo.toml
- DESIGN.md
- session.rs
- THEMES.md
- DESIGN.md
- media lizard.gif
- docs DESIGN-STANDARD.md
- texts.de.ts
- plantage/stinger.ts
- .change
- AuditStore
- MinimeEvent
- Login
- Bear.tsx
- Plan: Theme "Bärenbande"
- urlaub/render.ts
- Part
- static_files.rs
- chaos/scenes/Minimes.tsx
- icons.ts
- Command
- FxAction
- emotes.ts
- library.rs
- FeatureLevel
- RenderJobs
- Format
- matrix/banners.ts
- jobs.rs
- clamp01
- Registration
- RenderError
- Clip

## God Nodes (most connected - your core abstractions)
1. `StreamerId` - 266 edges
2. `StoreError` - 185 edges
3. `VaultError` - 105 edges
4. `react` - 81 edges
5. `Login` - 76 edges
6. `ProviderError` - 71 edges
7. `App` - 62 edges
8. `fillTemplate()` - 57 edges
9. `server_error()` - 54 edges
10. `DataKey` - 52 edges

## Surprising Connections (you probably didn't know these)
- `Annahmen` --references--> `ThemeView`  [INFERRED]
  plans/PLAN-SCENES.md → src/core/theme.ts
- `Tests (TDD)` --references--> `basic()`  [INFERRED]
  plans/PLAN-SETTINGS.md → src/core/fields.ts
- `Annahmen` --references--> `groupsForView()`  [INFERRED]
  plans/PLAN-SETTINGS.md → src/dashboard/settingsForm.ts
- `Umsetzungsschritte` --references--> `FieldBase`  [INFERRED]
  plans/PLAN-SETTINGS.md → src/core/theme.ts
- `Acceptance Criteria` --references--> `clipsFor()`  [INFERRED]
  plans/PLAN-SCENES.md → src/themes/renderers.ts

## Import Cycles
- 1-file cycle: `server-rs/crates/rst-domain/src/identity/values.rs -> server-rs/crates/rst-domain/src/identity/values.rs`
- 1-file cycle: `server-rs/crates/rst-domain/src/triggers/pattern.rs -> server-rs/crates/rst-domain/src/triggers/pattern.rs`
- 2-file cycle: `server-rs/crates/rst-server/src/app.rs -> server-rs/crates/rst-server/src/handlers/mod.rs -> server-rs/crates/rst-server/src/app.rs`
- 2-file cycle: `server-rs/crates/rst-infra/src/backup/archive.rs -> server-rs/crates/rst-infra/src/backup/restore.rs -> server-rs/crates/rst-infra/src/backup/archive.rs`
- 2-file cycle: `server-rs/crates/rst-domain/src/themes/matrix.rs -> server-rs/crates/rst-domain/src/themes/registry.rs -> server-rs/crates/rst-domain/src/themes/matrix.rs`
- 2-file cycle: `server-rs/crates/rst-domain/src/themes/plantage.rs -> server-rs/crates/rst-domain/src/themes/registry.rs -> server-rs/crates/rst-domain/src/themes/plantage.rs`
- 2-file cycle: `server-rs/crates/rst-domain/src/themes/chaos.rs -> server-rs/crates/rst-domain/src/themes/registry.rs -> server-rs/crates/rst-domain/src/themes/chaos.rs`
- 2-file cycle: `server-rs/crates/rst-domain/src/themes/koth.rs -> server-rs/crates/rst-domain/src/themes/registry.rs -> server-rs/crates/rst-domain/src/themes/koth.rs`
- 2-file cycle: `server-rs/crates/rst-domain/src/themes/registry.rs -> server-rs/crates/rst-domain/src/themes/standard.rs -> server-rs/crates/rst-domain/src/themes/registry.rs`
- 2-file cycle: `server-rs/crates/rst-domain/src/themes/registry.rs -> server-rs/crates/rst-domain/src/themes/urlaub.rs -> server-rs/crates/rst-domain/src/themes/registry.rs`
- 3-file cycle: `server-rs/crates/rst-domain/src/themes/fixture.rs -> server-rs/crates/rst-domain/src/themes/registry.rs -> server-rs/crates/rst-domain/src/themes/matrix.rs -> server-rs/crates/rst-domain/src/themes/fixture.rs`
- 3-file cycle: `server-rs/crates/rst-domain/src/themes/fixture.rs -> server-rs/crates/rst-domain/src/themes/registry.rs -> server-rs/crates/rst-domain/src/themes/plantage.rs -> server-rs/crates/rst-domain/src/themes/fixture.rs`
- 3-file cycle: `server-rs/crates/rst-domain/src/themes/chaos.rs -> server-rs/crates/rst-domain/src/themes/fixture.rs -> server-rs/crates/rst-domain/src/themes/registry.rs -> server-rs/crates/rst-domain/src/themes/chaos.rs`
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

## Communities (229 total, 40 thin omitted)

### Community 0 - "open_data_db"
Cohesion: 0.08
Nodes (15): ServerSettingsStore, DATA_DB_VAR, migrations_twice(), open_data_db(), pragmas(), put_replaces_and_get_reads(), SqliteServerSettings, audit_appends_and_lists_newest_first() (+7 more)

### Community 1 - "archive.rs"
Cohesion: 0.09
Nodes (13): ARCHIVE_FORMAT, BACKUPS_VAR, bytes(), copy_hashed(), EXTENSION, number(), PARTIAL, Table (+5 more)

### Community 2 - "strokes.ts"
Cohesion: 0.15
Nodes (18): paintSpray(), Props, SprayTitle(), Bristle, drips, spray, stroke, two (+10 more)

### Community 3 - "react"
Cohesion: 0.07
Nodes (48): react, ThemeValues, countdownEnd(), countdown(), rotating(), ScreenKind, shortClock(), stageScale() (+40 more)

### Community 4 - "minimeFields.ts"
Cohesion: 0.04
Nodes (116): alertSoundFields(), asciiText(), GLYPHS, BADGE_KEYS, badgeFields(), labels, KEYS, asciiArt() (+108 more)

### Community 5 - "fillTemplate"
Cohesion: 0.07
Nodes (51): ALERT_SOUND_KEYS, alertQuote(), alertTextKeys, alertVars(), KINDS, sounds, values, describeAlert() (+43 more)

### Community 6 - "react"
Cohesion: 0.14
Nodes (21): useNow(), Marquee(), Props, song, marqueeSeconds(), MusicState, nowPlaying(), trackClock() (+13 more)

### Community 7 - "playSound"
Cohesion: 0.12
Nodes (25): mediaUrl(), numberParam(), beep(), playSound(), climbTone(), MELODY, NOTE, playChime() (+17 more)

### Community 8 - "types.ts"
Cohesion: 0.06
Nodes (56): badgeLabel(), MessageParts(), cat, extra, kappa, splitEmotes(), splitWords(), channelEmotes() (+48 more)

### Community 9 - "minimeFields.ts"
Cohesion: 0.05
Nodes (68): key(), defaults, probe, probeSet, COMBAT_SOUNDS, command(), hasMinimes(), MINIME_BASE_FIELDS (+60 more)

### Community 10 - "Login"
Cohesion: 0.08
Nodes (17): a_rename_keeps_the_profile(), id(), list_leaves_out_shredded_streamers(), login(), PROFILE_KIND, register_and_find(), RegisterError, AccountChanged (+9 more)

### Community 11 - ".replace"
Cohesion: 0.39
Nodes (3): AccessSettings<P>, initial_policy_then_the_saved_one(), login()

### Community 12 - "Rust Setting Field Builders"
Cohesion: 0.07
Nodes (51): ascii_art(), ascii_art_is_a_textarea_with_generator_flag(), basic(), basic_is_written_only_when_set(), basic_only_adds_the_flag(), choice(), color(), field() (+43 more)

### Community 13 - "hash"
Cohesion: 0.10
Nodes (40): streamer, hash(), Blob, blobs(), shapes, star, circle(), Cloud() (+32 more)

### Community 14 - "rst-domain/src/triggers/mod.rs"
Cohesion: 0.16
Nodes (22): ActionKind, Media, Text, check(), check_action(), compile(), Compiled, compiled_triggers_match_chat_lines() (+14 more)

### Community 15 - "Backup Schedule"
Cohesion: 0.10
Nodes (16): BackupError, Busy, Invalid, NotFound, Store, backups(), Backups<B, A, K>, entry() (+8 more)

### Community 16 - "Rust Minime Combat Fields"
Cohesion: 0.07
Nodes (42): combat(), combat_fields_are_opt_in_without_medic_durations(), minime_aim_key(), minime_combat_fields(), minime_fire_key(), alerts(), ALERTS, BANNER (+34 more)

### Community 17 - "DataKey"
Cohesion: 0.05
Nodes (39): AccessAdmin, AuditRow, login(), raw(), revoked_access_ends_every_session_and_is_audited(), saving_at_once_never_mixes_two_changes(), streamer_rows(), World (+31 more)

### Community 18 - "ProviderError"
Cohesion: 0.10
Nodes (14): FakeSpotify, Playing, Answer, Limited, Nothing, Unauthorized, SpotifyApi, TokenAnswer (+6 more)

### Community 19 - "audit/mod.rs"
Cohesion: 0.28
Nodes (8): aad(), AuditEntry, AuditLog<A, K>, entries_are_ciphertext_and_unreadable_after_shred(), entries_per_streamer_and_server_newest_first(), entry(), log(), neo()

### Community 20 - "monsters.ts"
Cohesion: 0.17
Nodes (28): between(), BodyKind, logins, splat, GROUND, leg(), Monster, monsterOf() (+20 more)

### Community 21 - "vault.rs"
Cohesion: 0.19
Nodes (7): aad(), moved_blocks_and_shredded_keys_are_unreadable(), neo(), round_trip_and_ciphertext_only_in_the_store(), vault(), Vault<S, K>, Store

### Community 22 - "koth/scenes/Minimes.tsx"
Cohesion: 0.06
Nodes (52): DEMO_FIRST_LOGIN, MinimeCombatScene, actorRun(), actorStyle(), MinimeActor, shownRole(), MEDIC, actor (+44 more)

### Community 23 - "channel/triggers.rs"
Cohesion: 0.18
Nodes (8): compiled(), fire_ignores_the_cooldown_and_replace_takes_effect(), line(), lock(), matching_lines_fire_in_the_planned_order_with_cooldowns(), neo(), rules(), TriggerRunner

### Community 24 - "KOTH Rust Schema"
Cohesion: 0.08
Nodes (39): alerts(), ALERTS, BANNER, BASIC, CAM, capital(), CHAT, chat_cam_music_fx() (+31 more)

### Community 25 - "Rust Minime Variants"
Cohesion: 0.08
Nodes (26): ALERTS, BANNER, BASIC, BEACH, BEACH_THINGS, CAM, capital(), CHAT (+18 more)

### Community 26 - "Rust Minime Rules and ASCII"
Cohesion: 0.07
Nodes (27): ascii_text(), ROWS, alert_sound_fields(), badge_fields(), badge_texts_default_to_the_abbreviation(), one_sound_per_alert_kind_and_fade_out(), ALERTS, BANNER (+19 more)

### Community 27 - "bears/scenes/Alerts.tsx"
Cohesion: 0.08
Nodes (45): fetchCommands(), demoCommands(), useCommands(), useThemeValues(), useInfoPage(), describeCommands(), InfoValues, channelNames() (+37 more)

### Community 28 - "validate.rs"
Cohesion: 0.14
Nodes (26): broken_unknown_and_renamed_files(), current_id(), default_theme(), first_login_personalizes_every_theme(), first_settings(), minime_rules_from_the_chosen_theme(), minime_rules_of(), OLD_DEFAULTS (+18 more)

### Community 29 - "pattern.rs"
Cohesion: 0.10
Nodes (16): linear(), MAX_PATTERN, Pattern, pattern(), PatternError, Invalid, TooLong, Unsupported (+8 more)

### Community 30 - "Urlaub Beach Shapes"
Cohesion: 0.10
Nodes (40): Beach(), shapes, star, circle(), CLOUD, GULL, ICON_NAMES, IconName (+32 more)

### Community 31 - "app.rs"
Cohesion: 0.06
Nodes (18): app(), call(), dispatch(), FRAME_CSP, headers(), maintenance_leaves_only_the_dashboard_and_the_admin_area(), origin_and_routes(), PENDING_LOGINS (+10 more)

### Community 32 - "auth.rs"
Cohesion: 0.14
Nodes (20): to_hex(), cookie(), oauth_state_cookie(), session_cookie(), now_ms(), redirect(), callback(), cookies() (+12 more)

### Community 33 - "rst-domain/src/commands/mod.rs"
Cohesion: 0.07
Nodes (39): a_missing_scope_is_remembered_and_the_config_can_change(), help(), HelpResponder, line(), lock(), replies_once_per_cooldown_and_ignores_its_echo(), ChatLine, command_list() (+31 more)

### Community 34 - "Effects Overlay"
Cohesion: 0.14
Nodes (30): FX_KEYS, fxDefaults(), FxSettings, useFxItem(), useFxScene(), FxMedia(), ShownFx, useFx() (+22 more)

### Community 35 - "restore.rs"
Cohesion: 0.13
Nodes (27): ArchiveError, Invalid, NotFound, Store, allowed_name(), bytes(), check(), Checked (+19 more)

### Community 36 - "fakeProviders.ts"
Cohesion: 0.15
Nodes (21): bearer(), Answer, connect(), masked, nextMessage(), control(), frame(), helix() (+13 more)

### Community 37 - "server_error"
Cohesion: 0.12
Nodes (21): json(), access(), ACCESS_LIMIT, audit(), AUDIT_LIMIT, delete_streamer(), save_access(), streamers() (+13 more)

### Community 38 - "StreamerId"
Cohesion: 0.04
Nodes (17): FileStore, FileWriter, StoreError, SessionStore, StreamerRepository, StreamerRow, lock(), MemoryFiles (+9 more)

### Community 39 - "request"
Cohesion: 0.16
Nodes (24): ACCOUNT_CASES, ALERT_CASES, Subscription, BACKUP_CASES, Listing, CHAT_CASES, chatLine(), DATA_CASES (+16 more)

### Community 40 - "paint.ts"
Cohesion: 0.11
Nodes (28): BearsValues, BodyShape, PartKind, BearColors, cache, feet, gradient, palette (+20 more)

### Community 41 - "bears/banners.ts"
Cohesion: 0.18
Nodes (17): ASLEEP, AWAKE, BearsBannerOptions, card(), drawBearsOfflineBanner(), drawBearsProfileBanner(), EVENING, fairyLights() (+9 more)

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
Cohesion: 0.10
Nodes (25): Call, handle(), all_on(), authorize(), find(), Found, MethodNotAllowed, Route (+17 more)

### Community 47 - "koth/render.ts"
Cohesion: 0.10
Nodes (23): battlefield(), centered(), gradient, options, drawKothOfflineBanner(), drawKothProfileBanner(), KothBannerOptions, PEAKS (+15 more)

### Community 48 - "ProviderError"
Cohesion: 0.08
Nodes (12): FakeTwitch, FakeTwitch, StreamerDeletion<'_, R, S, K, P, F, A>, the_streamer_is_gone_with_sessions_key_rows_and_files(), ChatSender, EventSubscriber, Said, MissingScope (+4 more)

### Community 49 - "themes standard.rs"
Cohesion: 0.10
Nodes (24): alerts(), ALERTS, BANNER, BASIC, CAM, CHAT, chat_cam_music(), FONTS (+16 more)

### Community 50 - "super"
Cohesion: 0.08
Nodes (11): EVERY_MS, KeyBackupStore, MemoryKeyBackups, one_copy_a_day_and_none_older_than_thirty_days(), RETENTION_MS, run_key_backups(), same_input_same_digest_and_purposes_apart(), copies_without_shredded_keys_and_deleted_after_thirty_days() (+3 more)

### Community 51 - "dashboard obsSetup.ts"
Cohesion: 0.12
Nodes (25): OBS_SCENES, importViaWebSocket(), ObsError, ObsImport(), ObsMessage, browserSettings(), collection, layout (+17 more)

### Community 52 - "ThemeSettings.tsx"
Cohesion: 0.06
Nodes (60): Acceptance Criteria, Kontext, Out of Scope, Package 2: Neues Layout der Theme-Seite, Tests (TDD), Umsetzungsschritte, Umsetzungsschritte, ScenePreview() (+52 more)

### Community 53 - "themes minime_fields.rs"
Cohesion: 0.10
Nodes (35): bears(), color_themes_get_base_and_color_fields(), COMBAT_SOUNDS, default_of(), feature_fields_match_the_typescript_fixture(), MEDIC, minime_base_fields(), minime_color_fields() (+27 more)

### Community 54 - "rig.ts"
Cohesion: 0.05
Nodes (66): BEAR_CHOICES, BearChoice, BEARS, minimesCss, CUP_FAR, CUP_NEAR, dot(), FOUR_BACK_LINE (+58 more)

### Community 55 - "fillTemplate"
Cohesion: 0.07
Nodes (42): emoji, standard, glyph(), GLYPHS, useDecode(), TerminalTiming, useTerminal(), decodeFrame() (+34 more)

### Community 56 - "import/mod.rs"
Cohesion: 0.13
Nodes (20): broken_files(), fixture(), fixture_roundtrip(), id_of(), idempotent(), importer(), Importer<R, S, K, F, P>, ImportReport (+12 more)

### Community 57 - "ref_node_assert"
Cohesion: 0.03
Nodes (74): figlet, features, standard, FEATURES_FILE, featuresText(), FIXTURES, fixtureText(), main() (+66 more)

### Community 58 - "rig.check.ts"
Cohesion: 0.09
Nodes (22): CLOSED_MOUTH, EAR_CENTERS, OPEN_MOUTH, Acceptance Criteria, Einstellungen, Gestaltung, Kontext, Out of Scope (+14 more)

### Community 59 - "irc.rs"
Cohesion: 0.18
Nodes (12): emote_positions(), emote_ranges(), EmoteRange, garbage_never_panics(), IRC_URL, parse_irc(), parses_tags_prefix_command_and_trailing(), split_word() (+4 more)

### Community 60 - "music/mod.rs"
Cohesion: 0.10
Nodes (14): answer(), DEFAULT_LIFETIME_S, neo(), NOW, now(), Player, polls_only_with_an_open_overlay_and_pauses_after_429(), RENEW_EARLY_MS (+6 more)

### Community 61 - "bears/stinger.ts"
Cohesion: 0.11
Nodes (29): isBearChoice(), drawTower(), Palette, pawX(), bearsClips(), paletteOf(), worldOf(), BearsStingerOptions (+21 more)

### Community 62 - "Triggers.tsx"
Cohesion: 0.10
Nodes (28): deleteMedia(), loadMedia(), uploadMedia(), Media(), megabytes(), Preview(), ActionRow(), ActionTiming() (+20 more)

### Community 63 - "media/values.rs"
Cohesion: 0.10
Nodes (6): InvalidValue, string_value!, is_word(), MEDIA_EXTENSIONS, MEDIA_STEM_MAX, OutputName

### Community 64 - "StreamerId"
Cohesion: 0.04
Nodes (45): is_key(), OverlayKeys<S, K>, vault_only(), library(), MediaEntry, MediaLibrary<S, K, F>, MediaOverview, neo() (+37 more)

### Community 65 - "rst-domain/src/access/mod.rs"
Cohesion: 0.30
Nodes (13): admins(), allowlist_only_admins_and_listed_logins(), beta_policy(), initial_policy_allows_the_admins_and_everything(), levels_all_beta_off(), login(), logins(), open_registration_lets_everyone_in() (+5 more)

### Community 66 - "validate.rs"
Cohesion: 0.11
Nodes (31): check_lines(), check_media(), check_sound(), check_text(), check_value(), codes(), defaults_of_all_building_blocks_pass(), extensions() (+23 more)

### Community 67 - "chat/events.rs"
Cohesion: 0.13
Nodes (18): ACTION_END, ACTION_START, alert(), CHAT_CHEERMOTE, chat_with_badges_and_emotes(), ChatMessage, ChatRemoval, events() (+10 more)

### Community 68 - "rst-domain/src/spotify/mod.rs"
Cohesion: 0.18
Nodes (18): callback_has_session(), changed(), changes_worth_sending(), millis(), only_complete_tokens_with_expiry(), origin(), POLL_MS, progress_moves_only_while_playing() (+10 more)

### Community 69 - "World.tsx"
Cohesion: 0.10
Nodes (28): alongGround(), Block, blockBase(), BRIDGE, bridgeShapes(), bridge, cells, CITY (+20 more)

### Community 70 - "identity/oauth.rs"
Cohesion: 0.20
Nodes (7): a_state_returns_its_value_once_and_expires(), above_the_limit_the_oldest_drop_out(), LoginStates, LoginStates<V>, NOW, Pending, same_browser()

### Community 71 - "cooldowns.rs"
Cohesion: 0.22
Nodes (3): Cooldowns, millis(), PRUNE_EVERY_MS

### Community 73 - "Admin.tsx"
Cohesion: 0.08
Nodes (45): isErrorCode(), accessLosses, losses, next, saved, hasLosses(), removed(), AccessDraft (+37 more)

### Community 74 - "paths.rs"
Cohesion: 0.12
Nodes (13): encoded_slash_stays_one_part_and_is_no_media_name(), is_scene_file(), OverlayRoute, Commands, Events, Media, Scene, Settings (+5 more)

### Community 75 - "App"
Cohesion: 0.08
Nodes (4): App, UploadSlot, serve(), streamer()

### Community 76 - "standard/render.ts"
Cohesion: 0.17
Nodes (17): bar(), base(), blob(), options, drawStandardOfflineBanner(), drawStandardProfileBanner(), StandardBannerOptions, write() (+9 more)

### Community 77 - "KeyStore"
Cohesion: 0.06
Nodes (29): KEY, changed_data_wrong_owner_or_key_fail(), CryptoError, Decrypt, Encrypt, Random, KEY, NONCE_LEN (+21 more)

### Community 78 - "SettingInput.tsx"
Cohesion: 0.17
Nodes (16): MEDIA_KIND, AsciiGenerator(), ASCII_FONTS, AsciiFont, asciiLogo(), FONTS, AsciiGenerator, asText() (+8 more)

### Community 79 - "Theme"
Cohesion: 0.11
Nodes (21): export_all(), export_config(), built_in_themes_pass(), assert_same_as_fixture(), assert_same_fields(), normalize(), SAMPLE_LOGINS, samples() (+13 more)

### Community 80 - "Dashboard.tsx"
Cohesion: 0.12
Nodes (22): Account, loadAccount(), post(), Connections(), SpotifyStatus(), Act, Content(), Dashboard() (+14 more)

### Community 81 - "plantage/banners.ts"
Cohesion: 0.15
Nodes (17): centered(), gradient, options, crateSign(), CROWN, disc(), drawPlantageOfflineBanner(), drawPlantageProfileBanner() (+9 more)

### Community 82 - "RecordStore"
Cohesion: 0.12
Nodes (6): RecordStore, StoredRecord, SqliteRecords, contract_tests!, sqlite(), streamer()

### Community 83 - "rst-infra/src/render/ffmpeg.rs"
Cohesion: 0.16
Nodes (10): EncodeError, Failed, Missing, TimedOut, exit_codes_time_limit_and_a_missing_program(), Ffmpeg, FFMPEG_VAR, LIMIT (+2 more)

### Community 84 - "src/events.rs"
Cohesion: 0.09
Nodes (19): alert(), at_most_fifty_streams_and_places_come_back(), CAPACITY, Channel, Hubs, MAX_STREAMS, messages_reach_every_stream_of_the_streamer(), neo() (+11 more)

### Community 85 - "chance"
Cohesion: 0.13
Nodes (38): Backdrop(), Filters(), FREE, LAYER, Mark(), Props, bannerWall(), makeChaosOfflineBanner() (+30 more)

### Community 86 - "rst-app/src/settings/mod.rs"
Cohesion: 0.14
Nodes (8): neo(), save_checks_chooses_and_audits(), SaveError, Invalid, Vault, SettingsService, SettingsService<'_, S, K, A>, world()

### Community 87 - "ports socket.rs"
Cohesion: 0.14
Nodes (4): SocketConnector, TextSocket, WebSockets, WebSocketText

### Community 88 - "config.rs"
Cohesion: 0.12
Nodes (7): DATA_DIR_VAR, DEFAULT_BACKUP_UPLOAD_MB, DEFAULT_DATA_DIR, DEFAULT_MEDIA_MB, DEFAULT_PORT, FILES_VAR, KEY

### Community 89 - "rules.rs"
Cohesion: 0.17
Nodes (18): command(), defaults_without_saved_values(), factions_only_with_variants_and_variant_names_first(), flag(), invalid_values_give_the_defaults(), minime_rules(), MinimeCommands, MinimeRules (+10 more)

### Community 90 - "ZipBackups"
Cohesion: 0.20
Nodes (10): is_backup_id(), archive_with_all_rows_and_files_matching_checksums_and_no_plaintext(), count(), entries(), filled(), forged(), parse_id(), restore_brings_back_the_state_and_skips_streamers_without_a_key() (+2 more)

### Community 91 - "encrypted.rs"
Cohesion: 0.09
Nodes (26): aad(), an_unfinished_write_leaves_nothing_behind(), BLOCK, BlockReader, Cache, cache_holds_at_most_its_limit_and_gives_the_same_bytes(), cut_reordered_or_foreign_blocks_fail(), DEFAULT_CACHE_MB (+18 more)

### Community 92 - "Plan: Theme-Einstellungen neu gestalten (Einfach und Erweitert)"
Cohesion: 0.09
Nodes (22): Acceptance Criteria, Acceptance Criteria, Acceptance Criteria, Annahmen, Ausgangslage, Kontext, Kontext, Kontext (+14 more)

### Community 93 - "minimes mod.rs"
Cohesion: 0.18
Nodes (16): chat_lines_become_events(), entry(), factions_in_the_file_round_trip_and_old_files_have_none(), is_color(), is_login(), is_variant(), line(), MAX_ROSTER (+8 more)

### Community 94 - "twitch alerts.rs"
Cohesion: 0.23
Nodes (10): Alert, alert(), EVENT_CHEERMOTE, message_text(), number(), sample_alert(), string(), tier() (+2 more)

### Community 95 - "chat.rs"
Cohesion: 0.17
Nodes (9): chat_lines_only_with_the_feature_moderation_always(), lines_become_events_ping_is_answered_and_the_chat_reconnects(), listen(), neo(), NEXT_ID, RECONNECT, relay(), session() (+1 more)

### Community 96 - "streamerPath.ts"
Cohesion: 0.39
Nodes (7): base(), traversal, decodeAll(), isLogin(), isMediaName(), parse(), StreamerPath

### Community 97 - "handlers events.rs"
Cohesion: 0.16
Nodes (5): data(), PING, running(), stream(), test_alert()

### Community 98 - "commands.ts"
Cohesion: 0.11
Nodes (21): army, HELP, list, roles, teams, TRIGGERS, CommandItem, commandList (+13 more)

### Community 99 - "master.rs"
Cohesion: 0.17
Nodes (9): accepts_32_bytes_in_base64(), debug_never_shows_the_key(), derived_keys_depend_on_purpose_and_master(), encoded(), MASTER_KEY_VAR, MasterKeyError, Missing, NotBase64 (+1 more)

### Community 100 - "generatedValues.check.ts"
Cohesion: 0.10
Nodes (7): MediaKind, SettingField, SoundValue, ChaosValues, KothValues, UrlaubValues, Unit

### Community 101 - "channel alerts.rs"
Cohesion: 0.18
Nodes (9): follow(), frame(), KEEPALIVE_GRACE, listen(), RETRY, session(), silence_beyond_the_keepalive_starts_again_and_subscribes_anew(), subscribes_after_welcome_and_keeps_the_subscriptions_on_reconnect() (+1 more)

### Community 102 - "run.ts"
Cohesion: 0.17
Nodes (17): drill(), main(), memoryMb(), read(), Reader, silentClient(), readBody(), startFakeProviders() (+9 more)

### Community 104 - "duration"
Cohesion: 0.40
Nodes (3): DELETE_ATTEMPTS, DELETE_PAUSE, remove_patiently()

### Community 105 - "Plan: Theme "Bärenbande""
Cohesion: 0.33
Nodes (7): Acceptance Criteria, Gestaltung, Out of Scope, Package 2: Overlays, Tests (TDD), Umsetzungsschritte, point()

### Community 106 - "client.ts"
Cohesion: 0.16
Nodes (15): AUTH_CASES, ME, cookie(), Init, location(), login(), STRANGER, Streamer (+7 more)

### Community 107 - "sceneNames"
Cohesion: 0.22
Nodes (14): Acceptance Criteria, Annahmen, Kontext, Out of Scope, Package 1: Szenen und Clips ohne Vererbung, Plan: Szenen ohne Vererbung, Tests (TDD), Umsetzungsschritte (+6 more)

### Community 108 - "tsconfig.json"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, jsx, lib, module, moduleResolution, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 109 - "chaos.rs"
Cohesion: 0.08
Nodes (34): alerts(), ALERTS, BANNER, BASIC, CAM, chaos(), CHAT, chat_cam_music_fx() (+26 more)

### Community 110 - "package.json"
Cohesion: 0.15
Nodes (14): name, private, type, version, eslint, @eslint/js, eslint-plugin-react-hooks, globals (+6 more)

### Community 111 - "twitch eventsub.rs"
Cohesion: 0.20
Nodes (10): DEFAULT_KEEPALIVE_SECONDS, EventSubError, NoMetadata, NotJson, is_twitch_reconnect_url(), parse(), parse_message(), subscriptions() (+2 more)

### Community 112 - "bears.rs"
Cohesion: 0.08
Nodes (28): ALERTS, BANNER, BASIC, BEAR_IDS, BEARS, bears(), CAM, capital() (+20 more)

### Community 113 - "Render.tsx"
Cohesion: 0.10
Nodes (23): ERROR_CODES, ErrorCode, REQUEST_ERROR_CODES, SETTING_ERROR_CODES, ClipPreview(), ClipSettings(), Render(), RenderedFile (+15 more)

### Community 115 - "handlers/backups.rs"
Cohesion: 0.30
Nodes (14): server_error(), actor(), create(), delete(), download(), failed(), id_of(), list() (+6 more)

### Community 116 - "swathes.ts"
Cohesion: 0.18
Nodes (14): STAGE, Props, left, right, tones, fromSide(), Streak, swathes (+6 more)

### Community 117 - "CODING-RULES.md"
Cohesion: 0.19
Nodes (10): Coding and layout rules, npm run verify, Review checklist, scripts/rules.check.ts rule script, Matrix-Theme, Plan: ein Server, mehrere Streamer, Themes, Einstellungs-Schema, Themes (standard, matrix, urlaub, plantage, koth) (+2 more)

### Community 118 - "package.json"
Cohesion: 0.14
Nodes (14): scripts, build, check, contract, dev, gen:types, lint, prepare (+6 more)

### Community 119 - "beachThings.ts"
Cohesion: 0.26
Nodes (9): MinimeVariantSet, BeachThing(), BEACH_THINGS, BeachThing, names, findThing(), THING_IDS, THING_SET (+1 more)

### Community 120 - "identity/sessions.rs"
Cohesion: 0.12
Nodes (12): LoginOutcome, AccountChanged, Failed, NotAllowed, Session, a_session_resolves_until_it_expires(), log_out_and_disconnect_end_sessions_at_once(), neo() (+4 more)

### Community 121 - "themes/audit.rs"
Cohesion: 0.13
Nodes (7): audit(), FX_KEYS, personalize(), reports_every_kind_of_problem(), values_object(), info_fields(), INFO_GROUP

### Community 122 - "export_types.rs"
Cohesion: 0.08
Nodes (25): actual(), differences(), expected(), generated_dir(), generated_files_are_current(), HEADER, KEEP, read_tree() (+17 more)

### Community 123 - "token_keeper.rs"
Cohesion: 0.12
Nodes (14): a_rejected_login_is_reported(), after_stop_nothing_is_saved_and_late_tokens_are_revoked(), Arc<FakeTwitch>, CHECK_SECONDS, FakeTwitch, keeper(), simultaneous_checks_share_one_renewal(), TokenKeeper (+6 more)

### Community 124 - "useMinimes.ts"
Cohesion: 0.05
Nodes (82): earliest(), Fights, MinimeSceneOptions, Scene, tick(), Towers, useMinimes(), useTowers() (+74 more)

### Community 125 - "render.rs"
Cohesion: 0.29
Nodes (15): text(), allowed(), cancel(), done(), encode(), file(), files(), folder() (+7 more)

### Community 126 - "rules.check.ts"
Cohesion: 0.11
Nodes (10): HookInput, input, AUTHORING_TYPES, BAG_NAME_EXCEPTIONS, EM_DASH, failures, files, GENERATED_TYPES (+2 more)

### Community 127 - "RST - Rezondes Stream Tools"
Cohesion: 0.09
Nodes (25): Docker-Image Workflow, image job (ghcr.io publish), verify job (npm run verify + contract), keys volume (/keys), overlays service, caddy service, overlays public override (no ports, https PUBLIC_URL), tokens volume (/data) (+17 more)

### Community 128 - "backup/schedule.rs"
Cohesion: 0.13
Nodes (10): backup(), BackupSchedule, HOUR_MS, KEY, MAX_INTERVAL_HOURS, MAX_KEEP, off_never_due_on_after_the_interval(), only_old_automatic_backups_are_surplus() (+2 more)

### Community 129 - "package.json"
Cohesion: 0.17
Nodes (12): devDependencies, eslint, @eslint/js, eslint-plugin-react-hooks, globals, @types/node, @types/react, @types/react-dom (+4 more)

### Community 130 - "ServerConfig"
Cohesion: 0.19
Nodes (12): cache_bytes(), ConfigError, Invalid, MasterKey, Missing, lookup(), OAuthApp, ProviderUrls (+4 more)

### Community 131 - "RUST-PLAN.md"
Cohesion: 0.19
Nodes (8): Backups, npm run contract, Audit-Log, Vertragstests (Package 4), Fake-Provider Twitch/Spotify (Package 3), Schluessel-Backups (30 days), Package 45: Umstieg (Node server removed), Plan: Rust-Server als einzige Source of Truth

### Community 132 - "plans PLAN-MINIMES.md"
Cohesion: 0.10
Nodes (21): DESIGN.md: Design principles, PLAN-MINIMES.md: Minimes plan, Bildsprache: zwei Ebenen, Dashboard-Skin (`data-skin="bears"`), Design: Bärenbande, Die drei Bären, Im Code, Overlays (+13 more)

### Community 133 - "main.rs"
Cohesion: 0.33
Nodes (6): import(), main(), run(), SCHEDULE_EVERY, serve(), USAGE

### Community 134 - "Plan: Theme "Chaos""
Cohesion: 0.07
Nodes (30): Acceptance Criteria, Acceptance Criteria, Acceptance Criteria, Acceptance Criteria, Acceptance Criteria, Annahmen, Einstellungen, Einstellungen (Gruppen dieses Packages) (+22 more)

### Community 135 - "media.rs"
Cohesion: 0.18
Nodes (10): MediaName, status(), audit(), delete(), deliver(), list(), MEDIA_LIMIT, name_of() (+2 more)

### Community 136 - "restore.ts"
Cohesion: 0.28
Nodes (13): expect(), setAccess(), backup(), drill(), main(), post(), state(), trigger() (+5 more)

### Community 137 - "scribbles.ts"
Cohesion: 0.11
Nodes (19): again, first, picks, random, values, weighted(), COLORS, Confetti() (+11 more)

### Community 138 - "twitch alerts.rs"
Cohesion: 0.18
Nodes (10): AlertKind, .ALL, Cheer, Follow, Gift, Hype, Raid, Redeem (+2 more)

### Community 139 - "Minimes Package 2: Scene, feature and settings (readMinimeOptions, hasMinimes)"
Cohesion: 0.11
Nodes (15): Minimes Package 1: Minime rules (parseColor, parseCommand, applyMinime), Minimes Package 2: Scene, feature and settings (readMinimeOptions, hasMinimes), Minimes Package 3: Server runtime (minimes.json, SSE), Minimes Package 4: Behavior and hook (minimeBehavior, useMinimes), Minimes Package 5: Matrix ghost base form, Minimes Package 6: Matrix ghost idle animations, Minimes Package 7: Docs, Minime state on server (data/streamers/<login>/minimes.json) (+7 more)

### Community 140 - "rust.ts"
Cohesion: 0.23
Nodes (10): BUILD, exe, home, plain, COMMANDS, findCargo(), GEN_TYPES, main() (+2 more)

### Community 141 - "hill.ts"
Cohesion: 0.09
Nodes (42): shapes, star, circle(), FLAG, HELI, ICON_NAMES, IconName, ICONS (+34 more)

### Community 143 - "public_commands"
Cohesion: 0.18
Nodes (5): CommandService, CommandService<'_, S, K, A>, help_setting_and_public_list_by_features(), neo(), public_commands()

### Community 144 - "MinimeRules"
Cohesion: 0.20
Nodes (12): allowed_teams(), allowed_variants(), entry(), millis(), Minime, MinimeEntry, prune(), remember() (+4 more)

### Community 145 - "theme_values.rs"
Cohesion: 0.21
Nodes (3): one_readonly_key_per_field_with_its_type(), ts_type(), values_type()

### Community 146 - "Stinger and banners as pure functions of time"
Cohesion: 0.22
Nodes (6): Stinger and banners as pure functions of time, Minime action catalog (name, durationMs, weight), KOTH smoke grenade stinger with flag change, Matrix columns stinger with decrypting logo, Plantage falling mango stinger, Urlaub wave stinger

### Community 147 - "Minimes Package 11: Combat (minimeCombat.ts)"
Cohesion: 0.09
Nodes (27): Minimes Package 10: Factions, Minimes Package 11: Combat (minimeCombat.ts), Minimes Package 12: Fixed slots, Minimes Package 8: Hopping in core, Minimes Package 9: Remove TS mirror of minime rules, KOTH hill holder display (flag in faction color), KOTH soldier minimes (helmet, faction uniform, role weapon), KOTH factions BLUFOR, OPFOR, INDFOR (+19 more)

### Community 149 - "bears/scenes/Minimes.tsx"
Cohesion: 0.14
Nodes (21): MinimeStackScene, MinimeAction, BEAR_IDS, BEAR_SET, lifts, MINIME_MOVES, MINIME_REACTION, minimePose() (+13 more)

### Community 150 - "deserialize"
Cohesion: 0.33
Nodes (5): CHAT_SCOPE, only_complete_tokens(), SCOPES, to_tokens(), tokens()

### Community 151 - "triggers/schedule.rs"
Cohesion: 0.39
Nodes (4): action(), actions_follow_each_other_and_together_joins_the_previous(), DEFAULT_DURATION, schedule()

### Community 152 - "RUST-PLAN.md"
Cohesion: 0.43
Nodes (4): rst-app crate, rst-domain crate, rst-infra crate, rst-server crate (binary rst)

### Community 153 - "Neues Theme planen"
Cohesion: 0.25
Nodes (7): 1. Eingabe sammeln, 2. Projekt lesen (immer, vor den Rückfragen), 3. Referenzbilder auswerten, 5. DESIGN-<ID>.md schreiben, 6. PLAN-<ID>.md schreiben, 7. Eintragen und abschliessen, Neues Theme planen

### Community 154 - "EventSubMessage"
Cohesion: 0.25
Nodes (7): EventSubMessage, Alert, Ignored, Offline, Reconnect, Revocation, Welcome

### Community 156 - "runtime.rs"
Cohesion: 0.09
Nodes (19): a_rejected_login_ends_the_runtime_and_deletes_the_tokens(), broken_profile_does_not_block(), chat_lines_fire_triggers_and_the_help_reply_without_its_echo(), id(), login(), panic_is_contained(), profile_with_tokens(), RESTART_PAUSE (+11 more)

### Community 158 - "Package 3: Stinger und Banner"
Cohesion: 0.22
Nodes (8): ClipName, RenderClip, Acceptance Criteria, Gestaltung, Kontext, Out of Scope, Package 3: Stinger und Banner, Tests (TDD)

### Community 161 - "chaos/paint.check.ts"
Cohesion: 0.08
Nodes (25): ChaosBannerOptions, offline, options, profile, brush, Call, COLORS, fakePath() (+17 more)

### Community 162 - ".complete"
Cohesion: 0.26
Nodes (4): entry(), FakeTwitch, LoginFlow<'_, R, S, K, Q, P, A>, logout_and_disconnect_end_sessions()

### Community 163 - "Feature"
Cohesion: 0.17
Nodes (11): Feature, Alerts, .ALL, Banners, Chat, Fx, Minimes, Music (+3 more)

### Community 164 - "IrcMessage"
Cohesion: 0.26
Nodes (8): amount(), badge(), chat_events(), notice_alert(), tag_or(), to_irc_events(), IrcMessage, channels()

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

### Community 172 - "session.rs"
Cohesion: 0.12
Nodes (7): cookies_http_only_lax_and_secure_with_https(), debug_hides_the_token(), is_secure_url(), OAUTH_STATE_SECONDS, SESSION_DAYS, SessionHash, token_text_and_hash_are_deterministic()

### Community 173 - "THEMES.md"
Cohesion: 0.67
Nodes (3): Theme folder structure (settings.ts, use<Id>.ts, index.tsx, render.ts, theme.css, scenes), ThemeModule (THEME_MODULES in registry.ts), ThemeView (THEME_VIEWS in scenes.tsx)

### Community 201 - "texts.de.ts"
Cohesion: 0.14
Nodes (21): 4. Rückfragen, EventFeed(), KINDS, time(), useEventLog(), add(), alertText(), many (+13 more)

### Community 202 - "plantage/stinger.ts"
Cohesion: 0.15
Nodes (18): easeIn(), easeInOut(), PlantageValues, atCut, bare, early, first, gradient (+10 more)

### Community 203 - ".change"
Cohesion: 0.40
Nodes (3): AccessAdmin<'_, R, S, K, Q, P, A>, json_of(), StreamerRow

### Community 204 - "AuditStore"
Cohesion: 0.26
Nodes (3): AuditStore, StoredEntry, SqliteAudit

### Community 205 - "MinimeEvent"
Cohesion: 0.18
Nodes (11): MinimeEvent, Ban, Chat, Clear, Color, Join, Kick, Leave (+3 more)

### Community 206 - "Login"
Cohesion: 0.36
Nodes (5): AccessPolicy, is_admin(), revoked_logins(), Login, StreamerPath

### Community 207 - "Bear.tsx"
Cohesion: 0.18
Nodes (14): Bear(), BearFigure(), BodyBlob(), FigureProps, safeId(), BearId, TOWER, TOWER_LEVELS (+6 more)

### Community 208 - "Plan: Theme "Bärenbande""
Cohesion: 0.05
Nodes (44): Acceptance Criteria, Acceptance Criteria, Acceptance Criteria, Acceptance Criteria, Acceptance Criteria, Acceptance Criteria, Annahmen, Einstellungen (+36 more)

### Community 209 - "urlaub/render.ts"
Cohesion: 0.13
Nodes (21): beach(), centered(), gradient, options, drawUrlaubOfflineBanner(), drawUrlaubProfileBanner(), palm(), Size (+13 more)

### Community 210 - "Part"
Cohesion: 0.29
Nodes (9): emote_url(), kappa(), Part, Emote, Text, split_emotes(), split_words(), text() (+1 more)

### Community 211 - "static_files.rs"
Cohesion: 0.24
Nodes (5): percent_decode(), resolve(), StaticError, BadEncoding, Forbidden

### Community 212 - "chaos/scenes/Minimes.tsx"
Cohesion: 0.36
Nodes (6): seedOf(), Monster(), Character(), Lines(), Minimes(), scribbleShape()

### Community 213 - "icons.ts"
Cohesion: 0.48
Nodes (4): Icon, ICON_NAMES, IconName, ICONS

### Community 214 - "Command"
Cohesion: 0.25
Nodes (6): Command, Import, Serve, Usage, Version, parse()

### Community 215 - "FxAction"
Cohesion: 0.33
Nodes (6): FxPosition, Named, Point, NamedPosition, Center, Random

### Community 216 - "emotes.ts"
Cohesion: 0.21
Nodes (12): bttv(), BttvEmote, BttvUser, EmoteEntry, ffz(), FfzEmote, json(), loadEmotes() (+4 more)

### Community 218 - "library.rs"
Cohesion: 0.18
Nodes (4): MB, one_upload_per_streamer(), triggers_using(), UploadSlots

### Community 219 - "FeatureLevel"
Cohesion: 0.40
Nodes (4): FeatureLevel, All, Beta, Off

### Community 220 - "RenderJobs"
Cohesion: 0.38
Nodes (3): encoding_answers_busy_until_done(), Job, RenderJobs

### Community 221 - "Format"
Cohesion: 0.36
Nodes (6): Format, Gif, Webm, ffmpeg_args(), gif_with_own_palette_and_endless_loop(), webm_with_alpha()

### Community 222 - "matrix/banners.ts"
Cohesion: 0.19
Nodes (15): blink(), Call, empty, full, options, quiet, values, drawOfflineBanner() (+7 more)

### Community 223 - "jobs.rs"
Cohesion: 0.29
Nodes (5): Finished, GIF_WARN_BYTES, MAX_FRAME_BYTES, MAX_FRAMES, TIMEOUT_MS

### Community 224 - "clamp01"
Cohesion: 0.20
Nodes (15): clamp01(), MatrixValues, bannerOptions, clips, matrixClips(), atCut, options, drawFlash() (+7 more)

### Community 225 - "Registration"
Cohesion: 0.67
Nodes (3): Registration, Allowlist, Open

### Community 226 - "RenderError"
Cohesion: 0.33
Nodes (5): RenderError, Busy, Limit, NotStarted, TooLarge

### Community 229 - "Clip"
Cohesion: 0.18
Nodes (7): OUTPUT_NAMES, Clip, .ALL, Offline, Profile, Stinger, output_names_match_the_media_value()

## Ambiguous Edges - Review These
- `Non-media fixture file in import test data` → `rst import (Package 24)`  [AMBIGUOUS]
  server-rs/crates/rst-app/tests/fixtures/data/streamers/neo/media/notes.txt · relation: conceptually_related_to

## Knowledge Gaps
- **207 isolated node(s):** `AccountChanged`, `Vault`, `Alerts`, `Brb`, `Cam` (+202 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1738 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **40 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `scripts` connect `package.json` to `package.json`?**
  _High betweenness centrality (0.335) - this node is a cross-community bridge._
- **What connects `AccountChanged`, `Vault`, `Alerts` to the rest of the system?**
  _207 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `open_data_db` be split into smaller, more focused modules?**
  _Cohesion score 0.08258258258258258 - nodes in this community are weakly interconnected._
- **Why does `check` connect `package.json` to `archive.rs`?**
  _High betweenness centrality (0.329) - this node is a cross-community bridge._
- **Should `archive.rs` be split into smaller, more focused modules?**
  _Cohesion score 0.09462365591397849 - nodes in this community are weakly interconnected._
- **Why does `react` connect `react` to `strokes.ts`, `fillTemplate`, `react`, `types.ts`, `scribbles.ts`, `hill.ts`, `hash`, `bears/scenes/Minimes.tsx`, `koth/scenes/Minimes.tsx`, `bears/scenes/Alerts.tsx`, `Urlaub Beach Shapes`, `Effects Overlay`, `dashboard obsSetup.ts`, `ThemeSettings.tsx`, `fillTemplate`, `ref_node_assert`, `Triggers.tsx`, `Admin.tsx`, `texts.de.ts`, `SettingInput.tsx`, `Bear.tsx`, `Dashboard.tsx`, `chaos/scenes/Minimes.tsx`, `chance`, `package.json`, `Render.tsx`, `swathes.ts`, `useMinimes.ts`?**
  _High betweenness centrality (0.323) - this node is a cross-community bridge._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Non-media fixture file in import test data` and `rst import (Package 24)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._