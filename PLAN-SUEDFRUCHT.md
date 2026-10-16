# Plan: Theme "Südfrucht"

Ein drittes eingebautes Theme im süd-tropischen Küsten- und Meeres-Look: Meer, Wellen, Sand, Palmen, Sonne,
Hibiskus, Holzschilder. Jede Szene hat einen eigenen Stil (Starting, BRB, Ending, Alerts, Chat, Kamera-Rahmen,
Musik, Effekte), dazu Stinger und Twitch-Banner. Die Minimes sind Cartoon-Früchte mit Gesicht statt Farb-Geistern:
Chatter wählen eine Frucht, die Früchte hüpfen über den Strand.

Zwei Packages und damit zwei Commits (entschieden). Beide liegen deutlich über der Richtgrösse von etwa 400 Zeilen
pro Commit aus [CODING-RULES.md](CODING-RULES.md); das ist eine bewusste Ausnahme auf Wunsch, die in beiden
Commit-Beschreibungen steht. Jedes Package endet mit grünem `npm run verify`.

## Überblick

| # | Package | Ziel in einem Satz | Abhängig von |
|---|---------|--------------------|--------------|
| 1 | Minime-Typen im Kern | Ein Theme kann statt Farben feste Minime-Typen anbieten, die Chatter per Befehl wählen und die der Server speichert. | - |
| 2 | Theme Südfrucht | Das Theme `suedfrucht` bringt alle Szenen, Stinger, Banner, Töne und hüpfende Frucht-Minimes im Tropen-Look mit, alles einstellbar. | 1 |

## Annahmen

- **Id und Name:** id `suedfrucht` (Ordner `src/themes/suedfrucht/`, ids bestehen aus Kleinbuchstaben), Anzeigename
  "Südfrucht". Alle Texte im Theme sind deutsch.
- **Theme-eigene Funktionen** (Gedächtnis "Theme-eigene Features"): Südfrucht bindet die Minime-Felder selbst ein, die
  Szene `minimes` wird nicht geerbt. Matrix bleibt bei Farben, Starter hat weiterhin keine Minimes.
- **Alles einstellbar, auch Verhalten** (Gedächtnis "Alles einstellbar"): Farben, Schriften, Grössen, Positionen,
  Texte, Zeiten, Animationen (Art, Dauer, Stärke), Häufigkeiten, Töne, An/Aus je Szenenteil, Frucht-Namen im Chat,
  erlaubte Früchte und die Farben jeder Frucht. Fest im Code stehen nur Struktur, Formen (SVG-Pfade) und
  Server-Schutzgrenzen, jeweils mit `fixed: <Grund>`.
- **Fruchtwahl** (entschieden): `!join` klinkt mit einer zufälligen erlaubten Frucht ein, `!join mango` mit Mango,
  `!frucht papaya` wechselt (klinkt ein, wenn eingeschaltet). Die Namen im Chat sind je Frucht einstellbar (deutsch und
  englisch vorbelegt), eine Frucht mit leerer Namensliste ist ausgeschaltet. Eingaben werden vereinheitlicht:
  Kleinbuchstaben, ä/ö/ü/ß zu ae/oe/ue/ss, ohne Leerzeichen und Bindestriche ("Asiatische Birne" = "asiatischebirne").
- **Früchte** (entschieden, 16): Mango, Sternfrucht, Papaya, Ananasguave, Nashi-Birne (asiatische Birne),
  Birnenmelone (Pepino), Kaktusfeige, Durian, Zitrone, Ananas, Kokosnuss, Drachenfrucht, Maracuja, Banane, Litschi,
  Wassermelone.
- **Stil** (entschieden): flache Cartoon-Illustration. Früchte als runde SVG-Sticker mit Augen, Bäckchen und Mund;
  Szenen im gleichen Stil (keine Fotos, keine Verläufe ausser Himmel und Wasser). Alle Formen sind SVG-Pfade als
  Text in `.ts`-Dateien, damit sie prüfbar sind und die Regel "keine Zahlen über 1 in Szenen" nicht berühren.
- **Schriften:** neu über `index.html` (Google Fonts, wie die bestehenden): "Fredoka" (Fliesstext, Standard),
  "Pacifico" (Titel, Standard), "Baloo 2" und "Nunito" als Alternativen; dazu die vorhandenen "Inter" und "DM Sans".
- **Töne:** eingebaute Töne im Steel-Drum/Marimba-Klang, synthetisch über Web Audio wie die Matrix-Töne. Dafür bekommt
  `beep` in `src/core/sound.ts` die Wellenform als optionalen Parameter (Standard bleibt `square`).
- **Deterministische Zufallswerte** für Stinger und Banner (Regel 21): Die gemeinsame `hash`-Funktion liegt heute in
  `src/themes/matrix/stinger.ts`; ein Theme darf nicht aus einem anderen importieren. Package 2 verschiebt sie nach
  `src/core/hash.ts` (Matrix importiert sie dann von dort). Das ist eine Verschiebung im selben Commit wie neue Logik,
  also eine zweite bewusste Ausnahme von den Commit-Regeln; sie steht in der Commit-Beschreibung.
- **Tageszeit je Szene:** Starting = Morgen, BRB = Mittag, Ending = Abendrot als Standard, je Szene umstellbar
  (Morgen, Mittag, Abend, Nacht).
- **Persönliche Startwerte** (wie Matrix und Starter): `personalize` trägt beim ersten Login nur den Kanal-Namen ein
  (erster Buchstabe gross, Rest wie der Login). Kein Logo, das Theme setzt den Namen in Schrift.
- **Checks:** `*.check.ts` mit `node:assert/strict`, Canvas über aufzeichnende Mocks wie in
  `src/themes/starter/stinger.check.ts`. Aussehen und Animationen sind manuelle Checks im Dashboard (Vorschau mit
  `?demo`) und in OBS.

