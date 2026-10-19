# Plan: Minimes (Chatter als Figuren im Overlay)

Chatter klinken sich per Chatbefehl als kleine Figur ("Minime") ein, die unten im Bild schwebt, hin und her wandert,
ihren Namen über dem Kopf trägt und zufällige Idle-Animationen zeigt. Im Matrix-Theme ist das Minime ein
Neon-Geist im Kapuzenpulli, ohne Beine, getragen von einer Matrix-Glyphen-Düse.

Die Packages sind nach technischen Abhängigkeiten geordnet. Jedes Package endet mit grünem `npm run verify` und ist
einzeln committbar. Regeln: [CODING-RULES.md](../CODING-RULES.md), Theme-Aufbau: [THEMES.md](../THEMES.md).

## Überblick

| # | Package | Ziel in einem Satz | Abhängig von |
|---|---------|--------------------|--------------|
| 1 | Minime-Regeln | Befehle, Farben und die Minime-Liste werden in einem reinen, geprüften Kernmodul entschieden. | - |
| 2 | Szene, Funktion und Einstellungen | Die Szene `minimes` existiert überall (Routen, Dashboard, OBS-Import), hat eine Funktionsstufe und gemeinsame Einstellungsfelder für jedes Verhalten. | - |
| 3 | Server-Laufzeit | Der Server führt die Minime-Liste pro Streamer, speichert sie und schickt sie per SSE an die Overlays. | 1, 2 |
| 4 | Verhalten und Hook | `useMinimes` liefert jeder Szene die Minimes samt aktueller Aktion und Position, mit Demo-Modus. | 1, 2 |
| 5 | Matrix-Geist: Grundform | Im Matrix-Theme schweben Neon-Geister mit Namen und Glyphen-Düse, wandern und erscheinen und verschwinden animiert. | 4 |
| 6 | Matrix-Geist: Idle-Animationen | Die Geister zeigen zufällig Backflip, Glitch, Umschauen, Blinzeln, Drehen und Schlafen und reagieren mit einem Düsen-Boost auf Chat. | 5 |
| 7 | Doku | THEMES.md und README erklären Befehle, Einstellungen und wie ein anderes Theme eigene Minimes bekommt. | 6 |
| 8 | Hüpfen im Kern | Die Hüpf-Bewegung der Minimes liegt im Kern, jedes Theme kann sie nutzen. | RUST-PLAN 48 |
| 9 | TS-Spiegel entfernen | Die Minime-Regeln (Befehle erkennen, Liste führen) gibt es nur noch in Rust. | - |
| 10 | Fraktionen | Ein Theme kann Fraktionen einbinden; Overlays, Info-Seite, Befehlsseite und Demo zeigen die Fraktion jedes Minimes. | 9, RUST-PLAN 47 |
| 11 | Gefechte | Ein Theme kann Gefechte einschalten: zufällige Schusswechsel mit Rollen, Getroffene liegen, bis ein Medic sie wiederbelebt. | RUST-PLAN 48 |
| 12 | Feste Plätze | Ein Theme kann Minimes auf gleichmässig verteilte Plätze stellen statt an zufällige Stellen. | 11, RUST-PLAN 48 |
| 13 | Türme | Ein Theme mit Minime-Typen kann Türme einschalten: je ein freies Minime pro Stufe stapelt sich zufällig, läuft als Turm und steigt ab. | RUST-PLAN 50 |

Parallel möglich: 1 und 2 sofort; 3 und 4 nach 1 und 2.

## Architektur in Kürze

```
Twitch-Chat ─> server/chat.ts ─> server/minimes.ts (Laufzeit, Datei) ─> SSE "minimes" / "minimeChat"
                                       │ nutzt
                                       v
                           src/core/minimes.ts (Regeln: Befehl, Farbe, Liste)

SSE ─> src/core/connection.ts ─> src/core/hooks/useMinimes.ts ─> src/themes/<id>/scenes/Minimes.tsx
                                       │ nutzt
                                       v
                           src/core/minimeBehavior.ts (Regeln: welche Aktion als nächstes, wohin)

src/core/minimeFields.ts: alle Verhaltens-Einstellungen, von jedem Theme-Schema eingebunden,
                          gelesen von Server (Regeln) und Hook (Verhalten)
```

- **Kern entscheidet, Theme zeigt (Regel 16):** Wer drin ist, welche Farbe, welche Aktion gerade läuft und wohin
  ein Minime wandert, entscheidet der Kern. Das Theme liefert Aussehen und einen **Aktionskatalog**
  (Name, Dauer, Gewicht aus seinen Einstellungen). So bekommt ein anderes Theme eigene Minimes mit eigenen
  Animationen, ohne Logik zu kopieren.
- **Eingebaute Aktionen** kennt jedes Theme: `enter`, `exit`, `idle`, `walk`. Alles andere (`backflip`, `glitch`, ...)
  ist themeeigen und wird nur über seinen Namen als CSS-Klasse angesprochen.
- **Bewegung per CSS (Regel 21):** Der Kern liefert `fromX`, `toX`, `durationMs`; die Szene setzt sie als
  CSS-Variablen, eine `transition` auf `transform` erledigt die Bewegung. React rendert nur bei Aktionswechseln.

## Annahmen

- **Alles einstellbar, auch Verhalten:** Jeder Wert, der beeinflusst, was ein Minime tut oder wie die Liste sich
  verhält, ist eine Einstellung mit Standardwert (siehe Package 2, AC3). Im Code fest bleiben nur Grenzen, die den
  Server schützen, jeweils mit Kommentar `fixed: <Grund>`: Farbspeicher max. 2000 Chatter, Speichern gebündelt alle 2 s,
  Aufräumen (`prune`) einmal pro Minute, Obergrenzen der Einstellungen selbst (z.B. `minimeMax` höchstens 100).
- **Zustand auf dem Server** (entschieden): Liste und Farben liegen in `data/streamers/<login>/minimes.json`.
  Farben bleiben pro Chatter auch nach dem Verschwinden gespeichert (beim nächsten Einklinken wieder da).
  Ohne Server oder ohne laufende Laufzeit gibt es keine Minimes, nur `?demo`.
- **Befehle** (entschieden: drei Befehle), Wörter einstellbar:
  - `!join` und `!join <farbe>`: einklinken (mit Farbe).
  - `!color <farbe>`: Farbe ändern; wer noch nicht drin ist, wird dabei eingeklinkt (abschaltbar).
  - `!leave`: raus. Mit Ziel (`!leave @name`) wirft es ein fremdes Minime raus, wenn die Rolle das darf (einstellbar).
  - Groß-/Kleinschreibung egal, Befehl muss am Anfang der Nachricht stehen (wie Trigger-Typ `command`).
- **Farbformate:** `#ff00aa`, `ff00aa`, `#f0a`, `255 0 170`, `255,0,170`, `rgb(255, 0, 170)`. Gespeichert als
  `#rrggbb` klein. Ungültige Eingaben werden ignoriert (der anonyme Chat-Leser kann nicht antworten).
  Zu dunkle Farben (hellster Kanal unter `minimeMinBrightness`, Standard 80) werden proportional aufgehellt.
  Ohne gewählte Farbe: Twitch-Namensfarbe (abschaltbar), sonst die Theme-Farbe `minimeDefaultColor`.
- **Rollen** wie bei Triggern (`allowed` in `server/triggers.ts`): `everyone`, `subscriber`, `vip`, `moderator`, `broadcaster`.
- **Chat-Reaktion** (entschieden): eine normale Chatnachricht eines Eingeklinkten setzt seinen Inaktivitäts-Timer
  zurück und löst die Theme-Reaktion aus (Matrix: Düsen-Boost). Beides einzeln abschaltbar.
- **Limits** (entschieden): Inaktivität und Höchstzahl einstellbar, bei vollem Platz fliegt der am längsten Inaktive
  (oder, einstellbar, der Neue wird abgewiesen). `stream.offline` (neues EventSub-Abo, braucht keinen Scope) leert die
  Liste, abschaltbar. Ban und Timeout (`CLEARCHAT` mit Login) entfernen das Minime, abschaltbar.
- **Gemeinsame Felder:** alle Verhaltens-Einstellungen stehen einmal in `src/core/minimeFields.ts` (Gruppen
  "Minimes: Befehle", "Minimes: Regeln", "Minimes: Bewegung") und werden von jedem Theme-Schema eingebunden, das
  Minimes anbietet. Server und Hook lesen sie über `readMinimeOptions`. Die Werte gehören wie alle Einstellungen zum
  gewählten Theme.
- **Minimes sind Theme-Sache:** Ein Theme hat Minimes genau dann, wenn sein Schema `MINIME_FIELDS` einbindet
  (`hasMinimes(schema)`, eine Quelle, keine zweite Liste). Die Szene `minimes` wird **nicht** vom Standard-Theme
  vererbt. Hat das gewählte Theme keine Minimes, zeigt `/s/<login>/minimes` eine leere transparente Seite und der Server
  verarbeitet keine Minime-Befehle (die gespeicherte Datei bleibt erhalten).
