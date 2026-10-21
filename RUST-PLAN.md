# Plan: Rust-Server als einzige Source of Truth

Stand 2026-10-17. Der Node-Server (`server/`) wird durch einen Rust-Server (`server-rs/`) ersetzt. Dieser Plan enthält
die Entscheidungen und alle Packages mit Acceptance Criteria und TDD-Schritten. Jedes Package endet mit grünem
`npm run verify` und ist ein eigener Commit. Der Node-Server läuft bis Package 45 unverändert weiter (ausser den
Provider-Adressen aus Package 3).

## Ziel

Der Rust-Server ist die einzige Instanz, die über Daten, Rechte und Regeln entscheidet. Browser (Dashboard, Overlays,
Befehlsseite) zeigen nur an und prüfen höchstens zur Bequemlichkeit vor; was der Server ablehnt, gilt nicht.

## Entscheidungen

| Thema | Entscheidung | Warum (und was verworfen wurde) |
|---|---|---|
| Struktur | DDD als modularer Monolith: vier Crates nach Schicht (`rst-domain`, `rst-app`, `rst-infra`, `rst-server`), darin ein Modul je Bounded Context | Ein Crate je Context (11 Crates) wäre viel Gerüst; die Schichtgrenzen erzwingt der Compiler über die Crate-Abhängigkeiten, Contexts sind Module mit eigener Sichtbarkeit. Einzelne Contexts können später eigene Crates werden |
| CQRS | CQRS-light: Commands und Queries in `rst-app` getrennt, gleiche Datenbank; SSE und Übersichten sind Lesemodelle aus Domain Events | Event Sourcing verworfen: meist überschreibbare Konfiguration, flüchtige Live-Ereignisse, hohe Kosten für Event-Versionierung |
| Änderungsverlauf | Audit-Log: jede Änderung an Konfiguration und Zugang als nur anhängbarer, je Streamer verschlüsselter Eintrag | ersetzt den Nutzen von Event Sourcing (Historie) ohne dessen Kosten |
| Datenbank | `sqlx` mit SQLite zum Start; Repository-Traits (Ports) in `rst-app`, schlichtes Standard-SQL, eine Vertragstest-Suite je Adapter | SeaORM verworfen: fast alle Daten sind verschlüsselte Blöcke in einfachen Tabellen, ein ORM bringt dafür kaum etwas. `sqlx` kann auch PostgreSQL |
| Verschlüsselung | Ein Datenschlüssel (DEK) je Streamer (XChaCha20-Poly1305), verpackt mit dem Hauptschlüssel aus `RST_MASTER_KEY`, im eigenen Schlüsselspeicher `keys.db`; Löschen = DEK löschen (Crypto-Shredding) | wirkt auch in alten Backups, die nie durchsucht werden müssen |
| Schlüssel-Backups | getrennt von den Daten-Backups, Aufbewahrung 30 Tage; danach ist eine Löschung endgültig | sonst brächte ein altes Backup einen gelöschten Schlüssel zurück |
| Medien | Medien- und Render-Dateien verschlüsselt gespeichert, beim Ausliefern entschlüsselt, kleiner Cache im Speicher | sonst blieben Medien gelöschter Streamer im Klartext in Backups |
| Backups | serverweit, logisch und datenbankunabhängig (JSON Lines je Tabelle plus Dateien, Manifest); erstellen, auflisten, herunterladen, hochladen, löschen, wiederherstellen; Zeitplan vom Server-Admin einstellbar, Standard nur manuell | ein Backup kann auch in eine andere Datenbank zurückgespielt werden |
| Theme-Schemas | Rust-Daten mit Hilfsfunktionen wie heute (`color()`, `number()`, ...), inklusive Label und Gruppe; der Server liefert das Schema aus; ein Test erzeugt `src/generated/themes/<id>.ts` mit dem Werte-Typ | Derive-Makro verworfen: eigenes Proc-Macro-Crate und Labels getrennt von den Feldern hätten die Wahrheit zweigeteilt |
| Typen ins Frontend | `ts-rs` erzeugt `src/generated/*.ts`; ein Test bricht ab, wenn die Dateien nicht zum Rust-Stand passen | nie von Hand gespiegelt |
| Live-Daten | ein SSE-Stream je Streamer für alles, auch Chatzeilen mit Twitch-Emote-Positionen; Emotes von 7TV, BTTV und FFZ löst weiter der Browser auf (nur Anzeige) | kein IRC-Client mehr im Browser; der Server fragt keine fremden Emote-Dienste ab |
| Datenübernahme | `rst import --from <DATA>`: übernimmt die heutigen Profile, mehrfach ausführbar ohne Doppelungen | |
| Prüfen | `npm run verify` ruft zusätzlich `cargo fmt --check`, `cargo clippy -- -D warnings` und `cargo test` auf; der Pre-Commit-Hook prüft damit beides | |

## Grundsätze

1. **Eine Wahrheit:** Jede Regel (Einstellungs-Schema, Trigger, Minimes, Befehle, Zugang, Limits) existiert genau einmal,
   im Rust-Code. TypeScript bekommt daraus erzeugte Typen und Schema-Daten.
2. **Client-Prüfung ist nur Komfort:** Das Dashboard darf mit den erzeugten Schemas vorprüfen, der Server prüft immer.
3. **Ungültige Zustände sind nicht darstellbar:** Value Objects (`Login`, `TwitchUserId`, `MediaName`, `OutputName`,
   `TriggerPattern`, `OverlayKey`) werden beim Einlesen geprüft ("parse, don't validate").
4. **Sicherheitsbefunde des Audits sind Anforderungen** (Bericht: `~/security-audit-skill/RezondesStream/run-1/REPORT.md`):
   gebundener OAuth-State, Profil an Twitch-ID, Overlay-Schlüssel, Backpressure bei SSE, eine Laufzeit pro Login,
   Single-Flight bei Token-Erneuerung, lineare Regex, ein Upload und ein Render pro Streamer, gültiges `who`.
5. **Tests werden übernommen, nicht neu erfunden:** jeder bestehende `*.check.ts` eines portierten Moduls wird als
   Rust-Test mit denselben Fällen übernommen, bevor die Rust-Logik entsteht.

## Architektur

```
server-rs/
  Cargo.toml                 Workspace
  crates/
    rst-domain/              reine Regeln, keine IO, kein tokio, kein sqlx
      src/{identity,access,themes,settings,triggers,minimes,commands,media,render,twitch,spotify,chat}/
    rst-app/                 Use Cases (commands/, queries/), Ports (Traits), Domain Events, API-Typen (ts-rs)
    rst-infra/               sqlx-Adapter, Schlüsselspeicher, Krypto, Twitch-/Spotify-HTTP, IRC, EventSub, ffmpeg, Dateien
    rst-server/              axum, Routen, Sitzung, Konfiguration, main (Binary `rst`)
  migrations/                sqlx-Migrationen der Daten-Datenbank
  migrations-keys/           Migrationen des Schlüsselspeichers
contract/                    Vertragstests (Node) und Fake-Provider für Twitch und Spotify
src/generated/               von Rust erzeugte TypeScript-Dateien (nie von Hand ändern)
```

Abhängigkeiten: `rst-server` -> `rst-app` + `rst-infra`; `rst-infra` -> `rst-app`; `rst-app` -> `rst-domain`.
`rst-domain` hängt an keinem anderen Crate des Projekts.

## Überblick

| # | Package | Ziel in einem Satz | Abhängig von |
|---|---------|--------------------|--------------|
| | **Phase 0: Gerüst** | | |
| 1 | Cargo-Workspace und Prüfung | `npm run verify` baut, formatiert, lintet und testet den Rust-Workspace mit. | - |
| 2 | Typ-Export | Rust-Typen landen als TypeScript in `src/generated/`, und ein veralteter Export lässt die Prüfung scheitern. | 1 |
| 3 | Fake-Provider | Twitch und Spotify lassen sich für Tests durch einen lokalen Fake-Server ersetzen, auch beim Node-Server. | - |
| 4 | Vertragstests | Eine Testsuite prüft das HTTP- und SSE-Verhalten eines laufenden Servers und ist gegen den Node-Server grün. | 3 |
| | **Phase 1: Domain** | | |
| 5 | Value Objects und Pfade | Logins, Twitch-IDs, Medien- und Ausgabenamen und Overlay-Pfade sind geprüfte Typen in `rst-domain`. | 1 |
| 6 | Zugang und Funktionsstufen | Registrierung, Allowlist, Beta, Admins und Funktionsstufen werden in `rst-domain` entschieden. | 5 |
| 7 | Einstellungs-Felder und Prüfung | Feldtypen, Hilfsfunktionen und die Prüfung von Einstellungswerten liegen in `rst-domain`. | 5 |
| 8 | Standard-Theme und gemeinsame Felder | Das Standard-Theme samt Info- und Minime-Feldern ist in Rust beschrieben und erzeugt seinen TypeScript-Werte-Typ. | 2, 7 |
| 9 | Matrix-Theme | Das Matrix-Theme mit ASCII-Logo-Personalisierung ist in Rust beschrieben. | 8 |
| 10 | Südfrucht-Theme | Das Südfrucht-Theme mit Frucht-Minimes ist in Rust beschrieben. | 8 |
| 11 | Trigger-Regeln | Trigger werden in `rst-domain` geprüft, gegen Chatzeilen abgeglichen und zeitlich geplant. | 5 |
| 12 | Minimes-Regeln | Minime-Befehle, Rollen und Zustandsänderungen werden in `rst-domain` berechnet. | 5, 7 |
| 13 | Befehlsliste und Hilfe | Die öffentliche Befehlsliste und der Hilfe-Text entstehen in `rst-domain`. | 11, 12 |
| 14 | Medien- und Render-Regeln | Quota, Medien-Nutzung durch Trigger, Clips, ffmpeg-Argumente und Render-Jobs sind Domain-Regeln. | 5 |
| 15 | Identität und Anmeldung | OAuth-States, Browser-Bindung und Sitzungs-Tokens sind Domain-Regeln. | 5 |
| 16 | Twitch-Nachrichten | Twitch-Tokens, EventSub-Nachrichten, Alerts und IRC-Zeilen werden in `rst-domain` gelesen. | 5 |
| 17 | Spotify-Nachrichten | Spotify-Tokens, Titel, Fortschritt und Änderungen werden in `rst-domain` gelesen. | 5 |
| | **Phase 2: Speicher und Schlüssel** | | |
| 18 | Krypto und Schlüsselspeicher | Jeder Streamer hat einen eigenen, mit dem Hauptschlüssel verpackten Datenschlüssel, der sich endgültig löschen lässt. | 1 |
| 19 | Daten-Datenbank und Ports | Die Daten-Datenbank hat Migrationen, Repository-Ports und eine Vertragstest-Suite für Adapter. | 18 |
| 20 | Streamer-Repository | Streamer sind über Twitch-ID und Login-HMAC auffindbar, ihr Login liegt verschlüsselt. | 19 |
| 21 | Profil-Daten | Tokens, Einstellungen, Trigger, Befehle und Minimes eines Streamers liegen verschlüsselt in der Datenbank. | 20 |
| 22 | Sitzungen, Overlay-Schlüssel, Audit-Log | Sitzungen sind widerrufbar, Overlay-Schlüssel prüfbar und jede Änderung steht im Audit-Log. | 20 |
| 23 | Verschlüsselte Dateien | Medien- und Render-Dateien liegen verschlüsselt und werden mit Cache entschlüsselt gelesen. | 18 |
| 24 | Import | `rst import --from <DATA>` übernimmt die heutigen Profile ohne Doppelungen. | 21, 22, 23 |
| | **Phase 3: HTTP und Auth** | | |
| 25 | Server-Gerüst | `rst serve` liefert die Overlays aus und prüft jede Route über eine Rechte-Tabelle. | 6, 19 |
| 26 | Twitch-Anmeldung | Streamer melden sich mit Twitch an, mit gebundenem State, Twitch-ID-Prüfung und widerrufbarer Sitzung. | 15, 16, 20, 22, 25 |
| 27 | Admin-Bereich | Admins ändern Zugang und Funktionsstufen und sehen alle Profile, jede Änderung im Audit-Log. | 26 |
| 28 | Einstellungen und Themes | Streamer lesen und speichern geprüfte Einstellungen, Overlays lesen Status, Einstellungen und Schema. | 8, 9, 10, 21, 26 |
| 29 | Trigger-Editor und Medien | Trigger werden gespeichert und Medien hoch- und heruntergeladen, mit Quota und einem Upload zur Zeit. | 11, 14, 21, 23, 26 |
| 30 | Befehle und Hilfe-Konfiguration | Die öffentliche Befehlsseite und die Hilfe-Einstellung laufen über den Rust-Server. | 13, 28 |
| | **Phase 4: Laufzeit** | | |
| 31 | Ereignisse und SSE | Domain Events erreichen Overlays per SSE, nur mit Overlay-Schlüssel oder Sitzung, mit Backpressure. | 22, 25 |
| 32 | Laufzeit je Streamer | Jeder freigeschaltete Streamer hat genau eine Laufzeit mit Token-Keeper, die Sperren und Trennen sicher beenden. | 26, 31 |
| 33 | Chat | Der Server liest den Chat jedes Streamers und schickt Chatzeilen und Bans als Ereignisse. | 16, 32 |
| 34 | EventSub und Alerts | Follows, Subs, Raids, Kanalpunkte und Hype Train kommen per EventSub als Alerts an. | 16, 32 |
| 35 | Trigger und Hilfe-Antwort | Chatzeilen lösen Trigger aus, und der Hilfe-Befehl antwortet als Streamer. | 11, 13, 33 |
| 36 | Minimes | Minimes laufen auf dem Server und werden gespeichert. | 12, 33 |
| | **Phase 5: Rest** | | |
| 37 | Spotify | Streamer verbinden Spotify, der laufende Titel geht per SSE an die Overlays. | 17, 21, 32 |
| 38 | Rendern | Stinger und Banner werden aus Frames mit ffmpeg gebaut, ein Render pro Streamer. | 14, 23, 26 |
| 39 | Backups erstellen | Admins erstellen, listen, laden herunter und löschen serverweite Backups. | 21, 22, 23 |
| 40 | Backups wiederherstellen | Admins laden ein Backup hoch und stellen es geprüft wieder her. | 39 |
| 41 | Backup-Zeitplan und Schlüssel-Backups | Automatische Backups sind einstellbar und Schlüssel-Backups laufen nach 30 Tagen ab. | 39 |
| 42 | Streamer löschen | Admins löschen einen Streamer endgültig über seinen Schlüssel. | 18, 27 |
| | **Phase 6: Umstellung** | | |
| 43 | Frontend auf erzeugte Typen | Dashboard und Overlays nutzen die erzeugten Typen und das Schema vom Server. | 2, 28, 30 |
| 44 | Chat-Overlay über SSE | Das Chat-Overlay bekommt Chatzeilen vom Server statt per IRC. | 33, 43 |
| 45 | Umstieg | Das Docker-Image enthält nur den Rust-Server, `server/` (Node) ist entfernt. | 4, alle davor |
| | **Phase 7: Prüfung** | | |
| 46 | Abnahme | Vertragstests, Wiederherstellung, Löschung über alte Backups und SSE-Last sind geprüft. | 45 |
| | **Phase 8: Features für Themes** | | |
| 47 | Fraktionen der Minimes | Ein Theme kann Fraktionen anbieten; Chatter wählen eine per Befehl, der Server speichert sie. | - |
| 48 | Neue Minime-Felder im Schema | Die Felder für Gefechte und feste Plätze der Minimes stehen im Rust- und TS-Schema und werden geprüft gespeichert. | 47 |
| 49 | Alte Standardwerte ersetzen | Ändert ein Theme einen Standardwert, bekommen Streamer mit dem alten Standard beim Lesen den neuen. | - |
| 50 | Turm-Felder der Minimes | Ein Theme mit Minime-Typen kann die Felder für Türme einbinden, Rust und TS gleich, geprüft gespeichert. | 48 |
| 51 | Merkmal "einfach" am Feld | Ein Feld kann im Rust-Schema als einfach markiert sein, der Server liefert das Merkmal mit. | - |
| 52 | Stream-Statistik | Der Server zählt je Stream Alerts und Chat und schickt den Stand als SSE-Nachricht `stats`. | - |
| 53 | Gemeinsame Stinger-Felder | Alle acht Themes führen Bildrate, Pause, Bewegungskurve und Ausgabegrösse des Stingers aus einem gemeinsamen Baustein im Schema. | - |
| 54 | Gemeinsames Feld Leistungsstufe | Themes mit 3D oder PixiJS führen die Leistungsstufe aus einem gemeinsamen Baustein im Schema. | - |

