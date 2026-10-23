# Plan: Theme "Chaos"

Neon-Graffiti in der Nacht: eine fast schwarze Wand voller Kritzeleien, grosse Pinselstriche und gesprühte Titel in
Magenta und Cyan, Energie-Schwaden bei Alerts und im Stinger. Keine Figuren, nur Stil; die Minimes sind kleine
Kritzel-Monster in der Farbe des Chatters. Gestaltung: [DESIGN-CHAOS.md](DESIGN-CHAOS.md).

Testbefehl: `npm test` (einzeln: `node <pfad>.check.ts`), Abschluss jedes Packages: `npm run verify`, wo der Server
betroffen ist auch `npm run contract`. Regeln: [CODING-RULES.md](../../../../CODING-RULES.md), Theme-Aufbau:
[THEMES.md](../../../../THEMES.md), Übersicht aller Pläne: [PLAN.md](../../../../PLAN.md).

## Überblick

| # | Package | Ziel in einem Satz | Abhängig von |
|---|---------|--------------------|--------------|
| 1 | Stil-Probe: Starting | Das Theme `chaos` ist wählbar und zeigt die Starting-Szene mit Wand, Kritzeleien, Pinselstrich und Sprühschrift so, dass der Nutzer den Stil abnimmt. | - |
| 2 | Vollbild-Szenen und Skin | BRB und Ending stehen, der Dashboard-Skin hat seine Szenerie, und das Theme ist in README und DESIGN.md eingetragen. | 1 (Abnahme) |
| 3 | Overlays | Alerts, Chat, Kamera, Musik, Effekte und Befehlsseite zeigen den Chaos-Look. | 2 |
| 4 | Stinger und Banner | Stinger, Profil- und Offline-Banner rendern deterministisch mit Schwaden, Wand und Sprühschrift. | 2 |
| 5 | Kritzel-Monster als Minimes | Chatter klinken sich als hüpfende Kritzel-Monster in ihrer Farbe ein, mit eigenen Animationen. | 2 |
| 6 | Modernisierung: Stil-Probe Starting | Starting malt Pinselstriche mit Sprühnebel und echtem Glow in PixiJS, Rough-Kritzeleien zeichnen sich selbst, der Titel wird aufgesprüht, danach bewegt sich alles weiter (abschaltbar). | 1 bis 5, PLAN-GRAFIK 1, 2, 5 und 8 |
| 7 | Modernisierung: BRB und Ending | BRB und Ending nutzen dieselbe Wand, dieselben Abläufe und dieselbe Bewegung nach dem Aufbau. | 6 (Abnahme) |
| 8 | Modernisierung: Overlays | Der Alert ist nur noch der Zettel in der Mitte mit Sprühstoss und Kritzel-Konfetti; die übrigen Overlays bewegen sich mit GSAP. | 6 |
| 9 | Modernisierung: Stinger und Banner | Stinger und Banner zeigen die neuen Striche, Rough-Kritzeleien und Sprühnebel als reine Funktion der Zeit. | 7, PLAN-GRAFIK 7 |

Parallel möglich: 3, 4 und 5 nach 2 untereinander (verschiedene Dateien bis auf `settings.ts`, `chaos.rs` und die
Fixture; wer später kommt, hängt seine Gruppen an). Package 1 endet mit einer Abnahme durch den Nutzer; ohne sie
beginnt kein weiteres Package.

## Annahmen

- **Name und id** (entschieden 2026-10-20): Anzeigename "Chaos", id `chaos`, Ordner `src/themes/chaos/`, Klassen
  `ch-*`, Keyframes `chaos-*`.
- **Stil statt Figur** (entschieden 2026-10-20): keine Person, kein Gesicht, keine Schriftzüge aus den Referenzen. Die
  Vorlage der Referenzbilder wird nirgends genannt (Dokumente, Code, Kommentare, Commits, Oberfläche).
- **Referenzbilder** (entschieden 2026-10-20): nur lokal unter `.claude/refs/chaos/ref-1.webp` bis `ref-4.webp`
  (git-ignoriert, nie committen). Der Detailgrad der Referenzen ist Pflicht (Dichte, Strichstärken, Borsten, Spray,
  Körnung, Glow; Liste in DESIGN-CHAOS.md). Jede sichtbare Arbeit wird neben ihnen gerendert und erst nach dem OK des
  Nutzers weitergebaut.
- **Farben** (entschieden 2026-10-20): Signatur Magenta `#d123a0` (Text in `#ff5ccb`), zweiter Akzent Cyan `#09d0fe`,
  Violett für Flächen und Schatten, Werte und Kontraste in DESIGN-CHAOS.md.
- **Schriften** (entschieden 2026-10-20): "Permanent Marker" (Titel, neu in `index.html`), "Space Grotesk" (Text,
  schon geladen). Beide in der Auswahl austauschbar.
- **Technik:** alle Formen als Pfad-Text in `.ts`-Modulen (prüfbar, nur Formen, keine Farben). Unruhige Linien,
  Körnung, Glow und Sprührand über SVG-Filter in den Szenen; auf dem Canvas (Stinger, Banner) dieselben Pfade mit
  `Path2D`, Glow über `shadowBlur`, Körnung als deterministisches Punktmuster aus `hash` (`src/core/hash.ts`).
- **Zufall:** jede Verteilung (Kritzeleien, Laufnasen, Schwaden) kommt aus `hash` mit einem Startwert je Szene, nie aus
  `Math.random`; dieselben Einstellungen ergeben dasselbe Bild.