- **Szenengröße:** `minimes` = 1920 x 360, transparenter Streifen, den der Streamer in OBS an den unteren Rand legt.
- **Funktionsstufe:** neues Feature `minimes` in `FEATURES` (`server/access.ts`), anfangs auf `beta` stellbar.
- **Starter-Theme bekommt vorerst keine Minimes:** keine Felder, keine Szene, keine Vererbung. Übersicht und
  OBS-Import im Dashboard listen die Szene trotzdem (sie kennen das gewählte Theme nicht); beim Starter-Theme bleibt
  die Quelle leer.
- **Checks** sind `*.check.ts` mit `node:assert/strict`. Optik und Animation werden als manuelle Checks im
  Dashboard-Vorschaufenster (`?demo`) und in OBS beschrieben.

Testbefehl: `npm test` (einzeln: `node <pfad>.check.ts`), Abschluss jedes Packages: `npm run verify`.

---

## Package 1: Minime-Regeln

**Ziel:** Befehle, Farben und die Minime-Liste werden in einem reinen, geprüften Kernmodul entschieden.

**Abhängigkeiten:** keine

**Betroffene Dateien:**
- `src/core/minimes.ts` (neu)
- `src/core/minimes.check.ts` (neu)
- `src/core/types.ts` (ändern: Typ `Minime`, zwei neue `ServerMessage`-Varianten)

### Kontext

Es gibt noch nichts zu Minimes. Vorbild für Befehlserkennung ist `toRegex` mit Typ `command` in `server/triggers.ts`,
für Rollen `allowed` dort (wird geteilt, nicht kopiert: falls nötig nach `src/core/` verschoben, eigener Commit, Regel
"Moves sind verhaltensneutral"). Regel 12 und 32: reine Module, `now` wird hereingereicht. Alle Schwellen kommen als
Parameter `rules: MinimeRules` herein, das Modul kennt keine Standardwerte (die stehen in Package 2).
Die Typen in `types.ts` gehen über die Leitung und bleiben danach stabil.

### Acceptance Criteria

- [ ] AC1: `parseColor(text, minBrightness)` erkennt alle Formate aus den Annahmen und liefert `#rrggbb`; Werte über 255,
      falsche Längen, Nicht-Hex-Zeichen und leere Eingaben ergeben `null`.
- [ ] AC2: `parseColor` hellt Farben, deren hellster Kanal unter `minBrightness` liegt, proportional auf diese Schwelle
      auf (`#000000` mit 80 wird `#505050`); `minBrightness` 0 lässt jede Farbe unverändert.
- [ ] AC3: `parseCommand(text, roles, rules)` liefert `join` (optional mit Farbe), `color`, `leave`, `kick` (nur mit
      erlaubter Rolle, Ziel-Login ohne `@`) oder `null`, auch für `!joinx`; wer `rules.joinRoles` nicht hat, bekommt `null`
      für `join` und `color`.
- [ ] AC4: `applyMinime(state, event, now, rules)` setzt `join`, `color`, `leave`, `kick`, `chat`, `ban`, `prune` und
      `clear` um und liefert `{ state, changed, react }`; `ban` wirkt nur mit `rules.removeOnBan`, `chat` setzt
      `lastSeen` nur mit `rules.chatKeepsAlive` und meldet `react` nur mit `rules.reactToChat`.
- [ ] AC5: Farben bleiben in `state.colors` nach `leave` erhalten; ein späteres `join` ohne Farbe nutzt die gespeicherte,
      sonst die Twitch-Farbe (nur mit `rules.useTwitchColor`), sonst `null`.
- [ ] AC6: Ist die Liste voll, verdrängt ein neues `join` den Eintrag mit dem ältesten `lastSeen` (`rules.whenFull = "replace"`)
      oder wird ignoriert (`"reject"`).
- [ ] AC7: `prune` entfernt alle mit `now - lastSeen > rules.idleMinutes` (0 = nie); `color` innerhalb von
      `rules.colorCooldownS` ändert nichts; `color` von Nicht-Eingeklinkten klinkt nur mit `rules.colorJoins` ein.
- [ ] AC8: `state.colors` ist auf 2000 Einträge begrenzt (`fixed: Speicherschutz`), der am längsten unbenutzte fällt heraus.

### Tests (TDD)

Reihenfolge: Test schreiben, rot, minimal implementieren, grün, refactoren. Eine Test-Konstante `RULES` mit allen
Schaltern an hält die Fälle kurz; einzelne Tests überschreiben je einen Wert.

1. `minimes.check.ts > parseColor: gültige Formate` (AC1)
   - Gegeben: `"#FF00AA"`, `"ff00aa"`, `"#f0a"`, `"255 0 170"`, `"255,0,170"`, `"rgb(255, 0, 170)"`
   - Erwartet: jeweils `"#ff00aa"`
2. `parseColor: ungültige Eingaben` (AC1)
   - Gegeben: `"#ff00a"`, `"256 0 0"`, `"#gg0000"`, `""`, `"rot"`, `"1 2"`
   - Erwartet: `null`
3. `parseColor: dunkle Farben aufhellen` (AC2)
   - Gegeben: Schwelle 80: `"#000000"`, `"#200010"`, `"#ff0000"`; Schwelle 0: `"#000000"`
   - Erwartet: `"#505050"`, `"#500028"`, `"#ff0000"`; `"#000000"`
4. `parseCommand: Befehle erkennen` (AC3)
   - Gegeben: `"!join"`, `"!JOIN #f0a"`, `"!color 255 0 0"`, `"!leave"`, `"!joinx"`, `"hallo !join"`; dazu eigene Wörter `!geist`
   - Erwartet: join ohne Farbe, join mit `#ff00aa`, color `#ff0000`, leave, null, null; `!geist` wirkt wie join
5. `parseCommand: Rollen` (AC3)
   - Gegeben: `"!leave @Neo_42"` mit `["moderator"]` und `[]`; `"!join"` mit `joinRoles: ["subscriber"]` und Rollen `[]`
   - Erwartet: `{ type: "kick", login: "neo_42" }`, `{ type: "leave" }`; null
6. `applyMinime: join, color, leave` (AC4, AC5)
   - Gegeben: leerer Zustand; join neo mit `#ff00aa`, leave neo, join neo ohne Farbe
   - Erwartet: neo wieder in der Liste mit `#ff00aa`, `changed` jeweils true
7. `applyMinime: Twitch-Farbe` (AC5): mit und ohne `useTwitchColor`.
8. `applyMinime: chat` (AC4)
   - Gegeben: neo drin, `chat` von neo bei `now + 5000`; einmal mit allen Schaltern, einmal `reactToChat: false`,
     einmal `chatKeepsAlive: false`; dazu `chat` eines Unbekannten
   - Erwartet: `lastSeen` und `react: "neo"` je nach Schalter, `changed: false`; Unbekannter: nichts
9. `applyMinime: volle Liste` (AC6)
   - Gegeben: `max = 2`, a (lastSeen 1), b (lastSeen 2), join c; einmal `replace`, einmal `reject`
   - Erwartet: b, c bzw. a, b
10. `applyMinime: prune, Cooldown, colorJoins` (AC7)
    - Gegeben: idle 20 min, a zuletzt vor 21 min, b vor 5 min; color von b zweimal im Abstand von 3 s bei Cooldown 10 s;
      idle 0; color eines Unbekannten mit `colorJoins: false`
    - Erwartet: nur b bleibt; zweite Farbe ignoriert; bei idle 0 bleiben beide; Unbekannter nicht drin, Farbe aber gemerkt
11. `applyMinime: ban, kick, clear` (AC4), `ban` mit `removeOnBan: false` ändert nichts.
12. `applyMinime: Farbspeicher begrenzt` (AC8)

Testbefehl: `node src/core/minimes.check.ts`

### Umsetzungsschritte

1. Typen in `types.ts`: `Minime = { login: string; user: string; color: string | null }`, `ServerMessage` um
   `{ type: "minimes"; minimes: Minime[] }` und `{ type: "minimeChat"; login: string }` erweitern.
2. Typ `MinimeRules` in `minimes.ts` (Befehlswörter, Rollen, Schwellen und Schalter aus den ACs).
3. Tests 1 bis 3, dann `parseColor`.
4. Tests 4 und 5, dann `parseCommand`.
5. Tests 6 bis 12, dann `MinimeState = { roster: (Minime & { lastSeen: number })[]; colors: Record<string, { color: string; usedAt: number }> }`,
   `MinimeEvent` (Union) und `applyMinime`.
6. Refactor: Funktionen unter 60 Zeilen, Kommentar am Dateianfang und an jedem Export (Regel 14).

### Out of Scope

- Standardwerte und Dashboard-Felder (Package 2), Speichern, Timer und Chat-Anbindung (Package 3), Bewegung (Package 4).

---

