# Plan: Theme "Bärenbande"

Drei Bärenbrüder (Eisbär, Grizzly, Panda) als Cartoon mit klarer Kontur vor einer Aquarell-Welt aus Waldrand, Höhle
und ferner Stadt. In jeder Szene steht ein Bär im Mittelpunkt, den der Streamer je Szene wählt; wo es passt, gibt es
als vierte Wahl den Bärenturm (alle drei übereinander). Die Minimes sind kleine Bären, die Chatter wählen; sie
watscheln und stapeln sich zufällig zu Türmen. Gestaltung: [DESIGN-BEARS.md](DESIGN-BEARS.md).

Testbefehl: `npm test` (einzeln: `node <pfad>.check.ts`), Abschluss jedes Packages: `npm run verify` (dafür
`export PATH="$(cygpath -u "$USERPROFILE")/.cargo/bin:$PATH"`), wo der Server betroffen ist auch `npm run contract`.
Regeln: [CODING-RULES.md](../../../../CODING-RULES.md), Theme-Aufbau: [THEMES.md](../../../../THEMES.md), Übersicht
aller Pläne: [PLAN.md](../../../../PLAN.md).

## Überblick

| # | Package | Ziel in einem Satz | Abhängig von |
|---|---------|--------------------|--------------|
| 1 | Grundlage und Vollbild-Szenen | Das Theme `bears` ist wählbar und zeigt Starting, BRB und Ending mit dem gewählten Bären oder Turm vor der Aquarell-Kulisse, mit eigenem Dashboard-Skin. | PLAN-SCENES 1 |
| 2 | Overlays | Alerts, Chat, Effekte, Kamera, Musik und Befehlsseite zeigen den gewählten Bären (wo vorgesehen auch den Turm) im Bärenbande-Look. | 1 |
| 3 | Stinger und Banner | Stinger, Profil- und Offline-Banner zeigen den gewählten Bären oder Turm und rendern deterministisch. | 1 |
| 4 | Bären-Minimes | Chatter wählen per Befehl einen Eisbären, Grizzly oder Panda, der watschelt und eigene Animationen zeigt. | 1 |
| 5 | Bärentürme der Minimes | Ist von jedem Bären einer da, stapeln sie sich zufällig zum Turm, watscheln als Turm und steigen ab. | 4, PLAN-MINIMES 13 |
| 6 | Rig-Modell der Bären | Jeder Bär ist ein Skelett aus Knochen mit einzeln gezeichneten Teilen; jede Pose sind Gelenkwinkel, sodass nirgends ein Arm doppelt oder ein Teil falsch sitzt. | 5 |
| 7 | Türme aus dem Modell | Jeder Turm (Szenen, Clips, Minimes) stellt die Füsse eines Bären genau auf den Rücken des Bären darunter. | 6 |
| 8 | Szenen-Korrekturen | Alerts, Musik und Kamera zeigen den Bären aus dem Modell richtig und vollständig; die Bären-Einstellungen gehören zu "Allgemein". | 6 |
| 9 | Welt-Modell | Jedes Ding der Kulisse steht auf seinem Boden: Tannen auf der Wiese, die Stadt am Ufer, die Brücke von Ufer zu Ufer. | 1 |
| 10 | Stinger mit Vorhang | Der Bär zieht einen Vorhang über das Bild, der am Übergangspunkt alles verdeckt, und zieht ihn danach wieder auf. | 6 |
| 11 | Modernisierung: Stil-Probe Starting | Die Welt malt sich als Rough-Aquarell ein, der Weg führt zur Brücke, die Brücke ans ferne Ufer, und der Bär aus dem Rig watschelt, landet und winkt mit GSAP. | 9, PLAN-GRAFIK 1, 2, 5 und 8 |
| 12 | Modernisierung: BRB und Ending | BRB und Ending zeigen die Aquarell-Welt zu anderen Tageszeiten, die Bären bewegen ihre Knochen mit GSAP. | 11 (Abnahme) |
| 13 | Modernisierung: Overlays | Der Alert ploppt, der Bär lugt hervor und jubelt, Pfoten und Blätter fliegen; die übrigen Overlays bewegen sich mit GSAP. | 11 |
| 14 | Modernisierung: Stinger und Banner | Stinger und Banner malen die Welt im selben Rough-Aquarell, der Bär watschelt aus dem Rig. | 12, PLAN-GRAFIK 7 |

Parallel möglich: 2, 3 und 4 nach 1 untereinander (verschiedene Dateien bis auf `settings.ts`, `bears.rs` und die
Fixture; wer später kommt, fügt seine Gruppen an). 5 nach 4 und dem Kern-Package. 6 bis 10 (Rückmeldung vom
2026-10-20, der Stil bleibt wie er ist): erst 6, danach 7, 8 und 10; 9 hängt nicht an 6 und kann jederzeit kommen.

## Annahmen

- **Name und ID** (entschieden 2026-10-19): Anzeigename "Bärenbande", id `bears`, Ordner `src/themes/bears/`.
- **Eigene Interpretation:** eigene Formen, Farben, Namen und Texte; keine fremden Namen, Sprüche, Orte oder Logos.
  Die Figuren heissen "Eisbär", "Grizzly" und "Panda" (Bezeichnungen einstellbar).
- **Bär je Szene** (entschieden 2026-10-19): Jede Szene hat eine Auswahl "Bär" mit `eisbaer`, `grizzly`, `panda` und,
  wo sinnvoll, `turm`. Kein Abwechseln. Standards: Starting Grizzly, BRB Eisbär, Ending Panda, alle anderen Grizzly.
  Mit Turm: Starting, BRB, Ending, Alerts, Kamera, Musik, Befehlsseite, Stinger, beide Banner. Ohne Turm: Chat, Effekte.
- **Keine Vererbung** (entschieden 2026-10-19): Das Theme hat nur, was es selbst mitbringt. Bis ein Package eine Szene
  oder einen Clip liefert, ist sie in OBS leer und im Dashboard als nicht verfügbar markiert
  ([plans/PLAN-SCENES.md](../../../../plans/PLAN-SCENES.md) Package 1).
- **Bildsprache:** Figuren und Requisiten mit dicker Kontur, flacher Farbe und genau einem Schattenton; die Welt als
  Aquarell ohne schwarze Kontur (Einzelheiten in DESIGN-BEARS.md).
- **Alles einstellbar** (Gedächtnis): Farben jedes Bären, Kontur, Welt, Texte, Grössen, Zeiten, Häufigkeit und Dauer
  jeder Animation, Bär je Szene, Turm-Verhalten. Fest bleiben nur Formen (SVG-Pfade als Text in `.ts`) und
  Server-Schutzgrenzen, jeweils mit `fixed: <Grund>`.
- **Kern statt Theme:** Minime-Typen, Laufen und Türme kommen aus dem Kern; das Theme liefert Aussehen, Katalog und
  Standards und verweist auf kein anderes Theme. Kein Import aus einem anderen Theme-Ordner.
- **Schema in Rust und TS:** `server-rs/crates/rst-domain/src/themes/bears.rs` und `src/themes/bears/settings.ts`, gleich
  gehalten über `server-rs/crates/rst-domain/tests/fixtures/bears.json`; `src/generated/themes/bears.ts` per
  `npm run gen:types`. Jedes Package ergänzt beide Seiten im selben Commit.
- **Persönliche Startwerte:** `personalize` setzt `channelName` (Login mit grossem Anfangsbuchstaben).
- **Schriften:** neu "Sniglet" (Titel, 800) in `index.html`; "Nunito" (Text) ist schon geladen. Auswahl einstellbar.
- **Töne:** eingebaute Töne in `tones.ts` (weiche Marimba- und Pfeiftöne über Web Audio), Ausnahme in
  `scripts/rules.check.ts` wie bei den anderen `tones.ts`.
- **Commit-Grösse:** Packages 1, 2 und 4 liegen über der Richtgrösse von 400 Zeilen; bewusste Ausnahme, steht in der
  Commit-Beschreibung. Committet wird nur, was der Nutzer freigibt.
- **Bis Package 1 rot:** Solange in `src/themes/bears/` nur `docs/` liegt, ist `src/themes/registry.check.ts` rot (jeder
  Ordner unter `src/themes/` muss registriert sein); Package 1 macht ihn grün (entschieden 2026-10-19: Docs trotzdem
  hier).
- **Checks:** `*.check.ts` mit `node:assert/strict`; Aussehen und Bewegung sind manuelle Checks in der Vorschau
  (`http://localhost:5173/<szene>.html?demo&preview`, Viewport 1600x900).

---

## Package 1: Grundlage und Vollbild-Szenen

**Ziel:** Das Theme `bears` ist wählbar und zeigt Starting, BRB und Ending mit dem gewählten Bären oder Turm vor der
Aquarell-Kulisse, mit eigenem Dashboard-Skin.

**Abhängigkeiten:** [plans/PLAN-SCENES.md](../../../../plans/PLAN-SCENES.md) Package 1 (ohne es würden fehlende Szenen
vom Standard-Theme geerbt, und `renderers.check.ts` verlangt alle drei Clips)