- **Alles einstellbar** (CODING-RULES 19, 20): Farben, Schriften, Grössen, Texte, Dichte und Farben der Kritzeleien,
  Art und Farbe der grossen Geste je Szene, Stärke von Körnung, Zittern, Glow, Flackern und Glitch, Dauern und
  Häufigkeiten, An/Aus je Szenenteil. Fest bleiben nur Formen und Server-Schutzgrenzen, jeweils mit `fixed: <Grund>`.
- **Schema in Rust und TS:** `server-rs/crates/rst-domain/src/themes/chaos.rs` und `src/themes/chaos/settings.ts`, gleich
  gehalten über `server-rs/crates/rst-domain/tests/fixtures/chaos.json` (`node scripts/dumpSchema.ts`),
  `src/generated/themes/chaos.ts` per `npm run gen:types`. Jedes Package ergänzt beide Seiten im selben Commit.
- **Einfache Ansicht:** jedes Package markiert seine wichtigsten Felder als einfach (`markBasic` mit einer Liste
  `BASIC` in `settings.ts`, `mark_basic` in Rust), wie im Kern-Plan [plans/PLAN-SETTINGS.md](../../../../plans/PLAN-SETTINGS.md).
- **Persönliche Startwerte:** `personalize` setzt `channelName` (Login in Grossbuchstaben).
- **Töne:** eingebaute Töne in `tones.ts` (Spray-Zischen als gefiltertes Rauschen, kurze Synth-Blips über Web Audio),
  in `WITHOUT_CHECK` von `scripts/rules.check.ts` wie die anderen `tones.ts`.
- **Texte:** deutsch, frecher Ton ("Gleich geht's los ... vielleicht"), alle als Einstellung.
- **Docs vor Code** (entschieden 2026-10-20): Solange in `src/themes/chaos/` nur `docs/` liegt, ist
  `src/themes/registry.check.ts` rot und damit `npm run verify`; Package 1 macht es grün.
- **Commit-Grösse:** Packages 1 bis 3 liegen voraussichtlich über der Richtgrösse von 400 Zeilen; bewusste Ausnahme,
  steht in der Commit-Beschreibung. Commit je Package, nur nach Freigabe durch den Nutzer.
- **Manuelle Checks:** Vorschau `http://localhost:5173/<szene>.html?demo&preview`, Viewport 1600x900. Nach jedem
  Package mit sichtbarer Arbeit Bilder zeigen und auf das OK warten.

---

## Package 1: Stil-Probe: Starting

**Ziel:** Das Theme `chaos` ist wählbar und zeigt die Starting-Szene mit Wand, Kritzeleien, Pinselstrich und
Sprühschrift so, dass der Nutzer den Stil abnimmt.

**Abhängigkeiten:** keine

**Betroffene Dateien:**

Neu in `src/themes/chaos/`:
- `chance.ts`, `paths.ts`, `wall.ts` mit Checks: Zufall aus `hash`, Pfad-Bausteine, Flecken und Sprühstaub der Wand
- `scribbles.ts`, `scribbles.check.ts`: Katalog der 20 Kritzeleien (Stern, X, Pfeil, Blitz, Zickzack, Spirale, Herz,
  Sonne, Monster, Totenkopf, Krakel, Strichbündel, ...) als Linien in einer Einheitsbox um 0, und
  `layoutScribbles(seed, count, free, white)`: Position, Drehung, Grösse, Strichart, Farbplatz aus `hash`
- `strokes.ts`, `strokes.check.ts`: Pinselstrich mit Borsten, Auslauf, Spritzern und Laufnasen (`brushStroke`),
  Kompositionen je Szene (`gestureLayout`), Laufnasen und Sprühpunkte eines Titels (`titleDrips`, `speckles`)
- `Backdrop.tsx` (Wand, Kritzeleien, Neon, Pinselstriche, Dunst, Körnung), `SprayTitle.tsx` (Titel mit Glow, Glitch,
  Sprühpunkten und Laufnasen), `Progress.tsx` (Zickzack oder Balken)
- `settings.ts`, `settings.check.ts`, `useChaos.ts`, `index.tsx` (nur `starting`), `theme.css`, `scenes/Screen.tsx`
- `render.ts` mit `chaosClips = () => []` (Clips kommen in Package 4)

Ändern:
- `src/themes/registry.ts` (`THEME_MODULES`), `src/themes/scenes.tsx` (`THEME_VIEWS`)
- `scripts/dumpSchema.check.ts` (Liste der ids)
- `server-rs/crates/rst-domain/src/themes/chaos.rs` (neu), `themes/mod.rs`, `themes/registry.rs` (`THEMES`),
  `server-rs/crates/rst-domain/tests/fixtures/chaos.json` (neu), `src/generated/themes/chaos.ts` (erzeugt),
  `src/themes/generatedValues.check.ts` (Werte aus Rust gleich den TS-Werten)
- `src/dashboard/skin.ts` (`SKINS`), `src/dashboard/skins.css` (Block `[data-skin="chaos"]`, Tokens aus
  DESIGN-CHAOS.md, noch ohne Szenerie)
- `index.html` (Schrift Permanent Marker)

### Kontext

Ein Theme ist ein Ordner und zwei Einträge (`THEME_MODULES`, `THEME_VIEWS`); `registry.check.ts` prüft, dass jeder
Ordner in beiden steht, `skin.check.ts` verlangt einen eigenen Skin, `renderers.check.ts` erlaubt eine Teilmenge der
Clips (auch keine), `scripts/rules.check.ts` verbietet Farbliterale, sichtbaren JSX-Text, feste px/ms/s in CSS und
Zahlen über 1 in Szenen. Starting nutzt `useStage` und `useScreen` aus `src/core/screens` (Countdown, `?ticker`,
`?next`). Fehlende Szenen bleiben leer ([plans/PLAN-SCENES.md](../../../../plans/PLAN-SCENES.md)).