## Package 2: Szene, Funktion und Einstellungen

**Ziel:** Die Szene `minimes` existiert überall (Routen, Dashboard, OBS-Import), hat eine Funktionsstufe und gemeinsame Einstellungsfelder für jedes Verhalten.

**Abhängigkeiten:** keine (die Typen `MinimeRules` und `MinimeMotion` legt dieses Package an, falls Package 1 noch nicht da ist; wer zuerst kommt, legt sie an)

**Betroffene Dateien:**
- `src/core/theme.ts` (ändern: `SCENES`, `SCENE_SIZES`)
- `src/core/minimeFields.ts` (neu), `src/core/minimeFields.check.ts` (neu)
- `server/access.ts` (ändern: `FEATURES`)
- `src/dashboard/texts.de.ts` (ändern: Szenenname, `featureNames.minimes`)
- `src/themes/matrix/settings.ts` (ändern: Felder einbinden, `GROUP_SCENES`); `src/themes/starter/` bleibt unverändert
- `src/core/themeRuntime.ts`, `src/core/themeRuntime.check.ts` (ändern: `minimes` wird nicht vererbt)
- `src/themes/schemaAudit.ts` (prüfen: Schlüssel aus `minimeFields.ts` gelten als benutzt)
- `src/core/theme.check.ts`, `src/dashboard/texts.de.check.ts`, `server/access.check.ts`, `server/routes.check.ts` (ergänzen)

### Kontext

Szenen kommen aus `SCENES` in `src/core/theme.ts`; daraus leiten sich Routen (`server/routes.ts`), Übersicht
(`Overview.tsx`), Vorschau (`ThemeSettings.tsx`) und OBS-Import (`obsSetup.ts`) ab. `theme.check.ts` und
`texts.de.check.ts` erzwingen Grösse und Namen je Szene. Funktionsstufen stehen in `FEATURES`, Namen dazu in
`ADMIN_TEXT.featureNames`. Feldtypen und Bausteine: `src/core/fields.ts`; eine Mehrfachauswahl gibt es nicht, darum
sind Rollen eine `select`-Auswahl der Mindestrolle (`everyone`, `subscriber`, `vip`, `moderator`, `broadcaster`), die
`readMinimeOptions` in die Rollenliste übersetzt. Ohne Szenen-Komponente zeigt `main.tsx` für `minimes` vorerst nichts.
`resolveScene` in `src/core/themeRuntime.ts` nimmt fehlende Szenen bisher immer vom Standard-Theme; für `minimes`
darf das nicht gelten, sonst bekäme das Starter-Theme den Matrix-Geist.

### Acceptance Criteria

- [ ] AC1: `/s/<login>/minimes` liefert die Overlay-Seite, die Übersicht und der OBS-Import enthalten die Szene mit 1920 x 360.
- [ ] AC2: Im Admin-Bereich lässt sich die Funktion "Minimes" auf aus/beta/alle stellen.
- [ ] AC3: `MINIME_FIELDS` enthält (Standard in Klammern):
      - Befehle: `minimeJoinCommand` (`!join`), `minimeColorCommand` (`!color`), `minimeLeaveCommand` (`!leave`),
        `minimeJoinRole` (`everyone`), `minimeKickRole` (`moderator`), `minimeColorJoins` (an)
      - Regeln: `minimeMax` (30, 1 bis 100), `minimeWhenFull` (`replace` | `reject`), `minimeIdleMinutes` (20, 0 bis 240, 0 = nie),
        `minimeColorCooldown` (10 s, 0 bis 300), `minimeMinBrightness` (80, 0 bis 255), `minimeUseTwitchColor` (an),
        `minimeChatKeepsAlive` (an), `minimeReactToChat` (an), `minimeClearOffline` (an), `minimeRemoveOnBan` (an)
      - Bewegung: `minimeSpeed` (60 px/s, 5 bis 600), `minimeMargin` (60 px), `minimeWalkMin` / `minimeWalkMax` (100 / 600 px),
        `minimeWalkWeight` (40), `minimeIdleWeight` (40), `minimeIdleMinMs` / `minimeIdleMaxMs` (2000 / 6000 ms),
        `minimeEnterMs` (1200 ms), `minimeExitMs` (900 ms)
- [ ] AC4: `readMinimeOptions(values)` liefert `{ rules: MinimeRules, motion: MinimeMotion }` aus beliebigen Werten; fehlende
      oder ungültige Werte ergeben die Standardwerte, Befehlswörter ohne `!` am Anfang oder mit Leerzeichen werden abgelehnt,
      `walkMin > walkMax` und `idleMinMs > idleMaxMs` werden getauscht.
- [ ] AC5: Das Matrix-Theme bindet `MINIME_FIELDS` ein, das Starter-Theme nicht; im Dashboard erscheinen die drei Gruppen
      nur beim Matrix-Theme, bei Vorschau der Szene `minimes`.
- [ ] AC6: `hasMinimes(schema)` ist für Matrix wahr, für Starter falsch; `resolveScene` liefert für `minimes` nur die Szene
      des gewählten Themes, nie die des Standard-Themes (Starter: `null`, Seite bleibt leer).

### Tests (TDD)

1. `theme.check.ts` (vorhanden) wird rot, sobald `minimes` in `SCENES` steht und die Grösse fehlt (AC1).
2. `texts.de.check.ts` (vorhanden) wird rot ohne Szenennamen (AC1).
3. `server/routes.check.ts > "minimes ist eine Szene"`: die Overlay-Adresse `minimes` ergibt `{ kind: "scene", file: "minimes.html" }` (AC1).
4. `server/access.check.ts > "minimes ist eine Funktion"`: `sanitize({})` enthält `features.minimes === "all"` (AC2).
5. `minimeFields.check.ts > "Standardwerte"`: `readMinimeOptions({})` ergibt genau die Standardwerte aus AC3 (AC3, AC4).
6. `minimeFields.check.ts > "ungültige Werte"`: `{ minimeJoinCommand: "join", minimeMax: 999, minimeWalkMin: 700, minimeWalkMax: 100 }`
   ergibt `!join`, 30, 100 / 700 (AC4).
7. `minimeFields.check.ts > "Rollen"`: `minimeJoinRole: "vip"` ergibt `["vip", "moderator", "broadcaster"]` (AC4).
8. `matrix/settings.check.ts`, `starter/settings.check.ts` (vorhanden, `auditTheme`): bleiben grün (AC5).
9. `minimeFields.check.ts > "hasMinimes"`: `matrixSettings` wahr, `starterSettings` falsch (AC6).
10. `themeRuntime.check.ts > "minimes wird nicht vererbt"`: `resolveScene(scenes, "starter", "minimes", "matrix")` ist `null`,
    obwohl `scenes.matrix.minimes` existiert; andere Szenen erben weiter (AC6).

Testbefehl: `npm test`

### Umsetzungsschritte

1. `minimes` in `SCENES` und `SCENE_SIZES`, Name in `texts.de.ts`; Checks 1 bis 3 grün.
2. `minimes` in `FEATURES` und `featureNames`; Check 4 grün.
3. Checks 5 bis 7, dann `minimeFields.ts` mit den Bausteinen aus `fields.ts` und `readMinimeOptions` (nutzt `resolveSettings`).
4. Felder ins Matrix-Schema einbinden (`...MINIME_FIELDS`), `GROUP_SCENES` um die drei Gruppen mit `["minimes"]` ergänzen;
   `auditTheme` so anpassen, dass Schlüssel aus `minimeFields.ts` als benutzt gelten (sie werden im Kern gelesen); Check 8.
5. Checks 9 und 10, dann `hasMinimes` und eine Liste nicht vererbbarer Szenen (`["minimes"]`) in `resolveScene`.
6. Manueller Check: Dashboard Übersicht, Admin und Theme-Formular bei Matrix und bei Starter ansehen.

### Out of Scope

- Die Szene selbst (Package 5), das Lesen der Felder auf dem Server (Package 3) und im Hook (Package 4).

---

## Package 3: Server-Laufzeit

**Ziel:** Der Server führt die Minime-Liste pro Streamer, speichert sie und schickt sie per SSE an die Overlays.

**Abhängigkeiten:** Package 1, Package 2

**Betroffene Dateien:**
- `server/minimes.ts` (neu), `server/minimes.check.ts` (neu)
- `server/streamer.ts` (ändern: Chat auch für Minimes starten, SSE-Snapshot beim Verbinden, offline)
- `server/chat.ts` (ändern: `CLEARCHAT`, Twitch-Farbe aus Tag `color`)
- `server/twitch.ts`, `server/twitch.check.ts` (ändern: Abo `stream.offline`, Rückruf)
- `server/index.ts` (ändern: Optionen an die Laufzeit geben, bei Änderung aktualisieren)

### Kontext