Testbefehl: `npm test` (einzeln: `node <pfad>.check.ts`), Abschluss jedes Packages: `npm run verify`.

---

## Package 1: Minime-Typen im Kern

**Ziel:** Ein Theme kann statt Farben feste Minime-Typen anbieten, die Chatter per Befehl wählen und die der Server speichert.

**Abhängigkeiten:** keine

**Betroffene Dateien:**
- `src/core/types.ts` (ändern: `Minime.variant`)
- `src/core/theme.ts` (ändern: `ThemeSchema.minimeVariants`)
- `src/core/minimes.ts`, `src/core/minimes.check.ts` (ändern: Typen wählen, speichern, zufällig vergeben)
- `src/core/minimeFields.ts`, `src/core/minimeFields.check.ts` (ändern: Felder aufteilen, Typ-Felder bauen, Regeln lesen)
- `src/core/demo.ts` (ändern: Demo-Minimes mit `variant: null`)
- `server/minimes.ts`, `server/minimes.check.ts` (ändern: Datei, Ereignisse, Zufall)
- `server/settings.ts`, `server/settings.check.ts` (ändern: `minimeRules` reicht die Typen des Themes weiter)
- `src/themes/schemaAudit.ts`, `src/themes/schemaAudit.check.ts` (ändern: gebaute Typ-Felder gelten als benutzt)
- `src/themes/matrix/settings.ts` (ändern: neue Feldaufteilung, Schlüssel und Werte bleiben gleich)

### Kontext

Heute kennt der Kern nur Farben: `Minime = { login, user, color }` (`src/core/types.ts`), `parseCommand` liest eine
Farbe hinter `!join` und `!color` (`src/core/minimes.ts`), `MinimeState.colors` merkt sie pro Chatter, `parseMinimeFile`
in `server/minimes.ts` liest `roster` und `colors` aus `minimes.json`. `MINIME_FIELDS` (`src/core/minimeFields.ts`)
enthält Befehle, Regeln und Bewegung inklusive der Farb-Felder `minimeColorCommand`, `minimeMinBrightness`,
`minimeUseTwitchColor`; `readMinimeOptions` macht daraus `{ rules, motion }`. `minimeRules(file)` in
`server/settings.ts` liefert die Regeln des gewählten Themes oder `null`, wenn es keine Minimes hat.

Persistierte Namen bleiben (CODING-RULES "Persisted files and the wire keep their names"): `minimes.json` bekommt nur
neue, optionale Schlüssel (`variants`, `roster[].variant`), alte Dateien bleiben lesbar. Die Matrix-Schlüssel und ihre
gespeicherten Werte ändern sich nicht.

### Design

- **Typ eines Minimes:** `Minime = { login, user, color: string | null, variant: string | null }`. Farb-Themes
  setzen `variant: null`, Typ-Themes `color: null`. SSE `minimes` trägt das Feld mit.
- **Typen eines Themes:** `ThemeSchema.minimeVariants?: readonly MinimeVariantInfo[]` mit
  `MinimeVariantInfo = { id: string; label: string; names: readonly string[] }` (id `^[a-z0-9]{1,30}$`, label für das
  Dashboard, names = Standard-Namen im Chat). Fehlt die Liste, ist es ein Farb-Theme.
- **Felder:** `MINIME_FIELDS` wird geteilt in `MINIME_BASE_FIELDS` (Befehle `minimeJoinCommand`,
  `minimeLeaveCommand`, Rollen, Regeln, Bewegung) und `MINIME_COLOR_FIELDS` (`minimeColorCommand`,
  `minimeMinBrightness`, `minimeUseTwitchColor`). `MINIME_FIELDS = [...MINIME_BASE_FIELDS, ...MINIME_COLOR_FIELDS]`
  bleibt für Matrix. Neu `minimeVariantFields(variants, options)`: `text("minimeVariantCommand", "Befehl: <label>
  wählen", ..., options.command)` plus je Typ `text("minimeNames_<id>", "<label>: Namen im Chat (leer = aus)",
  MINIME_VARIANTS, names.join(", "))`. Das Theme gibt Standardwort und Bezeichnung mit (`{ command: "!frucht",
  label: "Frucht" }`). Neue Gruppe `MINIME_VARIANTS = "Minimes: Typen"`.
- **Regeln:** `MinimeRules.variants: readonly { id: string; names: readonly string[] }[] | null` (null = Farben) und
  `commands.look` (bisher `commands.color`, interner Name; gespeicherter Schlüssel bleibt `minimeColorCommand` bzw.
  neu `minimeVariantCommand`). `readMinimeOptions(values, variants?)`: mit `variants` werden Befehl und Namen aus den
  Typ-Feldern gelesen, Namen vereinheitlicht (`normalizeName`), leere Listen fallen weg; doppelte Namen gewinnt der
  erste Typ.
- **Befehle:** `parseCommand` im Typ-Modus: `!join <name>` ergibt `{ type: "join", color: null, variant }` (unbekannter
  Name = `null`, also zufällig), `!frucht <name>` ergibt `{ type: "look", variant }`, unbekannter Name = `null` (wird
  ignoriert). Im Farb-Modus bleibt alles wie heute (`look` mit `color`).
- **Zustand:** `MinimeState.variants: Record<login, { variant, usedAt, changedAt }>` neben `colors`, gleiche
  Obergrenze und gleicher Cooldown (`minimeColorCooldown`, Label wird "Abklingzeit Farb- oder Typwechsel").
  `applyMinime(state, event, now, rules, random)` bekommt den Zufall herein (Regel 32): Beim Einklinken ohne Wahl gilt
  der gemerkte Typ, wenn er noch erlaubt ist, sonst ein zufälliger erlaubter. `prune` gibt Eingeklinkten mit einem
  inzwischen ausgeschalteten Typ einen neuen erlaubten (Ergebnis `changed: true`). Sind alle Typen aus, bleibt
  `variant: null` (das Theme zeigt dann seinen Standard-Typ).