### Gestaltung

- **Wand:** radialer Verlauf `ground` zu `wall`, Körnung (`grain`, 0 bis 1).
- **Kritzeleien:** `scribbleCount` Zeichen, dichter am Rand, Mitte frei (freie Fläche in Anteilen der Bühne), Farben
  aus `scribbleColor1` bis `scribbleColor4`, Zittern `jitter` (0 bis 1), Strichstärke `scribbleWidth`. Beim Einschalten
  zeichnen sie sich nacheinander (`drawMs`, `drawGapMs`).
- **Grosse Geste:** `gestureStarting` (zweix, x, strich, keine; Standard zweix = Cyan-X links, Magenta-X rechts, zwei lose
  Striche, ungleich in Grösse, Winkel und Kreuzung, aus `gestureLayout(kind, seed)` in `strokes.ts`), Farbe für x und
  strich `gestureColorStarting` (cyan, magenta), dunkler Dunst hinter dem Text `haze` (0 bis 1), Laufnasen
  `drips` (an/aus).
- **Titel:** Überzeile, Titel als Sprühschrift mit `glow` (0 bis 1) und Laufnasen, Untertitel, Countdown in Cyan,
  wechselnde Sprüche, Fortschritt als Zickzack oder Markerbalken, Ticker als Klebeband-Streifen.
- **Bewegung:** Flackern `flicker` (0 bis 1), Glitch alle `glitchEvery` Sekunden mit Stärke `glitch` (0 = aus).
- **Einschalten:** `powerOn` (spray, blende, keins), Dauer `powerOnDuration`.

### Einstellungen (Gruppen dieses Packages)

| Gruppe | Schlüssel (Auswahl, Standard) |
|---|---|
| Allgemein | `channelName` ("CHAOS"), `font` (Space Grotesk), `titleFont` (Permanent Marker), `fontSize`, `ground` (`#120910`), `wall` (`#22182f`), `accent` (`#d123a0`), `accentText` (`#ff5ccb`), `accent2` (`#09d0fe`), `onAccent2` (`#120910`), `violet` (`#502a5f`), `violetLight` (`#986ea9`), `lilac` (`#d39dd4`), `textColor` (`#ffffff`), `mutedColor` (`#b8a6c4`), `grain` (0.55), `jitter` (0.5), `glow` (0.6), `flicker` (0.2), `glitch` (0.3), `glitchEvery` (9 s) |
| Kritzeleien | `scribbleCount` (340), `scribbleWidth` (Faktor 1), `scribbleColor1` bis `scribbleColor4` (Magenta, Cyan, Violett hell, Flieder), `scribbleWhite` (an), `drawMs` (700 ms), `drawGapMs` (8 ms), `drips` (an) |
| Starting, BRB, Ending | `gestureStarting` (zweix), `gestureColorStarting` (cyan), `haze` (0.78), `startingEyebrow`, `startingTitle` ("Gleich geht's los"), `startingSubtitle`, `startingLines`, `countdown`, `countdownPrefix`, `countdownDone`, `progressStyle` (zickzack, balken, aus), `linesEvery`, `ticker`, `tickerSpeed`, `powerOn` (spray), `powerOnDuration` |

### Acceptance Criteria

- [ ] AC1: `chaos` steht in `THEME_MODULES`, `THEME_VIEWS`, `SKINS` und in Rust `THEMES`; `registry.check.ts`,
      `skin.check.ts` und `dumpSchema.check.ts` sind grün.
- [ ] AC2: Das Rust-Schema gleicht dem TS-Schema (Fixture-Test in `chaos.rs`), `personalize("neo")` ergibt
      `{ channelName: "NEO" }`.
- [ ] AC3: Jede Kritzelei des Katalogs besteht aus Linien in der Einheitsbox um 0 (-0.5 bis 0.5, mit Zittern bis 0.6),
      ohne Füllung; es gibt 20 verschiedene Arten.
- [ ] AC4: `layoutScribbles` ist deterministisch (gleicher Startwert, gleiches Ergebnis), liefert genau `count` Zeichen
      und legt kein Zeichen in die freie Fläche.
- [ ] AC5: `brushStroke` liefert einen geschlossenen, ausgefransten Körper im Band des Strichs, Borsten, Spritzer und
      Laufnasen darunter; `gestureLayout` liefert je Komposition die Striche (zwei X: sechs Striche, nie gleich breit),
      je Szene leicht versetzt; `titleDrips` und `speckles` bleiben in der Box des Titels.
- [ ] AC6: `auditTheme` findet keinen ungenutzten Schlüssel, die Standardwerte bestehen das Schema.
- [ ] AC7 (manuell): `starting.html?demo&preview` zeigt Wand, Kritzeleien, Pinselstrich und Sprühschrift; das Bild
      liegt neben `.claude/refs/chaos/ref-1.webp` bis `ref-4.webp`, erreicht deren Detailgrad (jeder Punkt der Liste
      in DESIGN-CHAOS.md sichtbar) und der Nutzer nimmt den Stil ab.

### Tests (TDD)

Reihenfolge: Test schreiben, rot, minimal implementieren, grün, refactoren.