`startStreamer` startet den Server-Chat nur, wenn Trigger an sind (`stopChat = triggers ? chat(...) : null`).
`openStream` schickt beim Verbinden den laufenden Titel; genauso bekommt jedes Overlay die aktuelle Minime-Liste.
Schreiben geht über `writeAtomic` (`server/atomicFile.ts`, Regel 28). `server/index.ts` sendet geänderte
Einstellungen schon per `broadcast({ type: "settings" })`; an derselben Stelle bekommt die Laufzeit die neuen Optionen.
`server/chat.ts` liefert bisher nur `PRIVMSG`.

### Acceptance Criteria

- [ ] AC1: Ist `minimes` für den Streamer an, liest der Server den Chat auch ohne Trigger; ein Chat-Socket bedient beide.
- [ ] AC1b: Hat das gewählte Theme keine Minimes (`hasMinimes` falsch, z.B. Starter), verarbeitet der Server keine
      Minime-Befehle und schickt eine leere Liste; `minimes.json` bleibt unverändert. Wechselt der Streamer zurück zu
      einem Theme mit Minimes, gilt die gespeicherte Liste (nach `prune`) wieder.
- [ ] AC2: Nach jeder Änderung der Liste bekommen alle Overlays `{ type: "minimes", minimes }`; eine Chatnachricht
      eines Eingeklinkten erzeugt `{ type: "minimeChat", login }` (wenn `minimeReactToChat` an).
- [ ] AC3: Ein neu verbundenes Overlay bekommt sofort die aktuelle Liste.
- [ ] AC4: `minimes.json` wird gebündelt höchstens alle 2 s geschrieben (`fixed: Schreiblast`), atomar, und beim Start
      eingelesen; eine kaputte oder fremde Datei ergibt einen leeren Zustand, ungültige Einträge werden verworfen.
- [ ] AC5: Einmal pro Minute läuft `prune` (`fixed: Takt, die Dauer selbst ist einstellbar`); `stream.offline` leert die
      Liste, wenn `minimeClearOffline` an; `CLEARCHAT` mit Login entfernt das Minime, wenn `minimeRemoveOnBan` an.
- [ ] AC6: Geänderte Befehle, Rollen, Limits und Schalter im Dashboard gelten ohne Neustart; sinkt `minimeMax`, wird die
      Liste sofort gekürzt (älteste Inaktive zuerst).
- [ ] AC7: `stop()` beendet Intervall und Schreib-Timer und schreibt den letzten Stand.

### Tests (TDD)

1. `server/minimes.check.ts > "Datei einlesen"` (AC4)
   - Gegeben: `parseMinimeFile` mit `null`, `"x"`, einem Eintrag mit Login `"../a"`, Farbe `"red"`, und einem gültigen
   - Erwartet: nur der gültige Eintrag bleibt
2. `"Chatzeile wird zum Ereignis"` (AC2, AC5)
   - Gegeben: `toMinimeEvent(line, rules)` für `!join`, normale Nachricht, Ban-Zeile
   - Erwartet: `join`, `chat`, `ban`
3. `"Laufzeit mit falscher Uhr"` (AC2, AC4, AC6, AC7)
   - Gegeben: `startMinimes({ folder: tmp, emit, now, timers, options })`, drei Zeilen, `setOptions` mit kleinerem `max`, `setOptions(null)` plus `!join`, `stop()`
   - Erwartet: `emit` bekam `minimes` und `minimeChat` in der richtigen Reihenfolge, Liste nach `setOptions` gekürzt,
     nach `setOptions(null)` leere Liste gesendet und `!join` ignoriert, Datei existiert danach mit dem Stand; Temp-Ordner wird gelöscht. Timer werden injiziert (Regel 32).
4. `server/twitch.check.ts > "stream.offline"` (AC5): das Abo steht in der Liste, ein Offline-Ereignis ruft den Rückruf.

Testbefehl: `node server/minimes.check.ts`, danach `npm test`

### Umsetzungsschritte

1. Test 1, dann `parseMinimeFile` (Allowlist für Login `^[a-z0-9_]{1,25}$`, Name max. 25 Zeichen, Farbe über `parseColor`).
2. Test 2: `server/chat.ts` liefert `ChatLine` zusätzlich mit `color` und Zeilen `{ ban: login }` aus `CLEARCHAT`; `toMinimeEvent`.
3. Test 3, dann `startMinimes`: hält `MinimeState`, ruft `applyMinime`, plant gebündeltes Speichern, `prune` per Intervall, `setOptions`.
4. `streamer.ts`: Chat starten, wenn Trigger oder Minimes an; Zeilen an beide verteilen; `openStream` schickt auch
   die Liste; `stop()` ruft `minimes.stop()`. `server/streamer.ts` bleibt in `WITHOUT_CHECK`.
5. Test 4, dann `stream.offline` in `twitch.ts` und Weitergabe an `minimes.clear()`.
6. `index.ts`: beim Start und nach `POST /api/settings` `runtime.minimes?.setOptions(hasMinimes(schema) ? readMinimeOptions(values).rules : null)`;
   `null` pausiert die Minimes (AC1b, im Laufzeit-Check mit abgedeckt).
7. Manueller Check: Server lokal, im Twitch-Chat `!join #f0a`, `!color 0 255 0`, `!leave`; `curl /s/<login>/events` zeigt die Nachrichten.

### Out of Scope

- Antworten im Chat (der Server liest anonym und kann nicht schreiben).
- Anzeige (Package 4 bis 6).

---

## Package 4: Verhalten und Hook

**Ziel:** `useMinimes` liefert jeder Szene die Minimes samt aktueller Aktion und Position, mit Demo-Modus.

**Abhängigkeiten:** Package 1, Package 2

**Betroffene Dateien:**
- `src/core/minimeBehavior.ts` (neu), `src/core/minimeBehavior.check.ts` (neu)
- `src/core/hooks/useMinimes.ts` (neu)
- `src/core/connection.ts` (ändern: Handler `minimes`, `minimeChat`, letzte Liste für späte Abonnenten wie `lastTrack`)
- `src/core/demo.ts` (ändern: Demo-Minimes)

### Kontext

`connection.ts` verteilt SSE-Nachrichten an Handler und hebt den letzten Titel für späte Abonnenten auf (`lastTrack`);
dasselbe Muster gilt für die Minime-Liste. `demo.ts` erzeugt Fake-Ereignisse für `?demo`, damit Szenen ohne Stream
testbar sind (auch in der Dashboard-Vorschau). Zufall wird in reine Logik hereingereicht (Regel 32). Alle Zahlen
der Bewegung kommen aus `MinimeMotion` (Package 2), die themeeigenen Aktionen aus dem Katalog der Szene.

### Acceptance Criteria

- [ ] AC1: `nextAction(actor, catalog, motion, now, random)` wählt nach Ablauf der aktuellen Aktion die nächste nach
      Gewicht aus `idle` (`minimeIdleWeight`), `walk` (`minimeWalkWeight`) und dem Theme-Katalog; Gewicht 0 kommt nie,
      alle Gewichte 0 ergeben `idle`.
- [ ] AC2: `walk` liefert `fromX`, `toX` innerhalb `[margin, width - margin]` mit Strecke zwischen `walkMin` und `walkMax`
      (am Rand gekürzt), `facing` zeigt in Laufrichtung, `durationMs = Strecke / speed`; `idle` dauert zwischen
      `idleMinMs` und `idleMaxMs`.
- [ ] AC3: Ein neues Minime startet mit `enter` (`enterMs`) an zufälliger Stelle; ein verschwundenes bekommt `exit`
      (`exitMs`) und wird danach aus der Liste entfernt.
- [ ] AC4: `react(actor, reaction, now)` unterbricht `idle`, `walk` und Theme-Aktionen mit der Reaktionsaktion, nie aber
      `enter` oder `exit`; nach `walk` steht das Minime an der aktuellen Zwischenposition.
- [ ] AC5: `useMinimes({ catalog, reaction, widthPx })` liest `MinimeMotion` selbst aus den Theme-Werten und gibt
      `MinimeView[]` zurück (`login`, `user`, `color`, `action`, `startedAt`, `durationMs`, `fromX`, `toX`, `facing`);
      rendert nur bei Aktionswechseln und räumt seinen Timer beim Abmelden ab (Regel 17).
- [ ] AC6: Mit `?demo` erscheinen Minimes mit Demo-Namen und Farben (Anzahl über `?demo=<n>`, Standard 5), und alle
      paar Sekunden reagiert eines auf "Chat".

### Tests (TDD)

1. `minimeBehavior.check.ts > "Gewichte"` (AC1)
   - Gegeben: Katalog `[{ name: "backflip", weight: 0 }, { name: "glitch", weight: 10 }]`, feste `random`-Folge; alle Gewichte 0
   - Erwartet: nie `backflip`, Verteilung folgt der Folge; `idle`
2. `"walk bleibt im Bild"` (AC2): `random` = 0 und 0.999, Breite 1920, Rand 60, walkMin 100, walkMax 600;
   `toX` in [60, 1860], Strecke in [100, 600] ausser am Rand, Dauer stimmt.