- **Server:** `parseMinimeFile` liest `variants` und `roster[].variant` (Allowlist `^[a-z0-9]{1,30}$`, fehlt = null),
  `toMinimeEvent` reicht `variant` durch, `startMinimes` bekommt `random` (Standard `Math.random`, im Check fest),
  `minimeRules(file)` übergibt `schema.minimeVariants`.

### Acceptance Criteria

- [ ] AC1: Matrix verhält sich unverändert: dieselben Schlüssel, Standardwerte und Gruppen; alle bisherigen Checks
      in `src/core/minimes.check.ts`, `src/core/minimeFields.check.ts`, `server/minimes.check.ts` laufen unverändert grün
      (nur `random` und `variant: null` kommen in Aufrufen und Erwartungen dazu).
- [ ] AC2: `normalizeName("Asiatische Birne")` = `"asiatischebirne"`, `normalizeName("Kaktus-Feige")` = `"kaktusfeige"`,
      `normalizeName("Süß")` = `"suess"`.
- [ ] AC3: Im Typ-Modus ergibt `!join mango` den Typ `mango`, `!join` und `!join xyz` einen zufälligen erlaubten Typ,
      `!frucht Karambole` (Name der Sternfrucht) den Typ `sternfrucht`, `!frucht xyz` nichts.
- [ ] AC4: Ein Typ mit leerer Namensliste ist aus: er wird nie zufällig vergeben, per Name nicht wählbar, und wer ihn
      trägt, bekommt beim nächsten `prune` einen erlaubten Typ.
- [ ] AC5: Der gewählte Typ bleibt nach `!leave` gemerkt und gilt beim nächsten `!join`; Wechsel unterliegen dem Cooldown.
- [ ] AC6: `minimes.json` aus der Zeit vor diesem Package (ohne `variants`) lädt ohne Fehler, alle `variant` sind `null`;
      ungültige Typ-ids in der Datei fallen weg.
- [ ] AC7: Die Regeln eines Themes mit `minimeVariants` enthalten die eingeschalteten Typen mit ihren Namen; Matrix
      liefert `variants: null`, Starter `null` (keine Minimes).
- [ ] AC8: `auditTheme` zählt `minimeVariantCommand` und alle `minimeNames_<id>` als benutzt.

### Tests (TDD)

Reihenfolge: Test schreiben, rot, minimal implementieren, grün, refactoren.

1. `src/core/minimes.check.ts > "Namen vereinheitlichen"` (AC2)
   - Gegeben: `"Asiatische Birne"`, `"Kaktus-Feige"`, `"Süß"`, `"  MANGO "`
   - Erwartet: `"asiatischebirne"`, `"kaktusfeige"`, `"suess"`, `"mango"`
2. `src/core/minimes.check.ts > "Befehle im Typ-Modus"` (AC3)
   - Gegeben: `RULES_VARIANT` mit `variants: [{ id: "mango", names: ["mango"] }, { id: "sternfrucht", names: ["sternfrucht", "karambole"] }]`,
     `commands.look: "!frucht"`; Texte `"!join mango"`, `"!join"`, `"!join xyz"`, `"!frucht Karambole"`, `"!frucht xyz"`
   - Erwartet: join `mango`, join `null`, join `null`, look `sternfrucht`, `null`
3. `src/core/minimes.check.ts > "Zufälliger Typ beim Einklinken"` (AC3, AC5)
   - Gegeben: join ohne Typ mit `random = () => 0.99`; dann leave, join ohne Typ mit `random = () => 0`
   - Erwartet: zweiter Typ der Liste, nach dem erneuten Einklinken derselbe (gemerkt)
4. `src/core/minimes.check.ts > "Typ wechseln mit Cooldown"` (AC5)
   - Gegeben: look `mango` bei 0 s, look `sternfrucht` bei 3 s und bei 12 s (Cooldown 10 s)
   - Erwartet: nach 3 s noch `mango`, nach 12 s `sternfrucht`
5. `src/core/minimes.check.ts > "Ausgeschalteter Typ"` (AC4)
   - Gegeben: neo trägt `mango`; Regeln danach nur mit `sternfrucht`; `prune`; join eines Neuen mit `random = () => 0`
   - Erwartet: neo trägt `sternfrucht`, `changed: true`; der Neue `sternfrucht`; ohne erlaubte Typen `variant: null`
6. `src/core/minimeFields.check.ts > "Typ-Felder"` (AC7, AC8)
   - Gegeben: `minimeVariantFields([{ id: "mango", label: "Mango", names: ["mango", "mangos"] }], { command: "!frucht", label: "Frucht" })`
   - Erwartet: Schlüssel `minimeVariantCommand` (Standard `!frucht`) und `minimeNames_mango` (Standard `"mango, mangos"`),
     Gruppe `Minimes: Typen`; `readMinimeOptions({ minimeNames_mango: "Mango,  MANGOS" }, variants).rules.variants`
     = `[{ id: "mango", names: ["mango", "mangos"] }]`; mit `minimeNames_mango: ""` = `[]`
7. `src/core/minimeFields.check.ts > "Matrix unverändert"` (AC1): `readMinimeOptions({})` ergibt die bisherigen
   Standardwerte plus `variants: null`; die Schlüsselliste von `MINIME_FIELDS` ist dieselbe wie vorher (als Liste im Check).
