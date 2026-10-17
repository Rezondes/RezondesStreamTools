# Plan: Rust-Server als einzige Source of Truth (grob)

Stand 2026-10-17. Grober Plan, noch keine Packages mit Acceptance Criteria; die entstehen je Phase mit `plan-packages`.

## Ziel

Ein Rust-Server ersetzt `server/` vollständig und ist die einzige Instanz, die über Daten, Rechte und Regeln entscheidet.
Browser (Dashboard, Overlays, Befehlsseite) zeigen nur an und prüfen höchstens zur Bequemlichkeit vor; was der Server
ablehnt, gilt nicht, egal was der Client meint.

## Entscheidungen

| Thema | Entscheidung |
|---|---|
| Live-Daten an Overlays | Alles über einen SSE-Stream je Streamer, auch Chatzeilen (mit Emotes und Badges). Kein IRC-Client mehr im Browser |
| Datenbank | Start mit SQLite, austauschbar: Repository-Traits je Aggregat (Ports) im Application-Layer, Umsetzung mit SeaORM (SQLite, PostgreSQL, MySQL) und Migrationen in Rust; dieselbe Vertragstest-Suite läuft gegen jede Datenbank |
| Backups | Serverweit: erstellen, auflisten, herunterladen, hochladen, löschen, wiederherstellen (Admin); logisches, datenbankunabhängiges Format, damit ein Backup auch in eine andere Datenbank zurückgespielt werden kann |
| Verschlüsselung | Alles, was einem Streamer gehört, verschlüsselt mit seinem eigenen Schlüssel; Löschen eines Streamers = Löschen seines Schlüssels (Crypto-Shredding), wirkt auch in alten Backups |
| Theme-Schemas | Rust-Code: ein Struct je Theme mit eigenem Derive-Makro (Regeln, Standardwerte, Grenzen); Labels und Texte im Frontend |
| Struktur | Domain-Driven Design als modularer Monolith: ein Crate je Bounded Context, ein Binary |
| CQRS | CQRS-light: Commands und Queries im Application-Layer getrennt, gleiche Datenbank; SSE und Übersichten sind Lesemodelle aus den Domain Events. Kein Event Sourcing |
| Änderungsverlauf | Audit-Log: jede Änderung an Konfiguration und Zugang als nur anhängbarer Eintrag (wer, was, wann, vorher, nachher), je Streamer mit seinem Schlüssel verschlüsselt; Live-Ereignisse (Chat, Alerts, Musik) werden nicht gespeichert |
| Schlüssel-Backups | Aufbewahrung 30 Tage; danach ist eine Löschung endgültig |
| Hauptschlüssel | aus einer Umgebungsvariable (z.B. `RST_MASTER_KEY`), nie in Datenbank, Backups oder Logs |
| Backup-Zeitplan | vom Server-Admin einstellbar; Standard nur manuell, automatische Backups (Intervall, Anzahl behaltener) einschaltbar |

## Grundsätze

1. **Eine Wahrheit:** Jede Regel (Einstellungs-Schema, Trigger, Minimes, Befehle, Zugang, Limits) existiert genau einmal,
   im Rust-Code. TypeScript bekommt daraus erzeugte Typen und Schema-Daten.
2. **Client-Prüfung ist nur Komfort:** Das Dashboard darf mit den erzeugten Schemas vorprüfen, der Server prüft immer
   vollständig und unabhängig davon.
3. **Typen werden erzeugt, nie von Hand gespiegelt:** `ts-rs` schreibt aus den Rust-Typen `src/generated/*.ts`; die CI
   bricht ab, wenn die erzeugten Dateien nicht zum Rust-Stand passen.
4. **Ungültige Zustände sind nicht darstellbar:** Value Objects (`Login`, `TwitchUserId`, `MediaName`, `TriggerPattern`,
   `Cooldown`, `OverlayKey`) werden beim Einlesen geprüft ("parse, don't validate"); danach rechnet der Code nur noch mit
   gültigen Werten.
5. **Sicherheitsbefunde des Audits sind Anforderungen:** gebundener OAuth-State, Profil an Twitch-ID, Overlay-Schlüssel,
   Backpressure bei SSE, eine Laufzeit pro Login, Single-Flight bei Token-Erneuerung, lineare Regex (Crate `regex`),
   ein Upload und ein Render pro Streamer. Jede Regel bekommt einen Test.

## Domain-Driven Design