1. `src/themes/chaos/scribbles.check.ts > "Katalog"` (AC3)
   - Gegeben: alle Arten aus `SCRIBBLES`
   - Erwartet: jeder Pfad beginnt mit `M`, endet ohne `Z`, alle Koordinaten zwischen 0 und 1, Arten eindeutig
2. `scribbles.check.ts > "Verteilung"` (AC4)
   - Gegeben: `layoutScribbles(7, 200, { x: 0.25, y: 0.25, width: 0.5, height: 0.5 })` zweimal
   - Erwartet: gleiche Liste, Länge 200, kein Mittelpunkt innerhalb der freien Fläche
3. `src/themes/chaos/strokes.check.ts > "Pinselstrich"` (AC5)
   - Gegeben: `brushStroke([100, 500], [900, 500], 200, chance(4))`
   - Erwartet: geschlossener Körper im Band 400 bis 600, mindestens 100 Borsten hell und dunkel, Laufnasen nach unten
4. `strokes.check.ts > "Kompositionen und Spray"` (AC5)
   - Gegeben: `gestureLayout("zweix", 1)`, `gestureLayout("zweix", 2)`, `titleDrips(3, 9)`, `speckles(3, 800, 150, 900)`
   - Erwartet: sechs Striche in Cyan und Magenta mit verschiedenen Breiten, Startwert 2 leicht versetzt, Laufnasen und
     Sprühpunkte in der Box des Titels
5. `src/themes/chaos/settings.check.ts > "Schema"` (AC6): `auditTheme(chaosSettings)` ohne Befund
6. `cargo test` in `chaos.rs > same_as_typescript` und `personalize_sets_channel_name` (AC2)

### Umsetzungsschritte

1. Tests 1 bis 4 schreiben, rot; `chance.ts`, `paths.ts`, `scribbles.ts`, `strokes.ts` und `wall.ts` umsetzen (je mit
   Check), grün.
2. `settings.ts` mit den Gruppen oben, `chaos.rs` gleich, Fixture schreiben, Typen erzeugen; Tests 5 und 6.
3. Registrieren (TS und Rust), `skin.ts` und `skins.css`, `index.html`.
4. `Backdrop.tsx` (Wand, Kritzeleien, Neon, Pinselstriche, Dunst, Körnung als eigene SVG-Ebenen), `SprayTitle.tsx`
   (Titel mit Glow, Glitch, Sprühpunkten und Laufnasen), `Progress.tsx`, `scenes/Screen.tsx` (nur Starting eingetragen),
   `theme.css`.
5. `npm run verify`, Vorschau rendern, neben die Referenzbilder legen, dem Nutzer zeigen, Abnahme abwarten (AC7).

### Out of Scope

- BRB, Ending und die Szenerie des Skins (Package 2); Overlays (3); Clips (4); Minimes (5).

---

## Package 2: Vollbild-Szenen und Skin

**Ziel:** BRB und Ending stehen, der Dashboard-Skin hat seine Szenerie, und das Theme ist in README und DESIGN.md
eingetragen.

**Abhängigkeiten:** Package 1 (mit Abnahme des Stils)

**Betroffene Dateien:**
- `src/themes/chaos/index.tsx`, `scenes/Screen.tsx`, `settings.ts`, `theme.css` (ändern)
- `server-rs/crates/rst-domain/src/themes/chaos.rs`, Fixture, erzeugte Typen (ändern)
- `src/dashboard/Scenery.tsx`, `src/dashboard/skins.css` (Szenerie)
- `README.md` (Theme-Liste), `DESIGN.md` ("(geplant)" entfernen)

### Gestaltung

- BRB: Magenta-X hinter der Mitte, Pausenzeit als Marker-Zahl, Sprüche; Ending: Cyan-X, "Nächster Stream" als
  Klebeband.
- Szenerie: Kritzeleien an den Rändern, Cyan-Pinselstrich unten links, Magenta-X oben rechts; unter 1100px nur die
  Kritzeleien, unter 720px keine Szenerie.

### Einstellungen

| Gruppe | Schlüssel (Auswahl, Standard) |
|---|---|
| Starting, BRB, Ending | `gestureBrb` (zweix), `gestureColorBrb` (magenta), `gestureEnding` (zweix), `gestureColorEnding` (cyan), je Szene Überzeile, Titel, Untertitel, Sprüche, `afkPrefix`, `endingNextLabel`, `endingNext` |

### Acceptance Criteria

- [ ] AC1: `index.tsx` trägt `starting`, `brb`, `ending` ein; jede Szene liest ihre Geste und Farbe aus den eigenen
      Feldern (Schema-Check ohne Befund).
- [ ] AC2: Rust und TS bleiben gleich (Fixture-Test).
- [ ] AC3 (manuell): BRB und Ending in der Vorschau, Szenerie im Dashboard bei 1600, 1000 und 700 px Breite.

### Tests (TDD)

1. `settings.check.ts > "Schema"` (AC1) erweitert um die neuen Felder.
2. `cargo test` `chaos.rs > same_as_typescript` (AC2).

### Out of Scope

- Overlays, Clips, Minimes.

---

## Package 3: Overlays

**Ziel:** Alerts, Chat, Kamera, Musik, Effekte und Befehlsseite zeigen den Chaos-Look.

**Abhängigkeiten:** Package 2

**Betroffene Dateien:**
- Neu: `src/themes/chaos/swathes.ts`, `swathes.check.ts` (Energie-Schwaden als gezackte Flächen aus kurzen Strichen,
  aus `hash`), `Swathes.tsx`, `Note.tsx` (Zettel mit Markerrand und Klebeband), `tones.ts`
