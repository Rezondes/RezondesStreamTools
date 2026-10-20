# Graph Report - RezondesStream  (2026-10-20)

## Corpus Check
- 561 files · ~333,730 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 27 file(s) not represented in the graph (top: .css 17, (none) 6, .toml 2)

## Summary
- 5269 nodes · 14285 edges · 206 communities (165 shown, 41 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 573 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4e1c8840`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- readMinimeOptions
- archive.rs
- RecordStore
- super
- bears/settings.ts
- types.ts
- Track
- connection.ts
- TwitchTokens
- minimeFields.ts
- identity/streamers.rs
- rst-app/src/access/mod.rs
- Rust Setting Field Builders
- hash
- rst-domain/src/triggers/mod.rs
- Backup Schedule
- Rust Minime Combat Fields
- help.rs
- ProviderError
- pattern.rs
- import/mod.rs
- StreamerId
- hill.ts
- channel/triggers.rs
- KOTH Rust Schema
- Rust Minime Variants
- Rust Minime Rules and ASCII
- bears/scenes/Alerts.tsx
- Settings Validation
- react
- Urlaub Beach Shapes
- app.rs
- auth.rs
- rst-domain/src/commands/mod.rs
- Effects Overlay
- restore.rs
- minimeBehavior.ts
- text
- ZipBackups
- client.ts
- paint.ts
- bears/banners.ts
- Runtime Registry
- roster.rs
- Minime Chat Commands
- main.tsx
- rst-server routes.rs
- koth/render.ts
- settings.rs
- themes standard.rs
- settings file.rs
- dashboard obsSetup.ts
- ThemeSettings.tsx
- themes minime_fields.rs
- rig.ts
- dumpSchema.ts
- themes/audit.rs
- urlaub/render.ts
- BearTower.tsx
- irc.rs
- music/mod.rs
- bears/stinger.ts
- Triggers.tsx
- media/values.rs
- useMinimes.ts
- rst-domain/src/access/mod.rs
- useMatrix
- chat/events.rs
- rst-domain/src/spotify/mod.rs
- World.tsx
- identity/oauth.rs
- cooldowns.rs
- errorCodes.ts
- Admin.tsx
- paths.rs
- soldiers.ts
- standard/render.ts
- rst-app/src/backup/keys.rs
- SettingInput.tsx
- Theme
- plantage/stinger.ts
- plantage/banners.ts
- minimeStack.check.ts
- rst-infra/src/render/ffmpeg.rs
- src/events.rs
- login.rs
- StoreError
- ports socket.rs
- ServerConfig
- rules.rs
- rules
- encrypted.rs
- Plan: Theme-Einstellungen neu gestalten (Einfach und Erweitert)
- minimes mod.rs
- twitch alerts.rs
- chat.rs
- matrix/banners.ts
- handlers events.rs
- types.ts
- master.rs
- RenderJobs
- channel alerts.rs
- urlaub/settings.ts
- SceneName
- wiring.rs
- Plan: Theme "Bärenbande"
- SqliteStreamers
- ref_node_assert
- tsconfig.json
- theme_values.rs
- package.json
- twitch eventsub.rs
- bears.rs
- theme.ts
- FxAction
- server_error
- BackupStore
- CODING-RULES.md
- package.json
- rules.check.ts
- Format
- SpotifyPlayer<A, S, K>
- export_types.rs
- TwitchTokens
- Dashboard.tsx
- render.rs
- useMinimes.ts
- README.md
- icons.ts
- package.json
- matrix/stinger.ts
- RUST-PLAN.md
- plans PLAN-MINIMES.md
- main.rs
- SettingField.ts
- media.rs
- streamerPath.ts
- text
- twitch alerts.rs
- Minimes Package 2: Scene, feature and settings (readMinimeOptions, hasMinimes)
- EventSubMessage
- guard.rs
- minimes roster.rs
- duration
- docker-compose.yml
- Stinger and banners as pure functions of time
- Minimes Package 11: Combat (minimeCombat.ts)
- alerts.check.ts
- rst-app/src/media/mod.rs
- triggers/schedule.rs
- RUST-PLAN.md
- config.rs
- render clips.rs
- runtime.rs
- DESIGN.md
- jobs.rs
- bears/scenes/Minimes.tsx
- scripts migrate.sh
- tests dependencies.rs
- vite.config.ts
- package.json
- rst-app Cargo.toml
- DESIGN.md
- THEMES.md
- DESIGN.md
- media lizard.gif
- docs DESIGN-STANDARD.md
- RenderError
- Overlays: everything configurable, no fixed value (rule 20)
- StaticError
- MinimeEvent
- lookup.rs
- emotes.ts
- library.rs
- Plan: Theme "Bärenbande"
- Clip
- Command
- plantage/scenes/Minimes.tsx

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
- `Tests (TDD)` --references--> `basic()`  [INFERRED]
  plans/PLAN-SETTINGS.md → src/core/fields.ts
- `Annahmen` --references--> `groupsForView()`  [INFERRED]
  plans/PLAN-SETTINGS.md → src/dashboard/settingsForm.ts
- `Package 1: Merkmal "einfach" im TS-Schema und Formular-Logik` --references--> `inScene()`  [INFERRED]
  plans/PLAN-SETTINGS.md → src/core/fields.ts
- `Acceptance Criteria` --references--> `basic()`  [INFERRED]
  plans/PLAN-SETTINGS.md → src/core/fields.ts
- `Umsetzungsschritte` --references--> `basic()`  [INFERRED]
  plans/PLAN-SETTINGS.md → src/core/fields.ts

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

## Communities (206 total, 41 thin omitted)

### Community 0 - "readMinimeOptions"
Cohesion: 0.08
Nodes (32): army, HELP, list, roles, teams, TRIGGERS, CommandItem, commandList (+24 more)

### Community 1 - "archive.rs"
Cohesion: 0.10
Nodes (14): BACKUPS_VAR, bytes(), copy_hashed(), count(), entries(), EXTENSION, forged(), number() (+6 more)

### Community 2 - "RecordStore"
Cohesion: 0.12
Nodes (6): RecordStore, StoredRecord, SqliteRecords, contract_tests!, sqlite(), streamer()

### Community 3 - "super"
Cohesion: 0.04
Nodes (52): AccessAdmin, AccessAdmin<'_, R, S, K, Q, P, A>, AuditRow, json_of(), login(), raw(), revoked_access_ends_every_session_and_is_audited(), saving_at_once_never_mixes_two_changes() (+44 more)

### Community 4 - "bears/settings.ts"
Cohesion: 0.04
Nodes (87): alertSoundFields(), KINDS, tier(), asciiText(), GLYPHS, BADGE_KEYS, badgeFields(), labels (+79 more)

### Community 5 - "types.ts"
Cohesion: 0.06
Nodes (76): alertQuote(), alertVars(), describeAlert(), lineKey(), useAlertSounds(), mediaUrl(), QueuedAlert, useAlerts() (+68 more)

### Community 6 - "Track"
Cohesion: 0.20
Nodes (13): useMusic(), song, marqueeSeconds(), MusicState, nowPlaying(), trackClock(), trackProgress(), useCover() (+5 more)

### Community 7 - "connection.ts"
Cohesion: 0.07
Nodes (44): cat, extra, kappa, splitEmotes(), splitWords(), channelEmotes(), connect(), events() (+36 more)

### Community 8 - "TwitchTokens"
Cohesion: 0.07
Nodes (11): FakeTwitch, Arc<FakeTwitch>, ChatSender, EventSubscriber, ProviderError, Said, MissingScope, Sent (+3 more)

### Community 9 - "minimeFields.ts"
Cohesion: 0.06
Nodes (48): key(), defaults, probe, probeSet, COMBAT_SOUNDS, command(), hasMinimes(), MINIME_BASE_FIELDS (+40 more)

### Community 10 - "identity/streamers.rs"
Cohesion: 0.14
Nodes (15): a_rename_keeps_the_profile(), id(), list_leaves_out_shredded_streamers(), login(), PROFILE_KIND, register_and_find(), RegisterError, AccountChanged (+7 more)

### Community 11 - "rst-app/src/access/mod.rs"
Cohesion: 0.10
Nodes (9): AccessSettings, AccessSettings<P>, initial_policy_then_the_saved_one(), KEY, login(), Importer, ServerSettingsStore, put_replaces_and_get_reads() (+1 more)

### Community 12 - "Rust Setting Field Builders"
Cohesion: 0.07
Nodes (52): ascii_art(), ascii_art_is_a_textarea_with_generator_flag(), basic(), basic_is_written_only_when_set(), basic_only_adds_the_flag(), choice(), color(), field() (+44 more)

### Community 13 - "hash"
Cohesion: 0.08
Nodes (48): hash(), seedOf(), ScreenKind, markerStyle(), Blob, blobs(), shapes, star (+40 more)

### Community 14 - "rst-domain/src/triggers/mod.rs"
Cohesion: 0.19
Nodes (17): check(), check_action(), compile(), Compiled, compiled_triggers_match_chat_lines(), CompiledTrigger, good(), limits() (+9 more)

### Community 15 - "Backup Schedule"
Cohesion: 0.06
Nodes (29): BackupError, Busy, Invalid, NotFound, Store, Backups, backups(), Backups<B, A, K> (+21 more)

### Community 16 - "Rust Minime Combat Fields"
Cohesion: 0.07
Nodes (42): combat(), combat_fields_are_opt_in_without_medic_durations(), minime_aim_key(), minime_combat_fields(), minime_fire_key(), alerts(), ALERTS, BANNER (+34 more)

### Community 17 - "help.rs"
Cohesion: 0.19
Nodes (7): a_missing_scope_is_remembered_and_the_config_can_change(), help(), HelpResponder, line(), lock(), replies_once_per_cooldown_and_ignores_its_echo(), ChatLine

### Community 18 - "ProviderError"
Cohesion: 0.09
Nodes (13): FakeSpotify, Playing, Answer, Limited, Nothing, Unauthorized, SpotifyApi, TokenAnswer (+5 more)

### Community 19 - "pattern.rs"
Cohesion: 0.10
Nodes (16): linear(), MAX_PATTERN, Pattern, pattern(), PatternError, Invalid, TooLong, Unsupported (+8 more)

### Community 20 - "import/mod.rs"
Cohesion: 0.06
Nodes (40): broken_files(), fixture(), fixture_roundtrip(), id_of(), idempotent(), importer(), Importer<R, S, K, F, P>, ImportReport (+32 more)

### Community 21 - "StreamerId"
Cohesion: 0.05
Nodes (29): aad(), AuditLog<A, K>, is_key(), OverlayKeys<S, K>, MediaLibrary<S, K, F>, Shelf, Media, Render (+21 more)

### Community 22 - "hill.ts"
Cohesion: 0.09
Nodes (41): countdown(), rotating(), shortClock(), STAGE, stageScale(), useScreen(), useStage(), Kontext (+33 more)

### Community 23 - "channel/triggers.rs"
Cohesion: 0.21
Nodes (8): compiled(), fire_ignores_the_cooldown_and_replace_takes_effect(), line(), lock(), matching_lines_fire_in_the_planned_order_with_cooldowns(), neo(), rules(), TriggerRunner

### Community 24 - "KOTH Rust Schema"
Cohesion: 0.08
Nodes (38): alerts(), ALERTS, BANNER, BASIC, CAM, capital(), CHAT, chat_cam_music_fx() (+30 more)

### Community 25 - "Rust Minime Variants"
Cohesion: 0.09
Nodes (28): ALERTS, BANNER, BASIC, BEACH, BEACH_THINGS, CAM, capital(), CHAT (+20 more)

### Community 26 - "Rust Minime Rules and ASCII"
Cohesion: 0.07
Nodes (29): ascii_text(), ROWS, alert_sound_fields(), badge_fields(), badge_texts_default_to_the_abbreviation(), one_sound_per_alert_kind_and_fade_out(), ALERTS, BANNER (+21 more)

### Community 27 - "bears/scenes/Alerts.tsx"
Cohesion: 0.10
Nodes (36): Bear(), BearFigure(), BodyBlob(), FigureProps, safeId(), BearId, BearTower(), Hero() (+28 more)

### Community 28 - "Settings Validation"
Cohesion: 0.11
Nodes (31): check_lines(), check_media(), check_sound(), check_text(), check_value(), codes(), defaults_of_all_building_blocks_pass(), extensions() (+23 more)

### Community 29 - "react"
Cohesion: 0.13
Nodes (16): Annahmen, react, Props, useOverflow(), screenScenes(), ThemeView, kothView, Screen (+8 more)

### Community 30 - "Urlaub Beach Shapes"
Cohesion: 0.12
Nodes (33): Marquee(), Beach(), shapes, star, circle(), CLOUD, GULL, ICON_NAMES (+25 more)

### Community 31 - "app.rs"
Cohesion: 0.04
Nodes (20): UploadSlots, App, app(), call(), dispatch(), FRAME_CSP, headers(), maintenance_leaves_only_the_dashboard_and_the_admin_area() (+12 more)

### Community 32 - "auth.rs"
Cohesion: 0.11
Nodes (20): cookie(), cookies_http_only_lax_and_secure_with_https(), is_secure_url(), oauth_state_cookie(), OAUTH_STATE_SECONDS, session_cookie(), SESSION_DAYS, redirect() (+12 more)

### Community 33 - "rst-domain/src/commands/mod.rs"
Cohesion: 0.10
Nodes (32): command_list(), CommandItem, Help, Join, Leave, Look, Team, Trigger (+24 more)

### Community 34 - "Effects Overlay"
Cohesion: 0.13
Nodes (32): FX_KEYS, fxDefaults(), FxSettings, useFxItem(), useFxScene(), FxMedia(), ShownFx, useFx() (+24 more)

### Community 35 - "restore.rs"
Cohesion: 0.13
Nodes (28): ArchiveError, Invalid, NotFound, Store, ARCHIVE_FORMAT, allowed_name(), bytes(), check() (+20 more)

### Community 36 - "minimeBehavior.ts"
Cohesion: 0.15
Nodes (26): tick(), advance(), area(), at(), actor(), demoTeams, STAGE, still (+18 more)

### Community 37 - "text"
Cohesion: 0.16
Nodes (19): json(), server_error(), access(), ACCESS_LIMIT, audit(), AUDIT_LIMIT, delete_streamer(), save_access() (+11 more)

### Community 38 - "ZipBackups"
Cohesion: 0.23
Nodes (7): archive_with_all_rows_and_files_matching_checksums_and_no_plaintext(), filled(), parse_id(), restore_brings_back_the_state_and_skips_streamers_without_a_key(), tampered_uploads_are_rejected_and_change_nothing(), ZipBackups, migration()

### Community 39 - "client.ts"
Cohesion: 0.05
Nodes (90): ACCOUNT_CASES, ALERT_CASES, Subscription, AUTH_CASES, BACKUP_CASES, Listing, CHAT_CASES, chatLine() (+82 more)

### Community 40 - "paint.ts"
Cohesion: 0.10
Nodes (32): BearsValues, BodyShape, PartKind, TOWER, BearColors, cache, feet, gradient (+24 more)

### Community 41 - "bears/banners.ts"
Cohesion: 0.09
Nodes (28): ASLEEP, AWAKE, BearsBannerOptions, card(), drawBearsOfflineBanner(), drawBearsProfileBanner(), EVENING, fairyLights() (+20 more)

### Community 42 - "Runtime Registry"
Cohesion: 0.11
Nodes (13): a_restart_stops_the_old_runtime(), Entries, Fake, held(), id(), locked_or_stopped_starts_are_discarded(), NEXT, nothing_to_start_and_runtimes_that_ended_themselves() (+5 more)

### Community 43 - "roster.rs"
Cohesion: 0.16
Nodes (27): allowed_teams(), allowed_variants(), apply(), chat(), entry(), join(), join_leave_and_come_back_with_the_remembered_color(), logins() (+19 more)

### Community 44 - "Minime Chat Commands"
Cohesion: 0.10
Nodes (28): channels(), find_variant(), has_role(), HEX, is_login(), join(), join_choice(), join_reads_role_and_faction_in_any_order() (+20 more)

### Community 45 - "main.tsx"
Cohesion: 0.13
Nodes (15): ThemeValues, applySkin(), root, stored, rememberedSkin(), Skin, skinOf(), SKINS (+7 more)

### Community 46 - "rst-server routes.rs"
Cohesion: 0.13
Nodes (19): all_on(), authorize(), Guard, Admin, Public, Session, routes!, MUSIC (+11 more)

### Community 47 - "koth/render.ts"
Cohesion: 0.10
Nodes (23): battlefield(), centered(), gradient, options, drawKothOfflineBanner(), drawKothProfileBanner(), KothBannerOptions, PEAKS (+15 more)

### Community 48 - "settings.rs"
Cohesion: 0.18
Nodes (11): Call, handle(), read_body(), save(), schemas(), settings(), SETTINGS_LIMIT, find() (+3 more)

### Community 49 - "themes standard.rs"
Cohesion: 0.10
Nodes (24): alerts(), ALERTS, BANNER, BASIC, CAM, CHAT, chat_cam_music(), FONTS (+16 more)

### Community 50 - "settings file.rs"
Cohesion: 0.14
Nodes (24): broken_unknown_and_renamed_files(), current_id(), first_login_personalizes_every_theme(), first_settings(), minime_rules_from_the_chosen_theme(), minime_rules_of(), OLD_DEFAULTS, old_defaults_are_replaced_and_own_values_stay() (+16 more)

### Community 51 - "dashboard obsSetup.ts"
Cohesion: 0.12
Nodes (25): OBS_SCENES, importViaWebSocket(), ObsError, ObsImport(), ObsMessage, browserSettings(), collection, layout (+17 more)

### Community 52 - "ThemeSettings.tsx"
Cohesion: 0.06
Nodes (60): Acceptance Criteria, Kontext, Out of Scope, Package 2: Neues Layout der Theme-Seite, Tests (TDD), Umsetzungsschritte, Umsetzungsschritte, ScenePreview() (+52 more)

### Community 53 - "themes minime_fields.rs"
Cohesion: 0.09
Nodes (35): bears(), color_themes_get_base_and_color_fields(), COMBAT_SOUNDS, default_of(), feature_fields_match_the_typescript_fixture(), MEDIC, minime_base_fields(), minime_color_fields() (+27 more)

### Community 54 - "rig.ts"
Cohesion: 0.04
Nodes (77): BearChoice, BEARS, CLOSED_MOUTH, CUP_FAR, CUP_NEAR, dot(), EAR_CENTERS, FOUR_BACK_LINE (+69 more)

### Community 55 - "dumpSchema.ts"
Cohesion: 0.23
Nodes (13): features, standard, FEATURES_FILE, featuresText(), FIXTURES, fixtureText(), main(), SAMPLE_LOGINS (+5 more)

### Community 56 - "themes/audit.rs"
Cohesion: 0.13
Nodes (8): audit(), built_in_themes_pass(), FX_KEYS, personalize(), reports_every_kind_of_problem(), values_object(), info_fields(), INFO_GROUP

### Community 57 - "urlaub/render.ts"
Cohesion: 0.13
Nodes (21): beach(), centered(), gradient, options, drawUrlaubOfflineBanner(), drawUrlaubProfileBanner(), palm(), Size (+13 more)

### Community 58 - "BearTower.tsx"
Cohesion: 0.13
Nodes (15): TOWER_LEVELS, LEFT, LEVELS, TOP, Acceptance Criteria, Einstellungen, Gestaltung, Kontext (+7 more)

### Community 59 - "irc.rs"
Cohesion: 0.13
Nodes (21): emote_positions(), emote_ranges(), emote_url(), EmoteRange, garbage_never_panics(), IRC_URL, kappa(), parse_irc() (+13 more)

### Community 60 - "music/mod.rs"
Cohesion: 0.11
Nodes (12): answer(), DEFAULT_LIFETIME_S, neo(), NOW, now(), Player, polls_only_with_an_open_overlay_and_pauses_after_429(), RENEW_EARLY_MS (+4 more)

### Community 61 - "bears/stinger.ts"
Cohesion: 0.11
Nodes (27): isBearChoice(), Palette, pawX(), bearsClips(), paletteOf(), worldOf(), BearsStingerOptions, early (+19 more)

### Community 62 - "Triggers.tsx"
Cohesion: 0.16
Nodes (19): post(), ActionRow(), ActionTiming(), AudienceRows(), CardProps, newAction(), newTrigger(), NumberField() (+11 more)

### Community 63 - "media/values.rs"
Cohesion: 0.10
Nodes (6): InvalidValue, string_value!, is_word(), MEDIA_EXTENSIONS, MEDIA_STEM_MAX, OutputName

### Community 64 - "useMinimes.ts"
Cohesion: 0.12
Nodes (19): Combat, nextEnd(), Cast, cast, find(), options(), own, stage (+11 more)

### Community 65 - "rst-domain/src/access/mod.rs"
Cohesion: 0.09
Nodes (34): AccessPolicy, admins(), allowlist_only_admins_and_listed_logins(), beta_policy(), Feature, Alerts, .ALL, Banners (+26 more)

### Community 66 - "useMatrix"
Cohesion: 0.08
Nodes (40): emoji, standard, glyph(), GLYPHS, useDecode(), useNow(), TerminalTiming, useTerminal() (+32 more)

### Community 67 - "chat/events.rs"
Cohesion: 0.10
Nodes (26): relay(), ACTION_END, ACTION_START, alert(), amount(), badge(), CHAT_CHEERMOTE, chat_events() (+18 more)

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

### Community 72 - "errorCodes.ts"
Cohesion: 0.14
Nodes (12): ERROR_CODES, ErrorCode, REQUEST_ERROR_CODES, SETTING_ERROR_CODES, codeArms, handlers, missing, rust (+4 more)

### Community 73 - "Admin.tsx"
Cohesion: 0.07
Nodes (49): isErrorCode(), accessLosses, losses, next, saved, hasLosses(), removed(), AccessDraft (+41 more)

### Community 74 - "paths.rs"
Cohesion: 0.11
Nodes (14): encoded_slash_stays_one_part_and_is_no_media_name(), is_scene_file(), OverlayRoute, Commands, Events, Media, Scene, Settings (+6 more)

### Community 75 - "soldiers.ts"
Cohesion: 0.09
Nodes (31): MEDIC, variantRules(), normalizeName(), SPELLED, MinimeVariantSet, audit, keys, REQUIRED (+23 more)

### Community 76 - "standard/render.ts"
Cohesion: 0.17
Nodes (17): bar(), base(), blob(), options, drawStandardOfflineBanner(), drawStandardProfileBanner(), StandardBannerOptions, write() (+9 more)

### Community 77 - "rst-app/src/backup/keys.rs"
Cohesion: 0.17
Nodes (6): EVERY_MS, KeyBackupStore, MemoryKeyBackups, one_copy_a_day_and_none_older_than_thirty_days(), RETENTION_MS, run_key_backups()

### Community 78 - "SettingInput.tsx"
Cohesion: 0.17
Nodes (16): MEDIA_KIND, AsciiGenerator(), ASCII_FONTS, AsciiFont, asciiLogo(), FONTS, AsciiGenerator, asText() (+8 more)

### Community 79 - "Theme"
Cohesion: 0.12
Nodes (18): export_all(), export_config(), default_theme(), assert_same_as_fixture(), assert_same_fields(), normalize(), SAMPLE_LOGINS, samples() (+10 more)

### Community 80 - "plantage/stinger.ts"
Cohesion: 0.18
Nodes (15): atCut, bare, early, first, gradient, options, second, drawPlantageStinger() (+7 more)

### Community 81 - "plantage/banners.ts"
Cohesion: 0.15
Nodes (17): centered(), gradient, options, crateSign(), CROWN, disc(), drawPlantageOfflineBanner(), drawPlantageProfileBanner() (+9 more)

### Community 82 - "minimeStack.check.ts"
Cohesion: 0.13
Nodes (20): useTowers(), Tower, advanceStacks(), find(), options(), stage, themes, landOffset() (+12 more)

### Community 83 - "rst-infra/src/render/ffmpeg.rs"
Cohesion: 0.16
Nodes (10): EncodeError, Failed, Missing, TimedOut, exit_codes_time_limit_and_a_missing_program(), Ffmpeg, FFMPEG_VAR, LIMIT (+2 more)

### Community 84 - "src/events.rs"
Cohesion: 0.05
Nodes (30): commands_change_the_list_saves_are_batched_and_survive_a_restart(), line(), MinimeRunner, MinimeRunner<S, K>, neo(), profile(), PRUNE_EVERY, Roster (+22 more)

### Community 85 - "login.rs"
Cohesion: 0.08
Nodes (15): LoginOutcome, AccountChanged, Failed, NotAllowed, Session, a_session_resolves_until_it_expires(), log_out_and_disconnect_end_sessions_at_once(), neo() (+7 more)

### Community 86 - "StoreError"
Cohesion: 0.04
Nodes (20): random_bytes(), StoredEntry, FileStore, FileWriter, DataKey, StoreError, SessionStore, StreamerRepository (+12 more)

### Community 87 - "ports socket.rs"
Cohesion: 0.14
Nodes (4): SocketConnector, TextSocket, WebSockets, WebSocketText

### Community 88 - "ServerConfig"
Cohesion: 0.19
Nodes (12): cache_bytes(), ConfigError, Invalid, MasterKey, Missing, lookup(), OAuthApp, ProviderUrls (+4 more)

### Community 89 - "rules.rs"
Cohesion: 0.17
Nodes (18): command(), defaults_without_saved_values(), factions_only_with_variants_and_variant_names_first(), flag(), invalid_values_give_the_defaults(), minime_rules(), MinimeCommands, MinimeRules (+10 more)

### Community 90 - "rules"
Cohesion: 0.22
Nodes (17): commands_at_the_start_case_insensitive(), rules(), chat_keeps_alive_and_reacts(), color_cooldown_and_color_joins(), color_memory_is_limited(), disabled_team_is_reassigned(), full_list_replaces_or_rejects(), join_picks_smallest_team() (+9 more)

### Community 91 - "encrypted.rs"
Cohesion: 0.06
Nodes (37): changed_data_wrong_owner_or_key_fail(), CryptoError, Decrypt, Encrypt, Random, KEY, NONCE_LEN, open() (+29 more)

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
Cohesion: 0.18
Nodes (8): chat_lines_only_with_the_feature_moderation_always(), lines_become_events_ping_is_answered_and_the_chat_reconnects(), listen(), neo(), NEXT_ID, RECONNECT, session(), anonymous_login()

### Community 96 - "matrix/banners.ts"
Cohesion: 0.16
Nodes (20): MatrixValues, bannerOptions, blink(), Call, empty, full, options, quiet (+12 more)

### Community 97 - "handlers events.rs"
Cohesion: 0.16
Nodes (5): data(), PING, running(), stream(), test_alert()

### Community 98 - "types.ts"
Cohesion: 0.08
Nodes (40): badgeLabel(), MessageParts(), useChat(), add(), alertText(), many, one, run() (+32 more)

### Community 99 - "master.rs"
Cohesion: 0.17
Nodes (9): accepts_32_bytes_in_base64(), debug_never_shows_the_key(), derived_keys_depend_on_purpose_and_master(), encoded(), MASTER_KEY_VAR, MasterKeyError, Missing, NotBase64 (+1 more)

### Community 100 - "RenderJobs"
Cohesion: 0.38
Nodes (3): encoding_answers_busy_until_done(), Job, RenderJobs

### Community 101 - "channel alerts.rs"
Cohesion: 0.18
Nodes (9): follow(), frame(), KEEPALIVE_GRACE, listen(), RETRY, session(), silence_beyond_the_keepalive_starts_again_and_subscribes_anew(), subscribes_after_welcome_and_keeps_the_subscriptions_on_reconnect() (+1 more)

### Community 102 - "urlaub/settings.ts"
Cohesion: 0.07
Nodes (27): color(), SoundValue, KothValues, StandardValues, UrlaubValues, BeachThing(), BEACH_THINGS, BeachThing (+19 more)

### Community 103 - "SceneName"
Cohesion: 0.10
Nodes (16): MinimeVariantInfo, MinimeVariantSet, SceneName, Alerts, .ALL, Brb, Cam, Chat (+8 more)

### Community 104 - "wiring.rs"
Cohesion: 0.04
Nodes (37): ScheduleSettings, seal(), copies_without_shredded_keys_and_deleted_after_thirty_days(), delete_waits_for_a_copy_held_open_by_another_process(), FolderKeyBackups, KEY_BACKUPS_VAR, MasterKey, DATA_DB_VAR (+29 more)

### Community 105 - "Plan: Theme "Bärenbande""
Cohesion: 0.29
Nodes (8): music(), Acceptance Criteria, Gestaltung, Out of Scope, Package 2: Overlays, Tests (TDD), Umsetzungsschritte, point()

### Community 107 - "ref_node_assert"
Cohesion: 0.05
Nodes (45): figlet, bad, good, resolved, schema, checkMedia(), checkValue(), isObject() (+37 more)

### Community 108 - "tsconfig.json"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, jsx, lib, module, moduleResolution, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 109 - "theme_values.rs"
Cohesion: 0.21
Nodes (3): one_readonly_key_per_field_with_its_type(), ts_type(), values_type()

### Community 110 - "package.json"
Cohesion: 0.15
Nodes (14): name, private, type, version, eslint, @eslint/js, eslint-plugin-react-hooks, globals (+6 more)

### Community 111 - "twitch eventsub.rs"
Cohesion: 0.20
Nodes (10): DEFAULT_KEEPALIVE_SECONDS, EventSubError, NoMetadata, NotJson, is_twitch_reconnect_url(), parse(), parse_message(), subscriptions() (+2 more)

### Community 112 - "bears.rs"
Cohesion: 0.08
Nodes (28): ALERTS, BANNER, BASIC, BEAR_IDS, BEARS, bears(), CAM, capital() (+20 more)

### Community 113 - "theme.ts"
Cohesion: 0.08
Nodes (40): Acceptance Criteria, Kontext, Out of Scope, Package 1: Szenen und Clips ohne Vererbung, Plan: Szenen ohne Vererbung, Tests (TDD), Umsetzungsschritte, Überblick (+32 more)

### Community 114 - "FxAction"
Cohesion: 0.18
Nodes (11): ActionKind, Media, Text, FxAction, FxEvent, FxPosition, Named, Point (+3 more)

### Community 115 - "server_error"
Cohesion: 0.28
Nodes (14): now_ms(), actor(), create(), delete(), download(), failed(), id_of(), list() (+6 more)

### Community 117 - "CODING-RULES.md"
Cohesion: 0.19
Nodes (10): Coding and layout rules, npm run verify, Review checklist, scripts/rules.check.ts rule script, Matrix-Theme, Plan: ein Server, mehrere Streamer, Themes, Einstellungs-Schema, Themes (standard, matrix, urlaub, plantage, koth) (+2 more)

### Community 118 - "package.json"
Cohesion: 0.14
Nodes (14): scripts, build, check, contract, dev, gen:types, lint, prepare (+6 more)

### Community 119 - "rules.check.ts"
Cohesion: 0.07
Nodes (26): HookInput, input, AUTHORING_TYPES, BAG_NAME_EXCEPTIONS, EM_DASH, failures, files, GENERATED_TYPES (+18 more)

### Community 120 - "Format"
Cohesion: 0.36
Nodes (6): Format, Gif, Webm, ffmpeg_args(), gif_with_own_palette_and_endless_loop(), webm_with_alpha()

### Community 122 - "export_types.rs"
Cohesion: 0.27
Nodes (9): actual(), differences(), expected(), generated_dir(), generated_files_are_current(), HEADER, KEEP, read_tree() (+1 more)

### Community 123 - "TwitchTokens"
Cohesion: 0.07
Nodes (22): a_rejected_login_is_reported(), after_stop_nothing_is_saved_and_late_tokens_are_revoked(), FakeTwitch, keeper(), simultaneous_checks_share_one_renewal(), TokenKeeper, TokenKeeper<T, S, K>, tokens() (+14 more)

### Community 124 - "Dashboard.tsx"
Cohesion: 0.11
Nodes (26): Account, deleteMedia(), loadAccount(), uploadMedia(), Connections(), SpotifyStatus(), Act, Content() (+18 more)

### Community 125 - "render.rs"
Cohesion: 0.20
Nodes (16): status(), text(), allowed(), cancel(), done(), encode(), file(), files() (+8 more)

### Community 126 - "useMinimes.ts"
Cohesion: 0.14
Nodes (28): DEMO_FIRST_LOGIN, earliest(), Fights, MinimeCombatScene, MinimeSceneOptions, Scene, Towers, useMinimes() (+20 more)

### Community 127 - "README.md"
Cohesion: 0.18
Nodes (11): index.html app entry (/src/main.tsx), Chat-Trigger, Dashboard, Zugang und Funktionsstufen (off/beta/all), Minimes, Overlay-Schluessel (?key=), Overlay-Szenen /s/<login>/<scene>, RST - Rezondes Stream Tools (+3 more)

### Community 128 - "icons.ts"
Cohesion: 0.60
Nodes (3): Icon, ICON_NAMES, ICONS

### Community 129 - "package.json"
Cohesion: 0.17
Nodes (12): devDependencies, eslint, @eslint/js, eslint-plugin-react-hooks, globals, @types/node, @types/react, @types/react-dom (+4 more)

### Community 130 - "matrix/stinger.ts"
Cohesion: 0.24
Nodes (11): clamp01(), easeIn(), easeInOut(), atCut, options, drawFlash(), drawLogo(), drawStinger() (+3 more)

### Community 131 - "RUST-PLAN.md"
Cohesion: 0.19
Nodes (8): Backups, npm run contract, Audit-Log, Vertragstests (Package 4), Fake-Provider Twitch/Spotify (Package 3), Schluessel-Backups (30 days), Package 45: Umstieg (Node server removed), Plan: Rust-Server als einzige Source of Truth

### Community 132 - "plans PLAN-MINIMES.md"
Cohesion: 0.15
Nodes (16): DESIGN.md: Design principles, PLAN-MINIMES.md: Minimes plan, Bildsprache: zwei Ebenen, Dashboard-Skin (`data-skin="bears"`), Design: Bärenbande, Die drei Bären, Im Code, Overlays (+8 more)

### Community 133 - "main.rs"
Cohesion: 0.33
Nodes (6): import(), main(), run(), SCHEDULE_EVERY, serve(), USAGE

### Community 134 - "SettingField.ts"
Cohesion: 0.47
Nodes (3): MediaKind, SettingField, Unit

### Community 135 - "media.rs"
Cohesion: 0.31
Nodes (9): MediaName, audit(), delete(), deliver(), list(), MEDIA_LIMIT, name_of(), upload() (+1 more)

### Community 136 - "streamerPath.ts"
Cohesion: 0.39
Nodes (7): base(), traversal, decodeAll(), isLogin(), isMediaName(), parse(), StreamerPath

### Community 138 - "twitch alerts.rs"
Cohesion: 0.18
Nodes (10): AlertKind, .ALL, Cheer, Follow, Gift, Hype, Raid, Redeem (+2 more)

### Community 139 - "Minimes Package 2: Scene, feature and settings (readMinimeOptions, hasMinimes)"
Cohesion: 0.15
Nodes (14): Minimes Package 1: Minime rules (parseColor, parseCommand, applyMinime), Minimes Package 2: Scene, feature and settings (readMinimeOptions, hasMinimes), Minimes Package 3: Server runtime (minimes.json, SSE), Minimes Package 4: Behavior and hook (minimeBehavior, useMinimes), Minimes Package 5: Matrix ghost base form, Minimes Package 6: Matrix ghost idle animations, Minimes Package 7: Docs, Minime state on server (data/streamers/<login>/minimes.json) (+6 more)

### Community 140 - "EventSubMessage"
Cohesion: 0.25
Nodes (7): EventSubMessage, Alert, Ignored, Offline, Reconnect, Revocation, Welcome

### Community 141 - "guard.rs"
Cohesion: 0.29
Nodes (3): cookie(), HOME, percent_decode()

### Community 143 - "duration"
Cohesion: 0.40
Nodes (3): DELETE_ATTEMPTS, DELETE_PAUSE, remove_patiently()

### Community 145 - "docker-compose.yml"
Cohesion: 0.15
Nodes (14): Docker-Image Workflow, image job (ghcr.io publish), verify job (npm run verify + contract), keys volume (/keys), overlays service, caddy service, overlays public override (no ports, https PUBLIC_URL), tokens volume (/data) (+6 more)

### Community 146 - "Stinger and banners as pure functions of time"
Cohesion: 0.22
Nodes (6): Stinger and banners as pure functions of time, Minime action catalog (name, durationMs, weight), KOTH smoke grenade stinger with flag change, Matrix columns stinger with decrypting logo, Plantage falling mango stinger, Urlaub wave stinger

### Community 147 - "Minimes Package 11: Combat (minimeCombat.ts)"
Cohesion: 0.09
Nodes (27): Minimes Package 10: Factions, Minimes Package 11: Combat (minimeCombat.ts), Minimes Package 12: Fixed slots, Minimes Package 8: Hopping in core, Minimes Package 9: Remove TS mirror of minime rules, KOTH hill holder display (flag in faction color), KOTH soldier minimes (helmet, faction uniform, role weapon), KOTH factions BLUFOR, OPFOR, INDFOR (+19 more)

### Community 148 - "alerts.check.ts"
Cohesion: 0.25
Nodes (6): ALERT_SOUND_KEYS, alertTextKeys, KINDS, sounds, values, ALERT_KEYS

### Community 149 - "rst-app/src/media/mod.rs"
Cohesion: 0.07
Nodes (15): to_hex(), library(), MediaEntry, MediaLibrary, MediaOverview, neo(), store_error(), store_list_read_replace_and_delete() (+7 more)

### Community 151 - "triggers/schedule.rs"
Cohesion: 0.39
Nodes (4): action(), actions_follow_each_other_and_together_joins_the_previous(), DEFAULT_DURATION, schedule()

### Community 152 - "RUST-PLAN.md"
Cohesion: 0.43
Nodes (4): rst-app crate, rst-domain crate, rst-infra crate, rst-server crate (binary rst)

### Community 154 - "config.rs"
Cohesion: 0.12
Nodes (7): DATA_DIR_VAR, DEFAULT_BACKUP_UPLOAD_MB, DEFAULT_DATA_DIR, DEFAULT_MEDIA_MB, DEFAULT_PORT, FILES_VAR, KEY

### Community 156 - "runtime.rs"
Cohesion: 0.09
Nodes (20): a_rejected_login_ends_the_runtime_and_deletes_the_tokens(), broken_profile_does_not_block(), chat_lines_fire_triggers_and_the_help_reply_without_its_echo(), id(), login(), panic_is_contained(), profile_with_tokens(), RESTART_PAUSE (+12 more)

### Community 162 - "jobs.rs"
Cohesion: 0.29
Nodes (5): Finished, GIF_WARN_BYTES, MAX_FRAME_BYTES, MAX_FRAMES, TIMEOUT_MS

### Community 164 - "bears/scenes/Minimes.tsx"
Cohesion: 0.12
Nodes (23): MinimeStackScene, shownVariant(), COMBAT_ACTIONS, STACK_ACTIONS, BEAR_SET, lifts, names, MINIME_MOVES (+15 more)

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

### Community 173 - "THEMES.md"
Cohesion: 0.67
Nodes (3): Theme folder structure (settings.ts, use<Id>.ts, index.tsx, render.ts, theme.css, scenes), ThemeModule (THEME_MODULES in registry.ts), ThemeView (THEME_VIEWS in scenes.tsx)

### Community 200 - "RenderError"
Cohesion: 0.33
Nodes (5): RenderError, Busy, Limit, NotStarted, TooLarge

### Community 204 - "StaticError"
Cohesion: 0.40
Nodes (3): StaticError, BadEncoding, Forbidden

### Community 205 - "MinimeEvent"
Cohesion: 0.18
Nodes (11): MinimeEvent, Ban, Chat, Clear, Color, Join, Kick, Leave (+3 more)

### Community 216 - "emotes.ts"
Cohesion: 0.21
Nodes (12): bttv(), BttvEmote, BttvUser, EmoteEntry, ffz(), FfzEmote, json(), loadEmotes() (+4 more)

### Community 218 - "library.rs"
Cohesion: 0.17
Nodes (3): MB, one_upload_per_streamer(), triggers_using()

### Community 224 - "Plan: Theme "Bärenbande""
Cohesion: 0.05
Nodes (43): Acceptance Criteria, Acceptance Criteria, Acceptance Criteria, Acceptance Criteria, Acceptance Criteria, Acceptance Criteria, Annahmen, Einstellungen (+35 more)

### Community 229 - "Clip"
Cohesion: 0.18
Nodes (7): OUTPUT_NAMES, Clip, .ALL, Offline, Profile, Stinger, output_names_match_the_media_value()

### Community 239 - "Command"
Cohesion: 0.25
Nodes (6): Command, Import, Serve, Usage, Version, parse()

### Community 246 - "plantage/scenes/Minimes.tsx"
Cohesion: 0.19
Nodes (15): actorRun(), actorStyle(), MinimeActor, actor, plan, hopPlan(), hopStyle(), Ghost() (+7 more)

## Ambiguous Edges - Review These
- `Non-media fixture file in import test data` → `rst import (Package 24)`  [AMBIGUOUS]
  server-rs/crates/rst-app/tests/fixtures/data/streamers/neo/media/notes.txt · relation: conceptually_related_to

## Knowledge Gaps
- **207 isolated node(s):** `@types/node`, `@types/react`, `@types/react-dom`, `eslint`, `typescript` (+202 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1586 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **41 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `scripts` connect `package.json` to `package.json`?**
  _High betweenness centrality (0.321) - this node is a cross-community bridge._
- **What connects `@types/node`, `@types/react`, `@types/react-dom` to the rest of the system?**
  _207 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `readMinimeOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.0761904761904762 - nodes in this community are weakly interconnected._
- **Why does `check` connect `package.json` to `archive.rs`?**
  _High betweenness centrality (0.320) - this node is a cross-community bridge._
- **Should `archive.rs` be split into smaller, more focused modules?**
  _Cohesion score 0.09885057471264368 - nodes in this community are weakly interconnected._
- **Why does `react` connect `react` to `types.ts`, `Track`, `connection.ts`, `hash`, `hill.ts`, `bears/scenes/Alerts.tsx`, `Urlaub Beach Shapes`, `Effects Overlay`, `bears/scenes/Minimes.tsx`, `main.tsx`, `dashboard obsSetup.ts`, `ThemeSettings.tsx`, `Triggers.tsx`, `useMatrix`, `Admin.tsx`, `SettingInput.tsx`, `types.ts`, `ref_node_assert`, `package.json`, `theme.ts`, `plantage/scenes/Minimes.tsx`, `Dashboard.tsx`, `useMinimes.ts`?**
  _High betweenness centrality (0.305) - this node is a cross-community bridge._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Non-media fixture file in import test data` and `rst import (Package 24)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._