8. `server/minimes.check.ts > "alte Datei"` (AC6)
   - Gegeben: `parseMinimeFile({ roster: [{ login: "neo", user: "Neo", color: null, lastSeen: 1 }], colors: {} })` und eine
     Datei mit `variants: { neo: { variant: "../x", usedAt: 1, changedAt: 1 } }`
   - Erwartet: `variant: null`, `variants: {}`
9. `server/minimes.check.ts > "Laufzeit im Typ-Modus"` (AC3): `startMinimes` mit festem `random`, `!join` und
   `!frucht karambole` ergeben SSE-Listen mit `variant`.
10. `server/settings.check.ts > "Regeln je Theme"` (AC7): reine Hilfsfunktion `rulesFor(schema, values)` (von
    `minimeRules` genutzt) mit einem Probe-Schema mit `minimeVariants` ergibt die Typen; `minimeRules` für Matrix
    `variants: null`, für Starter `null`. Das echte Südfrucht-Schema prüft Package 2.
11. `src/themes/schemaAudit.check.ts > "gebaute Typ-Felder"` (AC8): Probe-Schema mit `minimeVariantFields` hat keine
    unbenutzten Schlüssel.

Testbefehl: `npm test`

### Umsetzungsschritte

1. `normalizeName` mit Test 1.
2. Typen: `Minime.variant`, `MinimeVariantInfo`, `ThemeSchema.minimeVariants`, `MinimeRules.variants`, `commands.look`;
   alle bestehenden Aufrufer und Checks um `variant: null` und `random` ergänzen (AC1 bleibt grün).
3. Tests 2 bis 5, dann `parseCommand` und `applyMinime` im Typ-Modus (eine gemeinsame Speicherfunktion für Farben und
   Typen statt einer Kopie).
4. Tests 6 und 7, dann Aufteilung der Felder, `minimeVariantFields`, `readMinimeOptions(values, variants?)`.
5. Tests 8 bis 10, dann Server: Datei, Ereignisse, `random`, `rulesFor`/`minimeRules`.
6. Test 11, dann `auditTheme` (Schlüssel `minimeVariantCommand` und mit Präfix `minimeNames_` gelten als Kern-Schlüssel).
7. `demo.ts`: Demo-Minimes mit `variant: null` (das Theme verteilt sie in der Vorschau selbst, Package 2).
8. `npm run verify`, manueller Check: Matrix-Szene `minimes?demo` sieht aus wie vorher.

### Out of Scope

- Aussehen der Typen (Package 2). Typen für Matrix oder Starter.

---

## Package 2: Theme Südfrucht

**Ziel:** Das Theme `suedfrucht` bringt alle Szenen, Stinger, Banner, Töne und hüpfende Frucht-Minimes im Tropen-Look mit, alles einstellbar.

**Abhängigkeiten:** Package 1

**Betroffene Dateien:**

Neu in `src/themes/suedfrucht/`:
- `settings.ts`, `settings.check.ts`: Schema (Gruppen unten), `SuedfruchtValues`, `personalize`, `minimeVariants`
- `useSuedfrucht.ts`: Werte mit Typ, Platzhalter `{channel}` und `{login}` (wie `useStarter.ts`)
- `index.tsx`: Szenen per `React.lazy`, Import von `theme.css`
- `theme.css`: Look aller Szenen unter `.theme-suedfrucht`, Keyframes `suedfrucht-*`
- `fruits.ts`, `fruits.check.ts`: die 16 Früchte (id, label, Chat-Namen, SVG-Teile als Pfad-Text)
- `beach.ts`, `beach.check.ts`: SVG-Teile der Strandkulisse (Palme, Welle, Wolke, Möwe, Sonne, Boot, Hibiskus, Schild) als Pfad-Text
- `hops.ts`, `hops.check.ts`: Sprungplan für das Hüpfen (Anzahl und Takt aus Dauer und Sprungtakt)
- `Beach.tsx`: Kulisse für die Vollbild-Szenen (Himmel, Sonne, Wolken, Meer mit Wellen, Sand, Palmen, Möwen, Boot)
- `Fruit.tsx`: eine Frucht als SVG aus `fruits.ts` mit Gesicht und Farben aus den Einstellungen
- `minimes.css`: Look der Szene `minimes`, nur mit ihr geladen
- `tones.ts`: eingebaute Töne (Steel-Drum/Marimba) für Alerts und Effekte
- `scenes/Screen.tsx`, `scenes/Alerts.tsx`, `scenes/Chat.tsx`, `scenes/Cam.tsx`, `scenes/Music.tsx`, `scenes/Fx.tsx`, `scenes/Minimes.tsx`
- `stinger.ts`, `stinger.check.ts`, `banners.ts`, `banners.check.ts`, `render.ts`, `render.check.ts`

Ändern:
- `src/core/hash.ts` (neu, verschoben aus `src/themes/matrix/stinger.ts`), `src/core/hash.check.ts` (neu), `src/themes/matrix/stinger.ts`, `src/themes/matrix/banners.ts` (Import)
- `src/core/sound.ts` (`beep` mit optionaler Wellenform)
- `src/themes/registry.ts`, `src/themes/scenes.tsx`, `src/themes/renderers.ts` (eintragen)
- `src/themes/registry.check.ts`, `src/themes/renderers.check.ts` (neues Theme prüfen)
- `index.html` (Schriften Fredoka, Pacifico, Baloo 2, Nunito)
- `THEMES.md`, `README.md` (Theme, Fruchtbefehle, Minime-Typen)

### Kontext