- Neu: `scenes/Alerts.tsx`, `scenes/Chat.tsx`, `scenes/Cam.tsx`, `scenes/Music.tsx`, `scenes/Fx.tsx`, `scenes/Info.tsx`
- Ändern: `index.tsx`, `settings.ts`, `theme.css`, `chaos.rs`, Fixture, erzeugte Typen, `scripts/rules.check.ts`
  (`WITHOUT_CHECK` für `tones.ts`)

### Kontext

Kern-Bausteine je Szene aus THEMES.md: `useAlerts`, `describeAlert`, `useAlertSounds` (Alerts), `useChat`,
`<MessageParts>` (Chat), `useNowPlaying`, `useTrackProgress`, `useCover`, `<Marquee>` (Musik), `useFxScene`, `useFxItem`
(Effekte), `useInfoPage` und `...INFO_FIELDS` (Befehlsseite).

### Gestaltung

Wie in DESIGN-CHAOS.md, Abschnitt Szenen: Alerts mit Schwaden von einer Seite (`alertSide`: links, rechts, wechselnd)
und Zettel; Chat als Zettel, Markerblasen oder schlicht (`chatStyle`); Kamera-Rahmen aus Markerstrichen (`camStyle`);
Musik als Zettel, Kassette oder schlicht (`musicStyle`); Effekte als Sprühschrift; Befehlsseite als Zettel vor der Wand.

### Acceptance Criteria

- [ ] AC1: `swathes` liefert für Seite und Startwert deterministisch Flächen, die von der gewählten Seite ins Bild
      reichen; die Anzahl der Striche folgt `swathDensity`.
- [ ] AC2: Jede Szene nutzt nur Kern-Hooks (kein `fetch`, `EventSource`, `WebSocket`), `rules.check.ts` grün.
- [ ] AC3: Alle Texte, Farben, Zeiten und Varianten sind Einstellungen (Schema-Check ohne Befund), Rust gleich.
- [ ] AC4 (manuell): jede Szene in der Vorschau mit `?demo`, Alerts aller Arten, Chat mit Emotes und langen Namen.

### Tests (TDD)

1. `swathes.check.ts > "Seite und Startwert"` (AC1): Gegeben `swathes("left", 5, 40)` zweimal, Erwartet gleiche
   Flächen, alle beginnen am linken Rand, 40 Striche.
2. `settings.check.ts` erweitert (AC3), `cargo test` (AC3).

### Out of Scope

- Stinger, Banner, Minimes.

---

## Package 4: Stinger und Banner

**Ziel:** Stinger, Profil- und Offline-Banner rendern deterministisch mit Schwaden, Wand und Sprühschrift.

**Abhängigkeiten:** Package 2 (Package 3 für `swathes.ts`; liegt es noch nicht vor, bringt Package 4 es mit)

**Betroffene Dateien:**
- Neu: `src/themes/chaos/paint.ts`, `paint.check.ts` (Wand, Körnung, Kritzeleien, Pinselstrich, Schwaden und
  Sprühschrift auf dem Canvas), `stinger.ts`, `stinger.check.ts`, `banners.ts`, `banners.check.ts`
- Ändern: `render.ts` (`chaosClips` mit `stinger`, `profile`, `offline`), `render.check.ts` (neu),
  `src/themes/renderers.check.ts` (`COMPLETE`), `settings.ts` (Gruppen `Stinger`, `Banner`), `chaos.rs`, Fixture,
  erzeugte Typen

### Acceptance Criteria

- [ ] AC1: Der Stinger deckt am Übergangspunkt das ganze Bild (jede Stichprobe der Pixel ist Schwade), davor und
      danach ist der Rand frei.
- [ ] AC2: Zweimal derselbe Zeitpunkt mit denselben Einstellungen ergibt dieselben Zeichenbefehle (aufzeichnender
      Canvas-Mock wie in den anderen `*.check.ts` der Clips).
- [ ] AC3: Die Banner sind Standbilder (jedes Zeichnen gibt dasselbe Bild).
- [ ] AC4 (manuell): Rendern im Dashboard, Stinger in OBS als Übergang.

### Tests (TDD)

1. `stinger.check.ts > "deckt am Übergangspunkt"` (AC1)
2. `stinger.check.ts > "deterministisch"` (AC2)
3. `banners.check.ts > "Standbild"` (AC3)
4. `paint.check.ts > "Kritzeleien auf dem Canvas"`: dieselben Pfade wie in SVG, Glow nur auf Magenta und Cyan

### Out of Scope

- Minimes.

---

## Package 5: Kritzel-Monster als Minimes

**Ziel:** Chatter klinken sich als hüpfende Kritzel-Monster in ihrer Farbe ein, mit eigenen Animationen.

**Abhängigkeiten:** Package 2

**Betroffene Dateien:**
- Neu: `src/themes/chaos/monsters.ts`, `monsters.check.ts` (Körper rund oder zackig, Augen, Zackenmund, Beine als
  offene Pfade; Form je Chatter aus `hash(seedOf(login))`), `Monster.tsx`, `scenes/Minimes.tsx`, `minimes.css`
- Ändern: `settings.ts` (`...MINIME_FIELDS`, `...MINIME_HOP_FIELDS`, eigene Gruppe "Minimes: Aussehen"), `index.tsx`
  (`minimes`), `chaos.rs` (Kern-Felder aus `minime_fields.rs`), Fixture, erzeugte Typen

### Kontext