Modularer Monolith, ein Binary. Jedes Crate eines Bounded Context hat die Schichten `domain` (Aggregate, Value Objects,
Domain Events, keine IO), `application` (Use Cases), `infrastructure` (sqlx, Twitch, Spotify, Dateien) und wird von
`rst-server` (Interface: axum) zusammengesteckt. Speicher und Schlüssel sind Ports (Traits) im Application-Layer
(`StreamerRepository`, `SettingsRepository`, `AuditLog`, `KeyStore`, `BackupStore` usw.); die Datenbank-Adapter liegen
in `infrastructure`, damit SQLite später durch eine andere Datenbank ersetzt werden kann. Verschlüsselung passiert vor
dem Speichern, ist also unabhängig von der Datenbank. Bewusst nicht: Event Sourcing, getrennte Lese-Datenbank.

| Bounded Context (Crate) | Aggregate und Regeln | Ersetzt heute |
|---|---|---|
| `rst-identity` | `Streamer` (Twitch-ID, Login), `Session` (widerrufbar, nur als Hash gespeichert), `AccessPolicy` (Registrierung, Allowlist, Beta, Funktionsstufen, Admins), OAuth mit gebundenem State | `session.ts`, `access.ts`, `loginStates.ts`, Teile von `index.ts`, `profile.ts` |
| `rst-keyring` | Schlüssel je Streamer, Ver- und Entschlüsseln, Crypto-Shredding | neu |
| `rst-channel` | `ChannelRuntime` (genau eine pro Login), Twitch IRC und EventSub, Token-Keeper, Hilfe-Befehl, SSE-Projektion mit Overlay-Schlüssel und Backpressure | `streamer.ts`, `runtimeRegistry.ts`, `tokenKeeper.ts`, `twitch.ts`, `chat.ts`, `help.ts`, `streamHub.ts`, `overlayKeys.ts` |
| `rst-triggers` | `TriggerSet` (Muster, Rollen, Cooldowns, Ablauf der Aktionen) | `triggers.ts`, `regexMatch.ts` |
| `rst-minimes` | `Roster` (Befehle, Rollen, Bewegung, Bans) | `src/core/minimes.ts`, `server/minimes.ts` |
| `rst-music` | `SpotifyLink` (Verbinden, Erneuern, Trennen mit Generation) | `spotify.ts` |
| `rst-media` | `MediaLibrary` (Namen, Quota, ein Upload zur Zeit), `RenderJob` (ein Render pro Streamer, ffmpeg) | `media.ts`, `render.ts`, `renderRoutes.ts` |
| `rst-themes` | Theme-Structs mit Derive-Makro, `Settings` (Validierung, Standardwerte, Personalisierung beim ersten Login) | `src/themes/*/settings.ts`, `src/core/settings.ts`, `theme.ts`, `server/settings.ts` |
| `rst-commands` | öffentliche Befehlsliste, Hilfe-Text | `commands.ts` (core und server) |
| `rst-backup` | `Backup` (erstellen, prüfen, wiederherstellen) | neu |
| `rst-api-types` | alle Typen über HTTP und SSE, Export nach `src/generated/` | `src/core/types.ts` |

Domain Events (z.B. `AlertReceived`, `TriggerFired`, `RosterChanged`, `TrackChanged`, `ChatLineReceived`,
`SettingsChanged`) laufen über einen tokio-Broadcast je Streamer; die SSE-Projektion ist nur ein Abnehmer davon.

## Verschlüsselung (Crypto-Shredding)

- Jeder Streamer hat einen eigenen Datenschlüssel (DEK, 256 Bit, XChaCha20-Poly1305). Er liegt verpackt mit dem
  Hauptschlüssel (aus der Umgebung, nie in der Datenbank) im **Schlüsselspeicher** `keys.db`, getrennt von der Daten-
  Datenbank.
- Verschlüsselt mit dem DEK: alles, was dem Streamer gehört (Twitch- und Spotify-Tokens, Login-Name, Einstellungen,
  Trigger, Befehle, Minimes, Overlay-Schlüssel) sowie Medien- und Render-Dateien. Gesucht wird über einen HMAC des
  Login-Namens. Sitzungen und Overlay-Schlüssel werden zum Prüfen nur als Hash verglichen.
- **Löschen eines Streamers:** DEK im Schlüsselspeicher löschen, danach die Zeilen und Dateien. Alles, was in alten
  Daten-Backups liegt, ist ohne den DEK Datenmüll; Backups müssen nicht durchsucht werden.
- **Bedingung:** Der Schlüsselspeicher ist nie Teil der Daten-Backups (sonst käme ein gelöschter DEK mit dem Backup
  zurück). Er hat eigene Schlüssel-Backups mit kurzer Aufbewahrung; nach deren Ablauf ist eine Löschung endgültig.
  Geht der Schlüsselspeicher samt Schlüssel-Backups verloren, sind alle Daten verloren.
