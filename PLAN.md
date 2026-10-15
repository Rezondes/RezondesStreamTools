# Plan: ein Server, mehrere Streamer, Themes

Die Packages sind nach technischen Abhängigkeiten geordnet. Package 1 ist erledigt.
Jedes Package endet mit grünem `npm run verify` und ist einzeln committbar. Regeln: [CODING-RULES.md](CODING-RULES.md).

## Überblick

| # | Package | Ziel in einem Satz | Abhängig von |
|---|---------|--------------------|--------------|
| 1 | Server mandantenfähig | Mehrere Streamer melden sich per Twitch an und haben je eigene Laufzeit, Daten und Overlay-URLs. | - |
| 2 | Kern-Hooks | Alle Overlay-Logik liegt in `src/core/` und wird von den Szenen nur noch über Hooks genutzt. | 1 |
| 3 | Theme-Schnittstelle und Einstellungen | Ein Theme beschreibt seine Szenen und Einstellungen, der Server speichert geprüfte Einstellungen pro Streamer. | 1 |
| 4 | Theme zur Laufzeit | Jede Overlay-Seite lädt Theme und Einstellungen ihres Streamers und erbt fehlende Szenen vom Standard-Theme. | 2, 3 |
| 5 | Matrix-Theme | Der bisherige Look ist das eingebaute Theme `matrix`, in dem jede Farbe, jeder Name und jeder Text eine Einstellung ist. | 4 |
| 6 | Dashboard-Grundgerüst | Angemeldete Streamer sehen ein Dashboard mit Bereichen für Übersicht, Theme, Trigger, Medien, Verbindungen und Admin. | 1 |
| 7 | Einstellungs-Formular | Streamer ändern alle Theme-Einstellungen in einem automatisch erzeugten Formular mit Live-Vorschau. | 3, 5, 6 |
| 8 | Trigger und Medien im Dashboard | Trigger-Editor und Medienverwaltung laufen im Dashboard, mit Löschen und Speicherlimit pro Streamer. | 1, 6 |
| 9 | Admin-Bereich | Admins schalten Anmeldung, Allowlist, Beta-Tester und Funktionsstufen im Dashboard um. | 1, 6 |
| 10 | Rendern pro Streamer | Stinger und Banner werden pro Streamer mit seinen Einstellungen auf dem Server gerendert und heruntergeladen. | 5, 6 |
| 11 | Starter-Theme | Ein schlichtes Starter-Theme mit Anleitung zeigt, wie man ein eigenes Theme baut. | 4 |
| 12 | Deployment | Der Server läuft öffentlich hinter Caddy mit automatischem HTTPS. | 1 |
| 13 | Aufräumen | Altlasten aus der Einzel-Version sind entfernt, ESLint-Ausnahmen abgebaut, Coverage-Grenzen angehoben. | 2 bis 12 |

Parallel möglich: 2 und 3 nach 1; 6, 8, 9, 12 nach 1; 11 nach 4.

## Annahmen

- **Alles einstellbar:** Jeder sichtbare oder hörbare Wert eines Themes ist eine Einstellung des Streamers, auch im eingebauten Theme `matrix`:
  Farben, Schriften, Grössen, Positionen, Abstände, Texte, Namen, Logos, Zeiten, Animationen (Art, Dauer, Stärke), Töne, Medien, An/Aus je Szenenteil.
  Im Theme-Code bleiben nur Struktur und Logik. Das wird automatisch geprüft (Package 5, AC3).
  URL-Parameter (`?scale=`, `?demo`, ...) dürfen eine Einstellung pro OBS-Quelle überschreiben, ersetzen sie aber nicht.
- **Sprache:** Dashboard nur Deutsch, Texte aber in einem Textmodul (`src/dashboard/texts.de.ts`), damit später weitere Sprachen dazukommen (Regel 20).
- **Szenen:** feste Liste `starting`, `brb`, `ending`, `alerts`, `chat`, `cam`, `music`, `fx`. Ein Theme darf Szenen weglassen, sie kommen dann vom Standard-Theme `matrix`.
- **Einstellungen:** pro Streamer `data/streamers/<login>/settings.json` = `{ theme, values: { <theme-id>: { <key>: wert } } }`. Werte je Theme getrennt, damit ein Theme-Wechsel nichts verliert.
- **Einstellungs-Schema** ist reines TypeScript ohne React (`src/themes/<id>/settings.ts`), damit Server und Dashboard dasselbe Schema prüfen.
- **Feldtypen:** `color`, `text`, `textarea`, `lines` (Liste von Zeilen, z.B. Terminal-Witze), `number` (mit min/max/step), `boolean`, `select`.
- **Speicherlimit:** 200 MB Medien pro Streamer, einstellbar per `MEDIA_LIMIT_MB`. Einzeldatei weiter max. 50 MB.
- **Rendern:** Der Browser zeichnet die Frames wie bisher und lädt sie hoch, der Server kodiert mit ffmpeg (im Docker-Image per `apk add ffmpeg`). Ergebnis zum Herunterladen, denn OBS braucht den Stinger als lokale Datei.
- **Neue Funktionen** bekommen eine Funktionsstufe in `FEATURES` (`server/access.ts`), z.B. `themes`, damit sie erst an Beta-Tester gehen können.
- **Domain** kommt aus `DOMAIN` in `server.env`; Caddy holt das Zertifikat selbst.
- **Checks** sind `*.check.ts` mit `node:assert/strict`, gefunden von `npm test`; UI-Verhalten (Animation, Layout, OBS) wird als manueller Check beschrieben.