Minimes mit Farben (THEMES.md, "Theme-eigene Funktionen"): `MINIME_FIELDS` bringt Befehle, Regeln, Bewegung und die
Farbwahl (`!color`); `MINIME_HOP_FIELDS` und `src/core/minimeHops.css` bringen das Hüpfen (`minime-hop`,
`hopStyle(actor, values.hopMs)`). Die Szene ruft `useMinimes({ catalog, reaction, widthPx })`.

### Gestaltung

Katalog: `wiggle` (Zappeln), `grin` (Grinsen mit Zacken), `star` (Kritzel-Stern über dem Kopf), `tumble` (Umfallen und
Aufstehen), `sleep` (aufsteigende Krakel); Reaktion auf Chat: `splat` (Spray-Klecks in der eigenen Farbe). Je Animation
Dauer und Häufigkeit als Einstellung (0 = nie). Name in Marker über dem Kopf, Grösse einstellbar.

### Acceptance Criteria

- [ ] AC1: Jeder Login ergibt immer dasselbe Monster; mindestens sechs verschiedene Formen kommen bei 50 Logins vor.
- [ ] AC2: Die Animationsnamen kollidieren nicht mit `COMBAT_ACTIONS` und `STACK_ACTIONS` (geprüft im Kern).
- [ ] AC3: Schema-Check ohne Befund, Rust gleich.
- [ ] AC4 (manuell): `minimes.html?demo&preview`: Monster hüpfen, Animationen und Spray-Klecks bei Chat.

### Tests (TDD)

1. `monsters.check.ts > "gleicher Login, gleiches Monster"` (AC1)
2. `monsters.check.ts > "Vielfalt"` (AC1): 50 Logins, mindestens sechs Formen
3. `settings.check.ts` erweitert, `cargo test` (AC3)

### Out of Scope

- Typen, Fraktionen, Gefechte und Türme der Minimes.

---

# Modernisierung (Packages 6 bis 9)

Entschieden 2026-10-21: Neon-Graffiti auf der Wand bleibt die Kernidee, der Detailgrad der Referenzbilder bleibt der
Massstab. Neu: Pinselstriche und Sprühnebel in PixiJS mit echtem Glow, zusätzliche Kritzeleien aus Rough.js
(Schraffur, Kreuzschraffur, Zickzack), Abläufe mit GSAP und Bewegung nach dem Aufbau. Gestaltung:
[DESIGN-CHAOS.md](DESIGN-CHAOS.md), Abschnitt "Modernisierung". Kern-Bausteine:
[plans/PLAN-GRAFIK.md](../../../../plans/PLAN-GRAFIK.md) (`PixiStage`, `roughPath`, `useTimeline`, `chance`, `burstAt`,
`qualityField`, Stinger-Optionen).

## Annahmen der Modernisierung

- **Referenz** (abgenommen 2026-10-21): [refs/starting.html](refs/starting.html), [refs/alert.html](refs/alert.html)
  und die Standbilder daneben, zusätzlich weiter die lokalen Referenzbilder unter `.claude/refs/chaos/` (nie
  committen). Jedes Package mit sichtbarer Arbeit endet mit Renders daneben und dem OK des Nutzers.
- **Technik:** Wand, Pinselstriche, Laufnasen, Sprühnebel und Staub in einer `PixiStage` (Glow als unscharfe Kopie mit
  additiver Mischung statt SVG-Filter); Kritzeleien weiter als SVG, damit `drawSVG` sie zeichnet; Texte als HTML.
- **Rough.js** (entschieden 2026-10-21): nur für Schraffur-Füllungen und neue Kritzel-Arten; der Pinselstrich bleibt
  eigener Code (`strokes.ts`).
- **Bewegung nach dem Aufbau** (entschieden 2026-10-21): eine Einstellung, Standard an.
- **Alerts ohne Schwaden** (entschieden 2026-10-21): nur der Zettel in der Mitte; `alertSide` und `swathDensity`
  entfallen in TS und Rust, `swathes.ts` bleibt nur, soweit Stinger oder Banner sie noch nutzen.
- **Alter Look:** wird ersetzt, kein Schalter. **Alles einstellbar**, **Schema in Rust und TS** (`chaos.rs`, Fixture,
  Typen je Package), **Fallstricke** in [THEMES.md](../../../../THEMES.md), **Commit** je Package nach grünem
  `npm run verify`. **Minimes** bleiben unverändert.

---

## Package 6: Modernisierung: Stil-Probe Starting

**Ziel:** Starting malt Pinselstriche mit Sprühnebel und echtem Glow in PixiJS, Rough-Kritzeleien zeichnen sich
selbst, der Titel wird aufgesprüht, danach bewegt sich alles weiter (abschaltbar).

**Abhängigkeiten:** Packages 1 bis 5, PLAN-GRAFIK Packages 1, 2, 5 und 8

**Betroffene Dateien:**
- Neu in `src/themes/chaos/`: `brush.ts`, `brush.check.ts` (Borsten, Farbkörper mit ausgefransten Kanten, trockener
  Auslauf und Laufnasen eines Strichs bis zum Fortschritt `p`, aus `strokes.ts`), `idle.ts`, `idle.check.ts` (Bewegung
  nach dem Aufbau: Fassung je Kritzelei beim "Kochen", Treiben, Schimmern der Borsten, Laufnasen in Schleife mit
  abfallendem Tropfen, Staub, Zeitpunkte von Flackern und Glitch; alles aus Zeit und Startwert), `roughScribbles.ts`,
  `roughScribbles.check.ts` (Rough-Arten mit Füllung: Stern, Herz, Kreis, Blitz, Krone mit `hachure`, `cross-hatch`,
  `zigzag`, `dashed`)