**Betroffene Dateien:**

Neu in `src/themes/bears/`:
- `bears.ts`, `bears.check.ts`: die drei Bären als SVG-Teile je Pose (Pfad-Text, nur Formen), Grössenverhältnis,
  Turm-Aufbau
- `world.ts`, `world.check.ts`: Teile der Kulisse (Tanne, Laubbaum, Hügel, Wolke, Stadtblock, Hängebrücke, Höhle, Weg,
  Grasbüschel, Blume, Holzpfahl) als Pfad-Text
- `Bear.tsx` (ein Bär in einer Pose, Farben über Klassen), `BearTower.tsx` (die drei im Turm), `World.tsx` (Kulisse mit
  Aquarell-Filter, Tageszeit)
- `settings.ts`, `settings.check.ts`, `useBears.ts`, `index.tsx`, `theme.css`, `scenes/Screen.tsx`
- `render.ts` mit `bearsClips = () => []` (Stinger und Banner kommen in Package 3)

Ändern:
- `src/themes/registry.ts`, `src/themes/scenes.tsx`, `scripts/dumpSchema.check.ts` (Liste der ids)
- `server-rs/crates/rst-domain/src/themes/bears.rs` (neu), `themes/mod.rs`, `themes/registry.rs`,
  `server-rs/crates/rst-domain/tests/fixtures/bears.json` (neu), `src/generated/themes/bears.ts` (erzeugt)
- `src/dashboard/skin.ts`, `src/dashboard/skins.css`, `src/dashboard/Scenery.tsx`
- `index.html` (Schrift Sniglet)
- `README.md` (Theme-Liste), `DESIGN.md` (Vermerk "(geplant)" in der Tabelle entfernen)

### Kontext

Ein Theme ist ein Ordner unter `src/themes/<id>/` und zwei Einträge (`THEME_MODULES` in `registry.ts`, `THEME_VIEWS`
in `scenes.tsx`); `registry.check.ts` prüft, dass jeder Ordner in beiden steht, `skin.check.ts` verlangt einen eigenen
Skin, `scripts/rules.check.ts` verbietet Farbliterale, sichtbaren JSX-Text, feste px/ms/s in CSS und Zahlen über 1 in
Szenen. Das Schema entsteht in Rust (`Theme::schema_for`, Fixture-Vergleich `assert_same_as_fixture`) und gleich in
TS. Starting, BRB und Ending nutzen `useStage` und `useScreen` aus `core/screens` (Countdown, Pausenzeit, `?ticker`,
`?next`).

### Gestaltung

- **Kulisse (`World.tsx`):** Himmel je Tageszeit (morgen, mittag, abend, nacht) als Aquarellfläche, Wolken, ferne
  Hügel und Stadtsilhouette mit Hängebrücke in Luftperspektive, Tannenreihe links mit Höhleneingang, Laubbäume, Wiese
  mit Weg in die Tiefe, Grasbüschel und Blumen. Papierstruktur über `feTurbulence`/`feDisplacementMap` (Stärke
  einstellbar, 0 = aus), Skizzenlinien per `color-mix` aus Fläche und Kontur. Jede Schicht abschaltbar.
- **Bären (`Bear.tsx`):** Teile mit den Klassen `part-fur`, `part-shade`, `part-patch`, `part-patch-shade`, `part-line`,
  `part-face`, `part-prop`; Farben je Bär als CSS-Variablen; Arme und Kopf als Gruppen für Winken, Nicken, Blinzeln;
  Atmen als leichte Hebung des Rumpfs; Blickseite einstellbar. Posen in diesem Package: `stand`, `wave`, `cook`
  (Eisbär), `sign` (Grizzly), `phone` und `selfie` (Panda), `four` (alle, für den Turm, Grizzly mit erhobenem Arm).
- **Turm (`BearTower.tsx`):** Eisbär unten, Panda Mitte, Grizzly oben, jeweils `four`; leichtes gemeinsames Wanken;
  Auftritt watschelnd von der Seite.
- **Starting, BRB, Ending (`scenes/Screen.tsx`):** Kulisse, Papierschild am Holzpfahl mit Überzeile, Titel
  (Titelschrift mit Kontur) und Untertitel, Countdown, Pausenzeit oder "Nächster Stream" als Pille, wechselnde Sprüche,
  Fortschritt als Weg mit kleinem laufendem Bären oder als Konturbalken, Ticker als Papierstreifen. Je Szene der
  gewählte Bär in seiner Pose (Starting `wave`, BRB `cook`/`phone`/`sign`, Ending `wave`/`selfie`) oder der Turm.
- **Skin (`data-skin="bears"`):** Tokens wie in DESIGN-BEARS.md, Szenerie mit der Kulisse (Mittag, Standards) und dem
  Turm rechts unten; unter 1100px fällt der Turm weg, unter 720px die Szenerie.

### Einstellungen (Schema `settings.ts`, Gruppen dieses Packages)

| Gruppe | Schlüssel (Auswahl) |
|---|---|
| Allgemein | `channelName` ("Bärenbande"), `font` (Nunito), `titleFont` (Sniglet), `fontSize`, `outline`, `outlineWidth`, `textColor`, `textDark`, `textDim`, `paper`, `paperShade`, `accent`, `accentText`, `accent2`, `radius`, `fadeDuration`, `locale`, `facing` (links, rechts) |
| Bären | je Bär Fell und Schatten (`iceFur`, `iceShade`, `grizzlyFur`, `grizzlyShade`, `pandaFur`, `pandaShade`, `pandaPatch`, `pandaPatchShade`), `bearEye`, `bearNose`, `grizzlyMouth`, `grizzlyTongue`, `phoneCase`, `phoneScreen`, `bearLabelIce`/`bearLabelGrizzly`/`bearLabelPanda` (Bezeichnungen), `blinkEvery`, `breathe` (an/aus), `breatheMs`, `towerSway`, `towerSwayMs` |
| Welt | `timeStarting`/`timeBrb`/`timeEnding`, Himmel je Tageszeit (`skyMorningTop` ... `skyNightBottom`), `cloud`, `cloudCount`, `cloudSpeed`, `meadow`, `meadowDark`, `fir`, `firDark`, `hills`, `city`, `cityWindow`, `bridge`, `road`, `cave`, `caveDark`, `wood`, `flowers`, `paperGrain` (0 bis 1), `sketchLines` (0 bis 1), `showCity`, `showBridge`, `showCave` |
| Starting, BRB, Ending | `bearStarting` (grizzly), `bearBrb` (eisbaer), `bearEnding` (panda), je Szene Überzeile, Titel, Untertitel, Sprüche, Grösse und Position des Bären, `countdown`, `countdownPrefix`, `countdownDone`, `progressStyle` (weg, balken, aus), `afkPrefix`, `endingNextLabel`, `endingNext`, `linesEvery`, `ticker`, `tickerSpeed`, `powerOn` (aquarell, blenden, keins), `powerOnDuration` |

`groupScenes`: Allgemein und Bären für alle Szenen des Themes, Welt für Starting, BRB, Ending (ab Package 2 auch
Befehlsseite), "Starting, BRB, Ending" nur dort.

### Acceptance Criteria

- [ ] AC1: Im Dashboard ist "Bärenbande" wählbar; Starting, BRB und Ending zeigen Kulisse, Schild und den je Szene
  gewählten Bären oder den Turm; alle anderen Szenen und alle Clips sind leer und als nicht verfügbar markiert.
- [ ] AC2: Jeder Schlüssel hat einen gültigen Standardwert und wird im Theme-Code benutzt; jede Gruppe ist genau ihren
  Szenen zugeordnet.
- [ ] AC3: `scripts/rules.check.ts` ist grün: keine Farbliterale, kein sichtbarer JSX-Text, keine festen px/ms/s, keine
  Zahlen über 1 in Szenen, keine Importe aus anderen Themes.
- [ ] AC4: `bears.ts` beschreibt jeden der drei Bären mit allen Posen dieses Packages; jede Pose hat Fell- und
  Konturteile, alle Pfade beginnen mit `M`; Panda hat `part-patch`.
- [ ] AC5: `world.ts` hat jedes Kulissenteil mit mindestens einem Pfad.
- [ ] AC6: Schema in Rust und TS gleich (Fixture), `GET /api/themes` liefert es; `personalize("neo_42")` ergibt
  `{ channelName: "Neo_42" }` und besteht das Schema.
- [ ] AC7: Die Auswahl `bear*` der Vollbild-Szenen bietet genau `eisbaer`, `grizzly`, `panda`, `turm`.
- [ ] AC8: Dashboard im Skin `bears` mit Kulisse und Turm; die Farben in `skins.css` sind die aus DESIGN-BEARS.md mit
  den dort gerechneten Kontrasten (manueller Check gegen die Liste).
- [ ] AC9: README nennt das Theme, in DESIGN.md steht es ohne "(geplant)".

### Tests (TDD)

Reihenfolge: Test schreiben, rot, minimal implementieren, grün, refactoren.