3. `"idle-Dauer"` (AC2): `random` 0 und 0.999 ergeben `idleMinMs` und knapp `idleMaxMs`.
4. `"enter und exit"` (AC3): `syncRoster(actors, minimes, now, motion, random)` mit neuem und fehlendem Login.
5. `"Reaktion"` (AC4): während `idle`, `walk` (halbe Strecke, Position = Mitte), `enter`.
6. Hook und Demo (AC5, AC6): kein automatischer Check (Hook, Netz); manueller Check in Package 5.

Testbefehl: `node src/core/minimeBehavior.check.ts`

### Umsetzungsschritte

1. Typen `MinimeAction = { name: string; durationMs: number; weight: number }` und `MinimeActor`.
2. Tests 1 bis 3, dann `nextAction`.
3. Test 4, dann `syncRoster`; Test 5, dann `react`.
4. `connection.ts`: Handler und `lastMinimes`; `useMinimes`: ein `setTimeout` auf das nächste Aktionsende, nicht pro Frame.
5. `demo.ts`: Demo-Liste und gelegentliche `minimeChat`.

### Out of Scope

- Aussehen und CSS (Package 5, 6). Ausweichen zwischen Minimes und Überlappen der Namen.

---

## Package 5: Matrix-Geist: Grundform

**Ziel:** Im Matrix-Theme schweben Neon-Geister mit Namen und Glyphen-Düse, wandern und erscheinen und verschwinden animiert.

**Abhängigkeiten:** Package 4

**Betroffene Dateien:**
- `src/themes/matrix/scenes/Minimes.tsx` (neu: Szene und darunter die Komponente `Ghost`)
- `src/themes/matrix/index.tsx` (ändern: Szene eintragen)
- `src/themes/matrix/theme.css` (ändern: Regeln unter `.theme-matrix .minimes`, Keyframes `matrix-minime-*`)
- `src/themes/matrix/settings.ts` (ändern: Aussehen-Felder in Gruppe "Minimes: Aussehen")

### Kontext

Szenen nutzen nur Kern-Hooks und Werte aus `useMatrix()`; Farben, Grössen und Zeiten kommen als CSS-Variablen
(`cssVariables`). `scripts/rules.check.ts` verbietet Farbliterale und feste px/ms ausserhalb von `var(--x, Standard)`.
Die Chatter-Farbe ist Laufzeitdaten, kein Literal: sie wird pro Geist als `style={{ "--minime": color }}` gesetzt.
Glyphen liefert `src/core/glyphs.ts`, den Glüh-Look nutzt das Theme schon (Text-Shadow mit `--accent`).

**Figur (SVG, nur Outlines, `stroke="var(--minime)"`, `fill="none"`, Glow per `filter: drop-shadow`):**
- Kapuze mit spitzem Zipfel, leeres Gesicht (dunkle Fläche in `--minimeFace`), zwei leuchtende Augen (gefüllt).
- Pulli mit Bauchtasche, zwei Kordeln, kurze Ärmel, unten ausfransend in 3 bis 4 Zacken statt Beinen.
- Darunter die Düse: Spalten fallender Glyphen in `--minime`, nach unten ausblendend (CSS-Keyframes,
  Glyphen beim Mount einmal zufällig gewählt).
- Name über dem Kopf in `--font`, Farbe `--minime`, leichter Glow.

### Acceptance Criteria

- [ ] AC1: Mit `?demo` zeigt `/s/<login>/minimes` Geister im Look der Vorlage (Outline, Augen, Kapuze, Düse) in ihrer Farbe.
- [ ] AC2: Jeder Geist schwebt ständig auf und ab und wandert per `walk` gleichmässig zum Ziel, in Laufrichtung geneigt,
      gespiegelt je nach `facing`; der Name bleibt lesbar (nicht gespiegelt).
- [ ] AC3: `enter`: Geist setzt sich aus fallenden Glyphen zusammen; `exit`: zerfällt nach unten in Glyphen.
- [ ] AC4: Einstellbar (Gruppe "Minimes: Aussehen"): Grösse, Abstand zum Boden, Schwebe-Höhe und -Dauer, Neigung beim
      Laufen, Glow-Stärke, Strichstärke, Gesichtsfarbe, Düse (Spalten, Glyphen je Spalte, Tempo, Länge), Name an/aus,
      Namensgrösse und -abstand, Standardfarbe `minimeDefaultColor`.
- [ ] AC5: `npm test` bleibt grün (`rules.check.ts`, `auditTheme`: jedes neue Feld wird benutzt).
- [ ] AC6: Hintergrund transparent, keine Konsolenfehler, Szene in OBS 1920 x 360 sichtbar.

### Tests (TDD)

1. `matrix/settings.check.ts` (vorhanden): wird rot, sobald Felder angelegt, aber noch nicht benutzt sind (AC4, AC5).
2. `scripts/rules.check.ts` (vorhanden): fängt Farbliterale und feste Zeiten in Szene und CSS (AC5).
3. Manueller Check (AC1 bis AC3, AC6): Dashboard, Theme-Vorschau Szene "Minimes" mit Demo; danach OBS-Browserquelle.
   Prüfen: Farbe, Glow, Düse, Spiegelung, Name nicht gespiegelt, Ein- und Ausblenden, keine Ruckler mit `?demo=30`.

Testbefehl: `npm test`, dann `npm run verify`

### Umsetzungsschritte

1. Felder in `settings.ts` anlegen (Check 1 wird rot).
2. `Minimes.tsx`: `useMinimes` mit leerem Theme-Katalog, Geister als `position: absolute`, Position über
   `--from`, `--to`, `--duration` und `transition: transform`.
3. `Ghost`: SVG und Düse; CSS für `idle`, `walk`, `enter`, `exit`.
4. In `index.tsx` eintragen. Checks grün, manueller Check.

### Out of Scope

- Idle-Animationen ausser Schweben und die Chat-Reaktion (Package 6).

---

## Package 6: Matrix-Geist: Idle-Animationen

**Ziel:** Die Geister zeigen zufällig Backflip, Glitch, Umschauen, Blinzeln, Drehen und Schlafen und reagieren mit einem Düsen-Boost auf Chat.

**Abhängigkeiten:** Package 5

**Betroffene Dateien:**
- `src/themes/matrix/scenes/Minimes.tsx` (ändern: Katalog aus Einstellungen bauen)
- `src/themes/matrix/theme.css` (ändern: Keyframes)
- `src/themes/matrix/settings.ts` (ändern: Gruppe "Minimes: Animationen")

### Kontext

Der Katalog ist eine Liste `MinimeAction` aus Package 4; jede Aktion wird zur CSS-Klasse `action-<name>` am Geist.
Pro Animation sind Gewicht, Dauer und die wichtigste Stärke Einstellungen.

**Animationen:**
| Aktion | Wirkung | Einstellungen |
|--------|---------|---------------|
| `backflip` | Sprung nach oben, volle Rückwärtsdrehung, Düse flammt beim Absprung auf, weiches Landen | Gewicht, Dauer, Sprunghöhe |
| `glitch` | kurzer RGB-Versatz und horizontales Zerreissen (clip-path), Name flackert | Gewicht, Dauer, Versatz |
| `look` | Augen wandern links, rechts, zurück | Gewicht, Dauer, Augenweg |
| `blink` | Augen schliessen kurz (scaleY); läuft zusätzlich unabhängig | Abstand zwischen Blinzlern, Dauer |
| `sleep` | Geist sinkt ab, Augen zu Strichen, Düse gedimmt, "z"-Glyphen steigen auf | Gewicht, Dauer, Absinken, z-Text |
| `spin` | Pirouette um die eigene Achse (scaleX-Wechsel) | Gewicht, Dauer, Umdrehungen |
| `boost` (Reaktion) | Düse länger und heller, Geist hüpft hoch, Augen leuchten auf | Dauer, Hüpfhöhe, Düsen-Verstärkung |

### Acceptance Criteria

- [ ] AC1: Jede Animation aus der Tabelle erscheint mit `?demo` im Laufe von zwei Minuten mindestens einmal.
- [ ] AC2: Alle Werte der Spalte "Einstellungen" sind Felder; Gewicht 0 schaltet eine Animation ab.
- [ ] AC3: Eine Chatnachricht des Chatters (Demo: `minimeChat`) löst `boost` aus, auch mitten in einer Idle-Animation.
- [ ] AC4: `npm test` bleibt grün (alle neuen Felder benutzt, keine Literale).

### Tests (TDD)

1. `matrix/settings.check.ts` (vorhanden) für die neuen Felder (AC2, AC4).
2. Das Auswahlverhalten (Gewicht 0, Unterbrechen) ist bereits in `minimeBehavior.check.ts` abgedeckt (Package 4).
3. Manueller Check (AC1, AC3): Vorschau mit `?demo`, je Animation einmal Gewicht auf 100 und alle anderen auf 0 stellen.

Testbefehl: `npm test`, dann `npm run verify`