Testbefehl für alle Packages: `npm test` (einzelner Check: `node src/<datei>.check.ts`), Abschluss: `npm run verify`.

---

## Package 1: Server mandantenfähig (erledigt)

**Ziel:** Mehrere Streamer melden sich per Twitch an und haben je eigene Laufzeit, Daten und Overlay-URLs.

**Abhängigkeiten:** keine

**Betroffene Dateien:**
- `server/twitch.ts` (neu), `server/streamer.ts` (neu), `server/spotify.ts` (umbauen zur Fabrik), `server/index.ts` (nur Routing und Start)
- `server/http.ts`, `server/access.ts`, `server/session.ts` (vorhanden, einbinden)
- neue Checks für reine Teile (z.B. `server/routes.check.ts`, `server/migration.check.ts`)
- `src/twitch.ts`, `src/scenes/Home.tsx`, `src/scenes/Fx.tsx`, `vite.config.ts` (URLs), `README.md`, `server.env.example`

### Kontext

`server/index.ts` hält heute einen einzigen Login (`data/tokens.json`), eine EventSub-Verbindung, einen Chat-Listener und globale SSE-Clients. Spotify (`server/spotify.ts`) hat Modul-Zustand. Trigger und Medien liegen in `config/`.

### Acceptance Criteria

- [x] AC1: Anmeldung über `/auth/login` legt `data/streamers/<login>/tokens.json` (mode 600) an und setzt ein signiertes Cookie; ohne Freigabe (`canUse`) kommt eine 403-Seite.
- [x] AC2: `GET /s/<login>/status`, `/s/<login>/events`, `/s/<login>/media/<datei>`, `/s/<login>/<szene>.html` liefern nur Daten dieses Streamers und keine Geheimnisse; unbekannter Login ergibt 404.
- [x] AC3: Jede Dashboard-API (`/api/me`, `/api/test`, `/api/triggers*`, `/api/trigger`, `/api/media`, `/spotify/*`, `/api/twitch/disconnect`) nimmt den Streamer aus dem Cookie, ohne Cookie 401, bei abgeschalteter Funktion 403.
- [x] AC4: `/api/admin/access` ist nur für `ADMINS` erreichbar (sonst 403) und speichert atomar.
- [x] AC5: Beim Start werden alte Einzel-Daten (`data/tokens.json`, `data/spotify.json`, `CONFIG/triggers.json`, `CONFIG/media/*`) nach `data/streamers/<login>/` übernommen, die alten Dateien heissen danach `*.migrated`, der Login steht in der Allowlist.
- [x] AC6: Pro Streamer laufen EventSub, Chat-Trigger und Spotify unabhängig; `stop()` beendet alle Verbindungen.
- [x] AC7: Overlays und Übersicht nutzen die neuen URLs (`/s/<login>/...`, `/api/me`).

### Tests (TDD)

1. `server/routes.check.ts > Pfad-Zerlegung` - AC2: Gegeben `/s/rezondes/media/a.gif`, `/s/Bad Name/x`, `/s/rezondes/../x`; Erwartet Login + Rest, bzw. abgelehnt.
2. `server/routes.check.ts > Funktions-Gate je Route` - AC3: Gegeben Route + Funktionsstufen; Erwartet erlaubt/403.
3. `server/migration.check.ts > Übernahmeplan` - AC5: Gegeben vorhandene Altdateien; Erwartet Liste der Verschiebungen und Umbenennungen, nichts bei bereits übernommenen Daten.
4. `server/access.check.ts`, `server/session.check.ts` (vorhanden) - AC1, AC4.
5. Manuell (Smoke-Test mit curl, Dummy-Env, Temp-Datenordner): AC1 bis AC7.

### Umsetzungsschritte

Siehe Auftrag an den Agenten: Checks zuerst, dann `twitch.ts`, `spotify.ts`-Fabrik, `streamer.ts`, Router in `index.ts`, Migration, Frontend-URLs, README.

### Out of Scope

- Themes und Einstellungen (Package 3 bis 5), vollständiges Dashboard (6 bis 9), Rendern (10), HTTPS (12).

---

## Package 2: Kern-Hooks (erledigt)

**Ziel:** Alle Overlay-Logik liegt in `src/core/` und wird von den Szenen nur noch über Hooks genutzt.

**Abhängigkeiten:** Package 1

**Betroffene Dateien:**
- `src/core/streamer.ts` (neu: Login aus Pfad `/s/<login>/` oder `?s=`), `src/core/connection.ts` (neu: Status + SSE + IRC aus `src/twitch.ts`)
- `src/core/hooks/useAlerts.ts`, `useChat.ts`, `useMusic.ts`, `useFx.ts`, `useTerminal.ts`, `useDecode.ts`, `useNow.ts` (neu)
- `src/core/params.ts`, `src/core/sound.ts`, `src/core/glyphs.ts` (neu, aus `src/util.ts`)
- `src/irc.ts`, `src/emotes.ts`, `src/typing.ts`, `src/vinyl.ts` (verschieben nach `src/core/`)
- `src/scenes/*.tsx` (auf Hooks umstellen), `src/util.ts` (entfällt), `scripts/rules.check.ts` (WITHOUT_CHECK, BAG_NAME_EXCEPTIONS anpassen)