1. `src/themes/bears/bears.check.ts > "every bear has every pose"` (AC4)
   - Gegeben: `BEARS` aus `bears.ts`
   - Erwartet: ids `["eisbaer", "grizzly", "panda"]`; je Bär `stand`, `wave`, `four` plus die eigenen Posen; jede Pose
     mit Teilen `fur` und `line`, Pfade beginnen mit `M`; Panda mit `patch`
2. `src/themes/bears/bears.check.ts > "size order"` (AC4): Höhenfaktor Eisbär > Grizzly > Panda, Panda breiter als
   Eisbär (aus den Werten in `bears.ts`).
3. `src/themes/bears/world.check.ts > "world parts"` (AC5): jedes Teil der Liste hat mindestens einen Pfad mit `M`.
4. `src/themes/bears/settings.check.ts` (AC2, AC7): `auditTheme` ohne Fehler und ohne unbenutzte Schlüssel;
   Pflichtschlüssel je Gruppe; `bearStarting`, `bearBrb`, `bearEnding` mit den vier Werten.
5. Rust: `rst-domain themes::bears::tests::schema_matches_fixture` und `personalize_sets_channel` (AC6).
6. `src/themes/registry.check.ts`, `src/dashboard/skin.check.ts`, `scripts/dumpSchema.check.ts`,
   `src/themes/renderers.check.ts` (vorhanden; nach PLAN-SCENES erlaubt `[]`): `bears` eingetragen.
7. `scripts/rules.check.ts` (vorhanden, AC3).
8. Manuell (AC1, AC8): Vorschau `starting.html?demo&preview`, `brb...`, `ending...` mit jedem Bären und dem Turm, jede
   Tageszeit, Power-on; Dashboard im Skin `bears` bei 1600, 1000 und 700 px Breite.

Testbefehl: `npm test`, Abschluss `npm run verify`

### Umsetzungsschritte

1. Tests 1 bis 3, dann `bears.ts` und `world.ts` (Formen nach den Grundsätzen in DESIGN-BEARS.md).
2. `settings.ts` mit den Gruppen dieses Packages, `personalize`; `useBears.ts`; Test 4 (rot, bis die Szenen die
   Schlüssel benutzen).
3. `bears.rs`, `mod.rs`, Rust-Registry, Fixture, `npm run gen:types`; Test 5.
4. Eintragen in `registry.ts` (Clips `[]`), `scenes.tsx`, `dumpSchema.check.ts`; `index.tsx` mit `starting`, `brb`,
   `ending`; Schrift in `index.html`.
5. `Bear.tsx`, `BearTower.tsx`, `World.tsx`, `scenes/Screen.tsx`, `theme.css`; Vorschau nach jedem Teil.
6. Skin: `skin.ts`, Block in `skins.css`, `Scenery.tsx`.
7. README, Vermerk in DESIGN.md; `npm run verify`, manuelle Checks.

### Out of Scope

- Alle übrigen Szenen (Package 2), Stinger und Banner (Package 3), Minimes (Packages 4 und 5).

---

## Package 2: Overlays

**Ziel:** Alerts, Chat, Effekte, Kamera, Musik und Befehlsseite zeigen den gewählten Bären (wo vorgesehen auch den
Turm) im Bärenbande-Look.

**Abhängigkeiten:** Package 1

**Betroffene Dateien:**
- Neu: `src/themes/bears/scenes/Alerts.tsx`, `Chat.tsx`, `Fx.tsx`, `Cam.tsx`, `Music.tsx`, `Info.tsx`,
  `src/themes/bears/tones.ts`, `src/themes/bears/icons.ts` und `icons.check.ts` (Symbole der Alert-Arten: Pfote,
  Herz, Stern, Fisch, Honigtopf, Handy, Kochmütze, Blatt)
- Ändern: `bears.ts` und `bears.check.ts` (Posen `cheer`, `thumbs`, `point`, `peek`, `headphones`, `holdSign`),
  `settings.ts`, `settings.check.ts`, `index.tsx`, `theme.css`, `bears.rs`, Fixture, `src/generated/themes/bears.ts`,
  `scripts/rules.check.ts` (Ausnahme `tones.ts`)

### Kontext

Die Szenen nutzen nur die Kern-Bausteine aus THEMES.md: `useAlerts`, `describeAlert`, `alertQuote`, `useAlertSounds`
(Alerts), `useChat`, `<MessageParts>`, `badgeLabel` (Chat), `useFxScene`, `useFxItem`, `<FxMedia>` (Effekte),
`useNowPlaying`, `useTrackProgress`, `useCover`, `<Marquee>` (Musik), `useCommands`, `describeCommands` und
`INFO_FIELDS` (Befehlsseite).

### Gestaltung

- **Alerts** (Bär oder Turm): Papierkarte mit Kontur und Symbol der Art, der Bär lugt seitlich hervor und reagiert
  (Grizzly `cheer`, Panda `cheer` mit Handy, Eisbär `thumbs`); der Turm wankt neben der Karte. Je Art Kopfzeile, Zeile,
  Symbol, Ton. Konfetti aus Pfotenabdrücken und Blättern (an/aus, Anzahl). Ein- und Ausblenden: hereinwatscheln,
  plopp, gleiten, blenden, keins. Restzeit als schrumpfender Konturbalken.
- **Chat** (nur Bär): Stil `handy` (der Bär hält ein grosses Handy, Nachrichten als Sprechblasen auf dem Schirm),
  `zettel` (Papierzettel an einer Schnur) oder `blasen` (Sprechblasen ohne Bär). Name in Twitch- oder Akzentfarbe,
  Badges als kleine Symbole mit Text.
- **Effekte** (nur Bär): Der Bär hält ein Schild (`holdSign`) oder eine Sprechblase mit dem Text; Medien wie überall.
- **Kamera** (Bär oder Turm): Rahmen `papier`, `holz` oder `polaroid` mit Kontur; der Bär lehnt an einer Ecke oder
  schaut über den Rand (`peek`), der Turm steht seitlich. Namensschild (`{channel}`) und Live-Pille.
- **Musik** (Bär oder Turm): Stil `kopfhoerer` (der Bär mit Kopfhörern wippt im Takt neben einem Papierrahmen mit
  Cover), `kofferradio` oder `schlicht`. Titel, Interpret, Album an/aus, Fortschritt als Konturbalken, Equalizer.
- **Befehlsseite** (Bär oder Turm): Kulisse fest dahinter, Papierkarten je Abschnitt, der Bär oder Turm im Kopf.

### Einstellungen (neue Gruppen)

| Gruppe | Schlüssel (Auswahl) |
|---|---|
| Alerts | `bearAlerts` (grizzly, mit turm), `alertIn`/`alertOut`, `alertDuration`, `alertScale`, `alertWidth`, `alertTimer`, je Art Kopfzeile, Zeile, Symbol, Ton (`alertSoundFields`), `confetti`, `confettiCount`, `quoteFormat`, `alertQuote` |
| Chat | `bearChat` (grizzly, ohne turm), `chatStyle` (handy, zettel, blasen), `chatNameColor`, Badge-Texte (`badgeFields`), `chatFontSize`, `emoteSize`, `chatFade`, `chatMax`, `chatAlign`, `chatIn`/`chatOut` |
| Effekte | `bearFx` (grizzly, ohne turm), `fxStyle` (schild, blase), `fxDuration`, `fxSize`, `fxIn`/`fxOut`, `fxMargin` |
| Kamera-Rahmen | `bearCam` (grizzly, mit turm), `camStyle` (papier, holz, polaroid), `camBearSpot` (links, rechts, oben), `camLabel` ("{channel}"), `camLive`, `camLiveText`, `camFrameWidth`, `camRadius` |
| Musik | `bearMusic` (grizzly, mit turm), `musicStyle` (kopfhoerer, kofferradio, schlicht), Kopfzeilen, `musicIdleTitle`, `musicIdleArtist`, `musicAlbum`, `musicProgress`, `equalizer`, `equalizerBars`, `coverSize`, `musicHide`, `musicMarquee`, `bopStrength` |
| Befehlsseite | `INFO_FIELDS`, `bearInfo` (grizzly, mit turm), `infoTime` |

### Acceptance Criteria

- [ ] AC1: Alle sechs Szenen sind im Theme vorhanden und zeigen den gewählten Bären; Alerts, Kamera, Musik und
  Befehlsseite bieten zusätzlich `turm`, Chat und Effekte nicht (prüfbar im Schema).
- [ ] AC2: Jeder neue Schlüssel hat einen gültigen Standard, wird benutzt und ist nur seinen Szenen zugeordnet.
- [ ] AC3: `rules.check.ts` grün; Töne nur in `tones.ts`.
- [ ] AC4: `icons.ts` hat jedes Symbol der Alert-Arten; jede neue Pose in `bears.ts` hat Fell- und Konturteile.
- [ ] AC5: Schema in Rust und TS gleich (Fixture).
- [ ] AC6: Die Vorschau jeder Szene mit `?demo` zeigt die Stile und Bären ohne Konsolenfehler (manuell).

### Tests (TDD)