Parallel möglich: 3 neben 1 und 2; nach 5 die Packages 6, 7, 11, 14, 15, 16, 17 untereinander; 9 und 10 nach 8;
18 neben Phase 1; 33 bis 36 nach 32 untereinander; 37 bis 42 nach ihren Abhängigkeiten untereinander; 47 vor 48, 49 unabhängig, 50 nach 48.

Phase 8 sammelt Server-Features, die ein Theme braucht. Braucht ein Theme ein neues Feature mit Rust-Anteil, steht
der Rust-Teil hier als eigenes Package; Kern- und Theme-Pläne verweisen darauf. Neue Felder entstehen hier in
Rust und TS zugleich, damit jedes Package für sich grün ist.

## Annahmen

- Rust 1.98 ist installiert (`~/.cargo/bin/cargo.exe`); Edition 2024.
- Bibliotheken: `tokio`, `tokio-util`, `axum`, `tower-http`, `sqlx` (Features `sqlite`, `postgres`, `runtime-tokio`,
  `migrate`), `serde`, `serde_json`, `ts-rs`, `chacha20poly1305`, `hkdf`, `sha2`, `hmac`, `rand`, `zeroize`, `reqwest`
  (rustls), `tokio-tungstenite`, `regex`, `figlet-rs`, `zip`, `tracing`, `thiserror`, `clap`.
- Ein bestehender `*.check.ts` gilt als Spezifikation; weicht Rust bewusst ab (z.B. Regex-Semantik), steht das im
  Package.
- Die HTTP-Pfade und JSON-Formen bleiben wie im Node-Server (Vertragstests, Package 4); neue Endpunkte (Themes-Schema,
  Backups, Streamer löschen, Audit-Log) kommen dazu.
- Sitzungs-Cookies des Node-Servers werden nicht übernommen; nach dem Umstieg melden sich alle neu an.
- OBS-URLs mit `?key=` bleiben gültig: der Import übernimmt die Overlay-Schlüssel.
- Testbefehl jedes Packages ist `npm run verify` (nach Package 1 inklusive Rust); für schnelles Arbeiten
  `cargo test --manifest-path server-rs/Cargo.toml -p <crate>`.

---

# Phase 0: Gerüst

## Package 1: Cargo-Workspace und Prüfung

**Ziel:** `npm run verify` baut, formatiert, lintet und testet den Rust-Workspace mit.

**Abhängigkeiten:** keine

**Betroffene Dateien:**
- `server-rs/Cargo.toml` (neu, Workspace mit `[workspace.lints]` und `[workspace.dependencies]`)
- `server-rs/crates/{rst-domain,rst-app,rst-infra,rst-server}/Cargo.toml` und `src/lib.rs` bzw. `src/main.rs` (neu)
- `server-rs/rust-toolchain.toml`, `server-rs/rustfmt.toml` (neu)
- `package.json` (ändern: Skript `rust`, `verify` ruft es auf)
- `scripts/rust.ts` (neu: findet `cargo`, führt fmt, clippy, test aus), `scripts/rust.check.ts` (neu)
- `.gitignore`, `.dockerignore` (ändern: `server-rs/target`)
- `CODING-RULES.md` (ändern: Abschnitt Rust)

### Kontext

`npm run verify` (package.json) prüft heute nur TypeScript. Der Pre-Commit-Hook (`.githooks/`) ruft `verify` auf.
`cargo` liegt nicht im PATH der Git-Bash (`~/.cargo/bin/cargo.exe`), deshalb ein kleines Node-Skript, das ihn findet.

### Acceptance Criteria

- [ ] AC1: `npm run verify` führt `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings` und `cargo test` im Workspace aus und scheitert, wenn einer davon scheitert.
- [ ] AC2: Die Abhängigkeitsrichtung ist erzwungen: `rst-domain` hat keine Abhängigkeit auf `tokio`, `sqlx`, `axum`, `reqwest` oder ein anderes Projekt-Crate.
- [ ] AC3: `cargo` wird auch ohne PATH-Eintrag gefunden (`CARGO`-Variable, sonst `~/.cargo/bin`).
- [ ] AC4: Workspace-Lints: `unsafe_code = "forbid"`, Clippy `pedantic` als Warnung (mit `-D warnings` also Fehler).

### Tests (TDD)

1. `scripts/rust.check.ts > "findet cargo"` - deckt AC3 ab
   - Gegeben: `CARGO` nicht gesetzt, Home-Ordner mit `.cargo/bin/cargo.exe`
   - Erwartet: Pfad zu dieser Datei; mit gesetztem `CARGO` dessen Wert
2. `server-rs/crates/rst-domain/tests/dependencies.rs > domain_has_no_io_dependencies` - deckt AC2 ab
   - Gegeben: `crates/rst-domain/Cargo.toml` (per `include_str!`)
   - Erwartet: keine Abhängigkeit `tokio`, `sqlx`, `axum`, `reqwest`, `rst-*`
3. Manueller Check zu AC1: in `rst-domain` eine unbenutzte Variable einbauen, `npm run verify` scheitert an clippy; wieder entfernen.

Testbefehl: `npm run verify`

### Umsetzungsschritte

1. Test 1 schreiben (rot), `scripts/rust.ts` mit `findCargo()` und Aufruf der drei Befehle, grün.
2. Workspace und vier leere Crates anlegen, Lints setzen, Test 2 schreiben (grün, solange keine Abhängigkeit).
3. `package.json`: `"rust": "node scripts/rust.ts"`, `verify` hängt `&& npm run rust` an.
4. `.gitignore`/`.dockerignore`, CODING-RULES.md (Rust: Edition, Lints, Tests neben dem Code, kein `unwrap` ausser in Tests).

### Out of Scope

- Docker-Build mit Rust und CI mit Rust-Toolchain (Package 45; bis dahin überspringt `scripts/rust.ts` in CI mit Hinweis, wenn `CI=true` und kein cargo vorhanden ist).

---

## Package 2: Typ-Export

**Ziel:** Rust-Typen landen als TypeScript in `src/generated/`, und ein veralteter Export lässt die Prüfung scheitern.

**Abhängigkeiten:** Package 1

**Betroffene Dateien:**
- `server-rs/crates/rst-app/src/api/mod.rs` (neu: Modul für API-Typen)
- `server-rs/crates/rst-app/tests/export_types.rs` (neu)
- `src/generated/README.md` (neu)
- `package.json` (ändern: Skript `gen:types`)
- `scripts/rules.check.ts` (ändern: `src/generated/` von Theme-Regeln ausnehmen)

### Kontext

Heute definiert `src/core/types.ts` die Nachrichten (`ServerMessage`, `Alert`, `Track`, `FxEvent`, `Minime`), Server
und Overlay nutzen dieselbe Datei. Künftig entstehen diese Typen in Rust; `ts-rs` exportiert sie.

### Acceptance Criteria

- [ ] AC1: `npm run gen:types` schreibt für jeden mit `#[ts(export)]` markierten Typ eine Datei nach `src/generated/`.
- [ ] AC2: `cargo test` scheitert mit klarer Meldung, wenn eine Datei in `src/generated/` nicht dem aktuellen Export entspricht oder eine überzählige Datei dort liegt.
- [ ] AC3: Erzeugte Dateien tragen einen Kopfkommentar "erzeugt aus server-rs, nicht von Hand ändern".

### Tests (TDD)

1. `rst-app/tests/export_types.rs > generated_files_are_current` - deckt AC2 ab
   - Gegeben: ein Beispieltyp `Ping { at: u64 }` mit `#[ts(export)]`, `src/generated/Ping.ts` fehlt
   - Erwartet: Test scheitert und nennt `Ping.ts`; nach `npm run gen:types` grün
2. `... > no_stale_files` - deckt AC2 ab
   - Gegeben: `src/generated/Alt.ts` ohne zugehörigen Typ
   - Erwartet: Test scheitert und nennt `Alt.ts`
3. `... > header_comment` - deckt AC3 ab

Testbefehl: `npm run verify`

### Umsetzungsschritte

1. Tests schreiben, `export_types.rs` vergleicht den Export (in ein Temp-Verzeichnis) mit `src/generated/`.
2. `gen:types` = `cargo test -p rst-app --test export_types -- --ignored write` (schreibt statt vergleicht).
3. Beispieltyp `Ping` anlegen, exportieren, grün; `Ping` wird in Package 31 durch die echten Nachrichten ersetzt.

### Out of Scope

- Die echten API-Typen (entstehen mit ihren Packages), das Umstellen des Frontends (Package 43).

---

## Package 3: Fake-Provider

**Ziel:** Twitch und Spotify lassen sich für Tests durch einen lokalen Fake-Server ersetzen, auch beim Node-Server.

**Abhängigkeiten:** keine

**Betroffene Dateien:**
- `contract/fakeProviders.ts` (neu: HTTP-Server für Twitch-OAuth, Helix, Spotify-Token und -API, WebSocket für EventSub und IRC)
- `contract/fakeProviders.check.ts` (neu)
- `server/twitch.ts`, `server/spotify.ts`, `src/core/irc.ts` (ändern: Basis-Adressen aus Umgebungsvariablen, Standard wie heute)
- `server/index.ts` (ändern: Variablen durchreichen)
- `server.env.example` (ändern: `TWITCH_ID_URL`, `TWITCH_API_URL`, `TWITCH_EVENTSUB_URL`, `TWITCH_IRC_URL`, `SPOTIFY_ACCOUNTS_URL`, `SPOTIFY_API_URL`, nur für Tests)

### Kontext

`server/twitch.ts` nutzt feste Adressen (`ID_URL`, Helix, EventSub-WebSocket), `server/spotify.ts` ebenso, `src/core/irc.ts`
`IRC_URL`. Vertragstests (Package 4) brauchen eine Anmeldung ohne echtes Twitch. Im Audit wurde dafür `fetch`
überschrieben; ein Fake-Server funktioniert für beide Server gleich. Ohne neue npm-Abhängigkeit: WebSocket-Handshake
und Text-Frames schreibt der Fake selbst (nur das, was EventSub und IRC brauchen).

### Acceptance Criteria

- [ ] AC1: Ohne die neuen Variablen nutzt der Node-Server die echten Adressen (Verhalten unverändert).
- [ ] AC2: Der Fake-Provider gibt für einen Code `code-<login>-<id>` Tokens aus, Helix `/users` liefert Login und ID, `/oauth2/validate` nimmt die Tokens an, `/oauth2/revoke` merkt sich widerrufene Tokens.
- [ ] AC3: Der Fake-Provider kann EventSub-Nachrichten (`session_welcome`, `notification`) und IRC-Zeilen an verbundene Clients schicken (Steuer-Endpunkte `POST /control/eventsub`, `POST /control/irc`).
- [ ] AC4: Spotify-Token und `currently-playing` lassen sich über `POST /control/spotify` setzen.

### Tests (TDD)

1. `contract/fakeProviders.check.ts > "Token und Benutzer"` - deckt AC2 ab
   - Gegeben: Fake auf Port 0, `POST /oauth2/token code=code-neo-7`
   - Erwartet: `access_token`, danach `GET /helix/users` mit diesem Token = `{ id: "7", login: "neo" }`
2. `... > "EventSub und IRC"` - deckt AC3 ab
   - Gegeben: verbundener WebSocket-Client auf `/eventsub`
   - Erwartet: erst `session_welcome`, nach `POST /control/eventsub` die Notification
3. `... > "Spotify"` - deckt AC4 ab
4. `server/twitch.check.ts > "Adressen aus der Umgebung"` - deckt AC1 ab
   - Gegeben: keine Variablen / `TWITCH_ID_URL=http://127.0.0.1:1`
   - Erwartet: echte Adresse / Fake-Adresse in `authorizeUrl`

Testbefehl: `npm run verify`

### Umsetzungsschritte

1. Tests schreiben, Fake-Provider bauen, Node-Server: Basis-Adressen lesen, Checks anpassen.

### Out of Scope

- Vertragstests selbst (Package 4).

---

## Package 4: Vertragstests

**Ziel:** Eine Testsuite prüft das HTTP- und SSE-Verhalten eines laufenden Servers und ist gegen den Node-Server grün.

**Abhängigkeiten:** Package 3

**Betroffene Dateien:**
- `contract/run.ts` (neu: startet Fake-Provider und den Server aus `--server "<befehl>"`, setzt Dummy-Umgebung, leere DATA)
- `contract/cases/*.ts` (neu: je Bereich eine Datei), `contract/shape.ts` (neu: Form-Vergleich)
- `contract/shape.check.ts` (neu)
- `package.json` (ändern: `contract:node`, später `contract:rust`)

### Kontext

Pfade und Antworten des Node-Servers stehen in `server/routes.ts` und `server/index.ts`. Die Suite beschreibt dieses
Verhalten aus Client-Sicht und ist später der Massstab für den Rust-Server.

### Acceptance Criteria

- [ ] AC1: `npm run contract:node` startet Fake-Provider und Node-Server mit Dummy-Werten und läuft grün.
- [ ] AC2: Abgedeckt: Anmeldung (Login, Callback mit Cookie-State, fremder State abgelehnt, Abmelden), `/api/me`, Rechte (401, 403 not-allowed, feature-off, admin-only), öffentliche Overlay-Routen (status, settings, commands, scene, media), `/events` (403 ohne Schlüssel, 200 mit Schlüssel, `?log` nur mit Sitzung), Einstellungen speichern mit Fehlercodes, Trigger speichern (who-Prüfung), Medien (Upload, Quota, 409 bei zweitem Upload), Admin-Zugang, Spotify-Callback-Bindung, Render-Start ohne Funktion.
- [ ] AC3: Jeder Fall prüft Status und die Form der Antwort (Schlüssel und Typen), nicht zufällige Werte.
- [ ] AC4: Die Suite ist nicht Teil von `npm run verify` (braucht laufende Prozesse), aber in CI ein eigener Job (Package 45).
- [ ] AC5: Fälle, die ein Server noch nicht kann, lassen sich per Liste als "ausstehend" markieren (`contract/pending-rust.json`), damit `contract:rust` ab Package 25 schrittweise grün wird.

### Tests (TDD)

1. `contract/shape.check.ts > "Form-Vergleich"` - deckt AC3 ab
   - Gegeben: erwartete Form `{ login: "string", features: "object" }`, Antwort mit zusätzlichem Feld
   - Erwartet: zusätzliches Feld erlaubt; fehlendes Feld oder falscher Typ meldet den Pfad
2. `contract/shape.check.ts > "ausstehende Fälle"` - deckt AC5 ab
3. Die Fälle in `contract/cases/*.ts` selbst gegen Node - decken AC1, AC2 ab

Testbefehl: `npm run contract:node`, danach `npm run verify`

### Umsetzungsschritte

1. Form-Vergleich mit Check, dann Läufer, dann die Fälle Bereich für Bereich, jeweils gegen Node grün.

### Out of Scope

- Lauf gegen Rust (`contract:rust` ab Package 25, vollständig grün in Package 45).

---

# Phase 1: Domain (`rst-domain`, reine Regeln)

Für alle Packages dieser Phase gilt: Code in `server-rs/crates/rst-domain/src/<context>/`, Tests als `#[cfg(test)]`
im selben Modul, keine IO. Jeder Testfall des genannten `*.check.ts` wird übernommen. Testbefehl:
`cargo test --manifest-path server-rs/Cargo.toml -p rst-domain`, zum Abschluss `npm run verify`.