- Neu: `pixi/Wall.tsx` (Grund, Flecken, Körnung), `pixi/Brushes.tsx` (Striche scharf und als Glow-Kopie),
  `pixi/Spray.tsx` (Nebel an der Strich-Spitze und an der Kante des Titels), `pixi/Dust.tsx`
- Ändern: `scenes/Screen.tsx` (Starting; BRB und Ending bis Package 7 alt), `Backdrop.tsx` (Kritzeleien in drei
  Fassungen, `drawSVG`), `SprayTitle.tsx` (Aufsprühen per Maske, danach Maske entfernen), `scribbles.ts` (Katalog um
  die Rough-Arten), `settings.ts`, `theme.css`, `server-rs/crates/rst-domain/src/themes/chaos.rs`, Fixture, Typen

### Gestaltung

- **Aufbau (Standard):** Sprühstoss, die grossen Striche werden ab 0,2 s nacheinander gemalt (je 0,55 s, Sprühnebel an
  der Spitze, Laufnasen laufen nach), ab 1,3 s zeichnen sich über 100 Kritzeleien, ab 2,0 s wird der Titel von links
  nach rechts aufgesprüht, ab 3,0 s Countdown, Zickzack-Fortschritt, Zeile, Klebeband-Ticker.
- **Bewegung nach dem Aufbau** (ab 4,6 s): Kritzeleien kochen wie Stop-Motion (drei Fassungen, 8 Bilder pro Sekunde)
  und treiben leicht, Borsten schimmern, Laufnasen laufen und tropfen ab, Sprühstaub schwebt, der Titel flackert alle
  paar Sekunden und glitcht ab und zu.

### Einstellungen (neue Schlüssel)

| Gruppe | Schlüssel (Standard) |
|---|---|
| Allgemein | `quality` (`qualityField`), `glowStrength` (22), `glowAlpha` (0.75), `roughShare` (35 % der Kritzeleien aus Rough), `roughFill` (an) |
| Bewegung | `idleOn` (an), `boilOn` (an), `boilFps` (8), `driftAmount` (2.5 px), `bristleShimmer` (Faktor 1), `dripLoop` (an), `dustOn` (an), `dustCount` (90, Obergrenze 600 mit `fixed`); bestehend `flicker`, `glitch`, `glitchEvery` gelten auch nach dem Aufbau |
| Starting | bestehende Texte bleiben; neu `strokeMs` (550 ms), `scribbleStagger` (45 ms), `sprayTitleMs` (1200 ms) |

### Acceptance Criteria

- [ ] AC1: `brushAt(stroke, p)` zeichnet bei `p = 0` nichts und bei `p = 1` den vollen Strich; Borsten und Laufnasen
      sind deterministisch aus dem Startwert.
- [ ] AC2: `boilTake(i, t)` wechselt mit `boilFps` zwischen drei Fassungen, nie zwei Kritzeleien im gleichen Takt; mit
      `idleOn` oder `boilOn` aus immer Fassung 0.
- [ ] AC3: Eine Laufnase wächst bis zu ihrer Länge, ein Tropfen fällt ab, dann beginnt sie neu (Schleife ohne Sprung).
- [ ] AC4: `roughScribble(kind, seed)` ist für gleichen Startwert gleich; alle neuen Arten haben eine Füllung.
- [ ] AC5: `auditTheme` ohne Befund; `scripts/rules.check.ts`, `scripts/bundle.ts` grün.
- [ ] AC6 (manuell): `starting.html?demo&preview&t=12` neben [refs/starting.png](refs/starting.png) und den lokalen
      Referenzbildern (Detailgrad); mit `idleOn` aus steht nach dem Aufbau alles still; Abnahme.

### Tests (TDD)

1. `brush.check.ts > "Strich bis p"` (AC1) 2. `idle.check.ts > "Kochen"` (AC2) 3. `idle.check.ts > "Laufnasen als
Schleife"` (AC3) 4. `roughScribbles.check.ts > "fester Zufall"` (AC4) 5. `settings.check.ts`, `cargo test` (AC5)

### Umsetzungsschritte

1. Tests, rot; Module, grün. 2. Einstellungen TS und Rust. 3. PixiJS-Ebenen, Kritzeleien, Titel, `Screen.tsx`.
4. `npm run verify`, Vorschau, Abnahme.

### Out of Scope

- BRB und Ending (7), Overlays (8), Clips (9), Minimes.

---

## Package 7: Modernisierung: BRB und Ending

**Ziel:** BRB und Ending nutzen dieselbe Wand, dieselben Abläufe und dieselbe Bewegung nach dem Aufbau.

**Abhängigkeiten:** Package 6 (Abnahme)

**Betroffene Dateien:** `scenes/Screen.tsx`, `settings.ts`, `chaos.rs`, Fixture, Typen

### Gestaltung

- Komposition je Szene wie heute einstellbar (zwei X, ein X, ein Strich, keine), jede Szene mit eigenem Startwert.
- **BRB:** Pausenzeit als Marker-Zahl; das Kochen der Kritzeleien ist langsamer (eigene `boilFps`).
- **Ending:** der Titel wird aufgesprüht und läuft danach stärker (mehr Laufnasen), `endingNext` auf Klebeband.

### Einstellungen

| Gruppe | Schlüssel (Standard) |
|---|---|
| BRB | `brbBoilFps` (5) |
| Ending | `endingDrips` (6) |

### Acceptance Criteria

- [ ] AC1: Jede Szene baut sich mit ihrem Startwert anders auf; gleicher Startwert, gleiches Bild.
- [ ] AC2 (manuell): BRB und Ending in der Vorschau; Abnahme.