1. `bears.check.ts > "overlay poses"` (AC4): `cheer`, `thumbs`, `point`, `peek`, `headphones`, `holdSign` je Bär.
2. `icons.check.ts > "alert icons"` (AC4): jedes Symbol mit Pfad.
3. `settings.check.ts` (AC1, AC2): neue Pflichtschlüssel; `bearChat` und `bearFx` ohne `turm`, die anderen mit.
4. Rust: Fixture-Vergleich (AC5).
5. `scripts/rules.check.ts` (AC3).
6. Manuell (AC6): `alerts.html?demo&preview` (alle Arten, alle Ein- und Ausblendungen), `chat`, `fx` (Trigger aus dem
   Dashboard), `cam`, `music` (Wiedergabe und Pause), `/s/<login>/` als Befehlsseite.

Testbefehl: `npm test`, Abschluss `npm run verify`

### Umsetzungsschritte

1. Tests 1 und 2, dann Posen und Symbole.
2. Gruppen in `settings.ts` und `bears.rs`, Fixture, `gen:types`; Tests 3 und 4.
3. Szenen nacheinander mit CSS und Vorschau: Alerts (mit `tones.ts`), Chat, Effekte, Kamera, Musik, Befehlsseite.
4. `npm run verify`, manuelle Checks.

### Out of Scope

- Stinger und Banner (Package 3), Minimes (Packages 4 und 5).

---

## Package 3: Stinger und Banner

**Ziel:** Stinger, Profil- und Offline-Banner zeigen den gewählten Bären oder Turm und rendern deterministisch.

**Abhängigkeiten:** Package 1

**Betroffene Dateien:** neu `src/themes/bears/stinger.ts`, `stinger.check.ts`, `banners.ts`, `banners.check.ts`,
`render.check.ts`; ändern `render.ts` (drei Clips statt `[]`), `settings.ts`, `settings.check.ts`, `bears.rs`, Fixture,
`src/generated/themes/bears.ts`.

### Kontext

Clips sind reine Funktionen der Zeit auf einem Canvas (`RenderClip` mit Gruppe, Länge, Bildrate, Übergangspunkt beim
Stinger, Schleife bei Bannern); Zufall nur über `hash` aus `src/core/hash.ts`. Die Formen aus `bears.ts` und
`world.ts` werden als `Path2D` gezeichnet, Farben aus den Werten.

### Gestaltung

- **Stinger:** Der gewählte Bär (oder der Turm) watschelt von links ins Bild, wächst, bis sein Fell am Übergangspunkt
  das ganze Bild deckt, zeigt Text in Titelschrift mit Kontur und watschelt rechts hinaus; davor und danach transparent.
- **Profilbanner (1200x480):** Wiese mit Waldrand, Stadt und Brücke, Kanalname auf einem Papierschild, der gewählte
  Bär oder Turm davor; Wolken und Atmen in nahtloser Schleife.
- **Offline-Banner (1920x1080):** Abend vor der Höhle, Lichterkette, der gewählte Bär schläft (der Turm schläft
  übereinander), Titel, Text und Zeilen auf einer Papierkarte.

### Einstellungen (neue Gruppen)

| Gruppe | Schlüssel (Auswahl) |
|---|---|
| Stinger | `stingerBear` (grizzly, mit turm), `stingerDuration`, `stingerCut`, `stingerText` ("{channel}"), `stingerWaddle` (Stärke) |
| Banner | `bannerProfileBear`, `bannerOfflineBear` (je mit turm), `bannerProfileText`, `bannerOfflineTitle`, `bannerOfflineText`, `bannerOfflineLines`, `bannerLoop`, `bannerProfileFps`, `bannerOfflineFps`, `fairyLights` |

### Acceptance Criteria

- [ ] AC1: Der Stinger ist bei t = 0 und t = Dauer leer, deckt am Übergangspunkt das ganze Bild und zeichnet bei
  gleichem t immer gleich (kein `Math.random`).
- [ ] AC2: Beide Banner zeichnen Titel und Text, Bild 0 gleicht dem Bild am Schleifenende.
- [ ] AC3: `render.ts` liefert `stinger`, `profile`, `offline` mit Gruppen, Länge, Übergangspunkt und Schleife aus den
  Einstellungen; jeder Bär und der Turm sind wählbar.
- [ ] AC4: Schema in Rust und TS gleich (Fixture).

### Tests (TDD)

1. `stinger.check.ts` (AC1): aufzeichnender Canvas-Mock; t = 0 und t = Dauer ohne Füllung, am Übergangspunkt eine
   Fläche über das ganze Bild; zweimal t = 0.37 gleiche Aufrufe; je Wert von `stingerBear`.
2. `banners.check.ts` (AC2): Titel und Text in den Aufrufen; Aufrufe bei t = 0 und t = Schleifenlänge gleich.
3. `render.check.ts` (AC3): drei Clips mit Gruppen und Werten.
4. `src/themes/renderers.check.ts` (vorhanden): `bears` liefert jetzt alle drei Clips.
5. Rust: Fixture-Vergleich (AC4). Manuell: Rendern im Dashboard, Clip ansehen.

Testbefehl: `npm test`, Abschluss `npm run verify`

### Out of Scope

- Weitere Clip-Arten.

---

## Package 4: Bären-Minimes

**Ziel:** Chatter wählen per Befehl einen Eisbären, Grizzly oder Panda, der watschelt und eigene Animationen zeigt.

**Abhängigkeiten:** Package 1

**Betroffene Dateien:** neu `src/themes/bears/scenes/Minimes.tsx`, `src/themes/bears/minimes.css`,
`src/themes/bears/minimeBears.ts` und `minimeBears.check.ts` (Typen: id, Bezeichnung, Chat-Namen); ändern
`bears.ts`/`bears.check.ts` (kleine Minime-Posen), `settings.ts`, `settings.check.ts`, `index.tsx`, `bears.rs`,
Fixture, `src/generated/themes/bears.ts`, README (Befehle).

### Kontext

Typen statt Farben über den Kern (THEMES.md, "Typen statt Farben"): `minimeVariants` im Schema,
`...MINIME_BASE_FIELDS` und `...minimeVariantFields(set)`, Szene mit `useMinimes({ catalog, reaction, widthPx })`,
`shownVariant` für die Anzeige, in `?demo` Typ per `hash(seedOf(login))`. Kein Hüpfen (`MINIME_HOP_FIELDS` nicht
eingebunden), keine Gefechte.

### Gestaltung

- **Typen:** `eisbaer` (Eisbär; Chat-Namen `eisbaer, eisbär, eis, polar, ice`), `grizzly` (Grizzly; `grizzly, braunbaer,
  braunbär, brown`), `panda` (Panda; `panda`). Befehl `!baer` (Bezeichnung "Bär"), einstellbar wie jeder Kern-Befehl.
- **Figur:** kleiner Bär in Dreiviertelansicht mit Kontur und einem Schattenton, Bodenschatten, Name auf einem
  Papierschild darüber (an/aus, Grösse). Laufen als Watscheln (Kippen im Schritt, Stärke und Takt einstellbar).
- **Animationen (Katalog):** `selfie` (Handy hoch, kurzer Blitz), `snack` (isst etwas), `wave` (winkt), `dance`
  (tanzt), `look` (schaut um sich), `sleep` (schläft, aufsteigendes Zeichen); Reaktion auf Chat: `wave`. Je Animation
  Häufigkeit (0 = nie) und Dauer.
- **Erscheinen:** watschelt von der Seite herein oder plopp; **Verschwinden:** watschelt hinaus oder plopp.

### Einstellungen (neue Gruppen)

| Gruppe | Schlüssel (Auswahl) |
|---|---|
| Minimes: Befehle, Regeln, Bewegung | aus `MINIME_BASE_FIELDS` (Kern) |
| Minimes: Typen | `minimeVariantCommand` ("!baer"), `minimeNames_eisbaer`, `minimeNames_grizzly`, `minimeNames_panda` |
| Minimes: Aussehen | `minimeBearSize`, `minimeGround`, `minimeShadow`, `minimeOutlineWidth`, `minimeDefault` (Typ ohne Wahl), `minimeNames` (an/aus), `minimeNameSize`, `waddleAngle`, `waddleMs`, `minimeEnter`, `minimeExit` |
| Minimes: Animationen | je Animation Häufigkeit und Dauer (`selfieWeight`, `selfieMs`, ... für selfie, snack, wave, dance, look, sleep), `sleepText`, `waveReactMs` |

### Acceptance Criteria

- [ ] AC1: `!baer panda` macht einen Panda, `!join` einen zufälligen erlaubten Bären, eine leere Namensliste schaltet
  den Bären aus (Kern-Verhalten; im Theme geprüft wird, dass `minimeVariants` und die Felder stimmen).
- [ ] AC2: Chat-Namen sind über alle drei Bären eindeutig (nach `normalizeName`).
- [ ] AC3: Die Szene zeigt jeden Typ; alle sechs Animationen und die Reaktion kommen mit `?demo` innerhalb von zwei
  Minuten vor (manuell).
- [ ] AC4: Kein Katalog-Name kollidiert mit Kern-Aktionen (`COMBAT_ACTIONS`, später `STACK_ACTIONS`).
- [ ] AC5: Schema in Rust und TS gleich (Fixture); `minimeRules` mit gewähltem Theme liefert drei Typen.