Vorlage ist das Starter-Theme (`src/themes/starter/`): eigenes Schema, eigene Szenen, Stinger und Banner als reine
Funktionen der Zeit (`stinger.ts`, `banners.ts`, `render.ts`), eingetragen in `registry.ts`, `scenes.tsx` und
`renderers.ts`. Die Minime-Szene der Matrix (`src/themes/matrix/scenes/Minimes.tsx`, `minimes.css`) zeigt, wie
`useMinimes({ catalog, reaction, widthPx })` genutzt wird: eine Aktion je Minime als Klasse `action-<name>`, Position
über `--x` und eine `transition` bei `walk`, Animation neu je Aktion über `key`. `scripts/rules.check.ts` erzwingt:
keine Farbliterale ausser in `settings.ts`, kein sichtbarer JSX-Text, in CSS keine px/ms/s ausserhalb von
`var(--name, Standard)`, in `scenes/*.tsx` keine Zahlen über 1. `auditTheme` verlangt, dass jeder Schlüssel im
Theme-Code vorkommt.

### Gestaltung je Szene

**Kulisse (`Beach.tsx`, Starting/BRB/Ending, auch Hintergrund der Banner):**
Schichten von hinten nach vorn: Himmel als Verlauf je Tageszeit (`skyMorning*`, `skyDay*`, `skyEvening*`,
`skyNight*`, je oben/unten), Sonne oder Mond mit weichem Schein, langsam ziehende Wolken, Horizont mit optionalem
Segelboot, Meer mit drei Wellenschichten, die nahtlos seitlich laufen (Tempo je Schicht), Glitzern auf dem Wasser,
Schaumkante, Sandstreifen mit Muscheln und Seesternen, Palmen links und rechts (Anzahl, Grösse, Neigung, Wiegen),
Möwen, die gelegentlich durchs Bild fliegen. Jede Schicht einzeln abschaltbar.

**Starting / BRB / Ending (`scenes/Screen.tsx`):**
In der Mitte ein Holzschild (an zwei Seilen von einer Palme hängend oder auf einem Pfahl im Sand, wählbar) mit
Überzeile, Titel (Titelschrift) und Untertitel. Darunter ein kleineres Schild mit Countdown (Starting), Pausenzeit
(BRB) oder "Nächster Stream" (Ending). Fortschritt als Welle, die von links nach rechts über das Schild läuft, oder als
Seil mit Boje (wählbar). Unter dem Schild wechseln Sprüche (Zeilen je Szene, Einblenden wie Flaschenpost-Zettel, Takt
einstellbar). Ticker als Banner hinter einem kleinen Flugzeug, das über den Himmel zieht, oder als Holzleiste unten
(wählbar). Kanal-Name optional in den Sand geschrieben. Parameter wie bisher: `?min=5`, `?at=20:00`, `?next=...`, `?ticker=...`.

**Alerts (`scenes/Alerts.tsx`):**
Drei Stile (wählbar): Postkarte (fliegt herein, Briefmarke mit Symbol der Alert-Art, Poststempel mit Kanal-Name),
Surfbrett (gleitet auf einer Welle herein, Text auf dem Brett), Flaschenpost (Flasche treibt auf einer Welle herein,
Zettel rollt sich aus). Je Alert-Art Kopfzeile, Zeile mit `{user}`, `{amount}`, `{detail}`, `{text}`, Symbol (Muschel,
Seestern, Ananas, Kokosnuss, Sonne, Welle, Hibiskus, Boot), Ton. Optional Konfetti aus Hibiskusblüten und Wasserspritzer.
Position, Breite, Skalierung, Dauer, Ein- und Ausblenden (Welle, Plopp, Gleiten, Blenden, keins), Restzeit als
schrumpfendes Seil.

**Chat (`scenes/Chat.tsx`):**
Nachrichten als Blasen, die von unten aufsteigen (Luftblase), als Holzplanken oder als Muscheln mit Text (wählbar).
Name in Twitch-Farbe oder Akzentfarbe (wählbar), Badges als kleine Symbole mit Text, Emote-Grösse, Schriftgrösse,
Ausblenden nach Sekunden, Anzahl, oben/unten, Deckkraft, sanftes Schaukeln an/aus.

**Kamera-Rahmen (`scenes/Cam.tsx`):**
Rahmen aus Bambus, Holz oder Seil (wählbar), Palmblätter in den Ecken (Anzahl 0 bis 4, Grösse, Wiegen), Hibiskusblüte
an einer Ecke, Namensschild ({channel}), Live-Anzeige als Seestern mit Text, Rahmenbreite, Eckenradius, Schatten.

**Musik (`scenes/Music.tsx`):**
Strandradio (Boombox im Holz-Look mit Cover im Bullauge), Muschel (Cover in einer Muschel, Text daneben) oder schlicht
(Karte mit Wellenkante), wählbar. Titel, Interpret, Album an/aus, Fortschritt als Wellenlinie, Equalizer als hüpfende
Wellenbalken (Anzahl), Cover rund oder eckig, Kopfzeilen für Wiedergabe und Pause, Text ohne Wiedergabe, bei Pause
ausblenden, Laufschrift für lange Titel.

**Effekte (`scenes/Fx.tsx`):**
Medien aus Triggern wie bisher (`useFx`), Texte in einer Sprechblase im Theme-Stil, Ein- und Ausblenden (Plopp, Welle,
Blenden), Rand und Schatten einstellbar.