### Tests (TDD)

1. `idle.check.ts > "Startwert je Szene"` (AC1) 2. `settings.check.ts`, `cargo test`

### Umsetzungsschritte

1. Test, rot, grün. 2. Einstellungen. 3. Szene. 4. `npm run verify`, Vorschau, Abnahme.

### Out of Scope

- Overlays (8), Clips (9).

---

## Package 8: Modernisierung: Overlays

**Ziel:** Der Alert ist nur noch der Zettel in der Mitte mit Sprühstoss und Kritzel-Konfetti; die übrigen Overlays
bewegen sich mit GSAP.

**Abhängigkeiten:** Package 6

**Betroffene Dateien:**
- Neu: `pixi/SprayBurst.tsx` (Sprühstoss rund um den Zettel über `burstAt`), `confetti.ts`, `confetti.check.ts`
  (Kritzel-Konfetti aus Rough-Formen mit Wurfbahn aus der Zeit)
- Ändern: `scenes/Alerts.tsx` (ohne `EnergySwathes`), `scenes/Chat.tsx`, `scenes/Cam.tsx`, `scenes/Music.tsx`,
  `scenes/Fx.tsx`, `scenes/Info.tsx`, `Note.tsx` (Markerrand aus Rough, zeichnet sich), `settings.ts` (ohne `alertSide`,
  `swathDensity`), `chaos.rs`, Fixture, Typen, `theme.css`

### Gestaltung

- **Alert** (wie [refs/alert.html](refs/alert.html)): der Zettel klatscht in der Mitte an die Wand (kurz zu gross, dann
  flach), Sprühnebel stäubt rund um ihn, der Markerrand zeichnet sich, das Klebeband sitzt, die Art-Pille springt, der
  Name wird aufgesprüht, Zeile und Zitat, Konfetti aus Kritzeleien fliegt heraus; Restzeit als Rough-Markerstrich, der
  sich zurückzieht; Abgang als Glitch.
- **Chat:** Zettel klatschen herein (GSAP), Klebeband zuletzt.
- **Kamera:** Markerrahmen zeichnet sich, Kritzeleien an den Ecken kochen.
- **Musik:** Zickzack-Fortschritt zeichnet sich, Equalizer zittert.

### Einstellungen

| Gruppe | Schlüssel (Standard) |
|---|---|
| Alerts | `alertSprayOn` (an), `alertSprayDots` (220, Obergrenze 1000 mit `fixed`), `alertConfetti` (34), `alertSlapScale` (1.35); entfällt: `alertSide`, `swathDensity` |

### Acceptance Criteria

- [ ] AC1: Im Alert gibt es keine Schwaden mehr; Schema ohne `alertSide` und `swathDensity` in TS und Rust (gespeicherte
      Werte dieser Schlüssel werden beim Laden verworfen wie andere unbekannte Schlüssel).
- [ ] AC2: `confettiAt(seed, i, t)` ist deterministisch und verschwindet nach der Lebensdauer.
- [ ] AC3: Alle Overlays transparent; jede Alert-Art zeigt ihre Texte wie bisher.
- [ ] AC4 (manuell): neben [refs/alert.png](refs/alert.png); Abnahme.

### Tests (TDD)

1. `settings.check.ts > "ohne Schwaden"` (AC1) 2. `confetti.check.ts > "Wurf aus der Zeit"` (AC2) 3. bestehende
Alert-Checks, `cargo test` (AC3)

### Umsetzungsschritte

1. Tests, rot; Module, grün. 2. Einstellungen. 3. Szenen. 4. `npm run verify`, Vorschau, Abnahme.

### Out of Scope

- Clips (9).

---

## Package 9: Modernisierung: Stinger und Banner

**Ziel:** Stinger und Banner zeigen die neuen Striche, Rough-Kritzeleien und Sprühnebel als reine Funktion der Zeit.

**Abhängigkeiten:** Package 7, PLAN-GRAFIK Package 7

**Betroffene Dateien:** `paint.ts` (Striche aus `brush.ts`, Rough-Kritzeleien über `rough.canvas` mit festem Startwert,
Sprühnebel aus `burstAt`, Glow über `shadowBlur`), `paint.check.ts`, `stinger.ts`, `stinger.check.ts`, `banners.ts`,
`banners.check.ts`, `render.ts`, `render.check.ts`

### Gestaltung

- **Stinger:** der klare Wisch bleibt (Wand kommt von links mit Magenta-Strich an der Kante, deckt am Übergangspunkt,
  Titel wird aufgesprüht, Wand wischt mit Cyan-Strich nach rechts hinaus); neu sind der gemalte Strich mit Borsten, der
  Sprühnebel an der Kante und die Rough-Kritzeleien.
- **Banner:** Wand mit neuen Kritzeleien und gemaltem Strich.

### Acceptance Criteria

- [ ] AC1: Am Übergangspunkt deckt die Wand das ganze Bild; alle Teile folgen aus Startwert und Zeit.
- [ ] AC2: Stinger-Optionen aus dem Kern; gleiche Einstellungen, gleiche Bilder.
- [ ] AC3 (manuell): WebM und GIF im Dashboard; Abnahme.

### Tests (TDD)

1. `stinger.check.ts > "gedeckt am Übergang"` (AC1) 2. `render.check.ts > "Clips"` (AC2)

### Umsetzungsschritte

1. Tests, rot; `paint.ts`, `stinger.ts`, `banners.ts`, grün. 2. `npm run verify`, rendern, Abnahme.

### Out of Scope

- Ton im Stinger.