### Kontext

Heute rufen die Szenen `connect()` aus `src/twitch.ts` direkt auf und halten Warteschlangen, Fortschritt und Phasen selbst (`Alerts.tsx`, `Music.tsx`, `Fx.tsx`, `Screen.tsx > Terminal`). `src/util.ts` ist ein Sammelmodul (Regel 8). Regel 16 verlangt: Szenen präsentieren nur.

### Acceptance Criteria

- [x] AC1: Keine Overlay-Szene unter `src/scenes/` und keine Datei unter `src/themes/` ruft `fetch`, `EventSource` oder `WebSocket` auf (geprüft in `scripts/rules.check.ts`; `eslint.config.js` ist durch einen Plugin-Hook gesperrt).
- [x] AC2: `useAlerts` liefert genau einen aktuellen Alert, die Warteschlange rückt nach `duration` weiter; `useMusic` liefert `{ track, progressMs, visible }`; `useFx` liefert die sichtbaren Effekte mit Phase (`pre`, `play`, `post`); `useTerminal` liefert `{ shown, typing }`.
- [x] AC3: Die Warteschlangen- und Phasenlogik steckt in reinen Funktionen (z.B. `alertQueue.ts`, `fxPhases.ts`, `progress.ts`) mit Checks.
- [x] AC4: `src/util.ts` existiert nicht mehr, `BAG_NAME_EXCEPTIONS` ist leer.
- [x] AC5: Alle Overlays verhalten sich wie vorher (manueller Check mit `?demo`).

### Tests (TDD)

1. `src/core/streamer.check.ts` - AC2-Grundlage: Gegeben Pfade `/s/rezondes/alerts.html`, `/alerts.html?s=rezondes`, `/`; Erwartet `rezondes`, `rezondes`, `null`.
2. `src/core/alertQueue.check.ts` - AC2/AC3: Gegeben drei Alerts und feste Zeiten; Erwartet aktueller Alert und Wechselzeitpunkte, leere Queue liefert `null`.
3. `src/core/fxPhases.check.ts` - AC3: Gegeben `delay 1, duration 3, after 2` und `now`; Erwartet Phase `pre` bei 0,5 s, `play` bei 2 s, `post` bei 4,5 s, entfernt ab 6 s.
4. `src/core/progress.check.ts` - AC3: Gegeben Track mit `progressMs`, `playing`, Empfangszeit und `now`; Erwartet weitergerechneter Fortschritt, gedeckelt bei `durationMs`, bei Pause unverändert.
5. Bestehende `irc`, `typing`, `vinyl`-Checks wandern mit (Pfad ändert sich, Inhalt nicht).
6. Manuell: alle Overlays mit `?demo` im Browser, gleiches Verhalten wie vorher (AC5).

### Umsetzungsschritte

1. Reine Module verschieben (eigener Commit, nur Moves, Regel "Moves getrennt").
2. Checks für `streamer`, `alertQueue`, `fxPhases`, `progress` schreiben, rot sehen.
3. Reine Funktionen implementieren, grün.
4. Hooks darauf bauen, Szenen umstellen, `util.ts` aufteilen.
5. ESLint-Sperre für Netzwerk-APIs in `src/scenes/**` und `src/themes/**` ergänzen.
6. `npx eslint . --prune-suppressions`, `npm run verify`.

### Out of Scope

- Theme-Ordner und Einstellungen (Package 3 bis 5).

---

## Package 3: Theme-Schnittstelle und Einstellungen (erledigt)


**Ziel:** Ein Theme beschreibt seine Szenen und Einstellungen, der Server speichert geprüfte Einstellungen pro Streamer.

**Abhängigkeiten:** Package 1

**Betroffene Dateien:**
- `src/core/theme.ts` (neu: Typen `ThemeDefinition`, `SettingField`, `SceneName`)
- `src/core/settings.ts` (neu: `resolveSettings(schema, stored)`, `validateSettings(schema, input)`)
- `src/themes/registry.ts` (neu: Liste der eingebauten Themes, nur Schemas, ohne React)
- `server/settings.ts` (neu: Laden/Speichern `settings.json` atomar), `server/index.ts` (Routen)
- `server/access.ts` (Funktion `themes` in `FEATURES`)

### Kontext

Heute stecken Farben in `src/style.css`, Texte in den Szenen (`Screen.tsx > LOG/TITLE`, `Alerts.tsx > describe`) und Längen in `src/stinger.ts`. Es gibt keine Einstellungen pro Streamer.

### Acceptance Criteria