## Package 5: Value Objects und Pfade

**Ziel:** Logins, Twitch-IDs, Medien- und Ausgabenamen und Overlay-Pfade sind geprüfte Typen in `rst-domain`.

**Abhängigkeiten:** Package 1

**Betroffene Dateien:**
- `rst-domain/src/identity/values.rs` (neu: `Login`, `TwitchUserId`)
- `rst-domain/src/media/values.rs` (neu: `MediaName`, `OutputName`)
- `rst-domain/src/paths.rs` (neu: `StreamerPath`, `OverlayRoute`)

### Kontext

Vorlage: `src/core/streamerPath.ts` (`isLogin`, `isMediaName`, `parse`, `base`) mit `src/core/streamerPath.check.ts`,
`server/routes.ts` (`overlayRoute`) mit `server/routes.check.ts`, `server/render.ts` (`isOutputName`).

### Acceptance Criteria

- [ ] AC1: `Login::parse` nimmt nur gültige Twitch-Logins an (wie `isLogin`) und normalisiert auf Kleinbuchstaben.
- [ ] AC2: `MediaName::parse` nimmt nur Namen ohne Pfad mit bekannten Endungen an (wie `isMediaName`).
- [ ] AC3: `StreamerPath::parse` zerlegt vor dem Decodieren, `%2F` wird nie zum Trenner (wie `parse`).
- [ ] AC4: `OverlayRoute::from_segments` liefert status, settings, events, commands, scene, media wie `overlayRoute`.
- [ ] AC5: `TwitchUserId` nur aus Ziffern; `OutputName` nur Namen aus der Clip-Liste.
- [ ] AC6: Beim Deserialisieren (`serde`) gilt dieselbe Prüfung; ungültige Werte werden Fehler.

### Tests (TDD)

1. `paths::tests::*` - alle Fälle aus `streamerPath.check.ts` und dem Overlay-Teil von `routes.check.ts` (AC3, AC4)
2. `identity::values::tests::login_*` - gültige/ungültige Logins inkl. 25 Zeichen, Unterstrich vorne, Grossbuchstaben (AC1)
3. `media::values::tests::*` - `a.png` ja; `../a.png`, `a/b.png`, `a.exe`, leer nein (AC2)
4. `identity::values::tests::user_id_*`, `media::values::tests::output_name_*` (AC5)
5. `identity::values::tests::deserialize_rejects_invalid` - Gegeben: JSON `"A B"`; Erwartet: Fehler (AC6)

### Umsetzungsschritte

1. Tests aus den Checks übertragen (rot), Typen mit privaten Feldern und `parse`-Konstruktoren, `Display`, `serde`.

### Out of Scope

- Speicherung (Phase 2).

---

## Package 6: Zugang und Funktionsstufen

**Ziel:** Registrierung, Allowlist, Beta, Admins und Funktionsstufen werden in `rst-domain` entschieden.

**Abhängigkeiten:** Package 5

**Betroffene Dateien:**
- `rst-domain/src/access/mod.rs` (neu: `AccessPolicy`, `Feature`, `FeatureLevel`, `can_use`, `features`, `has_feature`, `is_admin`, `revoked_logins`, `sanitize`)

### Kontext

Vorlage: `server/access.ts` mit `server/access.check.ts`. Die Änderungsanzeige `src/dashboard/accessChanges.ts` bleibt
im Frontend (reine Anzeige).

### Acceptance Criteria

- [ ] AC1: `AccessPolicy::sanitize` liefert dieselben bereinigten Werte wie `access.ts` (unbekannte Funktionen raus, ungültige Logins raus).
- [ ] AC2: `can_use`, `features`, `has_feature`, `is_admin` entsprechen den Check-Fällen.
- [ ] AC3: `revoked_logins(before, after, admins, running)` liefert die Logins, deren Laufzeit gestoppt werden muss.

### Tests (TDD)

1. `access::tests::*` - alle Fälle aus `server/access.check.ts` (AC1 bis AC3)

### Umsetzungsschritte

1. Tests übertragen, `AccessPolicy` als Struct mit `Login`-Sets, Funktionen umsetzen, `ts-rs`-Export der Policy.

### Out of Scope

- Speichern und Admin-API (Package 27).

---

## Package 7: Einstellungs-Felder und Prüfung

**Ziel:** Feldtypen, Hilfsfunktionen und die Prüfung von Einstellungswerten liegen in `rst-domain`.

**Abhängigkeiten:** Package 5

**Betroffene Dateien:**
- `rst-domain/src/settings/field.rs` (neu: `SettingField`, `SettingValue`, `SoundValue`, Hilfsfunktionen `color`, `text`, `textarea`, `lines`, `number`, `flag`, `choice`, `font`, `media`, `sound`, `in_scene`)
- `rst-domain/src/settings/validate.rs` (neu: `validate_settings`, `resolve_settings`, `SettingErrorCode`)
- `rst-domain/src/themes/schema.rs` (neu: `ThemeSchema`, `SceneName`, `SCENE_SIZES`, `group_scenes`, `MinimeVariantSet`)

### Kontext

Vorlage: `src/core/theme.ts` (Typen), `src/core/fields.ts` (Hilfsfunktionen) mit Check, `src/core/settings.ts` mit
`src/core/settings.check.ts`, Fehlercodes `SETTING_ERROR_CODES` in `src/core/errorCodes.ts`.

### Acceptance Criteria

- [ ] AC1: `validate_settings` liefert für jeden Fall aus `settings.check.ts` dieselben Fehler (`invalid_type`, `invalid_color`, `out_of_range`, `too_long`, `too_many_lines`, `unknown_option`, `invalid_media`) mit Feldschlüssel.
- [ ] AC2: `resolve_settings` ergänzt fehlende Werte mit Standardwerten und verwirft unbekannte Schlüssel.
- [ ] AC3: `SettingField`, `SettingValue`, `ThemeSchema` werden per `ts-rs` exportiert, in der Form der heutigen TS-Union (`type`-Feld).

### Tests (TDD)

1. `settings::validate::tests::*` - alle Fälle aus `src/core/settings.check.ts` (AC1, AC2)
2. `settings::field::tests::*` - Fälle aus `src/core/fields.check.ts`
3. Export-Test aus Package 2 nach `gen:types` grün (AC3)

### Umsetzungsschritte

1. Tests übertragen, Feld-Enum mit `serde(tag = "type")`, Prüfung umsetzen, Export.

### Out of Scope

- Die drei Themes (Packages 8 bis 10).

---

## Package 8: Standard-Theme und gemeinsame Felder

**Ziel:** Das Standard-Theme samt Info- und Minime-Feldern ist in Rust beschrieben und erzeugt seinen TypeScript-Werte-Typ.

**Abhängigkeiten:** Packages 2, 7

**Betroffene Dateien:**
- `rst-domain/src/themes/{mod.rs,standard.rs,info_fields.rs,minime_fields.rs,registry.rs,audit.rs}` (neu)
- `rst-app/tests/export_types.rs` (ändern: je Theme `src/generated/themes/<id>.ts` mit `<Id>Values`)
- `scripts/dumpSchema.ts` (neu: schreibt die heutigen TS-Schemas als JSON-Fixtures), `scripts/dumpSchema.check.ts` (neu)
- `server-rs/crates/rst-domain/tests/fixtures/{standard,matrix,suedfrucht}.json` (neu)

### Kontext

Vorlage: `src/themes/standard/settings.ts` (138 Zeilen), `src/core/infoFields.ts`, `src/core/minimeFields.ts` mit
Checks, `src/themes/registry.ts` (`DEFAULT_THEME`, `findTheme`) mit `registry.check.ts`, `src/themes/schemaAudit.ts`
mit Check (Kernschlüssel, die jedes Theme haben muss). Labels und Gruppen bleiben Teil des Schemas. Die Fixtures sind
die Brücke: sie halten den heutigen TS-Stand fest, solange beide Seiten existieren.

### Acceptance Criteria

- [ ] AC1: Das Rust-Schema `standard` ist Feld für Feld gleich dem TS-Schema (Schlüssel, Typ, Standard, Grenzen, Label, Gruppe, Szene, groupScenes).
- [ ] AC2: `standard` besteht `audit` (Kernschlüssel vorhanden, Standardwerte bestehen die eigene Prüfung) und `personalize("neo")` = `{ channelName: "NEO" }`.
- [ ] AC3: `src/generated/themes/standard.ts` enthält `StandardValues` mit allen Schlüsseln und passenden TS-Typen.
- [ ] AC4: `registry::find("gibt-es-nicht")` = `None`, `DEFAULT_THEME` = `standard`.

### Tests (TDD)

1. `scripts/dumpSchema.check.ts > "schreibt alle Themes"` - Gegeben: `THEMES`; Erwartet: drei JSON-Dateien, `personalize` als Beispielwerte für `neo`, `rezondes`, `neo_42`
2. `themes::standard::tests::same_as_typescript` - Gegeben: Fixture `standard.json`; Erwartet: Rust-Schema als JSON gleich (AC1)
3. `themes::audit::tests::*`, `themes::registry::tests::*` - Fälle aus `schemaAudit.check.ts`, `registry.check.ts` (AC2, AC4)
4. Export-Test für `standard.ts` (AC3)

### Umsetzungsschritte

1. `scripts/dumpSchema.ts` mit Check, Fixtures schreiben.
2. Test 2 rot, Schema übertragen (Hilfsfunktionen aus Package 7), grün; Audit, Registry, Export.

### Out of Scope

- Matrix und Südfrucht (Packages 9, 10); Umstellung der Szenen auf den erzeugten Typ (Package 43).

---

## Package 9: Matrix-Theme

**Ziel:** Das Matrix-Theme mit ASCII-Logo-Personalisierung ist in Rust beschrieben.

**Abhängigkeiten:** Package 8

**Betroffene Dateien:**
- `rst-domain/src/themes/matrix.rs` (neu)
- `rst-domain/src/themes/ascii_text.rs` (neu: Logo mit `figlet-rs`, gleiche Schrift wie `src/core/asciiText.ts`)
- `rst-domain/fonts/` (neu: die von `asciiText.ts` genutzte figlet-Schriftdatei)

### Kontext

Vorlage: `src/themes/matrix/settings.ts` (323 Zeilen); `personalize` setzt `channelName` und `logo: asciiText(login)`;
`src/core/asciiText.ts` mit Check. `figlet-rs` ist reine Rust-Logik; `rst-domain` darf sie nutzen (Schrift per
`include_str!`, keine IO).

### Acceptance Criteria

- [ ] AC1: Schema `matrix` gleich der Fixture aus Package 8.
- [ ] AC2: `ascii_text(login)` ergibt exakt denselben Text wie `asciiText(login)` in TS (Fixture für drei Logins).
- [ ] AC3: `personalize` liefert `channelName` und `logo`; Minime-Farben wie heute.

### Tests (TDD)

1. `themes::matrix::tests::same_as_typescript` (AC1)
2. `themes::ascii_text::tests::same_as_typescript` - Gegeben: Fixtures `neo`, `rezondes`, `a_1`; Erwartet: gleicher Text (AC2)
3. `themes::matrix::tests::personalize` (AC3)

### Umsetzungsschritte

1. ASCII-Fixtures per `scripts/dumpSchema.ts` ergänzen, Tests rot, umsetzen. Weicht `figlet-rs` ab, wird die Schrift
   selbst gerendert (das figlet-Format ist einfach) statt die Fixture anzupassen.

### Out of Scope

- Stinger/Banner-Clips (bleiben im Frontend; der Server kennt nur Clip-Namen und Formate, Package 14).

---

## Package 10: Südfrucht-Theme

**Ziel:** Das Südfrucht-Theme mit Frucht-Minimes ist in Rust beschrieben.

**Abhängigkeiten:** Package 8

**Betroffene Dateien:**
- `rst-domain/src/themes/suedfrucht.rs` (neu)

### Kontext

Vorlage: `src/themes/suedfrucht/settings.ts` (320 Zeilen) mit `minimeVariants` (16 Früchte) und Checks
(`settings.check.ts`, `fruits.check.ts`).

### Acceptance Criteria

- [ ] AC1: Schema `suedfrucht` gleich der Fixture.
- [ ] AC2: `minime_variants` mit 16 Varianten, Befehl und Standard-Namen wie heute; `personalize("neo_42")` = `{ channelName: "Neo_42" }`.

### Tests (TDD)

1. `themes::suedfrucht::tests::same_as_typescript` (AC1)
2. `themes::suedfrucht::tests::variants_and_personalize` (AC2)

### Umsetzungsschritte

1. Wie Package 9.

### Out of Scope

- Darstellung der Früchte (Frontend).

---

## Package 11: Trigger-Regeln

**Ziel:** Trigger werden in `rst-domain` geprüft, gegen Chatzeilen abgeglichen und zeitlich geplant.

**Abhängigkeiten:** Package 5

**Betroffene Dateien:**
- `rst-domain/src/triggers/{mod.rs,pattern.rs,schedule.rs,cooldowns.rs}` (neu)

### Kontext

Vorlage: `server/triggers.ts` (`toRegex`, `allowed`, `schedule`, `compile`, Cooldowns) mit `triggers.check.ts`.
Die Rust-Regex (`regex`-Crate) ist linear und kennt keine Lookarounds; damit entfällt der Worker aus
`server/regexMatch.ts`. Der Typ `word` nutzt heute Lookbehind: in Rust wird jeder Treffer gesucht und die
Nachbarzeichen geprüft (kein Buchstabe, keine Ziffer, kein `_`). Für `regex`-Trigger heisst das: Muster mit
Rückverweisen oder Lookarounds lehnt `compile` mit Fehler ab (bewusste Abweichung, steht im Editor als Fehlertext).

### Acceptance Criteria

- [ ] AC1: Alle Fälle aus `triggers.check.ts` für `word`, `contains`, `exact`, `command`, `regex`, `allowed`, `schedule`, `compile` gelten (inkl. `who` als Liste von Rollen, Beschreibung höchstens 200 Zeichen).
- [ ] AC2: `^(a+)+$` gegen 10 000 `a` und `!` dauert unter 50 ms (linear).
- [ ] AC3: `(a)\1` und `(?<=a)b` als `regex` ergeben den Fehler "Muster mit Rückverweis oder Lookaround nicht erlaubt".
- [ ] AC4: Cooldowns für alle und pro Zuschauer wie heute; abgelaufene Einträge werden entfernt (Audit-Härtung).
- [ ] AC5: Muster höchstens 500 Zeichen; Aktionswerte `delay`, `duration`, `after` sind endliche Zahlen in Grenzen (Audit-Härtung).

### Tests (TDD)

1. `triggers::tests::*` - alle Fälle aus `server/triggers.check.ts` (AC1)
2. `triggers::pattern::tests::linear` (AC2)
3. `triggers::pattern::tests::rejects_backrefs_and_lookaround` (AC3)
4. `triggers::cooldowns::tests::prunes_expired` - Gegeben: 10 000 Zuschauer, Zeit über alle Cooldowns hinaus; Erwartet: Tabelle leer nach `ready` (AC4)
5. `triggers::tests::limits` (AC5)

### Umsetzungsschritte

1. Tests übertragen und ergänzen, Typen `Trigger`, `When`, `Who`, `TriggerSet::compile`, `matches`, `schedule`, `Cooldowns`, Export.

### Out of Scope

- Auslösen und Senden (Package 35), Editor-API (Package 29).

---

## Package 12: Minimes-Regeln

**Ziel:** Minime-Befehle, Rollen und Zustandsänderungen werden in `rst-domain` berechnet.

**Abhängigkeiten:** Packages 5, 7

**Betroffene Dateien:**
- `rst-domain/src/minimes/{mod.rs,rules.rs,command.rs,roster.rs}` (neu)

### Kontext