**Minimes (`scenes/Minimes.tsx`, `Fruit.tsx`, `minimes.css`):**
Früchte stehen auf einer Sandlinie (Abstand zum Boden einstellbar) mit weichem Schatten, der beim Sprung kleiner wird.
Fortbewegung durch Hüpfen: Während `walk` läuft die Position linear (Kern), die Frucht macht dabei `hopPlan(durationMs,
hopMs)` Sprünge mit Stauchen beim Aufkommen; Sprunghöhe, Sprungtakt und Stauchung einstellbar. Name auf einem kleinen
Holzschild oder Band über der Frucht (wählbar), Name an/aus. Gesicht: Augen blinzeln, Bäckchen, Mund (lächelnd, beim
Schlafen offen), Gesichter abschaltbar. Erscheinen: fällt von oben in den Sand und federt nach; Verschwinden: hüpft
hoch aus dem Bild oder versinkt im Sand (wählbar).
Eigene Animationen (Katalog, je Häufigkeit und Dauer, Häufigkeit 0 = aus): Freudensprünge (`bounce`, mehrere kleine
Sprünge), Pirouette (`spin`), Wackeln (`wobble`), Sonnenbrille aufsetzen und chillen (`sunglasses`), Umschauen
(`look`), Schlafen mit Schnarchblase (`sleep`). Reaktion auf Chat (`splash`): grosser Sprung mit Saftspritzern in der
Fruchtfarbe. Ohne Typ (Demo oder alle Früchte aus) zeigt die Szene die Standardfrucht oder, in `?demo`, eine Frucht
nach `hash(login)` aus den eingeschalteten.

**Stinger (`stinger.ts`):** Eine grosse Welle mit Schaumkrone rollt von links ins Bild, deckt am Übergangspunkt alles
in Meeresfarben ab, zeigt kurz den Text (Titelschrift) und eine Palmen-Silhouette, läuft rechts wieder hinaus; davor
und danach transparent. Wellenhöhe, Anzahl Wellenschichten, Schaum an/aus, Farben, Text, Dauer, Übergangspunkt.

**Banner (`banners.ts`):** Profilbanner (1200x480) als Strandpanorama mit Kanal-Name und Text, Offline-Banner
(1920x1080) im Abendrot mit Titel, Text und Zeilen auf einem Holzschild. Wellen und Glitzern laufen in einer
nahtlosen Schleife (Bild 0 = Bild am Schleifenende).

### Einstellungen (Schema `settings.ts`)

Alle Schlüssel mit Standardwert; die Gruppen werden in `groupScenes` ihren Szenen zugeordnet (Stinger und Banner `[]`).
Farben als `color`, Zahlen mit Grenzen und Einheit, Schalter als `flag`, Auswahlen als `choice`.

| Gruppe | Schlüssel (Auswahl der Werte) |
|---|---|
| Allgemein | `channelName` ("Strand"), `font` (Fredoka), `titleFont` (Pacifico), `fontSize`, `textColor`, `textOnWood`, `wood`, `woodDark`, `sea`, `seaDeep`, `foam`, `sand`, `sandDark`, `palmLeaf`, `palmTrunk`, `accent` (Hibiskus-Pink), `accent2` (Mango-Orange), `shadowStrength`, `radius`, `fadeDuration`, `locale` |
| Kulisse | `timeStarting`/`timeBrb`/`timeEnding` (morgen, mittag, abend, nacht), Himmelfarben je Tageszeit (`skyMorningTop` ... `skyNightBottom`), `sun`, `sunGlow`, `moon`, `clouds` (an/aus), `cloudCount`, `cloudSpeed`, `waveLayers` (1 bis 3), `waveSpeed`, `waveHeight`, `sparkles`, `palmsLeft`, `palmsRight`, `palmSize`, `palmSway`, `palmSwaySpeed`, `boat`, `gulls`, `gullEvery`, `shells`, `sandName` (Kanal-Name im Sand) |
| Starting, BRB, Ending | Überzeile, Titel, Untertitel je Szene, `signStyle` (hängend, pfahl), `countdown`, `countdownPrefix`, `countdownDone`, `progressStyle` (welle, seil, aus), `afkPrefix`, `endingNextLabel`, `endingNext`, Sprüche je Szene (`startingLines`, `brbLines`, `endingLines`), `linesEvery`, `ticker`, `tickerStyle` (flugzeug, leiste), `tickerSpeed`, `powerOn` (sonnenaufgang, blenden, keins), `powerOnDuration` |
| Alerts | `alertStyle` (postkarte, surfbrett, flaschenpost), je Art Kopfzeile, Zeile, Symbol (`followIcon` ...), `quoteFormat`, `alertQuote`, `alertDuration`, `alertScale`, `alertTop`, `alertAlign`, `alertWidth`, `alertIn`/`alertOut` (welle, plopp, gleiten, blenden, keins), `alertTimer`, `petals` (Hibiskus-Konfetti), `petalCount`, `splash`, `alertSound`, Töne je Art (`soundFollow` ...), `soundLeave` |
| Chat | `chatStyle` (blase, planke, muschel), `chatNameColor` (twitch, akzent), Badge-Texte, `chatFontSize`, `emoteSize`, `chatFade`, `chatMax`, `chatAlign`, `chatOpacity`, `chatSway`, `chatIn`/`chatOut` |
| Kamera-Rahmen | `camStyle` (bambus, holz, seil), `camLeaves` (0 bis 4), `camLeafSize`, `camLeafSway`, `camFlower`, `camLabel` ("{channel}"), `camLive`, `camLiveText`, `camFrameWidth`, `camRadius` |
| Musik | `musicStyle` (radio, muschel, schlicht), Kopfzeilen, `musicIdleTitle`, `musicIdleArtist`, `musicAlbum`, `musicProgress`, `equalizer`, `equalizerBars`, `coverShape` (rund, eckig), `coverSize`, `musicTitleSize`, `musicHide`, `musicMarquee` |
| Effekte | `fxDuration`, `fxSize`, `fxIn`/`fxOut`, `fxBubble`, `fxMargin` |
| Stinger | `stingerDuration`, `stingerCut`, `stingerText` ("{channel}"), `stingerWaves`, `stingerFoam`, `stingerPalm` |
| Banner | `bannerProfileText`, `bannerOfflineTitle`, `bannerOfflineText`, `bannerOfflineLines`, `bannerLoop`, `bannerProfileFps`, `bannerOfflineFps` |
| Minimes: Befehle, Regeln, Bewegung | aus `MINIME_BASE_FIELDS` (Kern) |
| Minimes: Typen | aus `minimeVariantFields(FRUITS, { command: "!frucht", label: "Frucht" })`: `minimeVariantCommand`, `minimeNames_<id>` je Frucht |
| Minimes: Aussehen | `fruitSize`, `fruitGround`, `fruitShadow`, `fruitFaces`, `fruitEye`, `fruitCheek`, `fruitMouth`, `fruitOutline`, `fruitOutlineWidth`, `fruitLeaf`, `fruitDefault` (Standardfrucht), `fruitNames` (an/aus), `fruitNameStyle` (schild, band), `fruitNameSize`, `fruitBlinkEvery`, `fruitEnter` (fallen, blenden), `fruitExit` (wegspringen, versinken) |
| Minimes: Hüpfen | `hopHeight`, `hopMs`, `hopSquash` |
| Minimes: Animationen | je Animation Häufigkeit und Dauer (`bounceWeight`, `bounceMs`, ... für bounce, spin, wobble, sunglasses, look, sleep), Stärken (`bounceHeight`, `spinTurns`, `wobbleAngle`, `sleepText`), Reaktion `splashMs`, `splashHeight`, `splashDrops` |
| Früchte: Farben | je Frucht Hauptfarbe und Detailfarbe (`fruitMangoMain`, `fruitMangoDetail`, ... für alle 16) |