- [x] AC1: `SettingField` unterstützt `color`, `text`, `textarea`, `lines`, `number` (min/max/step, Einheit `px`/`ms`/`s`/`%`), `boolean`, `select`, `font` (Liste erlaubter Schriften), `media` (Datei aus den eigenen Medien, gefiltert nach Bild/Video/Ton), `sound` (eigener Ton oder eingebauter Synth-Ton mit Tonhöhe/Länge/Lautstärke), jeweils mit `key`, `label`, `group`, `scene` (welche Szene, für die Vorschau), `default`.
- [x] AC2: `resolveSettings` liefert für jedes Feld einen Wert: gespeichert und gültig, sonst Standard; unbekannte Schlüssel fallen weg.
- [x] AC3: `validateSettings` lehnt falsche Typen, Werte ausserhalb min/max, ungültige Farben, zu lange Texte (max. 2000 Zeichen, Listen max. 200 Zeilen) mit Fehlercodes ab.
- [x] AC4: `GET /s/<login>/settings` liefert `{ theme, values }` (aufgelöst, keine Geheimnisse); `POST /api/settings` (Sitzung, Funktion `themes`) speichert nur nach erfolgreicher Prüfung, sonst 400 mit Fehlercodes.
- [x] AC5: Werte werden pro Theme getrennt gespeichert; ein Theme-Wechsel verliert keine Werte eines anderen Themes.

### Tests (TDD)

1. `src/core/settings.check.ts > resolve` - AC2: Gegeben Schema mit 3 Feldern, gespeichert 1 gültiger, 1 ungültiger, 1 fremder Schlüssel; Erwartet gültiger Wert, Standard, fremder entfernt.
2. `src/core/settings.check.ts > validate` - AC3: je Feldtyp ein gültiger und ein ungültiger Wert; Erwartet Fehlercode je Feld (`invalid_color`, `out_of_range`, `too_long`, ...).
3. `server/settings.check.ts > Theme-Wechsel` - AC5: Gegeben Werte für `matrix`, Wechsel auf `starter` und zurück; Erwartet `matrix`-Werte unverändert.
4. Manuell: curl gegen `/s/<login>/settings` und `POST /api/settings` mit gültigem und ungültigem Body (AC4).

### Umsetzungsschritte

1. Typen in `theme.ts`, Checks für `settings.ts` schreiben (rot).
2. `resolveSettings`, `validateSettings` implementieren (grün).
3. `server/settings.ts` mit Check, Routen, Funktion `themes`.

### Out of Scope

- Szenen-Komponenten des Matrix-Themes (Package 5), Formular (Package 7).

---

## Package 4: Theme zur Laufzeit (erledigt)


**Ziel:** Jede Overlay-Seite lädt Theme und Einstellungen ihres Streamers und erbt fehlende Szenen vom Standard-Theme.

**Abhängigkeiten:** Package 2, Package 3

**Betroffene Dateien:**
- `src/main.tsx` (Einstieg: Streamer, Szene, Theme wählen), `src/core/hooks/useSettings.ts` (neu), `src/core/sceneResolver.ts` (neu)
- `src/themes/registry.ts` (React-Teil: Szenen je Theme, per `import()` geladen)

### Kontext

`src/main.tsx` wählt heute eine feste Komponente je Szene. Themes gibt es noch nicht.

### Acceptance Criteria

- [x] AC1: `/s/<login>/<szene>.html` rendert die Szene des eingestellten Themes mit den aufgelösten Werten.
- [x] AC2: Fehlt die Szene im Theme, wird die Szene des Standard-Themes `matrix` genutzt.
- [x] AC3: Die Werte stehen als CSS-Variablen am Wurzelelement der Szene (`--<key>` für Farben und Zahlen) und als Kontext für Texte.
- [x] AC4: Nur der Code des gewählten Themes wird geladen (eigener Chunk je Theme).
- [x] AC5: Ändert der Streamer Einstellungen, übernimmt die Overlay-Seite sie ohne Neuladen (SSE-Nachricht `settings`).

### Tests (TDD)

1. `src/core/sceneResolver.check.ts` - AC1/AC2: Gegeben Theme mit `alerts`, ohne `chat`; Erwartet `alerts` aus dem Theme, `chat` aus `matrix`, unbekannte Szene ergibt `null`.
2. `src/core/cssVariables.check.ts` - AC3: Gegeben aufgelöste Werte; Erwartet nur Farben und Zahlen als `--key`, Zahlen mit Einheit laut Schema.
3. Manuell: Theme in `settings.json` wechseln, Overlay zeigt neues Theme; Einstellung ändern, Overlay passt sich ohne Neuladen an (AC4, AC5).

### Umsetzungsschritte

1. Checks für `sceneResolver` und `cssVariables` (rot), implementieren (grün).
2. `useSettings` (lädt `/s/<login>/settings`, hört auf SSE `settings`), `main.tsx` umbauen.
3. Server: nach `POST /api/settings` SSE `settings` an alle Overlays des Streamers.

### Out of Scope

- Inhalt des Matrix-Themes (Package 5).

---

## Package 5: Matrix-Theme (erledigt)

**Ziel:** Der bisherige Look ist das eingebaute Theme `matrix`, in dem jede Farbe, jeder Name und jeder Text eine Einstellung ist.

**Abhängigkeiten:** Package 4

**Betroffene Dateien:**
- `src/themes/matrix/index.ts`, `settings.ts`, `theme.css` (neu), `scenes/*.tsx` (aus `src/scenes/` verschoben)
- `src/themes/matrix/MatrixRain.tsx`, `stinger.ts`, `banners.ts` (aus `src/` verschoben)
- `src/style.css` (theme-neutraler Rest)

### Kontext