Vorlage: `src/core/minimes.ts` (245 Zeilen, `parseCommand`, `applyMinime`, Regeln) mit `minimes.check.ts`,
`src/core/minimeFields.ts` (Regeln aus Einstellungen) mit Check, `server/minimes.ts` (Roster, Höchstzahl, Prune) mit
`server/minimes.check.ts`. Bewegung (`src/core/minimeBehavior.ts`) bleibt im Frontend (reine Darstellung).

### Acceptance Criteria

- [ ] AC1: `parse_command` und `apply` liefern für alle Fälle aus `minimes.check.ts` (core und server) dasselbe.
- [ ] AC2: Regeln aus Einstellungen (`minime_rules`) wie `minimeFields.ts`, inklusive Varianten (Früchte) statt Farben.
- [ ] AC3: Roster höchstens 100, Kick nur mit `kickRoles`, Ban entfernt.

### Tests (TDD)

1. `minimes::tests::*` - Fälle aus `src/core/minimes.check.ts`, `src/core/minimeFields.check.ts`, `server/minimes.check.ts` (AC1 bis AC3)

### Umsetzungsschritte

1. Tests übertragen, Typen `Minime`, `MinimeRules`, `MinimeCommand`, `Roster` mit `apply(command) -> Vec<RosterEvent>`, Export.

### Out of Scope

- Speichern und Timer (Package 36).

---

## Package 13: Befehlsliste und Hilfe

**Ziel:** Die öffentliche Befehlsliste und der Hilfe-Text entstehen in `rst-domain`.

**Abhängigkeiten:** Packages 11, 12

**Betroffene Dateien:**
- `rst-domain/src/commands/mod.rs` (neu: `command_list`, `help_reply`, `HelpConfig`, `MAX_CHAT`, Echo- und Cooldown-Regel)

### Kontext

Vorlage: `src/core/commands.ts` (78 Zeilen) mit Check, `server/commands.ts` (`toHelpConfig`, Standard `!befehle`,
Cooldown 0 bis 3600) mit Check, `server/help.ts` (Echo-Filter, Cooldown) mit Check.

### Acceptance Criteria

- [ ] AC1: `command_list` zeigt nur aktive, öffentliche Trigger, Regex-Muster als `null`, plus Minimes-Befehle je Funktionsstufe.
- [ ] AC2: `help_reply` passt in 500 Zeichen und enthält den Link zur Befehlsseite.
- [ ] AC3: Hilfe-Cooldown höchstens einmal pro Fenster; Echo der eigenen Antwort wird erkannt.

### Tests (TDD)

1. `commands::tests::*` - Fälle aus `src/core/commands.check.ts`, `server/commands.check.ts`, `server/help.check.ts` (AC1 bis AC3)

### Out of Scope

- Senden in den Chat (Package 35).

---

## Package 14: Medien- und Render-Regeln

**Ziel:** Quota, Medien-Nutzung durch Trigger, Clips, ffmpeg-Argumente und Render-Jobs sind Domain-Regeln.

**Abhängigkeiten:** Package 5

**Betroffene Dateien:**
- `rst-domain/src/media/library.rs` (neu: `quota_error`, `triggers_using`, `UploadSlots`)
- `rst-domain/src/render/{clips.rs,jobs.rs,ffmpeg.rs}` (neu)

### Kontext

Vorlage: `server/media.ts` mit Check (Quota, `triggersUsing`, `uploadSlots`, `storeMedia`), `server/render.ts` mit
Check (`CLIPS`, `outputNames`, `ffmpegArgs`, `createRenderJobs` mit encoding bis `done`).

### Acceptance Criteria

- [ ] AC1: Alle reinen Fälle aus `media.check.ts` und `render.check.ts` gelten.
- [ ] AC2: `RenderJobs`: während `encoding` antworten start, frame, finish und cancel mit `render-busy`.
- [ ] AC3: `ffmpeg_args` liefert eine Argument-Liste (nie eine Shell-Zeile).

### Tests (TDD)

1. `media::library::tests::*`, `render::*::tests::*` - Fälle aus den Checks (AC1 bis AC3)

### Out of Scope

- Dateien und ffmpeg-Prozess (Packages 23, 38).

---

## Package 15: Identität und Anmeldung

**Ziel:** OAuth-States, Browser-Bindung und Sitzungs-Tokens sind Domain-Regeln.

**Abhängigkeiten:** Package 5

**Betroffene Dateien:**
- `rst-domain/src/identity/{oauth.rs,session.rs}` (neu)

### Kontext

Vorlage: `server/loginStates.ts` (`createLoginStates`, `sameBrowser`) mit Check, `server/session.ts` mit Check. Neu:
Sitzungen sind zufällige Tokens (256 Bit), gespeichert wird nur ihr SHA-256 (statt eines HMAC-Cookies ohne
Widerruf). Zufall kommt von aussen (die Funktion bekommt die Bytes), damit `rst-domain` ohne IO bleibt.

### Acceptance Criteria

- [ ] AC1: OAuth-States: einmal einlösbar, Ablauf, Höchstzahl, Browser-Bindung (Fälle aus `loginStates.check.ts`).
- [ ] AC2: `SessionToken::from_bytes` und `hash()` deterministisch; Vergleich in konstanter Zeit.
- [ ] AC3: Cookie-Texte für Sitzung und OAuth-State wie `session.check.ts` (HttpOnly, SameSite=Lax, Secure bei https, Max-Age).

### Tests (TDD)

1. `identity::oauth::tests::*`, `identity::session::tests::*` (AC1 bis AC3)

### Out of Scope

- Speicherung der Sitzungen (Package 22), HTTP (Package 26).

---

## Package 16: Twitch-Nachrichten

**Ziel:** Twitch-Tokens, EventSub-Nachrichten, Alerts und IRC-Zeilen werden in `rst-domain` gelesen.

**Abhängigkeiten:** Package 5

**Betroffene Dateien:**
- `rst-domain/src/twitch/{tokens.rs,eventsub.rs,alerts.rs}` (neu)
- `rst-domain/src/chat/{irc.rs,line.rs}` (neu: `parse_irc`, `ChatLine`, Rollen aus Badges, Emote-Positionen)

### Kontext

Vorlage: `server/twitch.ts` (`toTokens`, `toAlert`, `SAMPLE_ALERTS`, Reconnect-Allowlist `wss://*.twitch.tv`) mit
Check, `src/core/irc.ts` und `src/core/ircEvents.ts` mit Checks, `server/chat.ts` (Rollen aus `badges`).

### Acceptance Criteria

- [ ] AC1: Alle Fälle aus `twitch.check.ts`, `irc.check.ts`, `ircEvents.check.ts` gelten.
- [ ] AC2: EventSub-Nachricht `null` oder ohne `metadata` ist ein Fehlerwert, nie eine Panik (Audit-Härtung).
- [ ] AC3: `ChatLine` enthält Twitch-Emote-Positionen aus dem Tag `emotes` (für Package 44).

### Tests (TDD)

1. `twitch::*::tests::*`, `chat::*::tests::*` - Fälle aus den Checks (AC1)
2. `twitch::eventsub::tests::null_and_garbage_are_errors` (AC2)
3. `chat::line::tests::emote_positions` - Gegeben: `emotes=25:0-4,12-16`; Erwartet: zwei Bereiche mit ID 25 (AC3)

### Out of Scope

- Verbindungen (Packages 33, 34).

---

## Package 17: Spotify-Nachrichten

**Ziel:** Spotify-Tokens, Titel, Fortschritt und Änderungen werden in `rst-domain` gelesen.

**Abhängigkeiten:** Package 5

**Betroffene Dateien:**
- `rst-domain/src/spotify/mod.rs` (neu: `to_tokens`, `to_track`, `progressed`, `changed`, `redirect_uri`, `callback_has_session`)

### Kontext

Vorlage: die reinen Teile von `server/spotify.ts` mit dem ersten Teil von `spotify.check.ts`.

### Acceptance Criteria

- [ ] AC1: Alle reinen Fälle aus `spotify.check.ts` gelten (Titel, Podcast, Fortschritt, Änderung, Redirect, Callback mit Sitzung).

### Tests (TDD)

1. `spotify::tests::*` (AC1)

### Out of Scope

- Abfrage und Tokens speichern (Package 37).

---

# Phase 2: Speicher und Schlüssel

## Package 18: Krypto und Schlüsselspeicher

**Ziel:** Jeder Streamer hat einen eigenen, mit dem Hauptschlüssel verpackten Datenschlüssel, der sich endgültig löschen lässt.

**Abhängigkeiten:** Package 1

**Betroffene Dateien:**
- `rst-app/src/ports/keys.rs` (neu: Trait `KeyStore`: `create`, `get`, `shred`, `rewrap_all`)
- `rst-infra/src/crypto/{cipher.rs,master.rs}` (neu: XChaCha20-Poly1305, `MasterKey` aus `RST_MASTER_KEY`, `zeroize`)
- `rst-infra/src/keys/sqlite.rs` (neu: `keys.db`), `server-rs/migrations-keys/0001_keys.sql` (neu)
- `rst-infra/tests/keystore_contract.rs` (neu: Vertragstest für jeden `KeyStore`-Adapter)

### Kontext

Neu. Der Hauptschlüssel ist 32 Byte, Base64 in `RST_MASTER_KEY`; fehlt oder ist er ungültig, startet der Server nicht.
DEKs (32 Byte zufällig) werden mit dem Hauptschlüssel verpackt (AEAD, Streamer-ID als Associated Data, damit ein
verpackter DEK nicht einem anderen Streamer untergeschoben werden kann). Abgeleitete Schlüssel (HKDF) für Login-Suche
und serverweite Einträge.

### Acceptance Criteria

- [ ] AC1: Ver- und Entschlüsseln mit DEK funktioniert; verändertes Chiffrat, falsche Associated Data oder falscher DEK schlagen fehl.
- [ ] AC2: `KeyStore::shred(id)` löscht den DEK; danach liefert `get(id)` `None`, und vorher verschlüsselte Daten sind nicht mehr lesbar.
- [ ] AC3: `rewrap_all(old, new)` verpackt alle DEKs mit einem neuen Hauptschlüssel neu; Daten bleiben lesbar.
- [ ] AC4: `MasterKey::from_env` lehnt fehlende, nicht-Base64 oder nicht-32-Byte-Werte mit klarer Meldung ab; der Schlüssel erscheint nie in `Debug` oder Logs.
- [ ] AC5: `keys.db` liegt getrennt von der Daten-Datenbank (eigener Pfad `RST_KEYS_DB`).

### Tests (TDD)

1. `crypto::cipher::tests::*` (AC1)
2. `keystore_contract::shred_makes_data_unreadable` gegen SQLite in einem Temp-Ordner (AC2)
3. `keystore_contract::rewrap_keeps_data_readable` (AC3)
4. `crypto::master::tests::*` inkl. `format!("{:?}")` enthält den Schlüssel nicht (AC4)
5. `keystore_contract::separate_file` (AC5)

Testbefehl: `npm run verify`

### Umsetzungsschritte

1. Cipher-Tests, Cipher; MasterKey-Tests, MasterKey; Port und SQLite-Adapter mit Vertragstests.

### Out of Scope

- Schlüssel-Backups (Package 41).

---

## Package 19: Daten-Datenbank und Ports

**Ziel:** Die Daten-Datenbank hat Migrationen, Repository-Ports und eine Vertragstest-Suite für Adapter.

**Abhängigkeiten:** Package 18

**Betroffene Dateien:**
- `server-rs/migrations/0001_init.sql` (neu: `streamers`, `records`, `sessions`, `audit_log`, `server_settings`)
- `rst-app/src/ports/{mod.rs,records.rs}` (neu: Trait `RecordStore` für verschlüsselte Blöcke je Streamer und Art)
- `rst-infra/src/db/{pool.rs,sqlite_records.rs}` (neu)
- `rst-infra/tests/records_contract.rs` (neu: Vertragstest als Makro `contract_tests!(adapter)`)

### Kontext

Schema bewusst schlicht und portabel (Standard-SQL, `BLOB`/`BYTEA` über `sqlx`): `records(streamer_id, kind, key,
nonce, ciphertext, updated_at, PRIMARY KEY(streamer_id, kind, key))`. Verschlüsselung passiert in `rst-app` (Use
Cases), nicht im Adapter; der Adapter sieht nur Chiffrat.

### Acceptance Criteria

- [ ] AC1: Migrationen laufen auf einer leeren SQLite-Datei und sind beim zweiten Start ohne Wirkung.
- [ ] AC2: `RecordStore`: `put`, `get`, `list(streamer, kind)`, `delete`, `delete_streamer`, `export_all` (für Backups); Vertragstests grün für SQLite.
- [ ] AC3: Der Vertragstest ist so geschrieben, dass ein zweiter Adapter (PostgreSQL) nur `contract_tests!(postgres_adapter)` braucht.
- [ ] AC4: WAL-Modus und `foreign_keys=ON` sind aktiv.

### Tests (TDD)

1. `records_contract::*` (AC2, AC3)
2. `db::pool::tests::migrations_twice` (AC1), `db::pool::tests::pragmas` (AC4)

Testbefehl: `npm run verify`

### Out of Scope

- PostgreSQL-Adapter (später, eigener Commit nach dem Umstieg).

---

## Package 20: Streamer-Repository

**Ziel:** Streamer sind über Twitch-ID und Login-HMAC auffindbar, ihr Login liegt verschlüsselt.

**Abhängigkeiten:** Package 19

**Betroffene Dateien:**
- `rst-app/src/ports/streamers.rs` (neu: Trait `StreamerRepository`)
- `rst-app/src/identity/streamers.rs` (neu: Use Cases `register`, `find_by_login`, `find_by_user_id`, `login_of`, `list`)
- `rst-infra/src/db/sqlite_streamers.rs` (neu), Vertragstest

### Kontext

`streamers(id UUID, twitch_user_id_hmac, login_hmac, created_at)`: Twitch-ID und Login sind über einen HMAC mit einem
abgeleiteten Schlüssel (HKDF, Zweck "lookup") suchbar; der Klartext-Login liegt verschlüsselt in `records` (Art
`profile`). Ersetzt `server/profile.ts` (inkl. `ownedByOther`).

### Acceptance Criteria

- [ ] AC1: Registrieren legt Streamer und DEK an; derselbe Login mit anderer Twitch-ID wird abgelehnt (`account-changed`).
- [ ] AC2: In der Datenbank steht weder Login noch Twitch-ID im Klartext (Test liest die Datei roh).
- [ ] AC3: `list()` liefert alle Streamer mit entschlüsseltem Login; Streamer ohne DEK (gelöscht) fehlen.

### Tests (TDD)

1. `identity::streamers::tests::register_and_find` (AC1, AC3)
2. `streamers_contract::no_plaintext_in_file` - Gegeben: Login `neo`, ID `12345`; Erwartet: `neo` und `12345` kommen in den Bytes der DB-Datei nicht vor (AC2)

Testbefehl: `npm run verify`

---

## Package 21: Profil-Daten

**Ziel:** Tokens, Einstellungen, Trigger, Befehle und Minimes eines Streamers liegen verschlüsselt in der Datenbank.

**Abhängigkeiten:** Package 20

**Betroffene Dateien:**
- `rst-app/src/profile/{tokens.rs,settings.rs,triggers.rs,help.rs,minimes.rs}` (neu: Repositories über `RecordStore` und DEK)

### Kontext

Ersetzt `tokens.json`, `spotify.json`, `settings.json`, `triggers.json`, `commands.json`, `minimes.json` je Profil.

### Acceptance Criteria

- [ ] AC1: Jede Art lässt sich speichern und laden; Werte gehen durch die Domain-Prüfung (Ungültiges landet nie in der DB).
- [ ] AC2: Nach `KeyStore::shred` liefert jedes Laden den Fehler "Daten nicht lesbar", nie Müll.
- [ ] AC3: Gespeicherte Werte stehen nicht im Klartext in der DB-Datei.

### Tests (TDD)

1. `profile::*::tests::roundtrip` (AC1), `profile::tests::after_shred` (AC2), `profile::tests::no_plaintext` (AC3)

Testbefehl: `npm run verify`