### Umsetzungsschritte

1. Felder je Animation (`minimeBackflipWeight`, `minimeBackflipMs`, `minimeBackflipHeight`, ...) anlegen.
2. Katalog in `Minimes.tsx` aus den Werten bauen, `reaction: "boost"`.
3. Keyframes je Animation, eine nach der anderen, jeweils manuell prüfen.

### Out of Scope

- Interaktion zwischen Minimes (z.B. sich anstupsen), Reaktionen auf Alerts.

---

## Package 7: Doku

**Ziel:** THEMES.md und README erklären Befehle, Einstellungen und wie ein anderes Theme eigene Minimes bekommt.

**Abhängigkeiten:** Package 6

**Betroffene Dateien:**
- `THEMES.md` (ändern: Abschnitt "Minimes")
- `README.md` (ändern: Szene, Befehle, Funktionsstufe)

### Kontext

`THEMES.md` beschreibt Aufbau und Schritte eines Themes. Für Minimes kommt dazu: `MINIME_FIELDS` ins Schema
einbinden, Szene `minimes` mit `useMinimes`, eigener Aktionskatalog aus eigenen Einstellungen, Pflichtklassen für
`enter`, `exit`, `idle`, `walk`, Farbe des Chatters über `--minime`.

### Acceptance Criteria

- [ ] AC1: THEMES.md enthält einen Abschnitt, mit dem sich ohne Blick in den Matrix-Code eine eigene Minime-Szene bauen lässt.
- [ ] AC2: README nennt die drei Befehle, Farbformate, die Gruppen der Einstellungen und die Funktionsstufe `minimes`.
- [ ] AC3: Kein Gedankenstrich (U+2014), `npm run verify` grün.

### Tests (TDD)

1. `scripts/rules.check.ts` (vorhanden) prüft Gedankenstriche (AC3).
2. Manueller Check (AC1): Abschnitt gegen die tatsächlichen Namen in `useMinimes` und `minimeFields.ts` abgleichen.

Testbefehl: `npm run verify`

### Umsetzungsschritte

1. Abschnitt in THEMES.md mit Mini-Beispiel (Katalog mit einer Aktion).
2. README ergänzen.

### Out of Scope

- Minimes für das Starter-Theme (eigenes späteres Package, sobald ein zweites Theme Minimes braucht).

---

## Annahmen für Packages 8 bis 12

- **Kern statt Theme:** Hüpfen, Fraktionen, Gefechte und feste Plätze sind Kern-Funktionen der Minimes (`src/core/`).
  Ein Theme bindet sie ein (opt-in über ihre Felder, wie `MINIME_FIELDS`) und liefert nur Aussehen, eigene Animationen
  und Standardwerte. Kein Theme verweist auf ein anderes.
- **Rust-Anteile** stehen in [RUST-PLAN.md](../RUST-PLAN.md) Phase 8 (Packages 47 bis 49). Die Felder entstehen dort in
  Rust und TS zugleich; hier steht nur die Logik im Frontend.
- **Rollen** (entschieden 2026-10-18): Rollen sind Minime-Typen (`variant`), kein neuer Code. Ein Theme mit Gefechten muss eine Rolle
  `medic` anbieten; ist sie ausgeschaltet, gibt es keine Gefechte. Ohne Angabe wählt der Server schon heute einen
  zufälligen erlaubten Typ (`resolve_variant`).
- **Gefechte** (entschieden 2026-10-18): zufällig als Animation, nie per Chatbefehl; nur wenn ein freier Medic da ist, mit Fraktionen einer
  aus der Fraktion des Ziels; Medics schiessen nicht und sind nie Ziel; ein Getroffener liegt, bis ein Medic ihn
  wiederbelebt, oder steht nach einer einstellbaren Liegezeit von selbst auf. Mit Fraktionen nur gegen andere
  Fraktionen. Eigener Ablauf mit echter Bewegung des Medics.
- **Je Overlay** (entschieden 2026-10-18): Gefechte würfelt jedes Overlay selbst; zwei Browser-Quellen zeigen verschiedene Gefechte, ein
  Neuladen beendet laufende Gefechte. Der Server weiss nichts davon.
- **Fraktionen** (entschieden 2026-10-18): zweites Typ-Set im Server ([RUST-PLAN.md](../RUST-PLAN.md) Package 47), nur in Themes mit Typen.
- **Regeln nur in Rust** (entschieden 2026-10-18): der TS-Spiegel der Minime-Regeln wird vorher entfernt (Package 9).
- **Alles einstellbar** (Gedächtnis): Gefechtsrate, Liegezeit, Wiederbelebungsdauer, Trefferchance, Medic-Tempo,
  Schussdauer je Rolle, Plätze.

## Package 8: Hüpfen im Kern

**Ziel:** Die Hüpf-Bewegung der Minimes liegt im Kern, jedes Theme kann sie nutzen.

**Abhängigkeiten:** [RUST-PLAN.md](../RUST-PLAN.md) Package 48 (Hüpf-Felder im Kern)

**Betroffene Dateien:** `hops.ts` und `hops.check.ts` aus dem Theme, das heute hüpft (`src/themes/suedfrucht/`, nach
der Umbenennung `src/themes/urlaub/`), nach `src/core/minimeHops.ts`; Hüpf-CSS als `src/core/minimes/hop.css` (wie
`src/core/screens/stage.css`) mit allgemeinen Klassen (`.minime-hop` am Körper, `.minime-hop-shadow` am Schatten,
aktiv bei `.action-walk` und `.action-approach`) statt `.theme-suedfrucht .sf-minime-body`; `hopStyle(actor, hopMs)` für
`--hops` und `--hop-ms`; `THEMES.md`.

### Kontext

Ein Theme darf nicht aus einem anderen importieren (Regel 16). Die Hüpf-Bewegung liegt heute in einem Theme; weitere
Themes sollen dieselbe nutzen, also gehört sie in den Kern. Die Felder dazu (`hopHeight`, `hopMs`, `hopSquash`)
verschiebt RUST-PLAN 48. Gehüpft wird bei jeder Bewegung, also
auch beim `approach` der Gefechte (Package 11).

### Acceptance Criteria

- [ ] AC1: `hopPlan` und das Hüpf-CSS liegen im Kern, das Theme, das heute hüpft, nutzt sie unverändert.
- [ ] AC2: Die Anleitung in THEMES.md beschreibt, wie ein Theme Minimes hüpfen lässt.

### Tests (TDD)

1. Der bestehende `hops.check.ts` wandert mit (AC1).
2. Manuell: Vorschau der Szene `minimes` mit `?demo`, Hüpfen sieht aus wie vorher (AC1).

---

## Package 9: TS-Spiegel der Minime-Regeln entfernen

**Ziel:** Die Minime-Regeln (Befehle erkennen, Liste führen) gibt es nur noch in Rust.

**Abhängigkeiten:** keine

**Betroffene Dateien:** `src/core/minimes.ts` (`parseCommand`, `applyMinime`, `parseColor`, Zustand und Ereignisse
entfernen; `normalizeName` und die Typen `MinimeRules`, `MinimeVariantRule` bleiben), `src/core/minimes.check.ts`.

### Kontext

`parseCommand` und `applyMinime` waren die Vorlage für Rust (RUST-PLAN 36) und werden seit dem Ende des Node-Servers
nur noch von `minimes.check.ts` benutzt. Die Rust-Tests decken dasselbe ab. Ohne Entfernen müsste jede neue Regel
(Fraktionen) doppelt gebaut und getestet werden.

### Acceptance Criteria

- [ ] AC1: Kein Code ausserhalb von Checks nutzt die entfernten Funktionen (Compiler und `rules.check.ts`).
- [ ] AC2: Für jeden entfernten TS-Testfall gibt es einen Rust-Test; fehlt einer, wird er vorher in `rst-domain`
  ergänzt.
- [ ] AC3: `normalizeName` bleibt (Formular, Info-Seite) mit eigenem Check.

### Tests (TDD)

1. Abgleich der Testfälle von `minimes.check.ts` mit `rst-domain minimes::*::tests`, fehlende in Rust ergänzen (AC2).
2. `npm run verify` grün nach dem Entfernen (AC1, AC3).

---

## Package 10: Fraktionen der Minimes

**Ziel:** Ein Theme kann Fraktionen einbinden; Overlays, Info-Seite, Befehlsseite und Demo zeigen die Fraktion jedes
Minimes.

**Abhängigkeiten:** Package 9, [RUST-PLAN.md](../RUST-PLAN.md) Package 47 (Fraktionen im Server, Felder)

**Betroffene Dateien:**
- `src/core/minimeFields.ts` (`readMinimeOptions(values, variants, teams)`), Info-Seiten der Themes mit Typen
  (`src/themes/*/scenes/Info.tsx`)