`src/scenes/*.tsx`, `src/style.css`, `src/stinger.ts`, `src/banners.ts` enthalten den Matrix-Look mit festen Werten (z.B. `#39FF14`, "REZONDES", `LOG`-Zeilen, Alert-Texte in `describe`, `DURATION = 1.6`, `CUT = 0.75`).

### Acceptance Criteria

- [x] AC1: Jeder sichtbare oder hörbare Wert ist eine Einstellung. Mindestens, gruppiert nach Szene:
  - **Allgemein:** alle Farben (Haupt, gedämpft, Linie, Hintergrund, Glow, Glitch, Blitz; eine Fehlerfarbe entfällt, die Overlays haben keinen Fehlerzustand), Schriften, Grundgrösse, Kanal-Name, ASCII-Logo, Glow-Stärke, Scanlines an/aus und Stärke, Glitch-Stärke und -Dauer.
  - **Matrix-Regen:** an/aus je Szene, Zeichensatz, Zeichengrösse, Dichte, Geschwindigkeit, Deckkraft, Bildrate.
  - **Starting/BRB/Ending:** Titel, Untertitel, Countdown-Standard, Fortschrittsbalken an/aus, Terminal an/aus, Terminal-Zeilen je Szene inkl. Vertipper-Skripte, Prompt-Text, Tipp-Tempo, Pausen zwischen Zeilen, Anzahl sichtbarer Zeilen, Ticker-Text und -Tempo, Einschalt-Animation (Art, Dauer), Rahmen-Grösse.
  - **Alerts:** Text je Alert-Art (Kopfzeile, Zeile, Platzhalter `{user}`, `{amount}`, `{detail}`), Dauer, Grösse (Skalierung), Position, Breite, Ein-/Ausblend-Animation, Ton je Alert-Art, Lautstärke, Zitat an/aus, Restzeit-Balken an/aus.
  - **Chat:** Prompt-Text (heute `@twitch:~$`), Badge-Texte, Schriftgrösse, Ausblendzeit, max. Nachrichten, Ausrichtung, Hintergrund-Deckkraft, Emote-Grösse, Ein-/Ausblend-Animation.
  - **Kamera-Rahmen:** Label, REC-Text und an/aus, Uhr an/aus, Eckenlänge und -dicke.
  - **Musik:** Darstellung (`cover`, `record`, `vinyl`, `none`), Kopfzeilen-Texte (Wiedergabe/Pause), Equalizer an/aus und Balkenanzahl, Ausblenden bei Pause, Platten-Drehtempo, Grössen.
  - **Effekte (fx):** Standarddauer, Standardgrösse, Ein-/Ausblend-Animation, Zufallsbereich der Position.
  - **Stinger:** Länge, Übergangspunkt, Text (heute `> SZENENWECHSEL`), Logo an/aus, Spaltenbreite, Fallzeit.
  - **Banner:** Texte, Untertitel, Schleifenlänge, Bildrate, Regen-Dichte.
- [x] AC2: Die Standardwerte ergeben genau den heutigen Look, die heutigen Texte, Töne und Zeiten.
- [x] AC3: Im Theme-Code (`src/themes/*/**` ausser `settings.ts`) gibt es keine festen Gestaltungswerte; automatisch geprüft durch `scripts/rules.check.ts`:
  Farbliterale (`#rgb`, `#rrggbb`, `rgb(`, `hsl(`), sichtbarer JSX-Text (Text zwischen Tags ausser Leerzeichen und Satzzeichen),
  `px`/`ms`/`s`-Zahlen in `theme.css` ausserhalb von `var(...)`-Standardwerten, Zahl-Literale > 1 in Szenen-Komponenten ausser Indizes.
  Ausnahmen nur mit Kommentar `// fixed: <Grund>` direkt darüber.
- [x] AC4: CSS ist unter `.theme-matrix` gekapselt.
- [x] AC5: Stinger und Banner nutzen Länge, Übergangspunkt und Texte aus den Einstellungen und bleiben reine Funktionen von `t`.

### Tests (TDD)

1. `src/themes/matrix/settings.check.ts` - AC1/AC2: Schema ist gültig (`validateSettings(schema, defaults)` ohne Fehler), alle Pflichtschlüssel vorhanden.
2. `src/themes/matrix/stinger.check.ts` - AC5: Gegeben `duration 2, cut 1`; Erwartet volle Abdeckung bei `t = cut`, leeres Bild bei `t = 0` und `t = duration` (Pixel-Stichprobe über ein Mock-Canvas mit gezählten `fillRect`-Aufrufen).
3. `scripts/rules.check.ts` erweitern - AC3: Gegeben eine Probe-Szene mit `#39FF14`, `<span>REC</span>`, `animation: 0.5s` und eine mit `// fixed:`-Ausnahme; Erwartet drei Meldungen, keine für die Ausnahme. Danach läuft die Prüfung über alle Themes.
4. `src/themes/matrix/settings.check.ts > Abdeckung` - AC1: jede Gruppe aus AC1 hat mindestens die genannten Schlüssel; jeder Schlüssel wird im Theme-Code genutzt (kein toter Schlüssel, Suche nach `settings.<key>` bzw. `var(--<key>)`).
4. Manuell: alle Szenen mit `?demo` sehen aus wie vorher (AC2), Farbe im Formular ändern wirkt überall (nach Package 7).

### Umsetzungsschritte