`personalize`: `{ channelName: <Login mit grossem Anfangsbuchstaben> }`.
`minimeVariants`: die 16 Früchte aus `fruits.ts` (id, label, Standard-Namen):

| id | Label | Standard-Namen im Chat |
|---|---|---|
| `mango` | Mango | mango, mangos |
| `sternfrucht` | Sternfrucht | sternfrucht, karambole, starfruit |
| `papaya` | Papaya | papaya |
| `ananasguave` | Ananasguave | ananasguave, feijoa, guave |
| `nashi` | Nashi-Birne | nashi, nashibirne, asiatischebirne, asianpear |
| `pepino` | Birnenmelone | birnenmelone, pepino |
| `kaktusfeige` | Kaktusfeige | kaktusfeige, feige, pricklypear |
| `durian` | Durian | durian, stinkfrucht |
| `zitrone` | Zitrone | zitrone, lemon |
| `ananas` | Ananas | ananas, pineapple |
| `kokosnuss` | Kokosnuss | kokosnuss, kokos, coconut |
| `drachenfrucht` | Drachenfrucht | drachenfrucht, pitaya, dragonfruit |
| `maracuja` | Maracuja | maracuja, passionsfrucht, passionfruit |
| `banane` | Banane | banane, banana |
| `litschi` | Litschi | litschi, lychee |
| `wassermelone` | Wassermelone | wassermelone, melone, watermelon |

### Acceptance Criteria

- [ ] AC1: Im Dashboard ist "Südfrucht" wählbar; jede Szene (starting, brb, ending, alerts, chat, cam, music, fx,
      minimes) zeigt ihre eigene Südfrucht-Gestaltung, keine erbt vom Matrix-Theme.
- [ ] AC2: Jeder Schlüssel des Schemas hat einen gültigen Standardwert und wird im Theme-Code benutzt; jede Gruppe ist
      genau ihren Szenen zugeordnet (Vorschau zeigt nur die Gruppen der Szene).
- [ ] AC3: Theme-Code enthält keine Farbliterale, keinen sichtbaren JSX-Text, in CSS keine festen px/ms/s und in Szenen
      keine Zahlen über 1 (`scripts/rules.check.ts` grün).
- [ ] AC4: `fruits.ts` beschreibt genau die 16 Früchte; ids passen zum Muster, Chat-Namen sind über alle Früchte
      eindeutig (nach `normalizeName`), jede Frucht hat mindestens einen Körper-Pfad und Farbfelder `fruit<Id>Main`
      und `fruit<Id>Detail` im Schema.
- [ ] AC5: `hopPlan(durationMs, hopMs)` liefert mindestens einen Sprung, Anzahl = gerundet Dauer / Takt, Takt =
      Dauer / Anzahl (die Frucht landet genau am Ziel).
- [ ] AC6: Der Stinger ist bei t = 0 und t = Dauer leer, deckt am Übergangspunkt das ganze Bild und zeichnet bei gleichem
      t immer gleich (kein `Math.random`, nur `hash`).
- [ ] AC7: Beide Banner zeichnen Titel und Text und sehen bei t = 0 und t = Schleifenlänge gleich aus.
- [ ] AC8: `render.ts` liefert die drei Clips mit Gruppen, Länge, Übergangspunkt und Schleife aus den Einstellungen.
- [ ] AC9: `registry.check.ts`: `hasMinimes(suedfrucht)` ist wahr, `minimeVariants` hat 16 Einträge, `personalize("neo_42")`
      ergibt `{ channelName: "Neo_42" }` und besteht das Schema; `minimeRules` mit gewähltem Südfrucht-Theme liefert
      16 Typen, mit `minimeNames_durian: ""` 15.
- [ ] AC10: Mit `?demo=16` zeigt die Szene `minimes` verschiedene Früchte, die hüpfend wandern, alle sechs Animationen
      und die Reaktion `splash` kommen innerhalb von zwei Minuten vor (manueller Check, Ablauf wie bei Matrix: Klassen
      und Animationsnamen per Stil-Abfrage).
