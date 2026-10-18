# Graph Report - RezondesStream  (2026-10-18)

## Corpus Check
- 514 files · ~276,556 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 23 file(s) not represented in the graph (top: .css 15, (none) 5, .toml 2)

## Summary
- 4661 nodes · 12652 edges · 216 communities (172 shown, 44 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 482 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d62effb4`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- RecordStore
- delete.rs
- Audit Log and Records
- useMinimes.ts
- matrix/settings.ts
- urlaub/scenes/Alerts.tsx
- login.rs
- eventLog.ts
- ProviderError
- useMatrix
- identity/streamers.rs
- rst-domain/src/access/mod.rs
- Rust Setting Field Builders
- path
- plantage/scenes/Minimes.tsx
- Backup Schedule
- Rust Minime Combat Fields
- minimeFields.ts
- ProviderError
- Field.tsx
- request
- fakeProviders.ts
- KOTH Hill Shapes
- channel/triggers.rs
- KOTH Rust Schema
- Rust Minime Variants
- Rust Minime Rules and ASCII
- Live Event Hubs
- Settings Validation
- session.rs
- Urlaub Beach Shapes
- vault.rs
- rules.rs
- Chat Command List
- Effects Overlay
- Backup Archives
- open_data_db
- server_error
- OAuth Callback
- client.ts
- Admin.tsx
- Triggers.tsx
- Runtime Registry
- Minime Roster
- Minime Chat Commands
- channel minimes.rs
- rst-server routes.rs
- koth/render.ts
- koth/scenes/Screen.tsx
- themes standard.rs
- settings file.rs
- dashboard obsSetup.ts
- ThemeSettings.tsx
- themes minime_fields.rs
- matrix/render.ts
- backup archive.rs
- handlers/triggers.rs
- urlaub/render.ts
- profile/mod.rs
- matrix/scenes/Chat.tsx
- music/mod.rs
- token_keeper.rs
- rst-app/src/settings/mod.rs
- triggers pattern.rs
- rst-app/src/backup/mod.rs
- rst-domain paths.rs
- music music.ts
- chat events.rs
- btreemap
- theme.ts
- identity oauth.rs
- run.ts
- crypto master.rs
- twitch/oauth.rs
- connection.ts
- commands.ts
- standard/render.ts
- rules
- AsciiGenerator.tsx
- themes registry.rs
- plantage stinger.ts
- themes generatedValues.check.ts
- rst-infra/src/render/ffmpeg.rs
- media values.rs
- triggers mod.rs
- plantage/scenes/Alerts.tsx
- chat irc.rs
- ports socket.rs
- handlers render.rs
- dumpSchema.ts
- .start
- encrypted.rs
- ServerConfig
- minimes mod.rs
- twitch alerts.rs
- backup archive.rs
- mangos.ts
- handlers events.rs
- dumpSchema.ts
- MinimeEvent
- Login
- channel alerts.rs
- chat.rs
- config.rs
- playSound
- minimes roster.rs
- koth/settings.check.ts
- StreamerRepository
- tsconfig.json
- Backups
- package.json
- twitch eventsub.rs
- plantage banners.ts
- plans PLAN-MINIMES.md
- access/admin.rs
- session.rs
- .complete
- CODING-RULES.md
- package.json
- rst-app/src/commands/mod.rs
- Clip
- CompiledTrigger
- export_types.rs
- .replace
- api/mod.rs
- access mod.rs
- core emotes.ts
- README.md
- App
- package.json
- SpotifyPlayer<A, S, K>
- RUST-PLAN.md
- plans PLAN-MINIMES.md
- rst-server main.rs
- import/mod.rs
- media.rs
- texts.de.ts
- triggers mod.rs
- twitch alerts.rs
- plans PLAN-MINIMES.md
- ports backups.rs
- app.rs
- minimes roster.rs
- LoginOutcome
- keystore_contract.rs
- docker-compose.yml
- plans PLAN-MINIMES.md
- docs PLAN-URLAUB.md
- FeatureLevel
- cli mod.rs
- ref_node_assert
- triggers schedule.rs
- RUST-PLAN.md
- text
- DataKey
- render clips.rs
- settings.rs
- DESIGN.md
- docs PLAN-KOTH.md
- workflows docker.yml
- EventSubMessage
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
- rst-app/src/backup/keys.rs
- matrix/banners.ts
- tokens.rs
- typing.check.ts
- rst-app/src/triggers/mod.rs
- rst-infra/src/backup/keys.rs
- library.rs
- identity/values.rs
- streamerPath.ts
- duration

## God Nodes (most connected - your core abstractions)
1. `StreamerId` - 266 edges
2. `StoreError` - 185 edges
3. `VaultError` - 105 edges
4. `Login` - 72 edges
5. `ProviderError` - 71 edges
6. `react` - 63 edges
7. `App` - 62 edges
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
- 2-file cycle: `server-rs/crates/rst-domain/src/themes/registry.rs -> server-rs/crates/rst-domain/src/themes/urlaub.rs -> server-rs/crates/rst-domain/src/themes/registry.rs`
- 2-file cycle: `server-rs/crates/rst-domain/src/themes/registry.rs -> server-rs/crates/rst-domain/src/themes/standard.rs -> server-rs/crates/rst-domain/src/themes/registry.rs`
- 3-file cycle: `server-rs/crates/rst-domain/src/themes/fixture.rs -> server-rs/crates/rst-domain/src/themes/registry.rs -> server-rs/crates/rst-domain/src/themes/matrix.rs -> server-rs/crates/rst-domain/src/themes/fixture.rs`
- 3-file cycle: `server-rs/crates/rst-domain/src/themes/fixture.rs -> server-rs/crates/rst-domain/src/themes/registry.rs -> server-rs/crates/rst-domain/src/themes/plantage.rs -> server-rs/crates/rst-domain/src/themes/fixture.rs`
- 3-file cycle: `server-rs/crates/rst-domain/src/themes/fixture.rs -> server-rs/crates/rst-domain/src/themes/registry.rs -> server-rs/crates/rst-domain/src/themes/koth.rs -> server-rs/crates/rst-domain/src/themes/fixture.rs`
- 3-file cycle: `server-rs/crates/rst-domain/src/themes/fixture.rs -> server-rs/crates/rst-domain/src/themes/registry.rs -> server-rs/crates/rst-domain/src/themes/urlaub.rs -> server-rs/crates/rst-domain/src/themes/fixture.rs`
- 3-file cycle: `server-rs/crates/rst-domain/src/themes/fixture.rs -> server-rs/crates/rst-domain/src/themes/registry.rs -> server-rs/crates/rst-domain/src/themes/standard.rs -> server-rs/crates/rst-domain/src/themes/fixture.rs`

## Hyperedges (group relationships)
- **Opt-in core minime extensions (variants, factions, combat, slots, hopping)** — themes_minime_variants, themes_minime_teams, themes_minime_combat, themes_minime_slots, themes_minime_hops, themes_minime_fields [EXTRACTED 1.00]
- **Rust server layer crates** — rust_plan_rst_domain, rust_plan_rst_app, rust_plan_rst_infra, rust_plan_rst_server [EXTRACTED 1.00]
- **Themes with soldier minimes using core combat** — src_themes_koth_docs_design_koth_soldier_minimes, src_themes_plantage_docs_design_plantage_mango_soldier_minimes, plans_plan_minimes_package_11_combat, plans_plan_minimes_combat_requires_medic [INFERRED 0.85]
- **Per-streamer encryption and key storage** — readme_key_store_encryption, rust_plan_crypto_shredding, rust_plan_key_backups, docker_compose_keys_volume [INFERRED 0.85]
- **Per-theme design docs following DESIGN.md axis decisions** — design_one_decision_per_axis, src_themes_standard_docs_design_standard_dashboard_skin, src_themes_matrix_docs_design_matrix_dashboard_skin, src_themes_urlaub_docs_design_urlaub_dashboard_skin, src_themes_plantage_docs_design_plantage_dashboard_skin, src_themes_koth_docs_design_koth_dashboard_skin [INFERRED 0.85]
- **Verification pipeline before publish** — _github_workflows_docker_verify_job, coding_rules_npm_run_verify, coding_rules_rules_check_script, readme_contract_tests, rust_plan_fake_providers [INFERRED 0.85]

## Communities (216 total, 44 thin omitted)

### Community 0 - "RecordStore"
Cohesion: 0.12
Nodes (6): RecordStore, StoredRecord, SqliteRecords, contract_tests!, sqlite(), streamer()

### Community 1 - "delete.rs"
Cohesion: 0.05
Nodes (21): AccessAdmin, AccessSettings, KEY, AuditLog, ScheduleSettings, OverlayKeys, LookupKey, StreamerDeletion (+13 more)

### Community 2 - "Audit Log and Records"
Cohesion: 0.06
Nodes (28): created_once_then_the_same(), import_takes_only_valid_keys(), is_key(), keys(), KIND, matches_only_the_current_key(), neo(), OverlayKeys<S, K> (+20 more)

### Community 3 - "useMinimes.ts"
Cohesion: 0.09
Nodes (51): seedOf(), MinimeSceneOptions, useMinimes(), advance(), area(), at(), actor(), demoTeams (+43 more)

### Community 4 - "matrix/settings.ts"
Cohesion: 0.05
Nodes (77): BADGE_KEYS, badgeFields(), labels, KEYS, asciiArt(), defaults, fields, schema (+69 more)

### Community 5 - "urlaub/scenes/Alerts.tsx"
Cohesion: 0.11
Nodes (30): ALERT_SOUND_KEYS, alertQuote(), alertSoundFields(), alertTextKeys, alertVars(), KINDS, sounds, values (+22 more)

### Community 6 - "login.rs"
Cohesion: 0.05
Nodes (14): FileStore, FileWriter, StoreError, SessionStore, lock(), MemoryFiles, MemoryRecords, MemorySessions (+6 more)

### Community 7 - "eventLog.ts"
Cohesion: 0.15
Nodes (19): EventFeed(), KINDS, time(), useEventLog(), add(), alertText(), many, one (+11 more)

### Community 8 - "ProviderError"
Cohesion: 0.09
Nodes (12): FakeTwitch, FakeTwitch, StreamerDeletion<'_, R, S, K, P, F, A>, the_streamer_is_gone_with_sessions_key_rows_and_files(), ChatSender, EventSubscriber, Said, MissingScope (+4 more)

### Community 9 - "useMatrix"
Cohesion: 0.11
Nodes (31): emoji, standard, glyph(), GLYPHS, useDecode(), useNow(), decodeFrame(), channelNames() (+23 more)

### Community 10 - "identity/streamers.rs"
Cohesion: 0.14
Nodes (15): a_rename_keeps_the_profile(), id(), list_leaves_out_shredded_streamers(), login(), PROFILE_KIND, register_and_find(), RegisterError, AccountChanged (+7 more)

### Community 11 - "rst-domain/src/access/mod.rs"
Cohesion: 0.30
Nodes (13): admins(), allowlist_only_admins_and_listed_logins(), beta_policy(), initial_policy_allows_the_admins_and_everything(), levels_all_beta_off(), login(), logins(), open_registration_lets_everyone_in() (+5 more)

### Community 12 - "Rust Setting Field Builders"
Cohesion: 0.07
Nodes (47): ts_type(), ascii_art(), ascii_art_is_a_textarea_with_generator_flag(), choice(), color(), field(), FieldKind, Boolean (+39 more)

### Community 13 - "path"
Cohesion: 0.22
Nodes (5): percent_decode(), resolve(), StaticError, BadEncoding, Forbidden

### Community 14 - "plantage/scenes/Minimes.tsx"
Cohesion: 0.11
Nodes (28): MinimeCombatScene, actorRun(), actorStyle(), MinimeAction, actor, plan, hopPlan(), hopStyle() (+20 more)

### Community 15 - "Backup Schedule"
Cohesion: 0.11
Nodes (11): BackupError, Busy, Invalid, NotFound, Store, Backups<B, A, K>, MemoryBackups, one_backup_at_a_time_in_the_background_and_every_step_is_audited() (+3 more)

### Community 16 - "Rust Minime Combat Fields"
Cohesion: 0.08
Nodes (40): combat(), combat_fields_are_opt_in_without_medic_durations(), minime_aim_key(), minime_combat_fields(), minime_fire_key(), alerts(), ALERTS, BANNER (+32 more)

### Community 17 - "minimeFields.ts"
Cohesion: 0.07
Nodes (40): options(), number(), readCombat(), defaults, probe, COMBAT_SOUNDS, command(), hasMinimes() (+32 more)

### Community 18 - "ProviderError"
Cohesion: 0.10
Nodes (14): FakeSpotify, Playing, Answer, Limited, Nothing, Unauthorized, SpotifyApi, TokenAnswer (+6 more)

### Community 19 - "Field.tsx"
Cohesion: 0.12
Nodes (27): hash(), Blob, blobs(), shapes, star, circle(), CRATES, DEPTHS (+19 more)

### Community 20 - "request"
Cohesion: 0.17
Nodes (22): slowUpload(), login(), request(), setAccess(), backup(), drill(), main(), post() (+14 more)

### Community 21 - "fakeProviders.ts"
Cohesion: 0.14
Nodes (22): bearer(), Answer, connect(), masked, nextMessage(), control(), FakeProviders, frame() (+14 more)

### Community 22 - "KOTH Hill Shapes"
Cohesion: 0.09
Nodes (41): KothValues, shapes, star, circle(), FLAG, HELI, ICON_NAMES, IconName (+33 more)

### Community 23 - "channel/triggers.rs"
Cohesion: 0.15
Nodes (10): compiled(), fire_ignores_the_cooldown_and_replace_takes_effect(), line(), lock(), matching_lines_fire_in_the_planned_order_with_cooldowns(), neo(), rules(), TriggerRunner (+2 more)

### Community 24 - "KOTH Rust Schema"
Cohesion: 0.08
Nodes (38): alerts(), ALERTS, BANNER, CAM, capital(), CHAT, chat_cam_music_fx(), fields() (+30 more)

### Community 25 - "Rust Minime Variants"
Cohesion: 0.06
Nodes (27): one_readonly_key_per_field_with_its_type(), values_type(), ALERTS, BANNER, BEACH, BEACH_THINGS, CAM, capital() (+19 more)

### Community 26 - "Rust Minime Rules and ASCII"
Cohesion: 0.07
Nodes (28): ascii_text(), ROWS, alert_sound_fields(), badge_fields(), badge_texts_default_to_the_abbreviation(), one_sound_per_alert_kind_and_fade_out(), ALERTS, BANNER (+20 more)

### Community 27 - "Live Event Hubs"
Cohesion: 0.08
Nodes (19): alert(), at_most_fifty_streams_and_places_come_back(), CAPACITY, Channel, Hubs, MAX_STREAMS, messages_reach_every_stream_of_the_streamer(), neo() (+11 more)

### Community 28 - "Settings Validation"
Cohesion: 0.11
Nodes (31): check_lines(), check_media(), check_sound(), check_text(), check_value(), codes(), defaults_of_all_building_blocks_pass(), extensions() (+23 more)

### Community 29 - "session.rs"
Cohesion: 0.09
Nodes (6): same_input_same_digest_and_purposes_apart(), debug_hides_the_token(), OAUTH_STATE_SECONDS, SESSION_DAYS, SessionHash, token_text_and_hash_are_deterministic()

### Community 30 - "Urlaub Beach Shapes"
Cohesion: 0.12
Nodes (31): useInfoPage(), Beach(), shapes, star, circle(), CLOUD, GULL, ICON_NAMES (+23 more)

### Community 31 - "vault.rs"
Cohesion: 0.19
Nodes (7): aad(), moved_blocks_and_shredded_keys_are_unreadable(), neo(), round_trip_and_ciphertext_only_in_the_store(), vault(), Vault<S, K>, Store

### Community 32 - "rules.rs"
Cohesion: 0.17
Nodes (18): command(), defaults_without_saved_values(), factions_only_with_variants_and_variant_names_first(), flag(), invalid_values_give_the_defaults(), minime_rules(), MinimeCommands, MinimeRules (+10 more)

### Community 33 - "Chat Command List"
Cohesion: 0.06
Nodes (38): a_missing_scope_is_remembered_and_the_config_can_change(), help(), HelpResponder, line(), lock(), replies_once_per_cooldown_and_ignores_its_echo(), command_list(), CommandItem (+30 more)

### Community 34 - "Effects Overlay"
Cohesion: 0.15
Nodes (27): FX_KEYS, fxDefaults(), FxSettings, useFxItem(), useFxScene(), FxMedia(), ShownFx, useFx() (+19 more)

### Community 35 - "Backup Archives"
Cohesion: 0.13
Nodes (27): ArchiveError, Invalid, NotFound, Store, allowed_name(), bytes(), check(), Checked (+19 more)

### Community 36 - "open_data_db"
Cohesion: 0.09
Nodes (15): ServerSettingsStore, DATA_DB_VAR, migrations_twice(), open_data_db(), pragmas(), put_replaces_and_get_reads(), SqliteServerSettings, audit_appends_and_lists_newest_first() (+7 more)

### Community 37 - "server_error"
Cohesion: 0.19
Nodes (22): json(), server_error(), access(), ACCESS_LIMIT, audit(), AUDIT_LIMIT, delete_streamer(), save_access() (+14 more)

### Community 38 - "OAuth Callback"
Cohesion: 0.14
Nodes (20): to_hex(), cookie(), oauth_state_cookie(), session_cookie(), now_ms(), redirect(), callback(), cookies() (+12 more)

### Community 39 - "client.ts"
Cohesion: 0.15
Nodes (30): ACCOUNT_CASES, ALERT_CASES, Subscription, AUTH_CASES, BACKUP_CASES, Listing, CHAT_CASES, chatLine() (+22 more)

### Community 40 - "Admin.tsx"
Cohesion: 0.07
Nodes (53): ERROR_CODES, ErrorCode, isErrorCode(), REQUEST_ERROR_CODES, SETTING_ERROR_CODES, AccessDraft, AccessForm(), Admin() (+45 more)

### Community 41 - "Triggers.tsx"
Cohesion: 0.12
Nodes (27): MEDIA_KIND, deleteMedia(), loadMedia(), uploadMedia(), Media(), megabytes(), Preview(), TEXTS (+19 more)

### Community 42 - "Runtime Registry"
Cohesion: 0.11
Nodes (13): a_restart_stops_the_old_runtime(), Entries, Fake, held(), id(), locked_or_stopped_starts_are_discarded(), NEXT, nothing_to_start_and_runtimes_that_ended_themselves() (+5 more)

### Community 43 - "Minime Roster"
Cohesion: 0.16
Nodes (27): allowed_teams(), allowed_variants(), apply(), chat(), entry(), join(), join_leave_and_come_back_with_the_remembered_color(), logins() (+19 more)

### Community 44 - "Minime Chat Commands"
Cohesion: 0.10
Nodes (28): channels(), find_variant(), has_role(), HEX, is_login(), join(), join_choice(), join_reads_role_and_faction_in_any_order() (+20 more)

### Community 45 - "channel minimes.rs"
Cohesion: 0.14
Nodes (11): commands_change_the_list_saves_are_batched_and_survive_a_restart(), line(), MinimeRunner, MinimeRunner<S, K>, neo(), profile(), PRUNE_EVERY, Roster (+3 more)

### Community 46 - "rst-server routes.rs"
Cohesion: 0.11
Nodes (23): all_on(), authorize(), find(), Found, MethodNotAllowed, Route, Guard, Admin (+15 more)

### Community 47 - "koth/render.ts"
Cohesion: 0.10
Nodes (23): battlefield(), centered(), gradient, options, drawKothOfflineBanner(), drawKothProfileBanner(), KothBannerOptions, PEAKS (+15 more)

### Community 48 - "koth/scenes/Screen.tsx"
Cohesion: 0.09
Nodes (37): react, clock(), countdownEnd(), countdown(), rotating(), ScreenKind, shortClock(), STAGE (+29 more)

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
Cohesion: 0.07
Nodes (52): ClipName, RenderClip, ClipPreview(), ClipSettings(), Render(), RenderedFile, SettingsFile, ThemeDraft (+44 more)

### Community 53 - "themes minime_fields.rs"
Cohesion: 0.11
Nodes (27): color_themes_get_base_and_color_fields(), COMBAT_SOUNDS, feature_fields_match_the_typescript_fixture(), MEDIC, minime_base_fields(), minime_color_fields(), MINIME_COMBAT, MINIME_COMMANDS (+19 more)

### Community 54 - "matrix/render.ts"
Cohesion: 0.21
Nodes (14): clamp01(), easeIn(), bannerOptions, matrixClips(), atCut, options, drawFlash(), drawLogo() (+6 more)

### Community 55 - "backup archive.rs"
Cohesion: 0.10
Nodes (12): ARCHIVE_FORMAT, archive_with_all_rows_and_files_matching_checksums_and_no_plaintext(), BACKUPS_VAR, bytes(), copy_hashed(), entries(), EXTENSION, number() (+4 more)

### Community 56 - "handlers/triggers.rs"
Cohesion: 0.17
Nodes (11): help(), HELP_LIMIT, save(), Call, handle(), read_body(), config(), fire() (+3 more)

### Community 57 - "urlaub/render.ts"
Cohesion: 0.13
Nodes (21): beach(), centered(), gradient, options, drawUrlaubOfflineBanner(), drawUrlaubProfileBanner(), palm(), Size (+13 more)

### Community 58 - "profile/mod.rs"
Cohesion: 0.15
Nodes (18): after_shred(), defaults_before_the_first_save(), filled(), HELP, invalid_input_never_lands_in_the_store(), lizard(), MINIMES, neo() (+10 more)

### Community 59 - "matrix/scenes/Chat.tsx"
Cohesion: 0.29
Nodes (14): badgeLabel(), MessageParts(), useChat(), ChatMessage, Chat(), Row(), Chat(), Line() (+6 more)

### Community 60 - "music/mod.rs"
Cohesion: 0.11
Nodes (12): answer(), DEFAULT_LIFETIME_S, neo(), NOW, now(), Player, polls_only_with_an_open_overlay_and_pauses_after_429(), RENEW_EARLY_MS (+4 more)

### Community 61 - "token_keeper.rs"
Cohesion: 0.12
Nodes (14): a_rejected_login_is_reported(), after_stop_nothing_is_saved_and_late_tokens_are_revoked(), Arc<FakeTwitch>, CHECK_SECONDS, FakeTwitch, keeper(), simultaneous_checks_share_one_renewal(), TokenKeeper (+6 more)

### Community 62 - "rst-app/src/settings/mod.rs"
Cohesion: 0.18
Nodes (7): neo(), save_checks_chooses_and_audits(), SaveError, Invalid, Vault, SettingsService<'_, S, K, A>, world()

### Community 63 - "triggers pattern.rs"
Cohesion: 0.10
Nodes (16): linear(), MAX_PATTERN, Pattern, pattern(), PatternError, Invalid, TooLong, Unsupported (+8 more)

### Community 64 - "rst-app/src/backup/mod.rs"
Cohesion: 0.08
Nodes (17): aad(), AuditEntry, AuditLog<A, K>, entries_are_ciphertext_and_unreadable_after_shred(), entries_per_streamer_and_server_newest_first(), entry(), log(), neo() (+9 more)

### Community 65 - "rst-domain paths.rs"
Cohesion: 0.13
Nodes (13): encoded_slash_stays_one_part_and_is_no_media_name(), is_scene_file(), OverlayRoute, Commands, Events, Media, Scene, Settings (+5 more)

### Community 66 - "music music.ts"
Cohesion: 0.15
Nodes (20): useMusic(), useThemeValues(), Marquee(), Props, song, marqueeSeconds(), MusicState, nowPlaying() (+12 more)

### Community 67 - "chat events.rs"
Cohesion: 0.11
Nodes (25): ACTION_END, ACTION_START, alert(), amount(), badge(), CHAT_CHEERMOTE, chat_events(), chat_with_badges_and_emotes() (+17 more)

### Community 68 - "btreemap"
Cohesion: 0.07
Nodes (34): callback_has_session(), changed(), changes_worth_sending(), millis(), only_complete_tokens_with_expiry(), origin(), POLL_MS, progress_moves_only_while_playing() (+26 more)

### Community 69 - "theme.ts"
Cohesion: 0.06
Nodes (36): ThemeValues, FieldBase, MinimeVariantInfo, SCENE_SIZES, SCENES, SettingField, SettingValues, ThemeModule (+28 more)

### Community 70 - "identity oauth.rs"
Cohesion: 0.20
Nodes (7): a_state_returns_its_value_once_and_expires(), above_the_limit_the_oldest_drop_out(), LoginStates, LoginStates<V>, NOW, Pending, same_browser()

### Community 71 - "run.ts"
Cohesion: 0.17
Nodes (17): readBody(), startFakeProviders(), freePort(), main(), report(), runCase(), serverEnv(), ServerUnderTest (+9 more)

### Community 72 - "crypto master.rs"
Cohesion: 0.14
Nodes (10): accepts_32_bytes_in_base64(), debug_never_shows_the_key(), derived_keys_depend_on_purpose_and_master(), encoded(), MASTER_KEY_VAR, MasterKey, MasterKeyError, Missing (+2 more)

### Community 74 - "connection.ts"
Cohesion: 0.10
Nodes (27): splitWords(), channelEmotes(), connect(), events(), fanout, fetchSettings(), loginFromQuery, serverStatus() (+19 more)

### Community 75 - "commands.ts"
Cohesion: 0.05
Nodes (54): cat, extra, kappa, splitEmotes(), army, HELP, list, roles (+46 more)

### Community 76 - "standard/render.ts"
Cohesion: 0.17
Nodes (17): bar(), base(), blob(), options, drawStandardOfflineBanner(), drawStandardProfileBanner(), StandardBannerOptions, write() (+9 more)

### Community 77 - "rules"
Cohesion: 0.22
Nodes (17): commands_at_the_start_case_insensitive(), rules(), chat_keeps_alive_and_reacts(), color_cooldown_and_color_joins(), color_memory_is_limited(), disabled_team_is_reassigned(), full_list_replaces_or_rejects(), join_picks_smallest_team() (+9 more)

### Community 78 - "AsciiGenerator.tsx"
Cohesion: 0.18
Nodes (10): figlet, asciiText(), GLYPHS, font(), AsciiGenerator(), ASCII_FONTS, AsciiFont, asciiLogo() (+2 more)

### Community 79 - "themes registry.rs"
Cohesion: 0.15
Nodes (18): built_in_themes_pass(), assert_same_as_fixture(), assert_same_fields(), normalize(), SAMPLE_LOGINS, samples(), take_fields(), same_as_typescript() (+10 more)

### Community 80 - "plantage stinger.ts"
Cohesion: 0.16
Nodes (16): easeInOut(), atCut, bare, early, first, gradient, options, second (+8 more)

### Community 81 - "themes generatedValues.check.ts"
Cohesion: 0.20
Nodes (4): SoundValue, MatrixValues, StandardValues, UrlaubValues

### Community 82 - "rst-infra/src/render/ffmpeg.rs"
Cohesion: 0.16
Nodes (10): EncodeError, Failed, Missing, TimedOut, exit_codes_time_limit_and_a_missing_program(), Ffmpeg, FFMPEG_VAR, LIMIT (+2 more)

### Community 83 - "media values.rs"
Cohesion: 0.10
Nodes (6): InvalidValue, string_value!, is_word(), MEDIA_EXTENSIONS, MEDIA_STEM_MAX, OutputName

### Community 84 - "triggers mod.rs"
Cohesion: 0.23
Nodes (13): check(), check_action(), compile(), compiled_triggers_match_chat_lines(), good(), limits(), MAX_ACTION_SECONDS, MAX_DESCRIPTION (+5 more)

### Community 85 - "plantage/scenes/Alerts.tsx"
Cohesion: 0.16
Nodes (23): useCover(), PlantageValues, ICONS, LEAF, Alerts(), Card(), describe(), ICONS_BY_KIND (+15 more)

### Community 86 - "chat irc.rs"
Cohesion: 0.12
Nodes (23): emote_positions(), emote_ranges(), emote_url(), EmoteRange, garbage_never_panics(), IRC_URL, kappa(), parse_irc() (+15 more)

### Community 87 - "ports socket.rs"
Cohesion: 0.14
Nodes (4): SocketConnector, TextSocket, WebSockets, WebSocketText

### Community 88 - "handlers render.rs"
Cohesion: 0.19
Nodes (16): status(), text(), allowed(), cancel(), done(), encode(), file(), files() (+8 more)

### Community 89 - "dumpSchema.ts"
Cohesion: 0.24
Nodes (12): features, standard, FEATURES_FILE, featuresText(), FIXTURES, fixtureText(), main(), SAMPLE_LOGINS (+4 more)

### Community 90 - ".start"
Cohesion: 0.11
Nodes (18): a_rejected_login_ends_the_runtime_and_deletes_the_tokens(), broken_profile_does_not_block(), chat_lines_fire_triggers_and_the_help_reply_without_its_echo(), id(), login(), panic_is_contained(), profile_with_tokens(), RESTART_PAUSE (+10 more)

### Community 91 - "encrypted.rs"
Cohesion: 0.06
Nodes (37): changed_data_wrong_owner_or_key_fail(), CryptoError, Decrypt, Encrypt, Random, KEY, NONCE_LEN, open() (+29 more)

### Community 92 - "ServerConfig"
Cohesion: 0.19
Nodes (12): cache_bytes(), ConfigError, Invalid, MasterKey, Missing, lookup(), OAuthApp, ProviderUrls (+4 more)

### Community 93 - "minimes mod.rs"
Cohesion: 0.18
Nodes (16): chat_lines_become_events(), entry(), factions_in_the_file_round_trip_and_old_files_have_none(), is_color(), is_login(), is_variant(), line(), MAX_ROSTER (+8 more)

### Community 94 - "twitch alerts.rs"
Cohesion: 0.23
Nodes (10): Alert, alert(), EVENT_CHEERMOTE, message_text(), number(), sample_alert(), string(), tier() (+2 more)

### Community 95 - "backup archive.rs"
Cohesion: 0.18
Nodes (11): is_backup_id(), count(), filled(), forged(), parse_id(), restore_brings_back_the_state_and_skips_streamers_without_a_key(), Table, tampered_uploads_are_rejected_and_change_nothing() (+3 more)

### Community 96 - "mangos.ts"
Cohesion: 0.24
Nodes (11): MEDIC, MinimeVariantSet, Mango(), names, EXPLOSIVE, findRole(), MANGO, Role (+3 more)

### Community 97 - "handlers events.rs"
Cohesion: 0.11
Nodes (6): PRUNE_EVERY_MS, data(), PING, running(), stream(), test_alert()

### Community 98 - "dumpSchema.ts"
Cohesion: 0.08
Nodes (20): HookInput, input, AUTHORING_TYPES, BAG_NAME_EXCEPTIONS, EM_DASH, failures, files, GENERATED_TYPES (+12 more)

### Community 99 - "MinimeEvent"
Cohesion: 0.18
Nodes (11): MinimeEvent, Ban, Chat, Clear, Color, Join, Kick, Leave (+3 more)

### Community 100 - "Login"
Cohesion: 0.23
Nodes (8): AccessPolicy, is_admin(), Registration, Allowlist, Open, revoked_logins(), Login, StreamerPath

### Community 101 - "channel alerts.rs"
Cohesion: 0.18
Nodes (9): follow(), frame(), KEEPALIVE_GRACE, listen(), RETRY, session(), silence_beyond_the_keepalive_starts_again_and_subscribes_anew(), subscribes_after_welcome_and_keeps_the_subscriptions_on_reconnect() (+1 more)

### Community 102 - "chat.rs"
Cohesion: 0.17
Nodes (9): chat_lines_only_with_the_feature_moderation_always(), lines_become_events_ping_is_answered_and_the_chat_reconnects(), listen(), neo(), NEXT_ID, RECONNECT, relay(), session() (+1 more)

### Community 103 - "config.rs"
Cohesion: 0.12
Nodes (7): DATA_DIR_VAR, DEFAULT_BACKUP_UPLOAD_MB, DEFAULT_DATA_DIR, DEFAULT_MEDIA_MB, DEFAULT_PORT, FILES_VAR, KEY

### Community 104 - "playSound"
Cohesion: 0.17
Nodes (20): mediaUrl(), numberParam(), beep(), playSound(), CHIRP, COMBAT_TONES, NOTE, playChime() (+12 more)

### Community 105 - "minimes roster.rs"
Cohesion: 0.24
Nodes (9): Minimes Package 1: Minime rules (parseColor, parseCommand, applyMinime), Minimes Package 8: Hopping in core, current_id theme id migration (suedfrucht to urlaub, starter to standard), hopPlan(durationMs, hopMs) jump plan, Urlaub Package 1: Minime variants in core, Urlaub Package 2: Theme Suedfrucht (fruit minimes), Urlaub Package 3: Rename suedfrucht to urlaub, Urlaub Package 4: Beach-thing minimes replace fruits (+1 more)

### Community 106 - "koth/settings.check.ts"
Cohesion: 0.08
Nodes (34): minimeTeamColorKey(), minimeTeamLabelKey(), KOTH, KOTH_VALUES, PLANTAGE, PLANTAGE_VALUES, ROLES, THINGS (+26 more)

### Community 107 - "StreamerRepository"
Cohesion: 0.15
Nodes (3): StreamerRepository, StreamerRow, SqliteStreamers

### Community 108 - "tsconfig.json"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, jsx, lib, module, moduleResolution, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 110 - "package.json"
Cohesion: 0.15
Nodes (14): name, private, type, version, eslint, @eslint/js, eslint-plugin-react-hooks, globals (+6 more)

### Community 111 - "twitch eventsub.rs"
Cohesion: 0.20
Nodes (10): DEFAULT_KEEPALIVE_SECONDS, EventSubError, NoMetadata, NotJson, is_twitch_reconnect_url(), parse(), parse_message(), subscriptions() (+2 more)

### Community 112 - "plantage banners.ts"
Cohesion: 0.15
Nodes (17): centered(), gradient, options, crateSign(), CROWN, disc(), drawPlantageOfflineBanner(), drawPlantageProfileBanner() (+9 more)

### Community 113 - "plans PLAN-MINIMES.md"
Cohesion: 0.29
Nodes (3): Minimes Package 3: Server runtime (minimes.json, SSE), Minime state on server (data/streamers/<login>/minimes.json), scripts/rules.check.ts automatic theme rules

### Community 114 - "access/admin.rs"
Cohesion: 0.21
Nodes (12): AccessAdmin<'_, R, S, K, Q, P, A>, AuditRow, json_of(), login(), raw(), revoked_access_ends_every_session_and_is_audited(), saving_at_once_never_mixes_two_changes(), streamer_rows() (+4 more)

### Community 115 - "session.rs"
Cohesion: 0.18
Nodes (8): a_session_resolves_until_it_expires(), log_out_and_disconnect_end_sessions_at_once(), neo(), only_the_hash_is_stored(), SESSION_MS, Sessions, Sessions<P>, SessionToken

### Community 116 - ".complete"
Cohesion: 0.26
Nodes (4): entry(), FakeTwitch, LoginFlow<'_, R, S, K, Q, P, A>, logout_and_disconnect_end_sessions()

### Community 117 - "CODING-RULES.md"
Cohesion: 0.19
Nodes (10): Coding and layout rules, npm run verify, Review checklist, scripts/rules.check.ts rule script, Matrix-Theme, Plan: ein Server, mehrere Streamer, Themes, Einstellungs-Schema, Themes (standard, matrix, urlaub, plantage, koth) (+2 more)

### Community 118 - "package.json"
Cohesion: 0.14
Nodes (14): scripts, build, check, contract, dev, gen:types, lint, prepare (+6 more)

### Community 119 - "rst-app/src/commands/mod.rs"
Cohesion: 0.18
Nodes (5): CommandService, CommandService<'_, S, K, A>, help_setting_and_public_list_by_features(), neo(), public_commands()

### Community 120 - "Clip"
Cohesion: 0.07
Nodes (26): OUTPUT_NAMES, Clip, .ALL, Offline, Profile, Stinger, Format, Gif (+18 more)

### Community 121 - "CompiledTrigger"
Cohesion: 0.50
Nodes (4): Compiled, CompiledTrigger, Trigger, When

### Community 122 - "export_types.rs"
Cohesion: 0.30
Nodes (9): actual(), differences(), expected(), generated_dir(), generated_files_are_current(), HEADER, KEEP, read_tree() (+1 more)

### Community 123 - ".replace"
Cohesion: 0.39
Nodes (3): AccessSettings<P>, initial_policy_then_the_saved_one(), login()

### Community 125 - "access mod.rs"
Cohesion: 0.17
Nodes (11): Feature, Alerts, .ALL, Banners, Chat, Fx, Minimes, Music (+3 more)

### Community 126 - "core emotes.ts"
Cohesion: 0.21
Nodes (12): bttv(), BttvEmote, BttvUser, EmoteEntry, ffz(), FfzEmote, json(), loadEmotes() (+4 more)

### Community 127 - "README.md"
Cohesion: 0.18
Nodes (11): index.html app entry (/src/main.tsx), Chat-Trigger, Dashboard, Zugang und Funktionsstufen (off/beta/all), Minimes, Overlay-Schluessel (?key=), Overlay-Szenen /s/<login>/<scene>, RST - Rezondes Stream Tools (+3 more)

### Community 128 - "App"
Cohesion: 0.08
Nodes (4): App, UploadSlot, serve(), streamer()

### Community 129 - "package.json"
Cohesion: 0.17
Nodes (12): devDependencies, eslint, @eslint/js, eslint-plugin-react-hooks, globals, @types/node, @types/react, @types/react-dom (+4 more)

### Community 131 - "RUST-PLAN.md"
Cohesion: 0.24
Nodes (5): Backups, Audit-Log, Schluessel-Backups (30 days), Package 45: Umstieg (Node server removed), Plan: Rust-Server als einzige Source of Truth

### Community 132 - "plans PLAN-MINIMES.md"
Cohesion: 0.22
Nodes (11): DESIGN.md: Design principles, PLAN-MINIMES.md: Minimes plan, Minimes Package 7: Docs, DESIGN-KOTH.md: King of the Hill design, PLAN-KOTH.md: King of the Hill plan, DESIGN-MATRIX.md: Matrix design, DESIGN-PLANTAGE.md: Suedfrucht-Plantage design, PLAN-PLANTAGE.md: Suedfrucht-Plantage plan (+3 more)

### Community 133 - "rst-server main.rs"
Cohesion: 0.33
Nodes (6): import(), main(), run(), SCHEDULE_EVERY, serve(), USAGE

### Community 134 - "import/mod.rs"
Cohesion: 0.17
Nodes (18): broken_files(), fixture(), fixture_roundtrip(), id_of(), idempotent(), importer(), Importer<R, S, K, F, P>, ImportReport (+10 more)

### Community 135 - "media.rs"
Cohesion: 0.31
Nodes (9): MediaName, audit(), delete(), deliver(), list(), MEDIA_LIMIT, name_of(), upload() (+1 more)

### Community 136 - "texts.de.ts"
Cohesion: 0.21
Nodes (11): accessLosses, losses, next, saved, hasLosses(), removed(), confirmLosses(), AccessPolicy (+3 more)

### Community 137 - "triggers mod.rs"
Cohesion: 0.18
Nodes (11): ActionKind, Media, Text, FxAction, FxEvent, FxPosition, Named, Point (+3 more)

### Community 138 - "twitch alerts.rs"
Cohesion: 0.18
Nodes (10): AlertKind, .ALL, Cheer, Follow, Gift, Hype, Raid, Redeem (+2 more)

### Community 139 - "plans PLAN-MINIMES.md"
Cohesion: 0.32
Nodes (5): Minimes Package 11: Combat (minimeCombat.ts), Minimes Package 12: Fixed slots, KOTH Package 1: Theme King of the Hill, Soldier roles (assault, medic, MG, sniper, grenadier), Plantage Package 1: Theme Suedfrucht-Plantage

### Community 141 - "app.rs"
Cohesion: 0.06
Nodes (20): cookies_http_only_lax_and_secure_with_https(), is_secure_url(), app(), call(), dispatch(), FRAME_CSP, headers(), maintenance_leaves_only_the_dashboard_and_the_admin_area() (+12 more)

### Community 143 - "LoginOutcome"
Cohesion: 0.33
Nodes (5): LoginOutcome, AccountChanged, Failed, NotAllowed, Session

### Community 144 - "keystore_contract.rs"
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

### Community 148 - "FeatureLevel"
Cohesion: 0.40
Nodes (4): FeatureLevel, All, Beta, Off

### Community 149 - "cli mod.rs"
Cohesion: 0.25
Nodes (6): Command, Import, Serve, Usage, Version, parse()

### Community 150 - "ref_node_assert"
Cohesion: 0.08
Nodes (35): bad, good, resolved, schema, checkMedia(), checkValue(), isObject(), isText() (+27 more)

### Community 151 - "triggers schedule.rs"
Cohesion: 0.39
Nodes (4): action(), actions_follow_each_other_and_together_joins_the_previous(), DEFAULT_DURATION, schedule()

### Community 152 - "RUST-PLAN.md"
Cohesion: 0.43
Nodes (4): rst-app crate, rst-domain crate, rst-infra crate, rst-server crate (binary rst)

### Community 153 - "text"
Cohesion: 0.17
Nodes (7): audit(), FX_KEYS, personalize(), reports_every_kind_of_problem(), values_object(), info_fields(), INFO_GROUP

### Community 154 - "DataKey"
Cohesion: 0.06
Nodes (19): backup(), BackupSchedule, HOUR_MS, KEY, MAX_INTERVAL_HOURS, MAX_KEEP, off_never_due_on_after_the_interval(), only_old_automatic_backups_are_surplus() (+11 more)

### Community 156 - "settings.rs"
Cohesion: 0.18
Nodes (7): config(), imports_the_fixture_twice_into_sqlite(), StoreConfig, save(), schemas(), settings(), SETTINGS_LIMIT

### Community 158 - "docs PLAN-KOTH.md"
Cohesion: 0.29
Nodes (6): Minimes Package 10: Factions, Minimes Package 9: Remove TS mirror of minime rules, KOTH hill holder display (flag in faction color), KOTH factions BLUFOR, OPFOR, INDFOR, normalizeName (lowercase, umlauts, no spaces/hyphens), Minime factions (minimeTeams, shownTeam, teamCounts)

### Community 161 - "workflows docker.yml"
Cohesion: 0.40
Nodes (6): Docker-Image Workflow, image job (ghcr.io publish), verify job (npm run verify + contract), npm run contract, Vertragstests (Package 4), Fake-Provider Twitch/Spotify (Package 3)

### Community 162 - "EventSubMessage"
Cohesion: 0.25
Nodes (7): EventSubMessage, Alert, Ignored, Offline, Reconnect, Revocation, Welcome

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

### Community 200 - "rst-app/src/backup/keys.rs"
Cohesion: 0.17
Nodes (6): EVERY_MS, KeyBackupStore, MemoryKeyBackups, one_copy_a_day_and_none_older_than_thirty_days(), RETENTION_MS, run_key_backups()

### Community 201 - "matrix/banners.ts"
Cohesion: 0.19
Nodes (15): blink(), Call, empty, full, options, quiet, values, drawOfflineBanner() (+7 more)

### Community 202 - "tokens.rs"
Cohesion: 0.33
Nodes (5): CHAT_SCOPE, only_complete_tokens(), SCOPES, to_tokens(), tokens()

### Community 209 - "typing.check.ts"
Cohesion: 0.17
Nodes (11): TerminalTiming, useTerminal(), fast, normal, paused, smashed, Frame, frames() (+3 more)

### Community 210 - "rst-app/src/triggers/mod.rs"
Cohesion: 0.21
Nodes (5): invalid_lists_change_nothing_valid_ones_are_audited(), neo(), TriggerName, TriggerService, TriggerService<'_, S, K, A>

### Community 211 - "rst-infra/src/backup/keys.rs"
Cohesion: 0.26
Nodes (4): copies_without_shredded_keys_and_deleted_after_thirty_days(), delete_waits_for_a_copy_held_open_by_another_process(), FolderKeyBackups, KEY_BACKUPS_VAR

### Community 212 - "library.rs"
Cohesion: 0.20
Nodes (4): MB, one_upload_per_streamer(), triggers_using(), UploadSlots

### Community 213 - "identity/values.rs"
Cohesion: 0.18
Nodes (3): LOGIN_MAX, streamer_id_is_hex_of_16_bytes(), USER_ID_MAX

### Community 214 - "streamerPath.ts"
Cohesion: 0.39
Nodes (7): base(), traversal, decodeAll(), isLogin(), isMediaName(), parse(), StreamerPath

### Community 215 - "duration"
Cohesion: 0.40
Nodes (3): DELETE_ATTEMPTS, DELETE_PAUSE, remove_patiently()

## Ambiguous Edges - Review These
- `Non-media fixture file in import test data` → `rst import (Package 24)`  [AMBIGUOUS]
  server-rs/crates/rst-app/tests/fixtures/data/streamers/neo/media/notes.txt · relation: conceptually_related_to

## Knowledge Gaps
- **209 isolated node(s):** `AccountChanged`, `Vault`, `eslint`, `@types/node`, `@types/react` (+204 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1326 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **44 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `scripts` connect `package.json` to `package.json`?**
  _High betweenness centrality (0.445) - this node is a cross-community bridge._
- **What connects `AccountChanged`, `Vault`, `eslint` to the rest of the system?**
  _209 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `RecordStore` be split into smaller, more focused modules?**
  _Cohesion score 0.12333333333333334 - nodes in this community are weakly interconnected._
- **Why does `check` connect `package.json` to `backup archive.rs`?**
  _High betweenness centrality (0.444) - this node is a cross-community bridge._
- **Should `delete.rs` be split into smaller, more focused modules?**
  _Cohesion score 0.04810126582278481 - nodes in this community are weakly interconnected._
- **Why does `react` connect `koth/scenes/Screen.tsx` to `useMinimes.ts`, `urlaub/scenes/Alerts.tsx`, `eventLog.ts`, `useMatrix`, `plantage/scenes/Minimes.tsx`, `Field.tsx`, `KOTH Hill Shapes`, `Urlaub Beach Shapes`, `Effects Overlay`, `Admin.tsx`, `Triggers.tsx`, `dashboard obsSetup.ts`, `ThemeSettings.tsx`, `matrix/scenes/Chat.tsx`, `music music.ts`, `theme.ts`, `connection.ts`, `commands.ts`, `AsciiGenerator.tsx`, `typing.check.ts`, `plantage/scenes/Alerts.tsx`, `koth/settings.check.ts`, `package.json`?**
  _High betweenness centrality (0.424) - this node is a cross-community bridge._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Non-media fixture file in import test data` and `rst import (Package 24)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._