1. Dateien verschieben (eigener Commit).
2. Schema-Check schreiben (rot), `settings.ts` mit heutigen Werten (grün).
3. Szenen auf Kontext/CSS-Variablen umstellen, Regel-Check für Farbliterale.
4. Stinger/Banner parametrisieren, Check.

### Out of Scope

- Formular (Package 7), Rendern auf dem Server (Package 10).

---

## Package 6: Dashboard-Grundgerüst (erledigt)

**Ziel:** Angemeldete Streamer sehen ein Dashboard mit Bereichen für Übersicht, Theme, Trigger, Medien, Verbindungen und Admin.

**Abhängigkeiten:** Package 1

**Betroffene Dateien:**
- `src/dashboard/Dashboard.tsx`, `Overview.tsx`, `Connections.tsx`, `texts.de.ts`, `dashboard.css` (neu)
- `src/dashboard/navigation.ts` (neu: Bereiche je Funktionsstufe)
- `src/scenes/Home.tsx` (entfällt), `src/main.tsx`

### Kontext

`src/scenes/Home.tsx` ist heute Übersicht und Verbindungsseite in einem, mit Texten als Literale.

### Acceptance Criteria

- [x] AC1: Ohne Sitzung zeigt `/` nur die Anmeldung mit Twitch; nach Anmeldung das Dashboard.
- [x] AC2: Die Navigation zeigt nur Bereiche, deren Funktion für den Streamer freigegeben ist; Admin nur für Admins.
- [x] AC3: Übersicht listet alle OBS-URLs `/s/<login>/<szene>.html` mit Grösse und Kopier-Knopf.
- [x] AC4: Verbindungen zeigt Twitch- und Spotify-Status mit Verbinden/Trennen.
- [x] AC5: Alle Texte kommen aus `texts.de.ts`, Fehlercodes des Servers werden dort übersetzt.

### Tests (TDD)

1. `src/dashboard/navigation.check.ts` - AC2: Gegeben `/api/me` mit Funktionen und `admin`; Erwartet sichtbare Bereiche.
2. `src/dashboard/texts.de.check.ts` - AC5: jeder Fehlercode aus `server/` hat einen Text (Codes aus einer gemeinsamen Liste `src/core/errorCodes.ts`).
3. Manuell: Anmeldung, Navigation, Kopieren, Verbinden/Trennen (AC1, AC3, AC4).

### Umsetzungsschritte

1. Checks (rot), `navigation.ts`, `errorCodes.ts`, `texts.de.ts` (grün).
2. Komponenten, `Home.tsx` ersetzen.

### Out of Scope

- Inhalte der Bereiche Theme (7), Trigger/Medien (8), Admin (9), Rendern (10).

---

## Package 7: Einstellungs-Formular (erledigt)

**Ziel:** Streamer ändern alle Theme-Einstellungen in einem automatisch erzeugten Formular mit Live-Vorschau.

**Abhängigkeiten:** Package 3, Package 5, Package 6

**Betroffene Dateien:**
- `src/dashboard/ThemeSettings.tsx`, `SettingInput.tsx`, `ScenePreview.tsx` (neu)
- `src/dashboard/settingsForm.ts` (neu: Gruppierung, Änderungs-Status)

### Acceptance Criteria

- [x] AC1: Theme-Auswahl aus allen eingebauten Themes; Wechsel speichert sofort.
- [x] AC2: Für jedes Feld des Schemas erscheint das passende Eingabefeld, gruppiert nach `group`, mit sichtbarem Label (Regel 23).
- [x] AC3: Speichern zeigt Fehler je Feld aus den Fehlercodes; ohne Fehler sind die Werte sofort in allen Overlays aktiv.
- [x] AC4: Vorschau zeigt eine gewählte Szene als `iframe` (`/s/<login>/<szene>.html?demo`) mit den ungespeicherten Werten.
- [x] AC5: "Auf Standard zurücksetzen" je Feld und für das ganze Theme.

### Tests (TDD)

1. `src/dashboard/settingsForm.check.ts` - AC2/AC5: Gegeben Schema; Erwartet Gruppen in Schema-Reihenfolge, Zurücksetzen liefert Standardwerte, "geändert"-Erkennung.
2. Manuell: jedes Feld eingeben, Fehler sehen, speichern, Overlay ändert sich (AC1, AC3, AC4).

### Umsetzungsschritte

1. Check (rot), `settingsForm.ts` (grün).
2. `SettingInput` je Feldtyp, `ThemeSettings`, `ScenePreview` (Vorschau-Werte per `postMessage` an das iframe).

### Out of Scope

- Eigene Themes hochladen (nicht geplant; Themes sind Code).

---

## Package 8: Trigger und Medien im Dashboard (erledigt)

**Ziel:** Trigger-Editor und Medienverwaltung laufen im Dashboard, mit Löschen und Speicherlimit pro Streamer.

**Abhängigkeiten:** Package 1, Package 6

**Betroffene Dateien:**
- `src/scenes/Triggers.tsx` -> `src/dashboard/Triggers.tsx` (verschieben), `src/dashboard/Media.tsx` (neu)
- `server/media.ts` (neu: Liste mit Grössen, Löschen, Limit), `server/index.ts`

### Acceptance Criteria