- `src/core/commands.ts` (Fraktions-Befehl in der Liste), `src/core/demo.ts` (Demo-Minimes mit Fraktion)
- `src/core/minimeBehavior.ts` (`shownTeam` wie `shownVariant`, `teamCounts`), `THEMES.md`, `README.md` (Befehle)

### Kontext

Der Server speichert die Fraktion als `team` (RUST-PLAN 47), dort entstehen auch die Felder. Der Kern liefert `team`
an das Theme weiter, zählt die Mitglieder je Fraktion (`teamCounts`, z.B. für einen Hügel-Halter) und zeigt den
Befehl auf Info- und Befehlsseite; das Aussehen macht das Theme.

### Acceptance Criteria

- [ ] AC1: `useMinimes` gibt `team` je Minime weiter; ohne `team` (Demo) eine erlaubte Fraktion nach Login, immer
  dieselbe (`shownTeam`).
- [ ] AC2: `teamCounts` zählt sichtbare Minimes je erlaubter Fraktion, ausgeschaltete Fraktionen fehlen.
- [ ] AC3: Info- und Befehlsseite zeigen den Fraktions-Befehl mit den Namen.
- [ ] AC4: THEMES.md beschreibt, wie ein Theme Fraktionen einbindet; README nennt `!team` und die Fraktionsnamen.

### Tests (TDD)

1. `minimeBehavior.check.ts`: `shownTeam` mit und ohne `team`, `teamCounts` (AC1, AC2)
2. `commands.check.ts`, `minimeFields.check.ts`: Fraktions-Befehl in Liste und Regeln (AC3)

---

## Package 11: Gefechte der Minimes

**Ziel:** Ein Theme kann Gefechte einschalten: zufällige Schusswechsel mit Rollen, Getroffene liegen, bis ein Medic sie
wiederbelebt.

**Abhängigkeiten:** [RUST-PLAN.md](../RUST-PLAN.md) Package 48 (Felder). Fraktionen (Package 10) sind keine
Voraussetzung: ohne `team` darf jeder auf jeden schiessen, jeder Medic hilft.

**Betroffene Dateien:** `src/core/minimeCombat.ts` (neu, rein) und Check, `src/core/minimeBehavior.ts` (`advance`,
`react`, `syncRoster`, `nextEnd`, `positionAt`), `src/core/hooks/useMinimes.ts`, `src/core/demo.ts`, `THEMES.md`.

### Kontext

Der heutige Planer wählt Aktionen je Minime einzeln: `advance()` ruft am Ende jeder Aktion `nextAction()`, `react()`
unterbricht alles ausser erscheinen und verschwinden, `positionAt()` bewegt nur bei `walk`, der Hook hat einen einzigen
Timer bis zum nächsten Aktionsende (Regel 21). Gefechte betreffen drei Minimes zugleich und müssen in alle diese
Stellen eingreifen.

### Design

- **Zustand am Minime:** `combat: { role: "shooter" | "target" | "medic"; with: login; step } | null`. Solange `combat`
  gesetzt ist, wählt `advance()` den nächsten Schritt aus `minimeCombat.ts` statt `nextAction()`.
- **Ablauf:** `aim` und `fire` (Schütze; Dauer je Rolle aus den Feldern, RUST-PLAN 48; der Grenadier trifft genau ein
  Ziel, die Explosion ist nur Optik), `hit` und `down` (Ziel), `approach` (Medic bewegt sich zum Ziel; `positionAt()`
  bewegt bei `walk` und `approach`), `revive` (Medic), `up` (Ziel), danach `combat = null` für alle.
- **Start:** `nextFightAt` im Zustand des Hooks; `nextEnd()` nimmt das Minimum aus Aktionsenden und `nextFightAt`. Ein
  Gefecht beginnt nur mit Schütze, Ziel und einem freien Medic (mit Fraktionen aus der Fraktion des Ziels), die alle
  bereit sind (nicht erscheinend, verschwindend oder schon im Gefecht); sonst wird `nextFightAt` neu gewürfelt. Es
  laufen höchstens so viele Gefechte gleichzeitig wie eingestellt (Standard 2, entschieden 2026-10-18). Die
  Trefferchance entscheidet, ob das Ziel getroffen wird; ein Fehlschuss endet nach `fire`.
- **Unterbrechungen:** `react()` lässt Minimes im Gefecht in Ruhe. Verschwindet der Schütze, läuft das Gefecht weiter.
  Verschwindet das Ziel oder steht es nach der Liegezeit selbst auf, bricht der Medic ab. Verschwindet der Medic, steht
  das Ziel nach der Liegezeit selbst auf. Ein Rollenwechsel (`!rolle`) gilt erst nach dem laufenden Gefecht.
- **Ohne Laufen:** Auch bei `minimeWalkWeight = 0` bewegt sich der Medic (`approach`). Danach bleibt er am neuen Ort,
  mit festen Plätzen (Package 12) geht er auf seinen Platz zurück.
- **Ausrichtung:** Schütze und Medic schauen zum Ziel (`facing`); der Medic hält neben dem Ziel an, nicht darauf.
  Läuft ein Beteiligter gerade, endet sein `walk` beim Start an der aktuellen Stelle (`positionAt`).
- **Rolle im Gefecht:** Das Minime behält die Rolle vom Gefechtsstart (`combat.variant`), auch wenn `syncRoster` schon
  den neuen Typ liefert; angezeigt wird bis zum Ende die alte Waffe.
- **Reservierte Namen:** `aim`, `fire`, `hit`, `down`, `approach`, `revive`, `up` sind Kern-Aktionen; ein Theme-Katalog
  darf sie nicht nutzen (Check in `minimeCombat.check.ts` gegen die Kataloge aller Themes).
- **Demo:** Mit Gefechten ist das erste Demo-Minime ein Medic, damit `?demo` Gefechte zeigt.
- **Töne** (entschieden 2026-10-18: einstellbar, Standard aus): Beim Beginn von `fire` (Schuss, beim Grenadier
  Explosion), `hit` und `revive` spielt der Kern den Ton aus den Feldern mit `playSound` (`src/core/sound.ts`); den
  eingebauten Ton je Ereignis liefert das Theme. `?sound=0` schaltet wie überall ab.

### Acceptance Criteria

- [ ] AC1: Ohne freien Medic (mit Fraktionen: der Fraktion des Ziels) beginnt kein Gefecht; ein Medic ist nie Schütze
  oder Ziel und hilft immer nur einem; nie mehr Gefechte gleichzeitig als eingestellt.
- [ ] AC2: Ein Getroffener liegt, bis der Medic ihn erreicht und wiederbelebt hat, höchstens bis die Liegezeit um ist.
- [ ] AC3: Chat-Reaktionen und Rollenwechsel unterbrechen kein Gefecht; ein verschwindendes oder aufgestandenes Ziel
  beendet das Gefecht für den Medic.
- [ ] AC4: Mit Fraktionen schiesst niemand auf die eigene Fraktion; mit nur einer Fraktion gibt es kein Gefecht.
- [ ] AC5: Der nächste Gefechtsstart kommt über denselben Timer wie die Aktionsenden, ohne Frame-Schleife.
- [ ] AC6: `?demo` mit Gefechten enthält einen Medic.
- [ ] AC7: Ausgeschaltet, ohne Medic-Rolle oder in Themes ohne Gefechte ändert sich nichts.
- [ ] AC8: Mit Gefechtstönen an spielt jedes Ereignis (Schuss, Explosion, Treffer, Wiederbeleben) genau einmal seinen
  Ton; aus (Standard) oder mit `?sound=0` keiner.

### Tests (TDD)

1. `minimeCombat.check.ts` mit festem `now` und `random`: Start nur mit passendem freiem Medic, Ablauf bis `up`,
   Fehlschuss, Fraktionsfilter, Liegezeit vor Ankunft, Höchstzahl gleichzeitiger Gefechte (AC1, AC2, AC4).
2. `minimeBehavior.check.ts`: `react` im Gefecht, Rollenwechsel, Ziel verschwindet, Medic verschwindet, `positionAt`
   bei `approach`, `nextEnd` mit `nextFightAt` (AC2, AC3, AC5).
3. `demo.ts`-Check mit Medic (AC6); bestehende Checks unverändert grün (AC7).
4. `minimeCombat.check.ts`: Ton-Ereignisse je Schritt als Rückgabe des reinen Planers, an/aus (AC8).

### Out of Scope

- Aussehen der Gefechte (Theme-Pläne).

---

## Package 12: Feste Plätze der Minimes

**Ziel:** Ein Theme kann Minimes auf gleichmässig verteilte Plätze stellen statt an zufällige Stellen.

**Abhängigkeiten:** [RUST-PLAN.md](../RUST-PLAN.md) Package 48 (Feld `minimePlacement`), Package 11 (Rückweg des Medics)

**Betroffene Dateien:** `src/core/minimeBehavior.ts` (`syncRoster`, Platz am Minime), `THEMES.md`.

### Kontext