- Schlüsselwechsel: Hauptschlüssel rotierbar (DEKs neu verpacken), DEK je Streamer rotierbar (Daten neu verschlüsseln).

## Backups

- Inhalt: logischer Export aller Aggregate über die Repositories (JSON Lines je Tabelle, Inhalte bereits
  verschlüsselt) plus Medien- und Render-Dateien als ein Archiv mit Manifest (Schema-Version, Zeitpunkt, Prüfsummen).
  Datenbankunabhängig: ein SQLite-Backup lässt sich in PostgreSQL zurückspielen (so geht auch ein späterer Wechsel).
- Admin-Funktionen: erstellen, auflisten, herunterladen, hochladen (Grössenlimit, kein Pfad ausserhalb des Ziels),
  löschen, wiederherstellen. Wiederherstellen: prüfen (Manifest, Prüfsummen, Schema-Version), in eine leere Staging-Datenbank,
  Migrationen, dann atomar umschalten im kurzen Wartungsmodus.
- Zeitplan: Einstellung des Server-Admins im Dashboard; Standard aus (nur manuell). Eingeschaltet: Intervall und Anzahl
  der behaltenen automatischen Backups, ältere werden gelöscht. Manuelle Backups bleiben, bis der Admin sie löscht.
- Schlüssel-Backups getrennt (siehe oben), Aufbewahrung 30 Tage.

## Phasen

| # | Phase | Ergebnis |
|---|---|---|
| 0 | Gerüst | Workspace, CI (fmt, clippy -D warnings, test, Typ-Export-Prüfung), Docker-Build mit Rust, `ts-rs`-Pipeline, Schnappschuss der heutigen HTTP-Antworten als Vertragstests |
| 1 | Domain | Domain-Schichten aller Contexts mit Value Objects und Aggregaten; die heutigen `*.check.ts` als Rust-Tests übernommen |
| 2 | Speicher und Schlüssel | Repository-Ports, SeaORM-Adapter für SQLite, Migrationen, Audit-Log, `rst-keyring` mit Schlüsselspeicher, Import der heutigen `DATA/streamers/*` (verschlüsselt) |
| 3 | HTTP und Auth | axum, Sitzungen in der Datenbank, OAuth, Admin-Zugang, Einstellungen, Trigger-Editor, Befehle, Medien |
| 4 | Laufzeit | Twitch IRC und EventSub, Token-Keeper, Trigger, Hilfe, Minimes, ein SSE-Stream inklusive Chatzeilen |
| 5 | Rest | Spotify, Render mit ffmpeg, Backups und Wiederherstellung, Streamer löschen (Crypto-Shredding) |
| 6 | Umstellung | Frontend auf erzeugte Typen, Chat-Overlay ohne IRC, Theme-Formulare aus dem Server-Schema, `server/` (Node) entfernt, Docker-Image nur mit Rust-Binary und ffmpeg |
| 7 | Prüfung | Sicherheits-Audit Lauf 2 gegen den Rust-Server, Lasttest der SSE-Verbindungen, Test einer Wiederherstellung und einer Löschung über alte Backups |

Bis Phase 6 läuft der Node-Server weiter; der Rust-Server läuft parallel auf einem anderen Port mit einer Kopie der
Daten, bis die Vertragstests aus Phase 0 grün sind.

## Risiken

- **Umfang:** heute rund 2500 Zeilen Server-Logik plus die mitbenutzten Teile aus `src/core`, dazu neu Verschlüsselung
  und Backups; realistisch mehrere Wochen.
- **Theme-Arbeit wird zweigeteilt:** Regeln in Rust, Darstellung und Texte in React. Das Derive-Makro muss bequem sein,
  sonst wandert Logik heimlich zurück ins Frontend.
- **Schlüsselverlust:** Ohne Schlüsselspeicher und Hauptschlüssel ist alles verloren; Betrieb und Schlüssel-Backups
  müssen dokumentiert sein.
- **Medien verschlüsselt:** öffentliche Medien werden beim Ausliefern entschlüsselt; kostet etwas CPU, Caching nötig.
- **Twitch-Details:** EventSub-Reconnect, IRC-Tags, Rate-Limits müssen exakt nachgebaut werden; dafür die
  Vertragstests und aufgezeichnete Beispielnachrichten aus den heutigen Checks nutzen.
- **Datenübernahme:** Import idempotent, alte Profile ohne gespeicherte Twitch-ID behandeln.