- [x] AC1: Der Trigger-Editor funktioniert wie heute, im Dashboard-Bereich "Trigger".
- [x] AC2: Medien-Bereich listet Dateien mit Grösse und Vorschau, Löschen fragt nach und meldet, wenn ein Trigger die Datei noch nutzt.
- [x] AC3: Upload über dem Speicherlimit (Standard 200 MB, `MEDIA_LIMIT_MB`) wird mit Fehlercode abgelehnt.
- [x] AC4: `DELETE /api/media?name=` löscht nur Dateien des eigenen Streamers mit gültigem Namen.

### Tests (TDD)

1. `server/media.check.ts > Limit` - AC3: Gegeben belegte 190 MB, Upload 20 MB; Erwartet `quota-exceeded` (wie die übrigen Anfrage-Codes mit Bindestrich).
2. `server/media.check.ts > Nutzung` - AC2: Gegeben Trigger-Liste; Erwartet Liste der Trigger, die `lizard.gif` nutzen.
3. `server/media.check.ts > Name` - AC4: `../x.gif`, `a.exe` abgelehnt.
4. Manuell: Upload, Löschen mit Rückfrage, Editor wie vorher (AC1, AC2).

### Umsetzungsschritte

1. Checks (rot), `server/media.ts` (grün), Routen.
2. Editor verschieben, Medien-Bereich.

### Out of Scope

- Medien zwischen Streamern teilen.

---

## Package 9: Admin-Bereich (erledigt)

**Ziel:** Admins schalten Anmeldung, Allowlist, Beta-Tester und Funktionsstufen im Dashboard um.

**Abhängigkeiten:** Package 1, Package 6

**Betroffene Dateien:**
- `src/dashboard/Admin.tsx` (neu), `server/index.ts` (Liste der Profile für Admins: `GET /api/admin/streamers`)

### Acceptance Criteria

- [x] AC1: Admin sieht Anmeldemodus (`allowlist`/`open`), Allowlist, Beta-Tester, je Funktion die Stufe (`off`/`beta`/`all`) und kann alles speichern.
- [x] AC2: Admin sieht alle Profile mit Status (verbunden, EventSub aktiv, letzte Anmeldung).
- [x] AC3: Entzieht der Admin einem Streamer den Zugang, wird dessen Laufzeit sofort gestoppt. Geprüft: `revokedLogins` im Check, Sperre und 404 der Overlays per curl; das Stoppen einer echten Laufzeit braucht echte Twitch-Tokens (manuell).
- [x] AC4: Nicht-Admins bekommen auf beide Admin-Routen 403.

### Tests (TDD)

1. `server/access.check.ts` erweitern - AC3: Gegeben Zugang vorher/nachher; Erwartet Liste der zu stoppenden Logins (reine Funktion `revokedLogins`).
2. Manuell: Umschalten, Profil-Liste, Entzug stoppt Overlays (AC1, AC2, AC4 per curl).

### Umsetzungsschritte

1. Check (rot), `revokedLogins` (grün), Route und Stopp.
2. `Admin.tsx`.

### Out of Scope

- Rollen ausser Admin und Streamer.

---

## Package 10: Rendern pro Streamer (erledigt)

**Ziel:** Stinger und Banner werden pro Streamer mit seinen Einstellungen auf dem Server gerendert und heruntergeladen.

**Abhängigkeiten:** Package 5, Package 6

**Betroffene Dateien:**
- `src/dashboard/Render.tsx` (aus `src/scenes/Stinger.tsx`), `server/render.ts` (neu, aus dem Vite-Plugin in `vite.config.ts`)
- `vite.config.ts` (Render-Plugin entfällt), `Dockerfile` (`apk add ffmpeg`), `package.json` (`ffmpeg-static` entfällt)

### Acceptance Criteria

- [x] AC1: Im Dashboard-Bereich "Rendern" wählt der Streamer Stinger, Profil- oder Offline-Banner, sieht die Vorschau mit seinen Einstellungen und rendert.
- [x] AC2: Frames gehen an `POST /api/render/frame`, der Server kodiert mit ffmpeg nach `data/streamers/<login>/render/<name>.webm|gif|png`.
- [x] AC3: Das Ergebnis ist im Dashboard herunterladbar; GIFs über 10 MB werden mit Hinweis gemeldet.
- [x] AC4: Pro Streamer läuft höchstens ein Render gleichzeitig; Frame-Anzahl und Grösse sind begrenzt.
- [x] AC5: Funktionsstufen `stinger` und `banners` werden geprüft.

### Tests (TDD)

1. `server/render.check.ts > ffmpeg-Argumente` - AC2: Gegeben `gif`/`webm`, fps; Erwartet Argumentliste (Palette, Alpha).
2. `server/render.check.ts > Grenzen` - AC4: zweiter Start während laufendem Render ergibt `render-busy`, Frame 10000 abgelehnt.
3. Manuell: Rendern, Herunterladen, in OBS einbinden (AC1, AC3).

### Umsetzungsschritte

1. Checks (rot), `server/render.ts` (grün), Routen.
2. Render-Seite ins Dashboard, Vite-Plugin und `ffmpeg-static` entfernen, Dockerfile.

### Out of Scope

- Rendern ohne Browser (headless) auf dem Server.

---

## Package 11: Starter-Theme (erledigt)

**Ziel:** Ein schlichtes Starter-Theme mit Anleitung zeigt, wie man ein eigenes Theme baut.