`syncRoster()` setzt neue Minimes heute an eine zufällige Stelle. Mit `minimePlacement = slots` gibt es `minimeMax`
Plätze gleichmässig zwischen den Rändern; jedes neue Minime bekommt den freien Platz, der am weitesten von den belegten
entfernt ist, und merkt ihn sich (`slot`). Mit Fraktionen hat jede Fraktion einen eigenen Bereich (in der Reihenfolge
der Fraktionen von links nach rechts), jeder Bereich mit eigenen `minimeMax` Plätzen, damit keine Fraktion überläuft.
Bei sehr vielen Minimes überlappen die Figuren; das ist hingenommen. Ändern sich `minimeMax` oder die Breite, werden die
Plätze neu berechnet; ein Minime mit einem Platz ausserhalb bekommt den nächsten freien.

### Acceptance Criteria

- [ ] AC1: Mit `slots` stehen nie zwei Minimes auf demselben Platz, alle Plätze liegen im Bild; ein frei gewordener
  Platz wird wieder vergeben.
- [ ] AC2: Mit Fraktionen liegen die Plätze einer Fraktion in ihrem Bereich; ein Fraktionswechsel gibt einen neuen
  Platz im neuen Bereich.
- [ ] AC3: Ein Medic kehrt nach dem Wiederbeleben auf seinen Platz zurück.
- [ ] AC4: Mit `random` (Standard) ändert sich nichts.

### Tests (TDD)

1. `minimeBehavior.check.ts`: `syncRoster` mit `slots` für 1, viele und `minimeMax` Minimes, mit und ohne Fraktionen,
   Fraktionswechsel, Rückweg des Medics (AC1 bis AC4).

---

## Package 13: Türme der Minimes

**Ziel:** Ein Theme mit Minime-Typen kann Türme einschalten: Sind von jedem Typ einer Turm-Reihenfolge freie Minimes
da, stapeln sich zufällig je eines davon übereinander, laufen eine Weile als Turm und steigen wieder ab.

**Abhängigkeiten:** [RUST-PLAN.md](../RUST-PLAN.md) Package 50 (Felder)

**Betroffene Dateien:** `src/core/minimeStack.ts` (neu, rein) und `src/core/minimeStack.check.ts` (neu),
`src/core/minimeBehavior.ts` (`MinimeActor.stack`, `positionAt`, `react`, `syncRoster`), `src/core/hooks/useMinimes.ts`,
`src/core/demo.ts`, `THEMES.md`.

### Kontext

Gefechte (Package 11) zeigen, wie mehrere Minimes zugleich geplant werden: ein reiner Planer (`minimeCombat.ts`) mit
eigenem Zeitpunkt (`nextFightAt`), eingehängt in `advance`, `nextEnd` und den einen Timer des Hooks; `react()` lässt
Beteiligte in Ruhe. Ein Turm braucht dasselbe Muster, aber ohne Rollen und Schaden: Minimes verschiedener Typen
bewegen sich zu einem gemeinsamen Ort, stehen übereinander und bewegen sich gemeinsam.

### Design

- **Reihenfolge:** Die Felder nennen je Stufe von unten nach oben einen Typ (`minimeStackLevel1` ... `minimeStackLevel3`,
  Auswahl aus den Typen des Themes, Standards vom Theme, RUST-PLAN 50). Eine Stufe "keiner" beendet den Turm darunter,
  mindestens zwei Stufen. Ein Turm beginnt nur, wenn für jede Stufe ein freies Minime genau dieses Typs da ist (nicht
  erscheinend, verschwindend, im Gefecht oder schon im Turm); sonst wird der nächste Zeitpunkt neu gewürfelt.
- **Zufall statt Befehl:** Kein Chatbefehl. Zeitpunkt wie bei Gefechten: Abstand min/max aus den Feldern, `nextStackAt`
  im Zustand des Hooks, `nextEnd()` nimmt das Minimum. Höchstens so viele Türme gleichzeitig wie eingestellt.
- **Zustand am Minime:** `stack: { base: login; level: number; step } | null`. Solange `stack` gesetzt ist, wählt
  `advance()` den nächsten Schritt aus `minimeStack.ts` statt `nextAction()`.
- **Ablauf:**
  1. `gather`: die oberen Stufen bewegen sich zum untersten Minime (bewegt wie `walk`, mit Hüpfen, wenn das Theme hüpft;
     Tempo aus den Feldern). Das unterste wartet mit `brace`.
  2. `climb`: von unten nach oben steigt je Stufe eins auf (Dauer je Stufe aus den Feldern).
  3. `stacked`: der Turm steht (Dauer aus den Feldern); mit "Turm läuft" an folgt `stackWalk`: das unterste Minime
     läuft, die oberen tragen dieselbe Position (`positionAt` liest bei Stufen über 1 die Position der Basis).
  4. `dismount`: von oben nach unten steigt je Stufe eins ab und landet neben der Basis (Stufe 2 und 3 auf
     verschiedenen Seiten, Abstand aus den Feldern); danach `stack = null` für alle.
- **Unterbrechungen:** `react()` lässt Minimes im Turm in Ruhe. Verschwindet ein Minime oder wechselt es den Typ,
  löst sich der ganze Turm auf (entschieden 2026-10-20: ein Turm bleibt ganz oder löst sich ganz auf): alle oben
  stehenden steigen sofort ab (`dismount`), die Basis und noch Zusammenlaufende sind sofort frei.
- **Mit Gefechten und festen Plätzen:** Minimes im Turm sind für Gefechte nicht frei und umgekehrt. Mit `slots` laufen
  alle nach dem Abbau auf ihren Platz zurück (wie der Medic).
- **Anzeige:** Das Theme zeigt die Schritte über `action-<name>` und die Stufe als CSS-Variable `--stack-level`; die
  Höhe einer Stufe ist eine Einstellung des Themes (Aussehen), nicht des Kerns.
- **Reservierte Namen:** `gather`, `brace`, `climb`, `stacked`, `stackWalk`, `dismount` (`STACK_ACTIONS`); ein
  Theme-Katalog darf sie nicht nutzen (Check gegen die Kataloge aller Themes, wie bei `COMBAT_ACTIONS`).
- **Demo:** Mit Türmen bekommen die ersten Demo-Minimes die Typen der Stufen, damit `?demo` Türme zeigt.

### Acceptance Criteria

- [ ] AC1: Ein Turm beginnt nur, wenn je Stufe ein freies Minime genau des eingestellten Typs da ist; nie mehr Türme
  gleichzeitig als eingestellt; ein Minime steht in höchstens einem Turm.
- [ ] AC2: Ablauf `gather`, `climb` (unten nach oben), `stacked`, optional `stackWalk`, `dismount` (oben nach unten);
  danach sind alle Beteiligten frei.
- [ ] AC3: Während `stackWalk` haben alle Stufen dieselbe x-Position wie die Basis.
- [ ] AC4: Chat-Reaktionen unterbrechen keinen Turm; ein verschwindendes Minime löst den ganzen Turm auf.
- [ ] AC5: Der nächste Turm kommt über denselben Timer wie die Aktionsenden, ohne Frame-Schleife.
- [ ] AC6: Ausgeschaltet, mit weniger als zwei Stufen oder in Themes ohne Türme ändert sich nichts.
- [ ] AC7: Gefechte und Türme nehmen nie dasselbe Minime; mit `slots` kehren alle auf ihren Platz zurück.

### Tests (TDD)

Reihenfolge: Test schreiben, rot, minimal implementieren, grün, refactoren.

1. `src/core/minimeStack.check.ts > "starts only with one free minime per level"` (AC1)
   - Gegeben: Stufen `["a", "b", "c"]`, Minimes vom Typ a, a, b (kein c); danach zusätzlich ein c im Gefecht; danach ein
     freies c
   - Erwartet: kein Turm, kein Turm, ein Turm mit genau je einem a, b, c; Höchstzahl 1 verhindert einen zweiten
2. `src/core/minimeStack.check.ts > "runs through all steps"` (AC2, AC3) mit festem `now` und `random`: Schritte in der
   Reihenfolge, Stufen beim Klettern von unten nach oben, beim Absteigen von oben nach unten; `positionAt` der Stufe 3
   gleich der Basis während `stackWalk`.
3. `src/core/minimeStack.check.ts > "a tower ends whole"` (AC4): egal welche Stufe verschwindet, alle anderen steigen
   ab oder sind frei, kein Turm bleibt.
4. `src/core/minimeBehavior.check.ts > "react leaves stacked minimes alone"`, `"nextEnd includes nextStackAt"` (AC4, AC5).
5. `src/core/minimeStack.check.ts > "no tower when off or below two levels"` (AC6) und `"combat and stack never share"`
   (AC7), Rückweg mit `slots` (AC7).
6. `src/core/minimeStack.check.ts > "reserved action names"`: kein Katalog eines Themes nutzt `STACK_ACTIONS`.

Testbefehl: `npm test`

### Out of Scope

- Aussehen der Türme (Theme-Pläne). Türme ohne Typen (Farb-Themes).