---

## Package 22: Sitzungen, Overlay-Schlüssel, Audit-Log

**Ziel:** Sitzungen sind widerrufbar, Overlay-Schlüssel prüfbar und jede Änderung steht im Audit-Log.

**Abhängigkeiten:** Package 20

**Betroffene Dateien:**
- `rst-app/src/identity/sessions.rs` (neu: `create`, `resolve`, `revoke`, `revoke_all(streamer)`, Ablauf 30 Tage)
- `rst-app/src/channel/overlay_key.rs` (neu: Schlüssel verschlüsselt im Profil plus HMAC zum Prüfen, `rotate`)
- `rst-app/src/audit/mod.rs` (neu: `AuditLog::append(actor, streamer, action, before, after)`, `list`)
- Adapter und Vertragstests

### Kontext

Ersetzt `server/session.ts` (zustandslos) und `server/overlayKeys.ts`. Audit-Einträge eines Streamers sind mit seinem
DEK verschlüsselt; serverweite Einträge (z.B. Zugangsrichtlinie) mit einem abgeleiteten Server-Schlüssel.

### Acceptance Criteria

- [ ] AC1: Abmelden und Trennen widerrufen die Sitzung sofort; ein kopiertes Cookie gilt danach nicht mehr (Audit-Härtung).
- [ ] AC2: Sitzungen stehen nur als Hash in der DB.
- [ ] AC3: Overlay-Schlüssel: das Dashboard bekommt ihn im Klartext, Prüfung in konstanter Zeit über HMAC, `rotate` macht den alten ungültig.
- [ ] AC4: Das Audit-Log ist nur anhängbar (kein Update/Delete im Port); Einträge eines Streamers sind nach `shred` unlesbar.

### Tests (TDD)

1. `identity::sessions::tests::*` (AC1, AC2), `channel::overlay_key::tests::*` (AC3), `audit::tests::*` (AC4)

Testbefehl: `npm run verify`

---

## Package 23: Verschlüsselte Dateien

**Ziel:** Medien- und Render-Dateien liegen verschlüsselt und werden mit Cache entschlüsselt gelesen.

**Abhängigkeiten:** Package 18

**Betroffene Dateien:**
- `rst-app/src/ports/files.rs` (neu: Trait `FileStore`)
- `rst-infra/src/files/encrypted.rs` (neu: Block-Verschlüsselung (STREAM-Konstruktion, 64-KiB-Blöcke), atomares Schreiben, Cache mit Grössenlimit)

### Kontext

Ersetzt `media/` und `render/` im Profil-Ordner und `server/atomicFile.ts`. Dateien liegen unter
`DATA/files/<streamer-id>/<zufälliger-name>`; der Klartext-Name steht verschlüsselt in `records` (Art `media`).

### Acceptance Criteria

- [ ] AC1: Schreiben und Lesen grosser Dateien (50 MB) in Blöcken, ohne die Datei ganz im Speicher zu halten.
- [ ] AC2: Abgeschnittene oder vertauschte Blöcke werden erkannt (Fehler).
- [ ] AC3: Der Cache hält höchstens `RST_FILE_CACHE_MB` (Standard 64) und liefert dieselben Bytes.
- [ ] AC4: Nach `shred` sind die Dateien unlesbar; `delete_streamer` entfernt den Ordner.

### Tests (TDD)

1. `files::encrypted::tests::*` (AC1 bis AC4)

Testbefehl: `npm run verify`

---

## Package 24: Import

**Ziel:** `rst import --from <DATA>` übernimmt die heutigen Profile ohne Doppelungen.

**Abhängigkeiten:** Packages 21, 22, 23

**Betroffene Dateien:**
- `rst-server/src/cli/import.rs` (neu), `rst-app/src/import/mod.rs` (neu)
- `server-rs/crates/rst-app/tests/fixtures/data/` (neu: Beispiel-DATA-Ordner, wie der Node-Server ihn schreibt)

### Kontext

Liest `DATA/access.json`, `DATA/streamers/<login>/{tokens,spotify,settings,triggers,commands,minimes,profile}.json`,
`overlay.key`, `media/`, `render/`. Einstellungen mit `RENAMED = { starter: "standard" }` wie `server/settings.ts`.

### Acceptance Criteria

- [ ] AC1: Alle Profile der Fixture sind danach in der DB, mit gleichen Einstellungen, Triggern, Tokens, Overlay-Schlüssel und Medien.
- [ ] AC2: Ein zweiter Lauf ändert nichts (keine doppelten Streamer, keine doppelten Dateien).
- [ ] AC3: Profile ohne gespeicherte Twitch-ID nehmen die ID aus `tokens.json`; ohne beides werden sie mit Warnung übersprungen.
- [ ] AC4: Kaputte Dateien und Regex-Trigger, die Rust nicht kann (Package 11), werden gemeldet; der Rest wird übernommen; Exit-Code ungleich 0, wenn etwas fehlte.

### Tests (TDD)

1. `import::tests::fixture_roundtrip` (AC1), `import::tests::idempotent` (AC2), `import::tests::missing_user_id` (AC3), `import::tests::broken_files` (AC4)

Testbefehl: `npm run verify`

---

# Phase 3: HTTP und Auth

## Package 25: Server-Gerüst

**Ziel:** `rst serve` liefert die Overlays aus und prüft jede Route über eine Rechte-Tabelle.

**Abhängigkeiten:** Packages 6, 19

**Betroffene Dateien:**
- `rst-server/src/{main.rs,config.rs,routes.rs,guard.rs,static_files.rs,errors.rs}` (neu)
- `rst-app/src/api/errors.rs` (neu: Fehlercodes wie `src/core/errorCodes.ts`, per `ts-rs` exportiert)
- `package.json` (ändern: `contract:rust`)

### Kontext

Vorlage: `server/index.ts` (Router, `sameOrigin`, Static-Fallback, Fehlerbehandlung), `server/routes.ts` (`ROUTES`,
`authorize`) mit Check, `server/http.ts` (Static mit Prefix-Prüfung, Sandbox-CSP für Medien) mit Check.

### Acceptance Criteria

- [ ] AC1: Konfiguration aus Umgebung: `PORT`, `PUBLIC_URL`, `DATA`, `DIST`, `RST_MASTER_KEY`, `RST_KEYS_DB`, `TWITCH_*`, `SPOTIFY_*`, `ADMINS`, `MEDIA_LIMIT_MB`, Provider-Adressen aus Package 3; fehlende Pflichtwerte beenden den Start mit Meldung.
- [ ] AC2: Rechte-Tabelle wie `ROUTES`: jede Route hat genau einen Handler und einen Wächter (`public`, `session`, `admin`, Funktionen); der Compiler erzwingt beides.
- [ ] AC3: Nicht-GET verlangt einen `Origin` gleich `PUBLIC_URL` (fehlender `Origin` wird abgelehnt, strenger als heute, Audit-Härtung).
- [ ] AC4: Statische Dateien aus `DIST` ohne Pfad ausserhalb; kaputte Prozent-Codierung = 400 statt 500.
- [ ] AC5: Sicherheits-Header: `X-Content-Type-Options: nosniff`, `Content-Security-Policy: frame-ancestors 'self'` für das Dashboard, Sandbox-CSP für Medien.
- [ ] AC6: `npm run contract:rust` läuft; noch nicht umgesetzte Fälle stehen in `contract/pending-rust.json`.

### Tests (TDD)

1. `routes::tests::*` - Fälle aus `server/routes.check.ts` (AC2)
2. `guard::tests::origin_*` (AC3), `static_files::tests::*` - Fälle aus `http.check.ts` plus `/%E0` = 400 (AC4), `tests::headers` (AC5)
3. `config::tests::*` (AC1)

Testbefehl: `npm run verify`, `npm run contract:rust`

---

## Package 26: Twitch-Anmeldung

**Ziel:** Streamer melden sich mit Twitch an, mit gebundenem State, Twitch-ID-Prüfung und widerrufbarer Sitzung.

**Abhängigkeiten:** Packages 15, 16, 20, 22, 25

**Betroffene Dateien:**
- `rst-infra/src/twitch/oauth.rs` (neu: Token-Tausch, Validate, Revoke, Helix `/users`)
- `rst-app/src/identity/login.rs` (neu: Use Case `complete_login`)
- `rst-server/src/handlers/auth.rs` (neu: `/auth/login`, `/auth/callback`, `POST /auth/logout`, `GET /api/me`, `POST /api/twitch/disconnect`, `POST /api/overlay-key`)

### Kontext

Vorlage: `twitchLogin`, `twitchCallback`, `logout`, `me`, `twitchDisconnect`, `rotateOverlayKey` in `server/index.ts`.

### Acceptance Criteria

- [ ] AC1: Login über einen anderen Host leitet erst auf `PUBLIC_URL` um; der Callback gilt nur mit passendem `oauth_state`-Cookie.
- [ ] AC2: Nicht freigeschaltet: Token widerrufen, `/?error=not-allowed`; anderer Twitch-Account mit bekanntem Login: `/?error=account-changed`.
- [ ] AC3: Erster Login legt Streamer, DEK, personalisierte Einstellungen und Overlay-Schlüssel an.
- [ ] AC4: Trennen widerruft Access- und Refresh-Token, löscht die Tokens und alle Sitzungen des Streamers.
- [ ] AC5: Jede Anmeldung, Abmeldung und Trennung steht im Audit-Log.

### Tests (TDD)

1. `identity::login::tests::*` mit Fake-Twitch-Port (AC2, AC3, AC5)
2. Vertragsfälle `contract/cases/auth.ts` gegen Rust grün (AC1 bis AC4)

Testbefehl: `npm run verify`, `npm run contract:rust`

---

## Package 27: Admin-Bereich

**Ziel:** Admins ändern Zugang und Funktionsstufen und sehen alle Profile, jede Änderung im Audit-Log.

**Abhängigkeiten:** Package 26

**Betroffene Dateien:**
- `rst-app/src/access/{commands.rs,queries.rs}` (neu), `rst-server/src/handlers/admin.rs` (neu)

### Kontext

Vorlage: `saveAccess`, `adminStreamers` und `GET /api/admin/access` in `server/index.ts`. Die Zugangsrichtlinie liegt in
`server_settings` (serverweit verschlüsselt).

### Acceptance Criteria

- [ ] AC1: `GET/POST /api/admin/access` wie heute; Speichern ist atomar (kein Fehler bei gleichzeitigem Speichern, Audit-Härtung).
- [ ] AC2: Entzogener Zugang stoppt die Laufzeit (ab Package 32) und widerruft alle Sitzungen des Streamers.
- [ ] AC3: `GET /api/admin/streamers` mit Login, erlaubt, verbunden, letzte Anmeldung.
- [ ] AC4: Audit-Einträge mit vorher/nachher; `GET /api/admin/audit` (neu) zeigt sie Admins.

### Tests (TDD)

1. `access::commands::tests::*` (AC1, AC2, AC4), Vertragsfälle `contract/cases/admin.ts` (AC1, AC3)

Testbefehl: `npm run verify`, `npm run contract:rust`

---

## Package 28: Einstellungen und Themes

**Ziel:** Streamer lesen und speichern geprüfte Einstellungen, Overlays lesen Status, Einstellungen und Schema.

**Abhängigkeiten:** Packages 8, 9, 10, 21, 26

**Betroffene Dateien:**
- `rst-app/src/settings/{commands.rs,queries.rs}` (neu), `rst-server/src/handlers/{settings.rs,overlay.rs}` (neu)

### Kontext

Vorlage: `settings`, `saveSettingsRequest`, `overlay()` (status, settings, scene) in `server/index.ts`,
`server/settings.ts` mit Check. Neu: `GET /api/themes` liefert alle Schemas (für Formulare, Package 43).

### Acceptance Criteria

- [ ] AC1: `GET/POST /api/settings` wie heute, Fehler als `{ key, code }`; Theme-Wechsel nur mit Funktion `themes`.
- [ ] AC2: `/s/<login>/status`, `/s/<login>/settings` und Szenen wie heute; unbekannter oder gesperrter Login = 404.
- [ ] AC3: `GET /api/themes` liefert die Schemas aller Themes im exportierten Format.
- [ ] AC4: Gespeicherte Einstellungen gehen als `settings`-Ereignis an die Overlays (ab Package 31) und ins Audit-Log.

### Tests (TDD)

1. `settings::commands::tests::*` (AC1, AC4), Vertragsfälle `contract/cases/settings.ts`, `overlay.ts` (AC1 bis AC3)

Testbefehl: `npm run verify`, `npm run contract:rust`

---

## Package 29: Trigger-Editor und Medien

**Ziel:** Trigger werden gespeichert und Medien hoch- und heruntergeladen, mit Quota und einem Upload zur Zeit.

**Abhängigkeiten:** Packages 11, 14, 21, 23, 26

**Betroffene Dateien:**
- `rst-app/src/triggers/{commands.rs,queries.rs}`, `rst-app/src/media/{commands.rs,queries.rs}` (neu)
- `rst-server/src/handlers/{triggers.rs,media.rs}` (neu)

### Kontext

Vorlage: Trigger- und Medien-Handler in `server/index.ts`, `server/media.ts`. Uploads werden gestreamt (nicht ganz im
Speicher) und verschlüsselt geschrieben.

### Acceptance Criteria

- [ ] AC1: `GET/POST /api/triggers/config`, `GET /api/triggers`, `POST /api/trigger` wie heute; Fehler je Trigger.
- [ ] AC2: `GET/POST/DELETE /api/media` wie heute; zweiter gleichzeitiger Upload = 409 `upload-busy`; Quota zählt alle Dateien.
- [ ] AC3: `/s/<login>/media/<name>` liefert entschlüsselt mit Sandbox-CSP und richtigem Content-Type.
- [ ] AC4: Uploads werden gestreamt; die 50-MB-Grenze bricht früh ab.
- [ ] AC5: Änderungen an Triggern und Medien stehen im Audit-Log.

### Tests (TDD)

1. Use-Case-Tests (AC1, AC2, AC4, AC5), Vertragsfälle `contract/cases/triggers.ts`, `media.ts` (AC1 bis AC3)

Testbefehl: `npm run verify`, `npm run contract:rust`

---

## Package 30: Befehle und Hilfe-Konfiguration

**Ziel:** Die öffentliche Befehlsseite und die Hilfe-Einstellung laufen über den Rust-Server.

**Abhängigkeiten:** Packages 13, 28

**Betroffene Dateien:**
- `rst-app/src/commands/{commands.rs,queries.rs}` (neu), `rst-server/src/handlers/commands.rs` (neu)

### Kontext

Vorlage: `helpConfig`, `saveHelpConfig` und `overlay()` commands in `server/index.ts`.

### Acceptance Criteria

- [ ] AC1: `GET/POST /api/commands` und `/s/<login>/commands` wie heute; Änderung im Audit-Log.

### Tests (TDD)

1. Vertragsfälle `contract/cases/commands.ts` (AC1)

Testbefehl: `npm run verify`, `npm run contract:rust`

---

# Phase 4: Laufzeit

## Package 31: Ereignisse und SSE

**Ziel:** Domain Events erreichen Overlays per SSE, nur mit Overlay-Schlüssel oder Sitzung, mit Backpressure.

**Abhängigkeiten:** Packages 22, 25

**Betroffene Dateien:**
- `rst-app/src/events.rs` (neu: `DomainEvent`, `ServerMessage` (ts-rs, ersetzt `Ping` aus Package 2), Bus je Streamer mit `tokio::sync::broadcast`)
- `rst-server/src/handlers/events.rs` (neu)

### Kontext

Vorlage: `server/streamHub.ts`, `events()` in `server/index.ts`, `src/core/types.ts` (`ServerMessage`).

### Acceptance Criteria