**Abhängigkeiten:** Package 4

**Betroffene Dateien:**
- `src/themes/starter/index.ts`, `settings.ts`, `theme.css`, `scenes/Alerts.tsx`, `scenes/Chat.tsx` (neu, bewusst nur zwei Szenen)
- `THEMES.md` (neu: Aufbau, Schema, Hooks, Vererbung, Checkliste)

### Acceptance Criteria

- [x] AC1: Das Starter-Theme ist im Dashboard wählbar, zeigt eigene Alerts und Chat, alle anderen Szenen kommen von `matrix`.
- [x] AC2: Es nutzt nur Kern-Hooks und CSS-Variablen, keine festen Farben (Regel-Check aus Package 5 greift).
- [x] AC3: `THEMES.md` beschreibt Schritt für Schritt ein neues Theme, inklusive Registrierung und Checks.

### Tests (TDD)

1. `src/themes/starter/settings.check.ts` - Schema gültig, Standardwerte gültig.
2. `src/themes/registry.check.ts` - AC1: jedes registrierte Theme hat gültiges Schema und eindeutige id.
3. Manuell: Theme wählen, Alerts/Chat sehen, andere Szenen von `matrix` (AC1).

### Out of Scope

- Weitere eingebaute Themes (später je ein eigenes Package).

---

## Package 12: Deployment (erledigt)

**Ziel:** Der Server läuft öffentlich hinter Caddy mit automatischem HTTPS.

**Abhängigkeiten:** Package 1

**Betroffene Dateien:**
- `docker-compose.yml` (Dienst `caddy`, Overlay-Port nur intern), `Caddyfile` (neu), `server.env.example` (`DOMAIN`), `README.md` (Abschnitt Betrieb)
- `server/index.ts`, `server/session.ts` (Secure-Cookie aus `PUBLIC_URL=https://...`; `X-Forwarded-Proto` ist nicht nötig, weil Redirects `PUBLIC_URL` nutzen und Caddy den Host durchreicht)
- Umgesetzt als `docker-compose.public.yml` zusätzlich zu `docker-compose.yml`, damit der lokale Betrieb auf Port 8089 bleibt

### Acceptance Criteria

- [x] AC1: `docker compose --env-file server.env -f docker-compose.yml -f docker-compose.public.yml up -d` startet Overlay-Server und Caddy (Konfiguration mit `docker compose config` geprüft; Zertifikat und Anmeldung manuell auf dem Server); Caddy holt ein Zertifikat für `DOMAIN` und leitet HTTP auf HTTPS um.
- [x] AC2: Der Overlay-Server ist von aussen nur über Caddy erreichbar.
- [x] AC3: Cookies sind `Secure`, Redirect-URIs nutzen `PUBLIC_URL=https://<DOMAIN>`.
- [x] AC4: SSE läuft durch Caddy ohne Pufferung (`flush_interval -1`).
- [x] AC5: README beschreibt Twitch- und Spotify-Redirect-URLs für die Domain, Backup von `data/`, Update-Ablauf.

### Tests (TDD)

1. `server/session.check.ts` erweitern (dort liegt das Cookie) - AC3: Gegeben `PUBLIC_URL` https; Erwartet `Secure` im Cookie.
2. Manuell: auf einem Server mit Domain starten, Zertifikat, Anmeldung, Overlay in OBS (AC1, AC2, AC4).

### Out of Scope

- Mehrere Server, Datenbank statt Dateien.

---

## Package 13: Aufräumen (erledigt bis auf AC4)

**Ziel:** Altlasten aus der Einzel-Version sind entfernt, ESLint-Ausnahmen abgebaut, Coverage-Grenzen angehoben.

**Abhängigkeiten:** Package 2 bis 12

**Betroffene Dateien:**
- `eslint-suppressions.json`, `package.json` (Coverage-Grenzen), `scripts/rules.check.ts` (WITHOUT_CHECK), `config/` (nach Übernahme entfernen), `README.md`

### Acceptance Criteria

- [x] AC1: `eslint-suppressions.json` ist leer (`{}`; die Datei bleibt, weil `eslint.config.js` sie nennt).
- [x] AC2: Coverage-Grenzen mindestens 85 % Zeilen, 90 % Zweige, 90 % Funktionen (gelten schon strenger: 90/90/95).
- [x] AC3: `WITHOUT_CHECK` enthält nur noch Netzwerk-, Browser-Ein/Ausgabe- und Einstiegs-Module; Hooks (`use*.ts`) und reine Typ-Module erkennt die Regel selbst.
- [ ] AC4: `config/` und der `CONFIG`-Mount sind entfernt, README ohne Hinweise auf die Einzel-Version.
  **Bewusst offen:** Im echten Docker-Volume liegt noch die Einzel-Version (`tokens.json`, `spotify.json` im Wurzelordner,
  kein `streamers/`). Die Übernahme läuft erst beim ersten Start der neuen Version und liest dabei `config/triggers.json`
  und `config/media/`. Erst danach `config/`, den Mount in `docker-compose.yml`, `CONFIG` in `server/index.ts` und den
  README-Abschnitt "Umstieg vom Einzel-Server" entfernen.

### Tests (TDD)

1. Bestehende Checks und `npm run verify` mit den neuen Grenzen.

### Out of Scope

- Neue Funktionen.