### Tests (TDD)

1. `minimeBears.check.ts > "three bear types"` (AC1, AC2): ids, Bezeichnungen, eindeutige Namen.
2. `bears.check.ts > "minime poses"`: kleine Posen je Typ für Stehen, Gehen und die sechs Animationen.
3. `settings.check.ts` (AC1, AC4): `hasMinimes`, `minimeNames_<id>` je Typ, kein Katalog-Name aus den Kern-Aktionen.
4. `src/themes/registry.check.ts` (vorhanden) und Rust-Fixture (AC5).
5. Manuell (AC3): `minimes.html?demo=9&preview` zwei Minuten beobachten; mit echtem Chat `!join`, `!baer panda`.

Testbefehl: `npm test`, Abschluss `npm run verify` und `npm run contract`

### Out of Scope

- Türme (Package 5). Hüpfen, Gefechte, Fraktionen.

---

## Package 5: Bärentürme der Minimes

**Ziel:** Ist von jedem Bären einer da, stapeln sie sich zufällig zum Turm, watscheln als Turm und steigen ab.

**Abhängigkeiten:** Package 4, [plans/PLAN-MINIMES.md](../../../../plans/PLAN-MINIMES.md) Package 13 (Logik der Türme),
[RUST-PLAN.md](../../../../RUST-PLAN.md) Package 50 (Felder)

**Betroffene Dateien:** `src/themes/bears/settings.ts` (Turm-Felder einbinden, Standards), `settings.check.ts`,
`scenes/Minimes.tsx`, `minimes.css`, `bears.ts`/`bears.check.ts` (Minime-Posen `four`, `climb`), `bears.rs`, Fixture,
`src/generated/themes/bears.ts`, README.

### Kontext

Der Kern plant Türme zufällig ohne Chatbefehl, nur wenn je Stufe ein freies Minime des eingestellten Typs da ist, und
setzt die Aktionen `gather`, `brace`, `climb`, `stacked`, `stackWalk`, `dismount` sowie `stack.level` am Minime. Das
Theme bindet die Turm-Felder mit eigenen Standards ein und zeigt die Schritte.

### Gestaltung

- **Standards:** Türme an, Stufe 1 `eisbaer`, Stufe 2 `panda`, Stufe 3 `grizzly`; alle Werte im Dashboard änderbar
  (Abstand, gleichzeitige Türme, Tempo, Dauer je Schritt, Turm läuft, Ton).
- **Aussehen:** `gather` mit Watscheln, `brace` (der unterste Bär geht auf alle viere), `climb` (Kletter-Pose, Stufe
  für Stufe), `stacked` (alle `four`, der oberste reisst einen Arm hoch, gemeinsames Wanken), `stackWalk` (gemeinsames
  Watscheln), `dismount` (springt seitlich ab, plopp). Stufenhöhe je Typ als Einstellung (`--stack-level` mal Höhe).
  Namensschilder rücken im Turm zur Seite, damit sie sich nicht überdecken.

### Einstellungen (neue Gruppen)

| Gruppe | Schlüssel (Auswahl) |
|---|---|
| Minimes: Türme | aus `minimeStackFields(set, defaults)` (Kern, RUST-PLAN 50) |
| Minimes: Aussehen (Ergänzung) | `stackStepIce`, `stackStepPanda`, `stackStepGrizzly` (Höhe einer Stufe je Typ), `stackSway`, `stackNameOffset` |

### Acceptance Criteria

- [ ] AC1: Mit den Standards stapeln sich in `?demo` mit allen drei Typen zufällig Türme in der Reihenfolge
  Eisbär, Panda, Grizzly (manuell; die Logik prüft der Kern).
- [ ] AC2: Fehlt ein Typ, entsteht kein Turm (Kern-Verhalten, manuell mit leerem `minimeNames_panda`).
- [ ] AC3: Jede Turm-Aktion hat eine Darstellung in `minimes.css`, keine Klasse fehlt (Check gegen `STACK_ACTIONS`).
- [ ] AC4: Schema in Rust und TS gleich (Fixture); die Standards der Stufen sind die drei Bären.

### Tests (TDD)

1. `settings.check.ts > "stack defaults"` (AC4): Stufen-Standards `eisbaer`, `panda`, `grizzly`, Türme an.
2. `bears.check.ts > "every stack action has a style"` (AC3): jede Aktion aus `STACK_ACTIONS` kommt als
   `action-<name>` in `minimes.css` vor.
3. Rust-Fixture (AC4).
4. Manuell (AC1, AC2): `minimes.html?demo=6&preview` fünf Minuten beobachten; Panda-Namen leeren und erneut prüfen.

Testbefehl: `npm test`, Abschluss `npm run verify`

### Out of Scope

- Türme in anderen Themes, Türme per Chatbefehl.

---

## Package 6: Rig-Modell der Bären

**Ziel:** Jeder Bär ist ein Skelett aus Knochen mit einzeln gezeichneten Teilen; jede Pose sind Gelenkwinkel, sodass
nirgends ein Arm doppelt oder ein Teil falsch sitzt.

**Abhängigkeiten:** Package 5

**Betroffene Dateien:** neu `src/themes/bears/rig.ts` (Skelett, Teile, Posen, Anker) und `rig.check.ts`; ändern
`bears.ts` (wird zur Datenquelle der Teilformen, `POSE_MODELS` und `PROPS` gehen in `rig.ts` auf), `Bear.tsx`,
`BearTower.tsx`, `paint.ts`, `paint.check.ts`, `bears.check.ts`, `minimeBears.ts`, `theme.css` (Gruppen je Knochen),
`docs/DESIGN-BEARS.md`.

### Kontext

Heute ist jede Pose ein Satz fertiger Pfade. Die Silhouette des stehenden Körpers enthält den hängenden Arm schon als
Ausbuchtung; ein gehobener Arm kommt als zweites Teil dazu. Darum hat der winkende Grizzly einen dritten Arm, und die
Daumen-Pose der Alerts zeigt eine Hand, die zu keinem Arm gehört. Requisiten (Kopfhörer, Handy) liegen mit festen
Koordinaten auf dem Bild statt an einem Körperteil. Turm, Minimes, Stinger und Banner rechnen mit festen Versätzen.

### Gestaltung

- **Skelett (2D):** Wurzel an der Hüfte; Rumpf, Kopf (mit Ohren und Gesicht), je Seite Oberarm, Unterarm und Pfote, je
  Seite Bein mit Fuss, Schwanz. Jeder Knochen hat Länge, Drehpunkt und Ruhewinkel. Zwei Haltungen: aufrecht und auf
  allen vieren (Rumpf waagrecht, die Arme werden zu Vorderbeinen). Ein 3D-Modell ist nicht nötig: der Stil ist flach
  mit einer Kontur und einem Schattenton, eine Drehung um die Hochachse zeigt sich nur als Spiegeln.
- **Teile:** Jedes Teil ist eine eigene geschlossene Form in den Koordinaten seines Knochens, mit Fell, Schattenton,
  Panda-Schwarz (je Teil beschnitten) und eigener Kontur. Der Rumpf hat keine Arme mehr in seiner Silhouette.
  Reihenfolge nach Tiefe: ferne Seite hinter dem Rumpf, nahe Seite davor.
- **Pose:** Gelenkwinkel je Knochen, Gesichtsausdruck (offen, zu, Mund offen beim lauten Bären) und Requisiten an
  Ankerpunkten der Knochen (Pfote, Kopf). Fehlende Winkel sind Ruhewinkel. Alle heutigen Posen (stand, wave, selfie,
  cook, sign, phone, cheer, snack, thumbs, headphones, sleep, four, fourWave) werden als Winkel nachgebaut, dazu `climb`
  und ein Gehzyklus (zwei Schrittstellungen) für Watscheln, Stinger und Minimes.
- **Requisiten am Knochen:** Handy, Pfanne, Schild und Snack an der Pfote; der Kopfhörer am Kopf als richtiges Headset
  (Bügel über den Kopf, zwei Muscheln auf Höhe der Ohren, die Ohren darunter verdeckt).
- **Ein Renderer:** `rigParts(bear, pose)` liefert die fertigen Teile mit Transformation (rein). `Bear.tsx` zeichnet sie
  als SVG-Gruppen je Knochen (CSS kann Winkel über Variablen animieren, z.B. Winken als Drehung des Oberarms),
  `paint.ts` dieselbe Liste auf dem Canvas. So sehen Szenen, Clips und Minimes gleich aus.
- **Anker:** je Pose die Bodenpunkte der Füsse, die Oberkante des Rückens (für Türme), die Pfoten, der Scheitel und der
  Umriss (für Platz und Zuschnitt in Szenen).
- **Stil bleibt:** Farben, Konturstärke, Schattenton, Panda-Flecken und Proportionen der drei Bären bleiben wie heute
  (Vergleich mit Bildschirmfotos der Szenen vor dem Umbau).

### Einstellungen

Keine neuen; Formen und Knochen sind fest (`fixed: Formen des Modells`).