- [ ] AC1: `/s/<login>/events?key=` mit gültigem Schlüssel = Stream, sonst 403; `?log` nur mit Sitzung desselben Streamers.
- [ ] AC2: Ein Client, der nicht liest, wird getrennt (Broadcast-Lag oder Puffer über 1 MiB); andere Clients sind nicht betroffen.
- [ ] AC3: Höchstens 50 Streams je Streamer; Ping alle 25 s; beim Verbinden sofort Musik und Minimes.
- [ ] AC4: `src/generated/ServerMessage.ts` entspricht der heutigen Form aus `src/core/types.ts` plus `chat` (Package 33).

### Tests (TDD)

1. `events::tests::slow_client_dropped` mit einem Client, der nicht liest (AC2)
2. Vertragsfälle `contract/cases/events.ts` (AC1, AC3)
3. Export-Test (AC4)

Testbefehl: `npm run verify`, `npm run contract:rust`

---

## Package 32: Laufzeit je Streamer

**Ziel:** Jeder freigeschaltete Streamer hat genau eine Laufzeit mit Token-Keeper, die Sperren und Trennen sicher beenden.

**Abhängigkeiten:** Packages 26, 31

**Betroffene Dateien:**
- `rst-app/src/channel/{runtime.rs,registry.rs,token_keeper.rs}` (neu)

### Kontext

Vorlage: `server/runtimeRegistry.ts`, `server/tokenKeeper.ts`, `server/streamer.ts` mit Checks. In Rust ist jede Laufzeit
eine `tokio`-Aufgabe mit `CancellationToken`; die Registry hält eine Generation je Login.

### Acceptance Criteria

- [ ] AC1: Alle Fälle aus `runtimeRegistry.check.ts` und `tokenKeeper.check.ts` gelten.
- [ ] AC2: Beim Start des Servers starten alle freigeschalteten Streamer mit Tokens; ein kaputtes Profil hält die anderen nicht auf.
- [ ] AC3: Eine Panik in einer Laufzeit beendet nur diese Laufzeit (geloggt, Neustart mit Pause), nie den Server.

### Tests (TDD)

1. `channel::registry::tests::*`, `channel::token_keeper::tests::*` (AC1)
2. `channel::runtime::tests::broken_profile_does_not_block` (AC2)
3. `channel::runtime::tests::panic_is_contained` (AC3)

Testbefehl: `npm run verify`

---

## Package 33: Chat

**Ziel:** Der Server liest den Chat jedes Streamers und schickt Chatzeilen und Bans als Ereignisse.

**Abhängigkeiten:** Packages 16, 32

**Betroffene Dateien:**
- `rst-infra/src/twitch/irc.rs` (neu: anonymer IRC-Client über WebSocket mit Reconnect)
- `rst-app/src/channel/chat.rs` (neu: `ChatLineReceived`, `ChatBanned`, `ChatMessageDeleted`)

### Kontext

Vorlage: `server/chat.ts`, `src/core/irc.ts` (`anonymousLogin`), `src/core/ircEvents.ts` (Löschungen). Fehler in einer
Zeile werden gefangen (Audit).

### Acceptance Criteria

- [ ] AC1: Chatzeilen des Fake-IRC kommen als `chat`-Nachricht per SSE an (Name, Farbe, Rollen, Text, Twitch-Emote-Positionen).
- [ ] AC2: `CLEARCHAT` und `CLEARMSG` werden Ereignisse (Ban, Löschung); PING wird beantwortet; Abbruch = Reconnect nach 3 s.
- [ ] AC3: Eine fehlerhafte Zeile wird geloggt und übersprungen.

### Tests (TDD)

1. `channel::chat::tests::*` mit Fake-IRC aus Package 3 (AC1 bis AC3), Vertragsfall `contract/cases/chat.ts` (AC1)

Testbefehl: `npm run verify`, `npm run contract:rust`

---

## Package 34: EventSub und Alerts

**Ziel:** Follows, Subs, Raids, Kanalpunkte und Hype Train kommen per EventSub als Alerts an.

**Abhängigkeiten:** Packages 16, 32

**Betroffene Dateien:**
- `rst-infra/src/twitch/eventsub.rs` (neu), `rst-app/src/channel/alerts.rs` (neu), Handler `POST /api/test`

### Kontext

Vorlage: `eventSub` in `server/twitch.ts` (Abos, Reconnect nur auf `wss://*.twitch.tv`, Offline = Minimes leeren).

### Acceptance Criteria

- [ ] AC1: Nach `session_welcome` werden die Abos angelegt (Fake-Helix sieht die Anfragen).
- [ ] AC2: Notifications werden zu `alert`-Nachrichten; `session_reconnect` nur zu erlaubten Adressen (im Test: Fake-Adresse per Konfiguration erlaubt).
- [ ] AC3: `POST /api/test?kind=` schickt Beispiel-Alerts wie heute.

### Tests (TDD)

1. `channel::alerts::tests::*` mit Fake-EventSub (AC1, AC2), Vertragsfall `contract/cases/alerts.ts` (AC3)

Testbefehl: `npm run verify`, `npm run contract:rust`

---

## Package 35: Trigger und Hilfe-Antwort

**Ziel:** Chatzeilen lösen Trigger aus, und der Hilfe-Befehl antwortet als Streamer.

**Abhängigkeiten:** Packages 11, 13, 33

**Betroffene Dateien:**
- `rst-app/src/channel/{triggers.rs,help.rs}` (neu), `rst-infra/src/twitch/helix_chat.rs` (neu: Nachricht senden, `canChat`)

### Kontext

Vorlage: `startTriggers` in `server/triggers.ts`, `server/help.ts`, `helpFor` in `server/streamer.ts`.

### Acceptance Criteria

- [ ] AC1: Passende Chatzeilen erzeugen `fx`-Ereignisse in der geplanten Reihenfolge und Zeit, mit Cooldowns.
- [ ] AC2: Der Hilfe-Befehl antwortet über Helix als Streamer, höchstens einmal pro Cooldown; die eigene Antwort wird nicht erneut verarbeitet.
- [ ] AC3: `POST /api/trigger?name=` löst ohne Cooldown aus.

### Tests (TDD)

1. `channel::triggers::tests::*` mit `tokio::time::pause` (AC1), `channel::help::tests::*` (AC2), Vertragsfall (AC3)

Testbefehl: `npm run verify`, `npm run contract:rust`

---

## Package 36: Minimes

**Ziel:** Minimes laufen auf dem Server und werden gespeichert.

**Abhängigkeiten:** Packages 12, 33

**Betroffene Dateien:**
- `rst-app/src/channel/minimes.rs` (neu)

### Kontext

Vorlage: `server/minimes.ts` (Speichern höchstens alle 2 s, Prune inaktiver, Offline leert).

### Acceptance Criteria

- [ ] AC1: Chat-Befehle ändern den Roster; `minimes`- und `minimeChat`-Ereignisse gehen raus.
- [ ] AC2: Speichern höchstens alle 2 s; nach Neustart ist der Roster wieder da; Ban entfernt.
- [ ] AC3: Eine Regeländerung in den Einstellungen wirkt sofort.

### Tests (TDD)

1. `channel::minimes::tests::*` mit `tokio::time::pause` (AC1 bis AC3)

Testbefehl: `npm run verify`

---

# Phase 5: Rest

## Package 37: Spotify

**Ziel:** Streamer verbinden Spotify, der laufende Titel geht per SSE an die Overlays.

**Abhängigkeiten:** Packages 17, 21, 32

**Betroffene Dateien:**
- `rst-infra/src/spotify/client.rs` (neu), `rst-app/src/music/{link.rs,poll.rs}` (neu), Handler `/spotify/*`, `/api/spotify`

### Kontext

Vorlage: `spotifyClient` in `server/spotify.ts` (Generation gegen späte Refreshes, Abfrage nur mit offenem Overlay,
429-Pause), Handler in `server/index.ts`.

### Acceptance Criteria

- [ ] AC1: Verbinden mit Callback-Bindung an die Sitzung (öffentlich) wie heute; Trennen löscht die Tokens auch ohne Musik-Funktion.
- [ ] AC2: Abfrage alle 3 s nur mit offenem Overlay, 429 pausiert, Erneuern als Single-Flight, späte Antworten nach Trennen werden verworfen.
- [ ] AC3: `GET /api/spotify` liefert Konto, Titel und Abfrage-Status.

### Tests (TDD)

1. `music::*::tests::*` mit Fake-Spotify und `tokio::time::pause` (AC2), Vertragsfälle `contract/cases/spotify.ts` (AC1, AC3)

Testbefehl: `npm run verify`, `npm run contract:rust`

---

## Package 38: Rendern

**Ziel:** Stinger und Banner werden aus Frames mit ffmpeg gebaut, ein Render pro Streamer.

**Abhängigkeiten:** Packages 14, 23, 26

**Betroffene Dateien:**
- `rst-infra/src/render/ffmpeg.rs` (neu: `tokio::process::Command`, Argumente als Liste, Zeitlimit), Handler `/api/render/*`

### Kontext

Vorlage: `server/renderRoutes.ts`. Frames liegen nur während des Renders unverschlüsselt in einem Temp-Ordner; das
Ergebnis wird verschlüsselt gespeichert.

### Acceptance Criteria

- [ ] AC1: Alle Render-Routen wie heute; während ffmpeg läuft `render-busy`; die Render-Funktion wird bei jedem Schritt geprüft (Audit-Härtung).
- [ ] AC2: ffmpeg hat ein Zeitlimit (5 Minuten) und wird beim Abbruch beendet; Temp-Frames werden in jedem Fall gelöscht.
- [ ] AC3: Ohne ffmpeg = `ffmpeg-missing`.

### Tests (TDD)

1. `render::ffmpeg::tests::*` mit einem Fake-ffmpeg-Skript über `FFMPEG` (AC2, AC3), Vertragsfälle `contract/cases/render.ts` (AC1)

Testbefehl: `npm run verify`, `npm run contract:rust`

---

## Package 39: Backups erstellen

**Ziel:** Admins erstellen, listen, laden herunter und löschen serverweite Backups.

**Abhängigkeiten:** Packages 21, 22, 23

**Betroffene Dateien:**
- `rst-app/src/backup/{create.rs,manifest.rs}` (neu), `rst-infra/src/backup/archive.rs` (neu: ZIP mit Manifest)
- Handler `GET/POST /api/admin/backups`, `GET /api/admin/backups/<id>`, `DELETE /api/admin/backups/<id>`
- `src/dashboard/Admin.tsx` (ändern: Bereich Backups)

### Kontext

Neu. Inhalt: JSON Lines je Tabelle aus der Daten-Datenbank (Chiffrat bleibt Chiffrat), verschlüsselte Dateien,
`manifest.json` (Schema-Version, Zeitpunkt, SHA-256 je Datei). Kein Schlüsselspeicher im Backup. Ablage `RST_BACKUPS`.

### Acceptance Criteria

- [ ] AC1: Ein Backup enthält alle Streamer und Dateien; das Manifest stimmt mit den Prüfsummen überein.
- [ ] AC2: Im Archiv steht kein Klartext-Login, kein Token und kein Schlüssel.
- [ ] AC3: Liste, Herunterladen und Löschen nur für Admins; jede Aktion im Audit-Log.
- [ ] AC4: Erstellen läuft im Hintergrund, ohne den Server zu blockieren; zwei gleichzeitige Backups = 409.

### Tests (TDD)

1. `backup::create::tests::*` (AC1, AC2, AC4), Vertragsfälle `contract/cases/backup.ts` (AC3)

Testbefehl: `npm run verify`, `npm run contract:rust`

---

## Package 40: Backups wiederherstellen

**Ziel:** Admins laden ein Backup hoch und stellen es geprüft wieder her.

**Abhängigkeiten:** Package 39

**Betroffene Dateien:**
- `rst-app/src/backup/restore.rs` (neu), Handler `POST /api/admin/backups/upload`, `POST /api/admin/backups/<id>/restore`
- `src/dashboard/Admin.tsx` (ändern: Hochladen, Wiederherstellen mit Bestätigung)

### Kontext

Wiederherstellen: Archiv prüfen (Manifest, Prüfsummen, Schema-Version, keine Pfade ausserhalb), in eine leere
Staging-Datenbank laden, Migrationen anwenden, im Wartungsmodus (alle Laufzeiten gestoppt, 503 für Overlays) atomar
umschalten, Laufzeiten neu starten.

### Acceptance Criteria

- [ ] AC1: Ein Backup aus Package 39 stellt denselben Stand wieder her (Vergleich vorher/nachher).
- [ ] AC2: Ein manipuliertes Archiv (Prüfsumme, Zip-Slip `../`, zu gross) wird abgelehnt; nichts wird geändert.
- [ ] AC3: Streamer, deren DEK fehlt (gelöscht), werden beim Wiederherstellen übersprungen und gemeldet.
- [ ] AC4: Während der Wiederherstellung antworten Overlays 503; danach laufen alle Laufzeiten wieder.

### Tests (TDD)

1. `backup::restore::tests::*` (AC1 bis AC4)

Testbefehl: `npm run verify`

---

## Package 41: Backup-Zeitplan und Schlüssel-Backups

**Ziel:** Automatische Backups sind einstellbar und Schlüssel-Backups laufen nach 30 Tagen ab.

**Abhängigkeiten:** Package 39

**Betroffene Dateien:**
- `rst-app/src/backup/{schedule.rs,keys.rs}` (neu), Handler `GET/POST /api/admin/backup-settings`
- `src/dashboard/Admin.tsx` (ändern: Zeitplan-Einstellungen)

### Kontext

Standard: nur manuell. Einstellbar: an/aus, Intervall (Stunden), Anzahl behaltener automatischer Backups.
Schlüssel-Backups: verschlüsselte Kopie von `keys.db` in eigenem Ordner `RST_KEY_BACKUPS`, täglich, Aufbewahrung fest
30 Tage (Server-Schutzgrenze).

### Acceptance Criteria

- [ ] AC1: Ausgeschaltet entsteht kein automatisches Backup; eingeschaltet im Intervall, ältere automatische werden gelöscht, manuelle bleiben.
- [ ] AC2: Schlüssel-Backups älter als 30 Tage werden gelöscht; ein gelöschter DEK ist nach 30 Tagen in keinem Schlüssel-Backup mehr.
- [ ] AC3: Einstellungen nur für Admins; Änderungen im Audit-Log.

### Tests (TDD)

1. `backup::schedule::tests::*`, `backup::keys::tests::*` mit `tokio::time::pause` (AC1, AC2), Vertragsfall (AC3)

Testbefehl: `npm run verify`

---

## Package 42: Streamer löschen

**Ziel:** Admins löschen einen Streamer endgültig über seinen Schlüssel.

**Abhängigkeiten:** Packages 18, 27

**Betroffene Dateien:**
- `rst-app/src/identity/delete.rs` (neu), Handler `DELETE /api/admin/streamers/<login>`
- `src/dashboard/Admin.tsx` (ändern: Knopf mit Bestätigung)

### Kontext

Reihenfolge: Laufzeit stoppen, Sitzungen widerrufen, Twitch- und Spotify-Token widerrufen, DEK löschen, Zeilen und
Dateien löschen, Audit-Eintrag (ohne Login im Klartext, nur Streamer-ID).

### Acceptance Criteria

- [ ] AC1: Nach dem Löschen ist der Streamer weg; Overlays antworten 404; Sitzungen sind ungültig.
- [ ] AC2: Ein vorher erstelltes Backup stellt den Streamer nicht wieder her (DEK fehlt, Package 40 AC3).
- [ ] AC3: Nur Admins, mit Bestätigung im Dashboard.

### Tests (TDD)

1. `identity::delete::tests::*` (AC1, AC2), Vertragsfall (AC3)

Testbefehl: `npm run verify`, `npm run contract:rust`

---

# Phase 6: Umstellung

## Package 43: Frontend auf erzeugte Typen

**Ziel:** Dashboard und Overlays nutzen die erzeugten Typen und das Schema vom Server.

**Abhängigkeiten:** Packages 2, 28, 30