- [ ] AC11: Auf dem Server wählt `!join mango` eine Mango, `!frucht karambole` wechselt zur Sternfrucht, eine im
      Dashboard ausgeschaltete Frucht wird ersetzt (manueller Check mit echtem Chat; die Logik ist in Package 1 geprüft).
- [ ] AC12: `matrix` sieht nach dem Verschieben von `hash` gleich aus (Matrix-Checks für Stinger und Banner unverändert grün).
- [ ] AC13: README und THEMES.md beschreiben das Theme, die Fruchtbefehle und wie ein Theme Minime-Typen anbietet.

### Tests (TDD)

Reihenfolge: Test schreiben, rot, minimal implementieren, grün, refactoren.

1. `src/core/hash.check.ts > "gleiche Eingabe, gleiche Ausgabe"` (AC6, AC12): Werte für einige Eingaben gleich wie die
   bisherige Matrix-Funktion (feste Erwartungswerte aus der heutigen Implementierung), alle in [0, 1).
2. `src/themes/suedfrucht/hops.check.ts > "Sprungplan"` (AC5)
   - Gegeben: (1000, 300), (100, 300), (0, 300), (900, 300)
   - Erwartet: `{ count: 3, periodMs: 333.33 }`, `{ count: 1, periodMs: 100 }`, `{ count: 1, periodMs: 0 }` (keine Teilung durch 0), `{ count: 3, periodMs: 300 }`
3. `src/themes/suedfrucht/fruits.check.ts > "16 Früchte"` (AC4): ids in der Reihenfolge der Tabelle, Muster
   `^[a-z0-9]{1,30}$`, Namen eindeutig nach `normalizeName`, jede mit Pfad der Art `body`.
4. `src/themes/suedfrucht/beach.check.ts > "Kulissen-Teile"`: jedes Teil (palm, wave, cloud, gull, sun, boat,
   hibiscus, sign) hat mindestens einen Pfad, Pfade beginnen mit `M`.
5. `src/themes/suedfrucht/settings.check.ts` (AC2, AC4): `auditTheme` ohne Fehler und ohne unbenutzte Schlüssel;
   Pflichtschlüssel je Gruppe (Liste wie in `matrix/settings.check.ts`); für jede Frucht `fruit<Id>Main`,
   `fruit<Id>Detail`, `minimeNames_<id>`; `groupScenes` nennt jede Gruppe.
6. `src/themes/suedfrucht/stinger.check.ts` (AC6): aufzeichnender Mock wie `starter/stinger.check.ts`; bei t = 0 und
   t = Dauer keine Füllung, am Übergangspunkt eine Fläche über das ganze Bild; zweimal t = 0.37 gibt dieselben Aufrufe.
7. `src/themes/suedfrucht/banners.check.ts` (AC7): beide Banner enthalten Titel und Text; Aufrufe bei t = 0 und
   t = Schleifenlänge gleich.
8. `src/themes/suedfrucht/render.check.ts` (AC8): drei Clips `stinger`, `profile`, `offline` mit Gruppen und Werten.
9. `src/themes/registry.check.ts` und `server/settings.check.ts` (AC9), `src/themes/renderers.check.ts`: Südfrucht
   eingetragen, Typen in den Regeln, eigene Clips.
10. `scripts/rules.check.ts` (vorhanden, AC3): wird während der Arbeit rot, wenn ein Literal durchrutscht.
11. Manuelle Checks (AC1, AC10, AC11): Dashboard, Theme wählen, jede Szene in der Vorschau mit `?demo` ansehen
    (Tageszeiten, Stile der Alerts, Chat, Rahmen und Radio umschalten); Szene `minimes?demo=16` zwei Minuten beobachten;
    in OBS jede Quelle einmal; auf dem Server mit echtem Chat `!join`, `!join mango`, `!frucht karambole`.

Testbefehl: `npm test`, Abschluss `npm run verify`

### Umsetzungsschritte

1. `hash` nach `src/core/hash.ts` verschieben (Test 1 zuerst), Matrix-Importe anpassen, Matrix-Checks grün.
2. `beep` in `src/core/sound.ts` um die Wellenform erweitern (Standard `square`, Matrix unverändert).
3. Datenmodule mit Tests: `hops.ts` (Test 2), `fruits.ts` (Test 3), `beach.ts` (Test 4).
4. `settings.ts` mit allen Gruppen aus der Tabelle, `minimeVariants`, `personalize`; `useSuedfrucht.ts`;
   `settings.check.ts` (Test 5, rot bis alle Szenen die Schlüssel benutzen).
5. Eintragen in `registry.ts`, `scenes.tsx`, `renderers.ts`; `index.tsx`; Schriften in `index.html`.
6. Szenen nacheinander, je mit CSS in `theme.css` und manuellem Blick in die Vorschau:
   `Beach.tsx` und `Screen.tsx`, dann `Alerts.tsx` mit `tones.ts`, `Chat.tsx`, `Cam.tsx`, `Music.tsx`, `Fx.tsx`.
7. `Fruit.tsx`, `scenes/Minimes.tsx`, `minimes.css` mit Hüpfen, Katalog und Reaktion.
8. `stinger.ts`, `banners.ts`, `render.ts` mit Tests 6 bis 8.
9. Tests 9 und 10 grün, `npm run verify`, alle manuellen Checks.
10. README (Theme-Liste, Fruchtbefehle, Szenen) und THEMES.md (Minime-Typen: `minimeVariants`, `minimeVariantFields`,
    Fallback ohne Typ).

### Out of Scope

- Frucht-Minimes in anderen Themes, Farben für Früchte per Chat.
- Eigene Szenen für weitere Funktionen (z.B. Umfragen, Ziele).
- Tageszeit nach echter Uhrzeit (nur fest je Szene).