### Acceptance Criteria

- [ ] AC1: Jede Pose hat genau zwei Vorderglieder (Arme oder Vorderbeine) und zwei Hinterbeine; kein Teil kommt doppelt
  vor, die Rumpf-Silhouette enthält keinen Arm.
- [ ] AC2: Jede Requisite hängt an einem Knochen-Anker und bewegt sich mit ihm (z.B. das Handy folgt der Pfote).
- [ ] AC3: SVG (`Bear.tsx`) und Canvas (`paint.ts`) zeichnen dieselben Teile in derselben Reihenfolge.
- [ ] AC4: Die Anker jeder Pose liegen im Umriss der Pose; die Füsse stehen auf der Bodenlinie.
- [ ] AC5: Alle Szenen, Clips und Minimes nutzen nur noch das Modell (kein fester Pfad einer ganzen Pose mehr).
- [ ] AC6: Stil wie vorher (manuell: Starting, Alerts, Musik, Kamera, Minimes, Banner im Vergleich).

### Tests (TDD)

1. `rig.check.ts > "every pose has two front and two hind limbs, no arm in the torso"` (AC1)
2. `rig.check.ts > "props follow their bone"`: Winkel der Pfote ändern, die Requisite verschiebt sich gleich (AC2)
3. `paint.check.ts > "canvas draws the parts of rigParts in order"` (AC3)
4. `rig.check.ts > "anchors inside the outline, feet on the ground"` (AC4)
5. `bears.check.ts`: keine Pfade ganzer Posen mehr ausserhalb von `rig.ts` (AC5)
6. Manuell (AC6): Vorschau aller Szenen mit `?demo&preview`, Viewport 1600x900

Testbefehl: `npm test`, Abschluss `npm run verify`

### Out of Scope

- Neue Bären oder ein anderer Stil. Skelett-Animation per Physik.

---

## Package 7: Türme aus dem Modell

**Ziel:** Jeder Turm (Szenen, Clips, Minimes) stellt die Füsse eines Bären genau auf den Rücken des Bären darunter.

**Abhängigkeiten:** Package 6

**Betroffene Dateien:** `rig.ts` (`towerLayout`), `BearTower.tsx`, `paint.ts`, `scenes/Minimes.tsx`, `minimeBears.ts`,
`minimes.css`, `settings.ts`, `settings.check.ts`, `bears.rs`, Fixture, `src/generated/themes/bears.ts`.

### Kontext

Heute verschiebt `TOWER_STEP` jede Stufe um einen festen Wert, und die Minimes heben jede Stufe um eingestellte
Prozente. Weil Panda und Grizzly kleiner sind und anders skaliert werden, steht der Panda teils vor statt auf dem
Eisbären.

### Gestaltung

- `towerLayout(levels)` stellt Stufe für Stufe die Fussanker des oberen Bären (in seiner Grösse) auf den Rückenanker
  des unteren, mittig über dem Rücken; gezeichnet wird von unten nach oben.
- Dieselbe Funktion für den grossen Turm (Szenen, Stinger, Banner) und den Minime-Turm (Hub je Stufe in px aus dem
  Modell mal Minime-Grösse). Die Einstellungen `stackStepIce`, `stackStepPanda` und `stackStepGrizzly` entfallen; dafür
  `stackFit` (Feinkorrektur in px, Standard 0), damit es einstellbar bleibt.
- Klettern im Minime-Turm: der Kletternde steigt im Gehzyklus auf den Rücken (Hub über die Dauer), nicht als Sprung.

### Einstellungen

| Gruppe | Schlüssel |
|---|---|
| Minimes: Aussehen | entfallen `stackStepIce`, `stackStepPanda`, `stackStepGrizzly`; neu `stackFit` |

### Acceptance Criteria

- [ ] AC1: In jedem Turm berühren die Füsse jeder Stufe den Rücken der Stufe darunter (Abstand höchstens 1 Einheit) und
  stehen innerhalb seiner Breite.
- [ ] AC2: Grosser Turm und Minime-Turm nutzen `towerLayout`.
- [ ] AC3: Schema in Rust und TS gleich (Fixture); alte Werte der entfallenen Schlüssel stören nicht.

### Tests (TDD)

1. `rig.check.ts > "tower levels stand on the back below"` (AC1) für alle Reihenfolgen der drei Bären
2. `minimeBears.check.ts > "minime lift from the model"` (AC2)
3. `settings.check.ts` und Rust-Fixture (AC3)
4. Manuell: Starting mit Turm, `minimes.html?demo=6&preview`

Testbefehl: `npm test`, Abschluss `npm run verify`

### Out of Scope

- Andere Turm-Reihenfolgen als die eingestellten.

---

## Package 8: Szenen-Korrekturen

**Ziel:** Alerts, Musik und Kamera zeigen den Bären aus dem Modell richtig und vollständig; die Bären-Einstellungen
gehören zu "Allgemein".

**Abhängigkeiten:** Package 6

**Betroffene Dateien:** `scenes/Alerts.tsx`, `scenes/Music.tsx`, `scenes/Cam.tsx`, `theme.css`, `settings.ts`,
`settings.check.ts`, `bears.rs`, Fixture, `src/generated/themes/bears.ts`, `docs/DESIGN-BEARS.md`.

### Kontext

Die Alerts zeigen eine einzelne Hand ohne Arm (Daumen-Pose), der Musik-Bär trägt statt eines Headsets nur zwei Punkte,
im Kamera-Rahmen ragen Bär und Namensschild aus der Quelle (negativer Versatz, Schild halb unter dem Rand). Die Gruppe
"Bären" (Fellfarben, Augen, Blinzeln, Atmen, Turm) erscheint in jeder Szene als eigener Reiter.

### Gestaltung

- **Alerts:** Daumen hoch und Jubeln als Posen des Modells (Pfote am Arm, Daumen an der Pfote).
- **Musik:** Headset aus Package 6 (Bügel, Muscheln über den Ohren), Kopfnicken als Drehung des Kopfknochens.
- **Kamera:** Platz aus dem Umriss der Pose: der Bär lehnt innen am Rahmen und bleibt ganz in der Quelle, das
  Namensschild sitzt innerhalb des unteren Rahmens; beim Spähen über den Rand wird nur der Teil unter der Kante verdeckt.
- **Einstellungen:** Die Felder der Gruppe "Bären" wandern nach "Allgemein" (Schlüssel bleiben, gespeicherte Werte
  gelten weiter); die Gruppe "Bären" entfällt in TS, Rust und `groupScenes`.

### Acceptance Criteria

- [ ] AC1: Keine Pose der Alerts zeigt eine Pfote ohne Arm (folgt aus Package 6, hier sichtbar geprüft).
- [ ] AC2: Der Musik-Bär trägt ein Headset mit Bügel und zwei Muscheln über den Ohren.
- [ ] AC3: Im Kamera-Rahmen sind Bär und Namensschild in jeder Ecke und jedem Stil ganz sichtbar (Quelle 1280x720 und
  1920x1080).
- [ ] AC4: Es gibt keine Gruppe "Bären" mehr; ihre Felder stehen in "Allgemein".

### Tests (TDD)

1. `settings.check.ts > "bear fields are general"` (AC4), Rust-Fixture
2. `rig.check.ts > "headset sits on the head"`: die Muscheln überdecken die Ohranker (AC2)
3. Manuell (AC1, AC3): `alerts.html?demo&preview`, `music.html?demo&preview`, `cam.html?preview` in beiden Grössen

Testbefehl: `npm test`, Abschluss `npm run verify`

### Out of Scope

- Neue Kamera-Stile.

---

## Package 9: Welt-Modell

**Ziel:** Jedes Ding der Kulisse steht auf seinem Boden: Tannen auf der Wiese, die Stadt am Ufer, die Brücke von Ufer zu
Ufer.

**Abhängigkeiten:** Package 1

**Betroffene Dateien:** `world.ts`, `world.check.ts`, `World.tsx`, `paint.ts` (Welt im Canvas), `theme.css`,
`docs/DESIGN-BEARS.md`.

### Kontext

Die Tannen stehen auf einer festen Linie (`FIR_BASE`), die nicht zur Wiese passt, und schweben dadurch. Die Brücke
beginnt am rechten Bildrand und endet links im Nichts. Die Stadt steht unter der Wasserkante.

### Gestaltung

- **Ebenen mit Boden:** fern (Himmel, Hügel), Ufer gegenüber (Stadt auf einer Uferlinie über dem Wasser), Wasser (eine
  Bucht zwischen den Ufern), nahes Ufer mit Waldrand und Höhlenhügel, Wiese vorn. Jede Ebene hat eine Bodenlinie als
  Funktion `ground(x)`; jedes Ding (Tanne, Laubbaum, Stadtblock, Brückenpfeiler) wird mit dem Fuss auf seine Linie
  gestellt statt auf eine feste Höhe.
- **Brücke:** spannt von einem Widerlager am nahen Ufer zu einem am fernen Ufer; die Pylone stehen im Wasser auf
  Sockeln, die Fahrbahn endet an beiden Enden auf Land.