**Betroffene Dateien:**
- `src/core/types.ts` (ändern: Re-Export aus `src/generated/`), `src/themes/*/settings.ts` (ändern: Werte-Typen aus `src/generated/themes/`)
- `src/dashboard/settingsForm.ts`, `ThemeSettings.tsx` (ändern: Schema per `GET /api/themes`)
- `scripts/rules.check.ts` (ändern: Regel "keine handgeschriebenen API-Typen ausserhalb von `src/generated/`")

### Kontext

Die TS-Schemas in `src/themes/*/settings.ts` werden zu reinen Anzeige-Ergänzungen (Szenen-Zuordnung, Vorschau); Regeln,
Grenzen und Standardwerte kommen nur noch vom Server. Die Fixtures aus Package 8 und `scripts/dumpSchema.ts` entfallen.

### Acceptance Criteria

- [ ] AC1: `tsc` grün mit den erzeugten Typen; keine doppelte Typdefinition für Server-Nachrichten mehr.
- [ ] AC2: Das Einstellungs-Formular baut sich aus dem Server-Schema; die Vorprüfung im Browser nutzt dasselbe Schema, der Server entscheidet.
- [ ] AC3: Bestehende Frontend-Checks bleiben grün.

### Tests (TDD)

1. `src/dashboard/settingsForm.check.ts` (ändern: Schema aus Fixture im Server-Format) (AC2)
2. `scripts/rules.check.ts` (AC1)

Testbefehl: `npm run verify`

---

## Package 44: Chat-Overlay über SSE

**Ziel:** Das Chat-Overlay bekommt Chatzeilen vom Server statt per IRC.

**Abhängigkeiten:** Packages 33, 43

**Betroffene Dateien:**
- `src/core/connection.ts` (ändern: `chat`-Nachrichten aus SSE, IRC-Pfad entfernt)
- `src/core/irc.ts`, `src/core/ircEvents.ts` (entfernen, soweit nur für den Browser-Chat)
- `src/core/emotes.ts` (bleibt: 7TV, BTTV, FFZ im Browser), `src/core/chat/chat.ts` (ändern: Twitch-Emotes aus Positionen)

### Kontext

Heute verbindet jedes Chat-Overlay selbst anonym zu IRC (`irc()` in `connection.ts`). `?channel=` ohne Server entfällt.

### Acceptance Criteria

- [ ] AC1: Chatzeilen, Löschungen und Bans erscheinen im Chat-Overlay über SSE.
- [ ] AC2: Twitch-Emotes aus Positionen und 7TV/BTTV/FFZ werden wie heute angezeigt.
- [ ] AC3: Im Browser gibt es keine Verbindung zu `irc-ws.chat.twitch.tv` mehr (Regel in `rules.check.ts`, plus manueller Check im Netzwerk-Tab).

### Tests (TDD)

1. `src/core/chat/chat.check.ts` (ändern: Positionen zu Teilen) (AC2), `scripts/rules.check.ts` (AC3)
2. Manueller Check: Chat-Overlay mit Fake-IRC (AC1)

Testbefehl: `npm run verify`

---

## Package 45: Umstieg

**Ziel:** Das Docker-Image enthält nur den Rust-Server, `server/` (Node) ist entfernt.

**Abhängigkeiten:** Package 4 und alle Packages davor

**Betroffene Dateien:**
- `Dockerfile` (ändern: Stufen Frontend-Build, `cargo build --release`, Laufzeit Alpine mit ffmpeg und `rst`)
- `docker-compose*.yml`, `server.env.example`, `README.md`, `CODING-RULES.md`, `PLAN.md` (ändern)
- `.github/workflows/docker.yml` (ändern: Rust-Toolchain und Cache, `npm run verify` mit Rust, Vertragstests als eigener Job)
- `server/` (entfernen), `package.json` (ändern: `server` startet `rst serve`), `scripts/rules.check.ts` (ändern)

### Acceptance Criteria

- [ ] AC1: `npm run contract:rust` ist vollständig grün, `contract/pending-rust.json` ist leer und entfernt.
- [ ] AC2: `docker build` erzeugt ein Image mit `rst` und ffmpeg, ohne Node-Laufzeit; der Container startet mit Dummy-Werten und beantwortet `/s/<x>/status` mit 404.
- [ ] AC3: CI baut, prüft (inkl. Rust und Vertragstests) und veröffentlicht nur von `main`.
- [ ] AC4: Die README beschreibt Hauptschlüssel, Schlüsselspeicher, Import, Backups und das Verhalten bei Schlüsselverlust.

### Tests (TDD)

1. Vertragstests (AC1), manueller Check Docker (AC2), CI-Lauf (AC3)

Testbefehl: `npm run verify`, `npm run contract:rust`, `docker build .`

---

# Phase 7: Prüfung

## Package 46: Abnahme

**Ziel:** Vertragstests, Wiederherstellung, Löschung über alte Backups und SSE-Last sind geprüft.

**Abhängigkeiten:** Package 45

**Betroffene Dateien:**
- `contract/drills/{restore.ts,shred.ts,sse-load.ts}` (neu)

### Acceptance Criteria

- [ ] AC1: Wiederherstellungs-Übung: Backup erstellen, Daten ändern, wiederherstellen; der Stand ist gleich dem Backup.
- [ ] AC2: Lösch-Übung: Backup, Streamer löschen, Backup wiederherstellen; der Streamer bleibt weg, kein Klartext im Archiv.
- [ ] AC3: SSE-Last: 50 Overlays je Streamer bei 10 Streamern plus 10 nicht lesende Clients; der Speicher bleibt unter 200 MB, keine Verbindung der lesenden Clients bricht ab.
- [ ] AC4: Sicherheits-Audit Lauf 2 mit dem Skill `anthropic-skills:security-audit` gegen den Rust-Server; neue Befunde als eigene Fix-Commits.

### Tests (TDD)

1. Die drei Übungen als Skripte (AC1 bis AC3), Audit (AC4)

Testbefehl: `node contract/drills/<name>.ts`

---

## Package 47: Fraktionen der Minimes

**Ziel:** Ein Theme kann Fraktionen anbieten; Chatter wählen eine per Befehl, der Server speichert sie.

**Abhängigkeiten:** keine

**Betroffene Dateien:**
- `server-rs/crates/rst-domain/src/themes/schema.rs` (`minime_teams: Option<MinimeVariantSet>`, gleiches Format wie
  `minime_variants`), `themes/minime_fields.rs` (Felder je Fraktion: Chat-Namen, Anzeigename, Farbe; Befehl)
- `server-rs/crates/rst-domain/src/minimes/{rules.rs,command.rs,roster.rs,mod.rs}`
- `server-rs/crates/rst-app/src/channel/minimes.rs`, `server-rs/crates/rst-domain/src/commands/mod.rs`
  (`CommandItem::Team`, auch in der Hilfe-Antwort)
- TS-Gegenstück der Felder: `src/core/theme.ts` (`minimeTeams`), `src/core/minimeFields.ts` (`minimeTeamFields` mit
  den Info-Texten zum Fraktions-Befehl), `src/core/commands.ts` (Eintrag `team`), `src/core/infoFields.ts`
  (Eintrag `team` auf der Info-Seite), `src/themes/schemaAudit.ts` (neue Kern-Schlüssel und Präfixe)
- `scripts/dumpSchema.ts` (neues Fixture `minime-features.json` mit allen Opt-in-Feldern), `src/generated/`

### Kontext

Fraktionen sind ein zweites Typ-Set (entschieden 2026-10-18): gleiches Format wie die Typen (`MinimeVariantSet` mit Befehl, Anzeigename
und Chat-Namen je Eintrag), gleiche Prüfung der Namen (`normalize_name`, ein Name gehört dem ersten Eintrag), gleiches
Merken nach `!leave` wie bei Typen (`StoredVariant`). Neu sind das Feld `team` in `MinimeEntry`, das Lesen beider
Sets aus einem `!join`-Argument, die Zuteilung zur kleinsten Fraktion und je Fraktion einstellbarer Name und Farbe.
Fraktionen gibt es nur in Themes mit Typen (entschieden 2026-10-18). Der Wechsel-Befehl ist der Befehl des Sets (Standard `!team`);
Abklingzeit und "Befehl klinkt auch ein" (`minimeColorJoins`) gelten wie beim Typ.

Details aus dem Code:
- `team` an `MinimeEntry` und `Minime` mit `#[serde(default, skip_serializing_if = "Option::is_none")]` und
  `#[ts(optional)]`: alte Daten bleiben lesbar, das SSE-Ereignis `minimes` bleibt für Themes ohne Fraktionen gleich,
  bestehende TS-Literale (`demo.ts`) kompilieren weiter. `MinimeState` bekommt `teams` mit `#[serde(default)]`.
- Steht ein Name in beiden Sets, gilt er als Typ (Typen zuerst, wie "ein Name gehört dem ersten Eintrag").
- Die Info-Texte zum Fraktions-Befehl sind Teil der Fraktions-Felder (opt-in), damit Themes ohne Fraktionen keine toten
  Felder bekommen (`auditTheme`).

Felder in Rust und TS entstehen im selben Package: Die Fixtures vergleichen sonst erst, wenn ein Theme die Felder nutzt.
Das neue Fixture `minime-features.json` hält die Opt-in-Felder (Fraktionen, Gefechte, Plätze) schon vorher gleich.

### Acceptance Criteria

- [ ] AC1: Beim `!join` wird das Argument an jeder Wortgrenze in zwei Teile geteilt (auch "alles" und "nichts"); der
  erste Schnitt, bei dem jeder nicht leere Teil genau in ein Set passt, gewinnt. So gehen `!join blau medic`,
  `!join medic blau`, `!join blau`, `!join medic` und Mehrwortnamen (`!join eis am stiel blau`). Passt nichts, ist es
  ein `!join` ohne Angabe. `!team rot` wechselt die Fraktion.
- [ ] AC2: Ohne Angabe kommt der Chatter in die Fraktion mit den wenigsten Mitgliedern (bei Gleichstand die erste);
  eine gemerkte Fraktion hat Vorrang, wenn sie noch an ist.
- [ ] AC3: Eine Fraktion mit leerer Namensliste ist aus; Mitglieder einer ausgeschalteten Fraktion werden beim
  Aufräumen neu zugeteilt (wie ausgeschaltete Typen).
- [ ] AC4: Die Fraktion wird gespeichert, kommt nach einem Neustart wieder und geht mit `minimes` an die Overlays;
  gespeicherte Minimes und alte Backups ohne `team` werden weiter gelesen (`#[serde(default)]`).
- [ ] AC5: Die öffentliche Befehlsliste (`public_commands`), die Hilfe-Antwort und die Info-Seite nennen den
  Fraktions-Befehl mit seinen Namen.
- [ ] AC6: Themes ohne Fraktionen und Farb-Themes verhalten sich wie bisher (kein `team`, `!team` unbekannt); ein Schema
  mit Fraktionen ohne Typen wird beim Start abgelehnt.
- [ ] AC7: TS- und Rust-Felder sind gleich (`minime-features.json`).

### Tests (TDD)

1. `rst-domain minimes::command::tests` für die Befehlsformen inklusive Mehrwortname (AC1, AC6)
2. `rst-domain minimes::roster::tests::join_picks_smallest_team`, `remembered_team_wins`, `disabled_team_is_reassigned`
   (AC2, AC3)
3. `rst-app channel::minimes::tests` Speichern und Laden mit Fraktion, Laden alter Daten ohne `team` (AC4)
4. `rst-app commands::tests::team_command_is_listed` (AC5)
5. `rst-domain themes::schema::tests::teams_need_variants` (AC6), Fixture-Vergleich (AC7)
6. Vertragsfall, sobald ein eingebautes Theme Fraktionen einbindet

Testbefehl: `npm run verify`, `npm run contract`

---

## Package 48: Neue Minime-Felder im Schema

**Ziel:** Die Felder für Hüpfen, Gefechte und feste Plätze der Minimes stehen im Kern-Schema (Rust und TS), und ein
Theme kann die Standards der Kern-Felder setzen.

**Abhängigkeiten:** Package 47 (Fixture `minime-features.json`)

**Betroffene Dateien:**
- `server-rs/crates/rst-domain/src/themes/minime_fields.rs` (Hüpf- und Gefechts-Felder opt-in, Feld
  `minimePlacement`, `minime_base_fields(defaults)`), `themes/suedfrucht.rs` bzw. `urlaub.rs` (Hüpf-Felder aus dem Kern)
- TS-Gegenstück: `src/core/minimeFields.ts` (`minimeBaseFields(defaults)`, `MINIME_HOP_FIELDS`, Gruppen-Namen als
  Konstanten wie `MINIME_MOTION`), Theme-Settings des Themes, das heute hüpft; `src/themes/schemaAudit.ts` (neue
  Kern-Schlüssel und Präfixe, sonst meldet `auditTheme` sie als unbenutzt); Fixtures, `src/generated/`

### Kontext

Gefechte und Plätze sind reine Logik im Overlay ([plans/PLAN-MINIMES.md](plans/PLAN-MINIMES.md) Packages 11 und 12);
der Server speichert weder Treffer noch Plätze. Er braucht nur die Felder im Schema, damit die Werte geprüft gespeichert
und im Formular angezeigt werden. `minimePlacement` kommt in alle Themes mit Minimes; ohne das TS-Gegenstück im selben
Commit wären die Fixtures von Matrix und Urlaub rot.

Die Kern-Felder haben heute feste Standards (`MINIME_BASE_FIELDS`, `minime_base_fields()`); ein Theme kann z.B.
"Häufigkeit: wandern" nicht auf 0 setzen. Neu: Die Kern-Felder entstehen über eine Funktion, der das Theme eigene
Standards mitgibt (nur Standards, Grenzen bleiben). Die Hüpf-Felder (`hopHeight`, `hopMs`, `hopSquash`) liegen heute im
Theme, das hüpft; sie wandern mit gleichen Schlüsseln in den Kern, gespeicherte Werte bleiben.

### Acceptance Criteria

- [ ] AC1: Ein Theme, das Gefechte einbindet, hat die Felder: an/aus, Abstand min/max, Trefferchance, Liegezeit bis zum
  Selbst-Aufstehen, Wiederbelebungsdauer, Medic-Tempo, gleichzeitige Gefechte (Standard 2, entschieden 2026-10-18), und je Rolle (aus
  den Typen) die Dauer von Zielen und Schuss;
  dazu Gefechtstöne an/aus (Standard aus) und je Ereignis (Schuss, Explosion, Treffer, Wiederbeleben) ein Ton-Feld
  wie bei den Alerts (`SoundValue`: eigene Datei oder eingebauter Ton des Themes, Lautstärke).
- [ ] AC2: Jedes Theme mit Minimes hat `minimePlacement` (`random` oder `slots`, Standard vom Theme, sonst `random`).
- [ ] AC3: Werte ausserhalb der Grenzen werden abgelehnt; Themes ohne Gefechte haben die Gefechts-Felder nicht.
- [ ] AC4: TS- und Rust-Felder sind gleich (Theme-Fixtures und `minime-features.json`).
- [ ] AC5: Ein Theme kann den Standard jedes Kern-Felds setzen; ohne Angabe gilt der Kern-Standard.
- [ ] AC6: Die Hüpf-Felder kommen aus dem Kern mit denselben Schlüsseln; ein gespeichertes `hopHeight` wird weiter
  gelesen.

### Tests (TDD)

1. `rst-domain themes::minime_fields::tests::combat_fields_are_opt_in` (AC1, AC3)
2. `rst-domain themes::minime_fields::tests::placement_defaults_to_random` (AC2)
3. Fixture-Vergleich (AC4, AC6)
4. `rst-domain themes::minime_fields::tests::theme_sets_core_default` (AC5)
5. `rst-domain settings::file::tests::stored_hop_values_stay` (AC6)

Testbefehl: `npm run verify`

---

## Package 49: Alte Standardwerte ersetzen

**Ziel:** Ändert ein Theme einen Standardwert, bekommen Streamer mit dem alten Standard beim Lesen den neuen; selbst
gewählte Werte bleiben.

**Abhängigkeiten:** keine