- **Stadt:** steht auf dem fernen Ufer, ihre Unterkante liegt über der Wasserlinie; Spiegelung im Wasser als blasser
  Streifen (Aquarell wie bisher, ohne schwarze Kontur).
- Stil wie bisher: Aquarell, Skizzenlinien im dunkleren Ton derselben Farbe, Luftperspektive.

### Einstellungen

Keine neuen (die Farben bestehen schon).

### Acceptance Criteria

- [ ] AC1: Jede Tanne und jeder Baum steht mit dem Fuss auf der Bodenlinie seiner Ebene (Abstand höchstens 2 px).
- [ ] AC2: Beide Enden der Brücke liegen auf Land; kein Stück der Fahrbahn endet über Wasser oder im Leeren.
- [ ] AC3: Jeder Stadtblock steht auf dem fernen Ufer über der Wasserlinie.
- [ ] AC4: SVG-Kulisse und Canvas-Kulisse (Banner) nutzen dieselbe Anordnung.

### Tests (TDD)

1. `world.check.ts > "things stand on their ground"` (AC1)
2. `world.check.ts > "bridge ends on land"` (AC2)
3. `world.check.ts > "city above the water"` (AC3)
4. `paint.check.ts > "world layout shared"` (AC4)
5. Manuell: Starting, BRB und Ending zu jeder Tageszeit

Testbefehl: `npm test`, Abschluss `npm run verify`

### Out of Scope

- Bewegte Teile der Welt ausser den Wolken.

---

## Package 10: Stinger mit Vorhang

**Ziel:** Der Bär zieht einen Vorhang über das Bild, der am Übergangspunkt alles verdeckt, und zieht ihn danach wieder
auf.

**Abhängigkeiten:** Package 6 (Gehzyklus, Pfote als Anker)

**Betroffene Dateien:** `stinger.ts`, `stinger.check.ts`, `paint.ts` (Vorhang), `render.ts`, `settings.ts`,
`settings.check.ts`, `bears.rs`, Fixture, `src/generated/themes/bears.ts`, `docs/DESIGN-BEARS.md`.

### Kontext

Heute läuft der Bär starr herein, wird gross, wieder klein und läuft hinaus. Das wirkt leblos.

### Gestaltung

- **Ablauf:** Der gewählte Bär (beim Turm zieht der Grizzly oben, der Turm watschelt mit) kommt im Gehzyklus von der
  Seite und zieht mit der Pfote die Kante eines Vorhangs hinter sich her über das Bild. Am Übergangspunkt ist das Bild
  ganz bedeckt, der Text steht auf dem Vorhang. Danach zieht der Bär den Vorhang zur anderen Seite wieder auf (oder der
  Vorhang hebt sich, einstellbar), die neue Szene erscheint.
- **Vorhang im Stil:** flache Stofffarbe mit Falten im einen Schattenton, Kontur an der Kante, Saum unten, wahlweise
  Pfotenabdrücke als Muster; die Falten schwingen beim Ziehen leicht nach.
- **Lebendig:** Gehzyklus mit Beinen und Armen aus dem Modell, der Kopf dreht sich kurz zur Kamera, ein Blinzeln am
  Übergangspunkt.
- Rein in der Zeit, Bild für Bild renderbar wie bisher.

### Einstellungen (Gruppe "Stinger")

| Schlüssel | Bedeutung |
|---|---|
| `stingerCurtain`, `stingerCurtainShade` | Stofffarbe und Faltenton |
| `stingerCurtainPattern` | Pfotenabdrücke an/aus |
| `stingerFrom` | Seite, von der der Bär kommt (`links`, `rechts`) |
| `stingerOpen` | Öffnen: zur anderen Seite ziehen (`ziehen`) oder hochziehen (`heben`) |
| `stingerFolds` | Zahl der Falten |
| bisher `stingerWaddle` | Watscheln beim Gehen |

Die bisherigen Werte für das Grosswerden des Bären entfallen.

### Acceptance Criteria

- [ ] AC1: Am Übergangspunkt (`stingerCut`) ist jedes Pixel des Bildes vom Vorhang bedeckt.
- [ ] AC2: Vor dem Start und nach dem Ende ist das Bild leer (transparent).
- [ ] AC3: Die Vorhangkante folgt der Pfote des Bären (gleiche Position in jedem Bild).
- [ ] AC4: Gleiche Zeit ergibt dasselbe Bild (deterministisch).
- [ ] AC5: Schema in Rust und TS gleich (Fixture).

### Tests (TDD)

1. `stinger.check.ts > "curtain covers the frame at the cut"` (AC1)
2. `stinger.check.ts > "empty before and after"` (AC2)
3. `stinger.check.ts > "curtain edge follows the paw"` (AC3)
4. `stinger.check.ts > "same time, same frame"` (AC4)
5. Rust-Fixture (AC5); manuell: Clip im Browser rendern und ansehen

Testbefehl: `npm test`, Abschluss `npm run verify`

### Out of Scope

- Ton zum Stinger.

---

# Modernisierung (Packages 11 bis 14)

Entschieden 2026-10-21: Die zwei Ebenen bleiben (Figuren mit klarer Kontur, Welt als Aquarell). Neu: die Welt wird mit
Rough.js als Aquarell gemalt (auch in Stinger und Banner, wo es heute keine Filter gibt), die Bären bewegen ihre
Knochen aus dem Rig mit GSAP statt CSS-Keyframes. Gestaltung: [DESIGN-BEARS.md](DESIGN-BEARS.md), Abschnitt
"Modernisierung". Kern-Bausteine: [plans/PLAN-GRAFIK.md](../../../../plans/PLAN-GRAFIK.md) (`roughPath`,
`useTimeline`, `chance`, `burstAt`, `qualityField`, Stinger-Optionen).

## Annahmen der Modernisierung

- **Referenz** (abgenommen 2026-10-21): [refs/starting.html](refs/starting.html), [refs/alert.html](refs/alert.html)
  und die Standbilder daneben. Die Bären darin sind die echten Figuren aus `Bear.tsx` (aus der laufenden Seite
  übernommen); jedes Package mit sichtbarer Arbeit endet mit Renders daneben und dem OK des Nutzers.
- **Figuren:** immer aus dem Rig (`rig.ts`, `Bear.tsx`, `paint.ts`); nie eine vereinfachte Zeichnung (Feedback zur
  Stil-Probe). GSAP dreht die Knochengruppen (`bone-<name>`) um ihre Drehpunkte aus dem Rig (`svgOrigin`).
- **Rough.js** (entschieden 2026-10-21): nur für die Welt (Flächen als mehrere weiche Lasuren mit unruhigem Rand,
  Skizzenlinie im Ton der Fläche, Papierkörnung); die Figuren behalten ihre gleichmässige Kontur.
- **Welt-Modell:** jedes Ding steht auf seinem Boden (Package 9). Neu dazu: der Weg führt bis zum Anfang der Brücke,
  die Brücke führt über das Wasser und landet am fernen Ufer, auf dem die Stadt steht (Feedback zur Stil-Probe).
- **Alter Look:** SVG-Filter der Welt (`feTurbulence`) werden ersetzt, kein Schalter. **Alles einstellbar**, **Schema in
  Rust und TS** (`bears.rs`, Fixture, Typen je Package), **Fallstricke** in [THEMES.md](../../../../THEMES.md),
  **Commit** je Package nach grünem `npm run verify`. **Minimes** und Türme bleiben unverändert.
- **Vorbild:** wird wie bisher nirgends genannt.

---

## Package 11: Modernisierung: Stil-Probe Starting

**Ziel:** Die Welt malt sich als Rough-Aquarell ein, der Weg führt zur Brücke, die Brücke ans ferne Ufer, und der Bär
aus dem Rig watschelt, landet und winkt mit GSAP.

**Abhängigkeiten:** Package 9, PLAN-GRAFIK Packages 1, 2, 5 und 8

**Betroffene Dateien:**
- Neu in `src/themes/bears/`: `watercolor.ts`, `watercolor.check.ts` (eine Fläche als Lasuren: versetzte
  Rough-Polygone mit festem Startwert, Deckkraft je Lasur, Skizzenlinie als Mischung aus Fläche und `outline`),
  `boneMotion.ts`, `boneMotion.check.ts` (Abläufe als Gelenkwinkel über die Zeit: watscheln, landen mit Stauchen,
  winken, Kopf wiegen, blinzeln, atmen; Drehpunkte aus dem Rig), `WorldCanvas.tsx` (malt die Welt aus `world.ts` mit
  `watercolor.ts` auf ein Canvas, Einmalen von links nach rechts als Maske)
- Ändern: `world.ts`, `world.check.ts` (Weg endet am Brückenanfang auf der Wiese; Brücke mit Pylonen über dem Wasser
  landet am fernen Ufer; fernes Ufer als eigene Fläche unter der Stadt), `Bear.tsx` (Knochen per `useTimeline` statt
  CSS-Keyframes, Drehpunkte bleiben), `scenes/Screen.tsx` (Starting mit `WorldCanvas`; BRB und Ending bis Package 12
  alt), `World.tsx` (entfällt am Ende von Package 12), `settings.ts`, `theme.css`,
  `server-rs/crates/rst-domain/src/themes/bears.rs`, Fixture, Typen

### Gestaltung

- **Welt:** Himmel, Wolken, ferne Hügel in Luftperspektive, fernes Ufer mit Stadt, Wasser der Bucht, rote Hängebrücke
  vom Weg über das Wasser zum Ufer, Wiese in zwei Tönen, Höhlenhügel mit Eingang, Tannen, Grasbüschel, Papierkörnung;
  sie malt sich in 2,2 s von links nach rechts ein.
- **Bär:** watschelt ab 0,9 s von links herein (Schaukeln und Wippen), landet mit Stauchen und Nachfedern, winkt in
  Schleife, wiegt den Kopf, blinzelt, atmet.
- **Karten:** ploppen mit Stauchen und Strecken herein, Titelbuchstaben springen; der kleine Bär läuft den Weg als
  Fortschritt (`motionPath`, Schaukeln je Schritt).

### Einstellungen (neue Schlüssel)

| Gruppe | Schlüssel (Standard) |
|---|---|
| Welt | `quality` (`qualityField`), `worldSeed` (3), `washLayers` (4), `washAlpha` (0.3), `washRoughness` (2.4), `sketchMix` (35 %), `paperGrain` (18), `paintInOn` (an), `paintInMs` (2200 ms) |
| Bewegung | `waddleIn` (an), `waddleAngle` (6 Grad), `landSquash` (10 %), `waveSpeed` (Faktor 1), `headSway` (4 Grad), `blinkEvery` (2.6 s), `breathAmount` (1.2 %) |

### Acceptance Criteria

- [ ] AC1: `world.ts`: das obere Ende des Weges liegt am Anfang der Brücke; das Ende der Brücke liegt auf dem fernen
      Ufer; jeder Pylon steht auf einem Sockel im Wasser; jedes Stadthaus steht auf dem Ufer.
- [ ] AC2: `wash(points, seed)` ist für gleichen Startwert gleich; die Lasuren bleiben innerhalb eines Randes von 2 %
      um die Fläche.
- [ ] AC3: Jeder Ablauf in `boneMotion.ts` beginnt und endet in der Ruhepose (ausser "landen", das in der Ruhepose
      endet); die Winkel bleiben in den Grenzen des Rigs.
- [ ] AC4: `auditTheme` ohne Befund; `scripts/rules.check.ts`, `scripts/bundle.ts` grün; kein Name des Vorbilds im Diff.
- [ ] AC5 (manuell): `starting.html?demo&preview&t=6` neben [refs/starting.png](refs/starting.png); Abnahme.

### Tests (TDD)

1. `world.check.ts > "Weg, Brücke und Ufer"` (AC1) 2. `watercolor.check.ts > "Lasuren"` (AC2) 3. `boneMotion.check.ts >
"Ruhepose"` (AC3) 4. `settings.check.ts`, `cargo test` (AC4)

### Umsetzungsschritte

1. Tests, rot; Module, grün. 2. Einstellungen TS und Rust. 3. `WorldCanvas.tsx`, `Bear.tsx`, `Screen.tsx`.
4. `npm run verify`, Vorschau, Abnahme.

### Out of Scope

- BRB und Ending (12), Overlays (13), Clips (14), Minimes, Türme.

---

## Package 12: Modernisierung: BRB und Ending

**Ziel:** BRB und Ending zeigen die Aquarell-Welt zu anderen Tageszeiten, die Bären bewegen ihre Knochen mit GSAP.

**Abhängigkeiten:** Package 11 (Abnahme)

**Betroffene Dateien:** `boneMotion.ts` (kochen, aufs Handy schauen, Schild halten, Selfie, Abschied winken),
`watercolor.ts` (Tageszeiten als Mischung), `scenes/Screen.tsx`, `World.tsx` (entfällt), `settings.ts`, `bears.rs`,
Fixture, Typen

### Gestaltung

- **BRB:** Nachmittag; der Eisbär kocht (Pfanne schwenkt), der Panda schaut aufs Handy (Kopf nickt), der Grizzly hält
  ein Schild (Arme wippen).
- **Ending:** Abend; der Bär winkt zum Abschied, der Panda macht ein Selfie (Blitz), der Turm watschelt einmal ins Bild.

### Acceptance Criteria

- [ ] AC1: Jeder neue Ablauf beginnt und endet in seiner Ruhepose; Requisiten bleiben an der Pfote.
- [ ] AC2: Die Welt zeigt je Szene die Tageszeit aus den Einstellungen (Mischung der Flächenfarben).
- [ ] AC3 (manuell): BRB und Ending; Abnahme.

### Tests (TDD)

1. `boneMotion.check.ts > "neue Abläufe"` (AC1) 2. `watercolor.check.ts > "Tageszeit"` (AC2) 3. `settings.check.ts`,
`cargo test`

### Umsetzungsschritte

1. Tests, rot; Module, grün. 2. Einstellungen. 3. Szene, `World.tsx` entfernen. 4. `npm run verify`, Vorschau, Abnahme.

### Out of Scope

- Overlays (13), Clips (14).

---

## Package 13: Modernisierung: Overlays

**Ziel:** Der Alert ploppt, der Bär lugt hervor und jubelt, Pfoten und Blätter fliegen; die übrigen Overlays bewegen
sich mit GSAP.

**Abhängigkeiten:** Package 11

**Betroffene Dateien:** `boneMotion.ts` (jubeln, lugen), `confetti.ts`, `confetti.check.ts` (Pfotenabdrücke und
Blätter mit Wurfbahn aus `burstAt`), `scenes/Alerts.tsx`, `scenes/Chat.tsx`, `scenes/Cam.tsx`, `scenes/Music.tsx`,
`scenes/Fx.tsx`, `scenes/Info.tsx`, `settings.ts`, `bears.rs`, Fixture, Typen, `theme.css`

### Gestaltung

- **Alert** (wie [refs/alert.html](refs/alert.html)): die Papierkarte ploppt (Stauchen, Strecken, Nachfedern), der Bär
  lugt mit Federn hinter der Karte hervor und jubelt (Arme in Pose "cheer", wippen), das Herz pocht, der Name springt,
  Pfoten und Blätter fliegen; Restzeit als Konturbalken; Abgang: der Bär duckt sich weg, die Karte hüpft und
  verschwindet. Reaktion je Bär wie heute (Grizzly jubelt, Panda erschrickt froh, Eisbär nickt mit Daumen hoch).
- **Chat, Kamera, Musik, Effekte, Befehlsseite:** ploppen statt einblenden; der Bär der Musik wippt im Takt über die
  Knochen.

### Acceptance Criteria

- [ ] AC1: `confettiAt(seed, i, t)` ist deterministisch und verschwindet nach der Lebensdauer.
- [ ] AC2: Jede Alert-Art zeigt ihre Texte wie bisher; jeder Bär hat seine Reaktion.
- [ ] AC3 (manuell): neben [refs/alert.png](refs/alert.png); Abnahme.

### Tests (TDD)

1. `confetti.check.ts > "Wurf aus der Zeit"` (AC1) 2. bestehende Alert-Checks, `cargo test` (AC2)

### Umsetzungsschritte

1. Tests, rot; Module, grün. 2. Einstellungen. 3. Szenen. 4. `npm run verify`, Vorschau, Abnahme.

### Out of Scope

- Clips (14).

---

## Package 14: Modernisierung: Stinger und Banner

**Ziel:** Stinger und Banner malen die Welt im selben Rough-Aquarell, der Bär watschelt aus dem Rig.

**Abhängigkeiten:** Package 12, PLAN-GRAFIK Package 7

**Betroffene Dateien:** `paint.ts` (Welt über `watercolor.ts` mit `rough.canvas`, Bär mit Posen aus `boneMotion.ts`),
`paint.check.ts`, `stinger.ts`, `stinger.check.ts`, `banners.ts`, `banners.check.ts`, `render.ts`, `render.check.ts`

### Gestaltung

- **Stinger:** der Vorhang aus Package 10 bleibt; neu watschelt der Bär mit den Abläufen aus `boneMotion.ts`, der
  Vorhang schwingt mit Nachfedern (Kurve aus den Stinger-Optionen).
- **Banner:** Welt im Rough-Aquarell, Bär oder Turm davor.

### Acceptance Criteria

- [ ] AC1: Am Übergangspunkt deckt der Vorhang das Bild; die Welt ist für gleichen Startwert in jedem Bild gleich.
- [ ] AC2: Stinger-Optionen aus dem Kern; gleiche Einstellungen, gleiche Bilder.
- [ ] AC3 (manuell): WebM und GIF; Abnahme.

### Tests (TDD)

1. `stinger.check.ts > "gedeckt am Übergang"` (AC1) 2. `render.check.ts > "Clips"` (AC2)

### Umsetzungsschritte

1. Tests, rot; `paint.ts`, `stinger.ts`, `banners.ts`, grün. 2. `npm run verify`, rendern, Abnahme.

### Out of Scope

- Ton im Stinger.