**Betroffene Dateien:** `server-rs/crates/rst-domain/src/settings/file.rs` (Tabelle `OLD_DEFAULTS`: Theme, Schlüssel,
alter Wert, neuer Wert; die Tabelle startet leer, der erste Eintrag kommt mit dem Theme-Plan, der ihn braucht)

### Kontext

Das Formular speichert alle Werte, auch unveränderte Standards. Ändert ein Theme einen Standard (Theme-Plan
[src/themes/urlaub/docs/PLAN-URLAUB.md](src/themes/urlaub/docs/PLAN-URLAUB.md) Package 4: `!frucht` zu `!typ`), bliebe bei allen Streamern der alte Wert
stehen. Die Übernahme läuft beim Lesen wie `current_id`, also auch für `rst import` und Backups.

### Acceptance Criteria

- [ ] AC1: Ein gespeicherter alter Standard wird als neuer gelesen, beim nächsten Speichern steht der neue drin.
- [ ] AC2: Ein selbst gewählter Wert bleibt.
- [ ] AC3: Die Regel greift nach `current_id`, also auch für Werte unter einer alten Theme-ID.

### Tests (TDD)

1. `rst-domain settings::file::tests::old_default_is_replaced`, `own_value_stays`, `old_default_under_old_id` mit einer
   Test-Tabelle (`starter -> standard` als alte ID) (AC1 bis AC3)

Testbefehl: `npm run verify`

---

## Package 50: Turm-Felder der Minimes

**Ziel:** Ein Theme mit Minime-Typen kann die Felder für Türme einbinden; sie stehen im Rust- und TS-Schema gleich und
werden geprüft gespeichert.

**Abhängigkeiten:** Package 48 (Kern-Felder mit Theme-Standards)

**Betroffene Dateien:**
- `server-rs/crates/rst-domain/src/themes/minime_fields.rs` (neu `minime_stack_fields(variants, defaults)`, opt-in)
- TS-Gegenstück: `src/core/minimeFields.ts` (`minimeStackFields(set, defaults)`, Gruppe `MINIME_STACK = "Minimes: Türme"`),
  `src/themes/schemaAudit.ts` (Kern-Schlüssel), Fixture `minime-features.json`, `src/generated/`

### Kontext

Türme sind reine Logik im Overlay ([plans/PLAN-MINIMES.md](plans/PLAN-MINIMES.md) Package 13); der Server speichert
keinen Turm. Er braucht nur die Felder, damit Werte geprüft gespeichert und im Formular gezeigt werden. Wie die
Gefechts-Felder sind sie opt-in: nur ein Theme, das sie einbindet, hat sie.

### Acceptance Criteria

- [ ] AC1: Ein Theme, das Türme einbindet, hat die Felder: an/aus, Abstand min/max zwischen zwei Türmen,
  gleichzeitige Türme, je Stufe 1 bis 3 der Typ (Auswahl aus den Typen des Themes plus "keiner" für Stufe 3),
  Tempo beim Zusammenlaufen, Dauer je Stufe beim Klettern und Absteigen, Abstand zur Seite beim Absteigen, Dauer des Stehens, "Turm läuft" an/aus,
  Dauer und Strecke des Laufens als Turm, und einen Ton beim Aufsteigen (an/aus, `SoundValue` wie bei den Alerts).
- [ ] AC2: Das Theme setzt die Standards (z. B. die Typen der Stufen); ohne Angabe gelten Kern-Standards (Türme aus).
- [ ] AC3: Werte ausserhalb der Grenzen und Typen, die das Theme nicht hat, werden abgelehnt; Themes ohne Türme haben
  die Felder nicht.
- [ ] AC4: TS- und Rust-Felder sind gleich (Theme-Fixtures und `minime-features.json`).

### Tests (TDD)

1. `rst-domain themes::minime_fields::tests::stack_fields_are_opt_in` (AC1, AC3)
2. `rst-domain themes::minime_fields::tests::stack_levels_offer_only_theme_variants` (AC3)
3. `rst-domain themes::minime_fields::tests::theme_sets_stack_defaults` (AC2)
4. Fixture-Vergleich (AC4)

Testbefehl: `npm run verify`

---

## Package 51: Merkmal "einfach" am Feld

**Ziel:** Ein Feld kann im Rust-Schema als einfach markiert sein, und `GET /api/themes` liefert das Merkmal mit.

**Abhängigkeiten:** keine

**Betroffene Dateien:**
- `server-rs/crates/rst-domain/src/settings/field.rs` (ändern: `SettingField.basic`, Helfer `basic(field)`)
- `src/generated/SettingField.ts` (neu erzeugt mit `npm run gen:types`)

### Kontext

Die Theme-Seite im Dashboard bekommt die Modi Einfach und Erweitert
([plans/PLAN-SETTINGS.md](plans/PLAN-SETTINGS.md)). Welche Felder einfach sind, entscheidet das Schema je Feld. Der
Server ist die Quelle des Schemas, also braucht das Rust-Feld das Merkmal. Es ändert weder Prüfung noch Standards.

### Acceptance Criteria

- [ ] AC1: `SettingField` hat `basic: bool`; JSON ohne `basic` liest sich als `false`, `false` wird nicht geschrieben,
  `true` als `"basic": true`.
- [ ] AC2: `basic(field)` setzt nur das Merkmal (wie `in_scene` nur die Szene setzt).
- [ ] AC3: Der erzeugte TS-Typ hat `basic?: boolean`; bestehende Fixtures ohne `basic` bleiben gleich.

### Tests (TDD)

1. `rst-domain settings::field::tests::basic_only_adds_the_flag` (AC2)
2. `rst-domain settings::field::tests::basic_is_written_only_when_set` (AC1)
3. Fixture-Vergleich aller Themes unverändert grün (AC3)

Testbefehl: `npm run verify`

---

## Package 52: Stream-Statistik

**Ziel:** Der Server zählt je Stream Alerts und Chat und schickt den Stand als SSE-Nachricht `stats`.

**Abhängigkeiten:** keine

**Betroffene Dateien:**
- `server-rs/crates/rst-domain/src/stats/mod.rs` (neu: `StreamTally` mit `record_alert`, `record_chat`, `reset`,
  `snapshot`, serialisierbar), `server-rs/crates/rst-domain/src/lib.rs` (Modul eintragen)
- `server-rs/crates/rst-app/src/profile/mod.rs` (ändern: Eintrag `stats` mit `stats` und `save_stats`)
- `server-rs/crates/rst-app/src/channel/stats.rs` (neu: `StatsRunner` nach dem Muster von `channel/minimes.rs`: lädt beim
  Start, zählt, sendet gedrosselt, speichert höchstens alle `SAVE_DELAY`), `server-rs/crates/rst-app/src/channel/mod.rs`
- `server-rs/crates/rst-app/src/channel/runtime.rs` (ändern: `StatsRunner` in der Laufzeit, Aufrufe in `read_events` und
  `read`)
- `server-rs/crates/rst-app/src/events.rs` (ändern: `ServerMessage::Stats { stats: StreamStats }`)
- `server-rs/crates/rst-server/src/handlers/events.rs` (ändern: `stats` in der ersten Nachrichtenfolge)
- `server-rs/crates/rst-server/src/app.rs` und ein Handler (neu: `POST /api/stats/reset`, nur mit Sitzung des
  Streamers)
- `src/generated/StreamStats.ts` (neu, erzeugt mit `npm run gen:types`), Vertragstest in `contract/`

### Kontext

Kern-Plan: [plans/PLAN-STATS.md](plans/PLAN-STATS.md). EventSub liefert heute Alerts und `stream.offline`
(`subscriptions` in `twitch/eventsub.rs`); `read_events` in `runtime.rs` leitet Alerts an die Overlays
(`ServerMessage::Alert`) und räumt bei `Offline` die Minimes. Chatzeilen kommen über `read` aus IRC. Der SSE-Stream
schickt beim Verbinden Musik und Minimes sofort (`handlers/events.rs`). `MinimeRunner` (`channel/minimes.rs`) zeigt das
Muster für Laden, gedrosseltes Senden und Speichern im verschlüsselten Profil.

### Acceptance Criteria

- [ ] AC1: `record_alert` zählt je Art: `follow` +1 `follows`; `sub` und `resub` +1 `subs`; `gift` + `amount`
  `giftedSubs`; `raid` +1 `raids` und + `amount` `raiders`; `cheer` + `amount` `bits`; `redeem` +1 `redeems`;
  `hype` mit `detail = "end"` setzt `hypeLevel` auf das Maximum aus bisherigem Wert und `amount`.
- [ ] AC2: `record_chat(login)` zählt `chatMessages` und `chatters` (verschiedene Logins, Gross- und Kleinschreibung
  gleich); der Snapshot enthält nie Logins.
- [ ] AC3: Nur `reset` setzt die Zählung auf 0 und `startedAt` auf jetzt; Streamstart, Streamende und ein Neustart
  lassen sie stehen; vor dem ersten Zurücksetzen setzt das erste Ereignis `startedAt`.
- [ ] AC4: Nach jeder Änderung geht `ServerMessage::Stats` an die Overlays, höchstens alle 2 Sekunden
  (`fixed: Schutz des SSE-Streams bei vollem Chat`); die letzte Änderung innerhalb der Sperre wird danach gesendet.
- [ ] AC5: Ein neues Overlay bekommt beim Verbinden sofort den aktuellen Stand.
- [ ] AC6: `POST /api/stats/reset` setzt die Zählung des eigenen Streamers zurück (401 ohne Sitzung), speichert und
  sendet den Stand.
- [ ] AC7: Gezählt wird nur, wenn die Laufzeit die Ereignisse empfängt (Funktion Alerts für EventSub, Chat für IRC); es
  gibt keine eigene Abfrage bei Twitch.
- [ ] AC8: Nach einem Ereignis ist der Stand spätestens nach `SAVE_DELAY` im verschlüsselten Profil gespeichert; eine neu
  gestartete Laufzeit lädt ihn und zählt weiter (auch die Zahl verschiedener Chatter).

### Tests (TDD)

1. `rst-domain stats::tests::alerts_count_by_kind` (AC1)
2. `rst-domain stats::tests::chatters_are_unique_and_never_exposed` (AC2)
3. `rst-domain stats::tests::only_reset_clears` (AC3)
4. `rst-app profile::tests::stats_round_trip` (AC8)
5. `rst-app channel::stats::tests::throttled_send_and_save_then_reload_continues` (AC4, AC8, mit fester Uhr)
6. Vertragstest `contract/`: SSE beim Verbinden enthält `stats`; Reset ohne Sitzung 401, mit Sitzung 0 (AC5, AC6)

Testbefehl: `npm run verify`, `npm run contract`

---

## Package 53: Gemeinsame Stinger-Felder

**Ziel:** Alle acht Themes führen Bildrate, Pause, Bewegungskurve und Ausgabegrösse des Stingers aus einem gemeinsamen
Baustein im Schema.

**Abhängigkeiten:** keine (TS-Seite: [plans/PLAN-GRAFIK.md](plans/PLAN-GRAFIK.md) Packages 6 und 7, im selben Commit wie
Package 7 dort)

**Betroffene Dateien:**
- `server-rs/crates/rst-domain/src/themes/stinger_fields.rs` (neu): `stinger_fields(group, fps_default)` nach dem
  Muster von `core_fields.rs`, Vorlage `stingerFields` in `src/core/stingerOptions.ts`; `themes/mod.rs` (Modul)
- `server-rs/crates/rst-domain/src/themes/{standard,matrix,urlaub,plantage,koth,bears,chaos,dachdecker}.rs` (ändern:
  die Gruppe "Stinger" hängt `stinger_fields` an; `dachdecker.rs` entfernt seine eigenen Zeilen `stingerFps` und
  `stingerHold`)
- `server-rs/crates/rst-domain/tests/fixtures/<id>.json` (neu erzeugt aus TS)

### Kontext

Die Felder sind dieselben wie in TS: `stingerFps` (10 bis 60, Standard je Theme 60, Dachdecker 30), `stingerHold` (0 bis
80 %, Standard 0), `stingerEase` (Auswahl `linear`, `nagel`, `federnd`, `weich`, `stempel`, Standard `linear`),
`stingerSize` (Auswahl `1080p`, `720p`, Standard `1080p`). Der Server prüft nur Bereiche und Auswahl; die Bildrate der
Render-Aufträge kommt weiter beim Abschluss (`/api/render/done?fps=`).

### Acceptance Criteria

- [ ] AC1: `stinger_fields("Stinger", 60.0)` liefert die vier Felder in dieser Reihenfolge mit den Bereichen und
      Standards oben.
- [ ] AC2: Jedes der acht Themes hat die Felder in der Gruppe "Stinger"; die Fixture-Tests (`same_as_typescript`) sind
      grün.
- [ ] AC3: Ein Wert ausserhalb des Bereichs (z. B. `stingerFps = 5`) oder eine unbekannte Auswahl wird abgelehnt.

### Tests (TDD)

1. `rst-domain themes::stinger_fields::tests::fields_and_defaults` (AC1)
2. `rst-domain themes::<id>::tests::same_as_typescript` je Theme (AC2)
3. `rst-domain themes::stinger_fields::tests::rejects_out_of_range` (AC3)

Testbefehl: `npm run verify`, `npm run contract`

---

## Package 54: Gemeinsames Feld Leistungsstufe

**Ziel:** Themes mit 3D oder PixiJS führen die Leistungsstufe aus einem gemeinsamen Baustein im Schema.

**Abhängigkeiten:** keine (TS-Seite: [plans/PLAN-GRAFIK.md](plans/PLAN-GRAFIK.md) Package 8, im selben Commit)

**Betroffene Dateien:**
- `server-rs/crates/rst-domain/src/themes/graphics_fields.rs` (neu): `quality_field(group)`, Vorlage `qualityField` in
  `src/core/graphicsFields.ts`; `themes/mod.rs`
- `server-rs/crates/rst-domain/src/themes/dachdecker.rs` (ändern: eigenes Feld `quality` durch `quality_field`)
- `server-rs/crates/rst-domain/tests/fixtures/dachdecker.json`

### Kontext

Die modernisierten Themes hängen das Feld in ihrem ersten Package der Modernisierung an (siehe deren Pläne); dieses
Package liefert nur den Baustein und stellt Dachdecker um. Schlüssel `quality`, Auswahl `hoch`, `mittel`, `niedrig`,
Standard `mittel`.

### Acceptance Criteria

- [ ] AC1: `quality_field("Allgemein")` liefert das Auswahlfeld mit den drei Stufen und Standard `mittel`.
- [ ] AC2: Dachdecker ist unverändert im Schema (gleicher Schlüssel, gleiche Gruppe), der Fixture-Test ist grün.

### Tests (TDD)

1. `rst-domain themes::graphics_fields::tests::quality_choices` (AC1)
2. `rst-domain themes::dachdecker::tests::same_as_typescript` (AC2)

Testbefehl: `npm run verify`

---

## Risiken

- **Umfang:** 46 Packages; realistisch mehrere Wochen.
- **Theme-Arbeit wird zweigeteilt:** Regeln in Rust, Darstellung in React. Neue Felder entstehen in Rust; ohne
  Rust-Toolchain kann niemand mehr ein Theme-Feld hinzufügen.
- **Schlüsselverlust:** Ohne `RST_MASTER_KEY` und Schlüsselspeicher sind alle Daten verloren; README und Betrieb müssen
  das deutlich sagen.
- **Regex-Abweichung:** Muster mit Rückverweisen oder Lookarounds funktionieren nicht mehr (Package 11); der Import
  meldet bestehende Trigger mit solchen Mustern (Package 24).
- **Twitch-Details:** EventSub-Reconnect, IRC-Tags und Rate-Limits müssen exakt nachgebaut werden; die Vertragstests
  mit dem Fake-Provider fangen nur, was sie beschreiben.
- **Doppelte Wahrheit in der Übergangszeit:** bis Package 43 existieren TS- und Rust-Schemas; die Fixtures aus Package 8
  halten sie gleich, Änderungen an Themes in dieser Zeit müssen auf beiden Seiten passieren.
