# Plan: Theme "Dachdecker"

Bauplan in 3D: Ein Dachstuhl aus leuchtenden Plan-Linien wird auf Blaupause gezeichnet (Starting), steht gedeckt im
Regen (BRB) und wird als fertiges Haus mit Richtkranz und Abnahmeprotokoll gefeiert (Ending). Alerts, Chat, Kamera und
Musik sind 2D-Bauplan-Schilder, die Musik ein Baustellenradio, die Minimes kleine 3D-Bauplan-Figuren mit Helm.
Gestaltung: [DESIGN-DACHDECKER.md](DESIGN-DACHDECKER.md).

Testbefehl: `npm test` (einzeln: `node <pfad>.check.ts`), Abschluss jedes Packages: `npm run verify`, wo der Server
betroffen ist auch `npm run contract`. Regeln: [CODING-RULES.md](../../../../CODING-RULES.md), Theme-Aufbau:
[THEMES.md](../../../../THEMES.md), Übersicht aller Pläne: [PLAN.md](../../../../PLAN.md).

## Überblick

| # | Package | Ziel in einem Satz | Abhängig von |
|---|---------|--------------------|--------------|
| 1 | Stil-Probe: Starting | Das Theme `dachdecker` ist wählbar und zeigt Starting in 3D so, dass der Nutzer den Stil neben dem Prototyp abnimmt. | Kern-Plan Grafik 1 bis 3 |
| 2 | BRB, Ending und Skin | BRB im Regen und Ending mit Richtfest und echtem Abnahmeprotokoll stehen, der Dashboard-Skin hat seine Szenerie. | 1 (Abnahme), Kern-Plan Statistik |
| 3 | Overlays | Alerts, Chat, Kamera, Baustellenradio, Effekte und Befehlsseite zeigen die Bauplan-Ebene. | 1 |
| 4 | Stinger und Banner | Stinger, Profil- und Offline-Banner rendern deterministisch in 3D. | 2, Kern-Plan Grafik 4 |
| 5 | Minimes | Chatter erscheinen als 3D-Bauplan-Figuren mit Typen, Werkzeugen, Gerüst und eigenen Animationen. | 2 |

Vorher fertig: [plans/PLAN-GRAFIK.md](../../../../plans/PLAN-GRAFIK.md) Packages 1 bis 3 (für Package 1) und 4 (für
Package 4), [plans/PLAN-STATS.md](../../../../plans/PLAN-STATS.md) mit [RUST-PLAN.md](../../../../RUST-PLAN.md)
Package 52 (für Package 2). Parallel möglich: 3 neben 2 (verschiedene Dateien bis auf `settings.ts`, `dachdecker.rs` und
die Fixture; wer später kommt, hängt seine Gruppen an). Package 1 endet mit einer Abnahme; ohne sie beginnt kein weiteres
Package.

## Annahmen

- **Name und id** (entschieden 2026-10-21): Anzeigename "Dachdecker", id `dachdecker`, Ordner `src/themes/dachdecker/`,
  Klassen `dd-*`, Keyframes `dachdecker-*`.
- **Stil** (entschieden 2026-10-21): Die Prototypen in [refs/](refs/) sind abgenommen (Starting, BRB, Ending in 3D,
  vom Alert nur das Schild). Jede sichtbare Arbeit wird neben ihnen gerendert und erst nach dem OK des Nutzers
  weitergebaut.
- **Technik** (entschieden 2026-10-21): 3D mit react-three-fiber, drei und postprocessing über `Stage3D`; Abläufe mit
  GSAP über `useTimeline`; Clips mit Vanilla-Three.js über `glClip` (alles aus dem Kern-Plan Grafik). PixiJS und Rough.js
  nutzt dieses Theme nicht. Die 2D-Ebene ist HTML, CSS und SVG.
- **Alles einstellbar** (entschieden 2026-10-21, Regeln 19 und 20): Texte, Farben, Grössen, Geschwindigkeiten, Dauern,
  Häufigkeiten, Anzahl und Dichte, Leistungsstufe, jedes Element einzeln an/aus. Fest bleiben nur Formen (Geometrie in
  `.ts`-Modulen) und Schutzgrenzen (z. B. höchste Zahl Regentropfen), jeweils mit `fixed: <Grund>`.
- **Geometrie als Daten:** Dachstuhl, Ziegel, Haus, Regen, Feuerwerk und Figuren sind reine Funktionen in `.ts`-Modulen
  mit Checks; Szenen (R3F) und Clips (Vanilla-Three.js) nutzen dieselben Module. Szenen enthalten keine Zahlen über 1
  (Regel aus `scripts/rules.check.ts`).
- **Zufall:** Jede Verteilung (Kupferziegel, Regen, Funken, Rauch) kommt aus `chance` mit einem Startwert aus den
  Einstellungen, nie aus `Math.random`.
- **Echte Zahlen im Ending** (entschieden 2026-10-21): aus der Kern-Statistik (`useStreamStats`, `describeStats`);
  welche Zahlen mit welchem Text erscheinen, ist eine Einstellung.
- **Schrift** (entschieden 2026-10-21): nur Roboto Mono, neu in `index.html`; im Feld `font` wählbar zwischen Roboto
  Mono, IBM Plex Mono, Fira Mono und Share Tech Mono (alle geladen).
- **Musik:** ein Baustellenradio ohne Bezug zu einer Marke; kein Markenname in Dokumenten, Code, Commits oder Oberfläche.
- **Effekte** (entschieden 2026-10-21): transparent; der Streamer stellt die Medien selbst ein, das Theme bringt nur den
  Kern-Baustein und einen optionalen Text.
- **Töne:** eingebaute synthetische Töne in `tones.ts` (Hammerschlag bei Ziegel-Landungen, dumpfer Schlag beim Stempel,
  Regenrauschen im BRB, Standard aus), in `WITHOUT_CHECK` von `scripts/rules.check.ts` wie die anderen `tones.ts`.
- **Texte:** deutsch, zünftig, alle als Einstellung; Platzhalter `{channel}`, `{user}`, `{amount}`, `{detail}`, `{text}`.
- **Persönliche Startwerte:** `personalize` setzt `channelName` (Login in Grossbuchstaben).
- **Einfache Ansicht:** Jedes Package markiert seine wichtigsten Felder mit `markBasic` (Liste `BASIC` in `settings.ts`,
  `mark_basic` in Rust), wie in [plans/PLAN-SETTINGS.md](../../../../plans/PLAN-SETTINGS.md).
- **Schema in Rust und TS:** `server-rs/crates/rst-domain/src/themes/dachdecker.rs` und `src/themes/dachdecker/settings.ts`,
  gleich gehalten über `server-rs/crates/rst-domain/tests/fixtures/dachdecker.json` (`node scripts/dumpSchema.ts`),
  `src/generated/themes/dachdecker.ts` per `npm run gen:types`. Jedes Package ergänzt beide Seiten im selben Commit.
- **Docs vor Code** (entschieden 2026-10-21): Solange in `src/themes/dachdecker/` nur `docs/` liegt, ist
  `src/themes/registry.check.ts` rot und damit `npm run verify`; Package 1 macht es grün.
- **Commit-Grösse:** Packages 1 bis 3 und 5 liegen voraussichtlich über der Richtgrösse von 400 Zeilen; bewusste
  Ausnahme, steht in der Commit-Beschreibung. Commit je Package nach grünem `npm run verify`, nie pushen.
- **Manuelle Checks:** Vorschau `http://localhost:5173/<szene>.html?demo&preview`, Viewport 1600x900; Standbilder mit
  `?t=<sekunden>`. Nach jedem Package mit sichtbarer Arbeit Bilder neben den Prototypen zeigen und auf das OK warten.
- **OBS:** 3D braucht die Hardware-Beschleunigung der Browserquelle; die Leistungsstufe (`quality`) und die Mengen
  (Regen, Ziegel, Funken) sind Einstellungen.

---

## Package 1: Stil-Probe: Starting

**Ziel:** Das Theme `dachdecker` ist wählbar und zeigt Starting in 3D so, dass der Nutzer den Stil neben dem Prototyp
abnimmt.

**Abhängigkeiten:** Kern-Plan Grafik Packages 1 bis 3

**Betroffene Dateien:**

Neu in `src/themes/dachdecker/`:
- `frame.ts`, `frame.check.ts`: `roofFrame(dims)` liefert alle Balken des Dachstuhls als Daten
  (`{ from, to, size, kind: "front" | "truss" | "purlin" | "batten" | "plate", order }`), `order` = Reihenfolge des
  Aufbaus; `dims` = Spannweite, Firsthöhe, Binderzahl, Binderabstand, Überstand
- `tiles.ts`, `tiles.check.ts`: `tileLayout(dims, rows, seed, copperShare, sides)` liefert Matrizen (Position, Drehung)
  und Kupfer-Merker je Platte, Reihen von der Traufe aufwärts
- `schedule.ts`, `schedule.check.ts`: `buildSchedule(values)` liefert Start und Dauer jedes Aufbau-Schritts (Mauer,
  vorderer Binder, Binder, Pfetten, Latten, Ziegel, Texte) aus den Einstellungen; die Szene baut daraus die GSAP-Timeline
- `three/Blueprint.tsx` (Hintergrund, Nebel, Raster, Licht), `three/RoofFrame.tsx` (Balken mit Plankanten, wachsen über
  `scale.z`), `three/Tiles.tsx` (Instanzen plus zusammengefasste Kanten aus `mergedEdges`), `three/OrbitCamera.tsx`
  (Ausfahrt und Kreisen aus Einstellungen)
- `plan/TitleBlock.tsx` (Schriftfeld), `plan/Headline.tsx` (Kopfzeile, Titel, Countdown mit Entschlüsseln und Flackern),
  `plan/Progress.tsx` (Masskette als Fortschritt)
- `settings.ts`, `settings.check.ts`, `useDachdecker.ts`, `index.tsx` (nur `starting`), `theme.css`, `scenes/Starting.tsx`
- `render.ts` mit `dachdeckerClips = () => []` (Clips in Package 4)

Schon angelegt: `src/themes/dachdecker/docs/refs/` mit den Prototypen.

Ändern:
- `src/themes/registry.ts` (`THEME_MODULES`), `src/themes/scenes.tsx` (`THEME_VIEWS`), `scripts/dumpSchema.check.ts`
- `server-rs/crates/rst-domain/src/themes/dachdecker.rs` (neu), `themes/mod.rs`, `themes/registry.rs` (`THEMES`),
  `server-rs/crates/rst-domain/tests/fixtures/dachdecker.json` (neu), `src/generated/themes/dachdecker.ts` (erzeugt),
  `src/themes/generatedValues.check.ts`
- `src/dashboard/skin.ts` (`SKINS`), `src/dashboard/skins.css` (Block `[data-skin="dachdecker"]` mit den Tokens aus
  DESIGN-DACHDECKER.md, noch ohne Szenerie)
- `index.html` (Schrift Roboto Mono 400, 500, 700)

### Kontext

Ein Theme ist ein Ordner und zwei Einträge (`THEME_MODULES`, `THEME_VIEWS`); `registry.check.ts`, `skin.check.ts` und
`renderers.check.ts` prüfen das. Starting nutzt `useStage` und `useScreen` aus `src/core/screens` (Countdown, `?ticker`,
`?next`). Die 3D-Bühne kommt aus `src/core/three/Stage3D.tsx`, Timelines aus `src/core/motion/useTimeline.ts`. Der
Prototyp `refs/starting.html` zeigt Aufbau, Kamera und Licht; seine Zahlen (Spannweite 8.4, Firsthöhe 3.25, fünf Binder
im Abstand 1.5, Kamera-Radius 17, Höhe 6.4) werden Standardwerte.

### Gestaltung

- 3D-Welt wie DESIGN-DACHDECKER.md "Bildsprache": Blaupause, Raster, Nebel, vorderer Binder in Terrakotta mit Bloom,
  weitere Binder, Pfetten und Latten in Weiss, zum Schluss die ersten Schindelreihen auf einer Dachseite.
- Ablauf (Standard): Mauerauflagen ab 0.2 s, vorderer Binder ab 0.5 s (je Balken 0.16 s versetzt), weitere Binder ab
  1.4 s (je Binder 0.35 s), Pfetten ab 2.6 s, Latten ab 3.4 s, Ziegel ab 4.6 s; die Kamera fährt in 5 s von nah und
  hoch auf Radius und Höhe und kreist dann. Alles skaliert mit `buildSpeed`.
- 2D: Kopfzeile oben links, Titel und Countdown unten mittig (Entschlüsseln), Schriftfeld unten rechts, optional
  Masskette als Fortschritt, wechselnde Zeilen, Ticker als Masskette am unteren Rand.

### Einstellungen (Gruppen dieses Packages)

| Gruppe | Schlüssel (Standard) |
|---|---|
| Allgemein | `channelName` ("DACHDECKER"), `font` (Roboto Mono), `fontSize` (26 px), `titleSize` (72 px), `countSize` (104 px), `blueprint` (`#192a56`), `page` (`#121e40`), `card` (`#22356a`), `accent` (`#e67e22`), `onAccent` (`#121e40`), `brick` (`#d35400`), `copper` (`#d4a373`), `slate` (`#2c3e50`), `slateDark` (`#1a252f`), `line` (`#ffffff`), `muted` (`#b4c2e0`), `rain` (`#7fe3ff`), `dusk` (`#8a3d16`), `quality` (mittel: hoch, mittel, niedrig), `bloom` (an), `bloomStrength` (0.42), `glow` (0.8), `scramble` (an), `scrambleMs` (1400 ms), `flicker` (an), `flickerEvery` (5 s) |
| Dachstuhl | `span` (8.4 m), `rise` (3.25 m), `trusses` (5), `trussGap` (1.5 m), `overhang` (12 %), `lineOpacity` (0.62), `fillOpacity` (0.1), `grid` (an), `gridOpacity` (0.13), `fog` (an), `tileCopperShare` (15 %), `seed` (7), `cameraRadius` (17), `cameraHeight` (6.4), `cameraSpeed` (0.07), `cameraIntro` (an), `buildSpeed` (Faktor 1) |
| Starting | `startingHead` ("BAUPLAN 01 // DACHSTUHL 3D // {channel}"), `startingTitle` ("STREAM STARTET GLEICH"), `startingSubtitle` (""), `startingLines` (Liste, z. B. "Sparren stehen, gleich wird gedeckt"), `linesEvery` (8 s), `countdown`, `countdownPrefix`, `countdownDone` ("GLEICH GEHT'S LOS"), `startingTiles` (an), `startingTileRows` (4), `startingProgress` (masskette: masskette, aus), `startingBlock` (an), `startingBlockLines` ("PROJEKT: STREAM", "M 1:50 \| BLATT 1/3", "GEZ. {channel} \| {date}"), `ticker` (""), `tickerSpeed` |

### Acceptance Criteria

- [ ] AC1: `dachdecker` steht in `THEME_MODULES`, `THEME_VIEWS`, `SKINS` und in Rust `THEMES`; `registry.check.ts`,
      `skin.check.ts` und `dumpSchema.check.ts` sind grün.
- [ ] AC2: Das Rust-Schema gleicht dem TS-Schema (Fixture-Test in `dachdecker.rs`), `personalize("neo")` ergibt
      `{ channelName: "NEO" }`.
- [ ] AC3: `roofFrame` liefert je Binder 7 Balken, dazu 5 Pfetten, Latten nach Sparrenlänge und 2 Mauerauflagen; der
      vordere Binder hat `kind: "front"`; alle Punkte liegen innerhalb von Spannweite mal Überstand und Firsthöhe; `order`
      steigt in der Reihenfolge Mauer, vorderer Binder, Binder, Pfetten, Latten.
- [ ] AC4: `tileLayout` ist deterministisch, versetzt jede zweite Reihe um eine halbe Platte, legt keine Platte über die
      Giebelkanten hinaus; der Kupfer-Anteil liegt bei 15 % plus minus 5 Prozentpunkte und bildet keine durchgehende
      Reihe oder Spalte.
- [ ] AC5: `buildSchedule` liefert Schritte in der Reihenfolge aus der Gestaltung; `buildSpeed = 2` halbiert alle Zeiten.
- [ ] AC6: `auditTheme` findet keinen ungenutzten Schlüssel, die Standardwerte bestehen das Schema; `scripts/rules.check.ts`
      ist grün (keine Farbliterale, keine Zahlen über 1 in Szenen).
- [ ] AC7 (manuell): `starting.html?demo&preview` zeigt den Aufbau wie `refs/starting.html`; das Standbild bei `?t=7`
      liegt neben `refs/starting.png` und trifft Komposition, Farben, Linien und Glow; der Nutzer nimmt den Stil ab.

### Tests (TDD)

Reihenfolge: Test schreiben, rot, minimal implementieren, grün, refactoren.

1. `src/themes/dachdecker/frame.check.ts > "Dachstuhl"` (AC3)
   - Gegeben: `roofFrame({ span: 8.4, rise: 3.25, trusses: 5, gap: 1.5, overhang: 0.12 })`
   - Erwartet: 35 Binder-Balken, davon 7 `front`; 5 Pfetten; 2 Mauerauflagen; alle `y` zwischen -0.6 und 3.3;
     `order` nicht fallend in der genannten Reihenfolge
2. `tiles.check.ts > "Ziegel"` (AC4)
   - Gegeben: `tileLayout(dims, 11, 7, 0.15, 2)` zweimal und mit Startwert 8
   - Erwartet: gleiche Liste bei gleichem Startwert, andere bei 8; Anteil Kupfer 10 bis 20 %; keine Reihe nur aus Kupfer
3. `schedule.check.ts > "Ablauf"` (AC5)
   - Gegeben: Standardwerte, dann `buildSpeed: 2`
   - Erwartet: Startzeiten 0.2, 0.5, 1.4, 2.6, 3.4, 4.6 s; mit Faktor 2 die Hälfte
4. `settings.check.ts > "Schema"` (AC6): `auditTheme(dachdeckerSettings)` ohne Befund
5. `cargo test` in `dachdecker.rs > same_as_typescript` und `personalize_sets_channel_name` (AC2)

### Umsetzungsschritte

1. Tests 1 bis 3, rot; `frame.ts`, `tiles.ts`, `schedule.ts`, grün.
2. `settings.ts` mit den Gruppen oben, `dachdecker.rs` gleich, Fixture schreiben, Typen erzeugen; Tests 4 und 5.
3. Registrieren (TS und Rust), `skin.ts` und `skins.css` (Tokens), `index.html`.
4. 3D-Komponenten und 2D-Bausteine, `scenes/Starting.tsx` (nur Starting eingetragen), `theme.css`.
5. `npm run verify`, Vorschau rendern, neben `refs/starting.png` legen, dem Nutzer zeigen, Abnahme abwarten (AC7).

### Out of Scope

- BRB, Ending, Szenerie des Skins (Package 2); Overlays (3); Clips (4); Minimes (5).

---

## Package 2: BRB, Ending und Skin

**Ziel:** BRB im Regen und Ending mit Richtfest und echtem Abnahmeprotokoll stehen, der Dashboard-Skin hat seine
Szenerie.

**Abhängigkeiten:** Package 1 (mit Abnahme), Kern-Plan Statistik (Package 2 dort)

**Betroffene Dateien:**
- Neu: `rain.ts`, `rain.check.ts` (Dachhöhe an einer Stelle, Aufprall mit Spiegelung und Dämpfung, Spritzer,
  zeitbasierter Schritt), `house.ts`, `house.check.ts` (Wände, Pfosten, Fenster, Tür, Schornstein, Richtkranz als Daten),
  `fireworks.ts`, `fireworks.check.ts` (Funkenwolken aus Startwert und Zeit), `protocol.ts`, `protocol.check.ts`
  (Zeilen des Abnahmeprotokolls), `three/Rain.tsx`, `three/Lightning.tsx`, `three/House.tsx`, `three/Wreath.tsx` (Bänder
  wehen über Vertex-Verschiebung), `three/Smoke.tsx`, `three/Fireworks.tsx`, `three/DuskSky.tsx`, `plan/Protocol.tsx`
  (mit Hochzählen), `plan/Stamp.tsx`, `scenes/Brb.tsx`, `scenes/Ending.tsx`, `tones.ts`
- Ändern: `settings.ts`, `index.tsx` (`brb`, `ending`), `theme.css`, `dachdecker.rs`, Fixture, erzeugte Typen,
  `scripts/rules.check.ts` (`WITHOUT_CHECK` für `src/themes/dachdecker/tones.ts`)
- Skin: `src/dashboard/Scenery.tsx` (Szenerie `dachdecker`: Dachstuhl als SVG-Linien unten rechts, Masskette links,
  Schriftfeld oben rechts), `src/dashboard/skins.css`
- Doku: `README.md` (Theme-Liste), `DESIGN.md` (Zeile ohne "(geplant)")

### Kontext

BRB nutzt `useScreen` (Pausenzeit), Ending `useScreen` (`?next`) und `useStreamStats` mit `describeStats` aus dem
Kern-Plan Statistik. Der Prototyp `refs/brb.html` hat gezeigt: Ein zu starker Blitz (Hintergrund plus Bloom) überstrahlt
das ganze Bild; Blitz und Bloom-Spitze haben darum Obergrenzen. `refs/ending.html` hat gezeigt: Beim Anhalten auf eine
Zeit müssen Zähler ihre Werte setzen (gelöst im Kern über `useTimeline`).

### Gestaltung

- **BRB:** Dachstuhl aus Package 1, beide Seiten komplett gedeckt (11 Reihen), Kupferfirst; Regen mit Aufprall,
  Spritzern und Wind in Böen; Blitze hinter dem Haus; Kamera kreist etwas tiefer; Texte und Schriftfeld wie Starting.
- **Ending:** Haus auf Wänden (Fachwerk-Pfosten, leicht gefüllte Wände), Fenster und Tür gehen nacheinander an,
  Schornstein mit Rauch, Richtkranz mit sechs Bändern auf dem vorderen Giebel, Abendhimmel; die Kamera startet am Kranz
  und fährt auf das ganze Haus (Bild nach rechts versetzt, damit links Platz ist); links zählt das Abnahmeprotokoll
  hoch, dann schlägt der Stempel auf; Titel und Unterzeile; Feuerwerk in Abständen.
- **Skin:** Szenerie als statische SVG-Linien in den Farben des Skins.

### Einstellungen (Gruppen dieses Packages)

| Gruppe | Schlüssel (Standard) |
|---|---|
| BRB | `brbHead` ("BAUPLAN 02 // PAUSE BEI REGEN // {channel}"), `brbTitle` ("BIN GLEICH ZURÜCK"), `brbSubtitle` ("DAS DACH HÄLT DICHT"), `brbTimerPrefix` ("SEIT"), `brbLines`, `brbBlock` (an), `brbBlockLines`, `brbTileRows` (11), `rainOn` (an), `rainCount` (2600, Obergrenze 6000 mit `fixed`), `rainSpeed` (Faktor 1), `rainLength` (0.38 m), `rainOpacity` (0.75), `splashOn` (an), `splashAmount` (3), `splashGround` (an), `windMax` (2.5), `windEvery` (3.5 s), `lightningOn` (an), `lightningEvery` (8 s), `lightningStrength` (0.6, Obergrenze 1), `rainSound` (aus), `rainVolume` (40 %) |
| Ending | `endingHead` ("BAUPLAN 03 // RICHTFEST // {channel}"), `endingTitle` ("FEIERABEND!"), `endingSubtitle` ("DANKE FÜRS MITDECKEN"), `endingNext`, `endingBlock` (an), `endingBlockLines`, `wallHeight` (2.7 m), `windowsOn` (an), `windowStep` (350 ms), `smokeOn` (an), `smokeAmount` (14), `wreathOn` (an), `ribbonColors` (Liste: Terrakotta, Kupfer, Weiss, Ziegelrot, Hellblau, Terrakotta), `ribbonWind` (Faktor 1), `fireworksOn` (an), `fireworksEvery` (2.5 s), `fireworksSparks` (110), `endingIntro` (an), `endingShift` (230 px), `protocolOn` (an), `protocolTitle` ("ABNAHMEPROTOKOLL"), `protocolLines` ("follows\|Neue Dachdecker", "subs\|Abos", "raids\|Raids", "bits\|Bits", "chatMessages\|Gelegte Ziegel"), `countUpMs` (1000 ms), `stampOn` (an), `stampText` ("ABGENOMMEN"), `stampAt` (6 s), `stampSound` (an) |

### Acceptance Criteria

- [ ] AC1: `roofHeight(x)` ist am First `rise` und an der Traufe 0 (mit Überstand negativ); ein Tropfen, der die
      Dachfläche durchquert, wird an der Fläche gespiegelt (Normale zeigt nach oben) und um den Faktor gedämpft; er
      geht nie durch das Dach.
- [ ] AC2: `stepRain(state, dt)` ist zeitbasiert (zwei Schritte mit `dt = 1` gleich einem mit `dt = 2` für einen
      Tropfen ohne Aufprall) und hält die Zahl der Tropfen konstant; Spritzer sterben nach ihrer Lebensdauer.
- [ ] AC3: `house(dims, wallHeight)` liefert Pfosten an den Ecken und zwischen den Fenstern, vier Fenster, eine Tür,
      den Schornstein auf der hinteren Dachseite und den Kranz über dem vorderen Giebel.
- [ ] AC4: `burst(seed, t)` ist eine reine Funktion der Zeit: gleiche Eingaben, gleiche Punkte.
- [ ] AC5: Das Protokoll zeigt die Zeilen aus `protocolLines` mit den echten Zahlen (`describeStats`), in `?demo` die
      Demo-Werte; ohne Statistik (`null`) zeigt es Striche statt Zahlen.
- [ ] AC6: Die Skin-Szenerie erscheint nur im Skin `dachdecker`, unter 1100 px nur das Raster, unter 720 px nichts.
- [ ] AC7 (manuell): BRB und Ending neben `refs/brb.png` und `refs/ending.png`; der Blitz überstrahlt nie das Bild;
      Abnahme durch den Nutzer.

### Tests (TDD)

1. `rain.check.ts > "Dachhöhe und Aufprall"` (AC1)
   - Gegeben: Tropfen bei x 2, y 3 mit Geschwindigkeit (0, -0.4); `roofHeight(2)` liegt darunter
   - Erwartet: nach dem Schritt y nicht unter `roofHeight(2)`, Geschwindigkeit zeigt von der Fläche weg, Betrag gedämpft
2. `rain.check.ts > "zeitbasiert und konstant"` (AC2)
3. `house.check.ts > "Haus"` (AC3)
4. `fireworks.check.ts > "rein aus der Zeit"` (AC4)
5. `protocol.check.ts > "Zeilen"` (AC5): `protocolRows(stats, lines)` mit Demo-Werten und mit `null`
6. `settings.check.ts` und `cargo test` wie in Package 1

### Umsetzungsschritte

1. Tests 1 bis 5, rot; `rain.ts`, `house.ts`, `fireworks.ts`, `protocol.ts`, grün.
2. Einstellungen in TS und Rust, Fixture, Typen.
3. 3D-Komponenten, `plan/Protocol.tsx`, `plan/Stamp.tsx`, `scenes/Brb.tsx`, `scenes/Ending.tsx`, `tones.ts`.
4. Skin-Szenerie, README, DESIGN.md.
5. `npm run verify`, Vorschau neben den Prototypen, Abnahme.

### Out of Scope

- Overlays (3); Clips (4); Minimes (5); Speichern der Statistik (Kern-Plan Statistik).

---

## Package 3: Overlays

**Ziel:** Alerts, Chat, Kamera, Baustellenradio, Effekte und Befehlsseite zeigen die Bauplan-Ebene.

**Abhängigkeiten:** Package 1

**Betroffene Dateien:**
- Neu: `plan/PlanSign.tsx` (Bauplan-Schild mit Eckmarken), `plan/DimensionLine.tsx` (Masslinie, zeichnet sich mit
  `drawSVG`), `alerts.ts`, `alerts.check.ts` (Schlüssel für `describeAlert` und Masslinien-Texte je Art), `radio.ts`,
  `radio.check.ts` (Formen des Baustellenradios als Pfade: Gehäuse, Puffer, Bügel, Gitter, Display), `scenes/Alerts.tsx`,
  `scenes/Chat.tsx`, `scenes/Cam.tsx`, `scenes/Music.tsx`, `scenes/Fx.tsx`, `scenes/Info.tsx`
- Ändern: `settings.ts`, `index.tsx` (`alerts`, `chat`, `cam`, `music`, `fx`, `info`), `theme.css`, `tones.ts`,
  `dachdecker.rs`, Fixture, erzeugte Typen

### Kontext

Kern-Bausteine: `useAlerts`, `describeAlert`, `alertQuote`, `useAlertSounds`, `alertSoundFields`
(`src/core/alerts/alerts.ts`); `useChat`, `<MessageParts>`, `badgeFields` (`src/core/chat`); `useNowPlaying`,
`useTrackProgress`, `useCover`, `<Marquee>` (`src/core/music`); `useFxScene`, `useFxItem`, `<FxMedia>`
(`src/core/fx`, `src/core/FxMedia.tsx`); `INFO_FIELDS`, `useCommands`, `describeCommands` (Befehlsseite). Vom
Alert-Prototyp `refs/alert.html` gilt nur das Schild mit Masslinie.

### Gestaltung

- **Alerts:** Die Masslinie zeichnet sich von der Mitte nach aussen, Text darüber; das Schild öffnet sich von der Mitte;
  Kopfzeile und Name entschlüsseln sich; Zeile und optional das Zitat erscheinen; die Restzeit optional als Masskette,
  die sich zurückzieht; Abgang umgekehrt.
- **Chat:** Zettel mit Name über kurzer Masslinie (Varianten zettel, liste, schlicht), neue Nachrichten öffnen sich wie
  das Schild.
- **Kamera:** Rahmen aus Plan-Linien, Eckmarken, Massketten oben und seitlich, Namensschild als Schriftfeld, Live-Marke.
- **Musik:** Baustellenradio (Variante radio): Gehäuse in `slate`, Puffer und Bügel in `accent`, Gitter in `slateDark`,
  Display in `rain` mit Lauftext (Titel, Künstler), Equalizer, Cover links im Display; Masskette als Fortschritt.
  Varianten schild (Bauplan-Schild) und schlicht.
- **Effekte:** transparent, `<FxMedia>`, optionaler Text im Stil des Titels.
- **Befehlsseite:** Bauplan-Blatt mit Raster und Schriftfeld, Befehle als Schilder.

### Einstellungen (Gruppen dieses Packages)

| Gruppe | Schlüssel (Standard) |
|---|---|
| Alerts | je Art `<art>Tag`, `<art>Line`, `<art>Dim`: Follow ("NEUER FOLLOWER", "{user} deckt jetzt das Dach mit!", "+1 DACHDECKER"), Sub ("NEUES ABO", "{user} geht bei uns in die Lehre!", "+1 AZUBI"), Resub ("ABO x{amount}", "{user} deckt seit {amount} Monaten mit!", "{amount} MONATE"), Gift ("ABOS VERSCHENKT", "{user} stellt {amount} Azubis ein!", "+{amount} AZUBIS"), Raid ("RAID", "{user} rückt mit einer Kolonne von {amount} Leuten an!", "+{amount} KOLONNE"), Bits ("{amount} BITS", "{user} legt {amount} Ziegel aufs Dach!", "+{amount} ZIEGEL"), Kanalpunkte ("KANALPUNKTE", "{user} löst {detail} ein.", "EINGELÖST"), Hype Train ("HYPE TRAIN", "Richtfest! Der Kran fährt hoch!", "RICHTFEST"; Ende "Richtfest Level {amount} geschafft!"); `alertQuote` (an), `quoteFormat`, `alertDuration` (7000 ms), `alertWidth` (720 px), `alertDim` (an), `alertCorners` (an), `alertTimer` (an), `alertOpenMs` (550 ms), `alertCloseMs` (400 ms), `alertSound` (an) und `alertSoundFields` |
| Chat | `chatStyle` (zettel), `chatMax` (6), `chatLifetime` (30 s), `chatWidth` (520 px), `chatNameColor` (kupfer: kupfer, chatter), `chatDim` (an), `chatBadges` und `badgeFields`, `chatOpenMs` (350 ms) |
| Kamera-Rahmen | `camStyle` (plan: plan, ecken, aus), `camLabel` ("{channel}"), `camDims` ("1920 x 1080"), `camDimsOn` (an), `camCorners` (an), `camLive` (an), `camLiveText` ("LIVE") |
| Musik | `musicStyle` (radio: radio, schild, schlicht), `musicLabel` ("BAUSTELLENRADIO"), `musicIdle` ("FUNKSTILLE"), `musicCover` (an), `musicEq` (an), `musicProgress` (an), `musicMarqueeSpeed`, `radioBody` (wie `slate`), `radioBumper` (wie `accent`), `radioDisplay` (wie `rain`), `radioScale` (Faktor 1) |
| Effekte | `fxText` (an), `fxTextSize` (96 px) |
| Befehlsseite | `INFO_FIELDS`, `infoWidth` (900 px) |

### Acceptance Criteria

- [ ] AC1: Jede Alert-Art zeigt ihre Kopfzeile, Zeile und ihren Masslinien-Text mit gefüllten Platzhaltern
      (`describeAlert` mit den eigenen Schlüsseln); mit `alertDim` aus bleibt nur das Schild.
- [ ] AC2: Alle sichtbaren Texte kommen aus Einstellungen; `scripts/rules.check.ts` ist grün.
- [ ] AC3: `radio.ts` liefert geschlossene Pfade für Gehäuse, Puffer, Bügel, zwei Gitter und das Display in einer Box
      von 0 bis 1; das Display liegt mittig zwischen den Gittern.
- [ ] AC4: Musik ohne Titel zeigt `musicIdle`; mit Titel laufen Titel und Künstler im Display, Fortschritt als
      Masskette.
- [ ] AC5 (manuell): Alerts neben dem Schild aus `refs/alert.png`; alle Overlays transparent; Abnahme durch den Nutzer.

### Tests (TDD)

1. `alerts.check.ts > "Texte je Art"` (AC1): `alertTexts(alert, values)` für alle acht Arten und das Hype-Ende
2. `radio.check.ts > "Formen"` (AC3)
3. `settings.check.ts` und `cargo test` wie in Package 1 (AC2)

### Umsetzungsschritte

1. Tests 1 und 2, rot; `alerts.ts`, `radio.ts`, grün.
2. Einstellungen in TS und Rust, Fixture, Typen.
3. Bausteine und Szenen, Töne für Alerts.
4. `npm run verify`, Vorschau, Abnahme.

### Out of Scope

- 3D in Overlays; Clips (4); Minimes (5).

---

## Package 4: Stinger und Banner

**Ziel:** Stinger, Profil- und Offline-Banner rendern deterministisch in 3D.

**Abhängigkeiten:** Package 2, Kern-Plan Grafik Package 4

**Betroffene Dateien:**
- Neu: `stinger.ts`, `stinger.check.ts` (Plattenfeld über das Bild: Klappwinkel je Platte aus der Zeit),
  `banners.ts`, `banners.check.ts` (Profil: Haus im Abendlicht, Offline: Dach im Regen, beide als Standbild), beide mit
  `glClip` und den Modulen aus Package 1 und 2, `render.check.ts`
- Ändern: `render.ts` (`dachdeckerClips` liefert `stinger`, `profile`, `offline`), `settings.ts`, `dachdecker.rs`,
  Fixture, erzeugte Typen

### Kontext

`RenderClip` (`src/core/renderClip.ts`) mit `draw(context, time)`; `glClip` aus dem Kern-Plan Grafik rendert die
Vanilla-Three.js-Szene und kopiert sie in den 2D-Kontext. Regen und Funken im Clip kommen aus `chance` und der Zeit,
nicht aus einem fortlaufenden Zustand: Für jedes Bild wird die Lage jedes Tropfens aus Startwert und `t` berechnet
(Fallweg modulo Fallhöhe).

### Gestaltung

- **Stinger:** Platten klappen reihenweise von unten nach oben ins Bild, am Übergangspunkt ist das Bild voll; ein Glanz
  läuft darüber, Text in der Mitte optional; danach klappen sie von oben nach unten weg.
- **Profil:** Haus aus Package 2 im Abendlicht, Kanalname als Titel, Schriftfeld.
- **Offline:** gedecktes Dach im Regen, "OFFLINE // DACH DICHT"; die Schleife schliesst nahtlos (Regen periodisch in
  der Banner-Dauer).

### Einstellungen (Gruppen dieses Packages)

| Gruppe | Schlüssel (Standard) |
|---|---|
| Stinger | `stingerText` ("{channel}"), `stingerDuration` (2.4 s), `stingerCut` (1.2 s), `stingerRows` (9), `stingerShine` (an), `stingerCopperShare` (15 %) |
| Banner | `profileTitle` ("{channel}"), `profileSubtitle` ("BAUPLAN // RICHTFEST"), `offlineText` ("OFFLINE // DACH DICHT"), `bannerRain` (an), `bannerRainCount` (1200) |

### Acceptance Criteria

- [ ] AC1: `tileAngle(row, col, t)` ist am Übergangspunkt für jede Platte 0 (flach, Bild gedeckt), vorher und nachher
      grösser; Reihen weiter unten klappen früher ein und später aus.
- [ ] AC2: Die Banner sind Standbilder; die Tropfen im Offline-Banner liegen verteilt über die Höhe.
- [ ] AC3: Dieselben Einstellungen ergeben dieselben Bilder (zweimal rendern, gleiche Bytes eines Bildes).
- [ ] AC4 (manuell): Rendern im Dashboard als WebM und GIF; Abnahme durch den Nutzer.

### Tests (TDD)

1. `stinger.check.ts > "gedeckt am Übergang"` (AC1)
2. `banners.check.ts > "Standbild"` (AC2)
3. `render.check.ts > "Clips"` (AC3): Liste der Clips und ihre Felder (`group`, `cut`, Grösse)

### Umsetzungsschritte

1. Tests, rot; `stinger.ts`, `banners.ts`, grün.
2. Einstellungen in TS und Rust, Fixture, Typen; `render.ts`.
3. `npm run verify`, im Dashboard rendern, Abnahme.

### Out of Scope

- Ton im Stinger (der Clip ist stumm wie bei allen Themes).

---

## Package 5: Minimes

**Ziel:** Chatter erscheinen als 3D-Bauplan-Figuren mit Typen, Werkzeugen, Gerüst und eigenen Animationen.

**Abhängigkeiten:** Package 2

**Betroffene Dateien:**
- Neu: `figures.ts`, `figures.check.ts` (Teile einer Figur als Quader und Kugel je Typ, Gelenke, Werkzeuge; Posen je
  Animation als Gelenkwinkel über die Zeit), `three/Figure.tsx`, `three/Ridge.tsx` (Firststreifen am unteren Rand),
  `scenes/Minimes.tsx`, `minimes.css` (Namensschilder)
- Ändern: `settings.ts` (`minimeVariants` mit den fünf Typen, `MINIME_BASE_FIELDS`, `minimeVariantFields(set)`,
  `MINIME_HOP_FIELDS`, `minimeStackFields(set, defaults)`), `index.tsx` (`minimes`), `dachdecker.rs`, Fixture,
  erzeugte Typen

### Kontext

`useMinimes({ catalog, reaction, widthPx, stack })` aus `src/core/hooks/useMinimes.ts`; Typen statt Farben wie in
THEMES.md beschrieben (`MinimeVariantSet`, Befehl `!typ`); Türme aus `src/core/minimeStack.ts` mit den Aktionen
`gather`, `brace`, `climb`, `stacked`, `stackWalk`, `dismount`; Hüpfen aus `src/core/minimeHops.ts`. Die 3D-Figuren
stehen in einer transparenten `Stage3D` (ohne Bloom); die Position in x kommt aus `fromX`/`toX` des Kerns und wird in
Weltkoordinaten umgerechnet.

### Gestaltung

Wie DESIGN-DACHDECKER.md "Figuren": fünf Typen mit Helmfarbe und Werkzeug; eigene Animationen hämmern, messen,
schultern, tragen (mit Stolpern beim Azubi), Plan zeigen, winken, Brotzeit; Reaktion auf Chat: Helm lupfen; Gerüst als
Turm (Azubi unten, Zimmerer Mitte, Polier oben). Namensschilder als Bauplan-Etiketten (2D über der Figur).

### Einstellungen (Gruppen dieses Packages)

| Gruppe | Schlüssel (Standard) |
|---|---|
| Minimes: Aussehen | `minimeSize` (Faktor 1), `minimeRidge` (an), `minimeRidgeHeight` (90 px), `minimeLabels` (an), `minimeLabelSize` (16 px), `helmetDachdecker` (wie `accent`), `helmetZimmerer` (wie `copper`), `helmetSpengler` (wie `line`), `helmetAzubi` (wie `rain`), `helmetPolier` (wie `brick`) |
| Minimes: Animationen | je Animation Häufigkeit und Dauer: `minimeHammerWeight` (6), `minimeHammerMs` (2400 ms), `minimeMeasureWeight` (4), `minimeMeasureMs` (3000 ms), `minimeCarryWeight` (4), `minimeCarryMs` (3500 ms), `minimePlanWeight` (3), `minimePlanMs` (3000 ms), `minimeWaveWeight` (3), `minimeWaveMs` (1800 ms), `minimeSnackWeight` (2), `minimeSnackMs` (6000 ms), `minimeTipMs` (900 ms), `minimeStumble` (an) |
| Minimes: Typen | aus `minimeVariantFields(set)`: Befehl `!typ`, je Typ Name und Chat-Namen |
| Minimes: Türme | aus `minimeStackFields(set, defaults)` mit Türmen an und den Stufen Azubi, Zimmerer, Polier |
| Kern-Gruppen | `MINIME_COMMANDS`, `MINIME_RULES`, `MINIME_MOTION`, `MINIME_HOP` |

### Acceptance Criteria

- [ ] AC1: `figure(type)` liefert für jeden der fünf Typen Kopf, Rumpf, Arme, Beine, Helm und das eigene Werkzeug; alle
      Teile liegen in einer Box von etwa einem Viertel der Firsthöhe.
- [ ] AC2: `pose(animation, t)` ist eine reine Funktion der Zeit und beginnt und endet in der Ruhepose (nahtloser
      Übergang).
- [ ] AC3: Der Katalog nutzt keine Aktionsnamen des Kerns (`COMBAT_ACTIONS`, `STACK_ACTIONS`; geprüft im Kern).
- [ ] AC4: Mit Türmen an stehen drei Figuren der Typen Azubi, Zimmerer und Polier übereinander auf dem Gerüst.
- [ ] AC5 (manuell): `minimes.html?demo&preview` mit Demo-Minimes; Laufen mit Hüpfen, Animationen, Reaktion, Gerüst;
      Abnahme durch den Nutzer.

### Tests (TDD)

1. `figures.check.ts > "Teile je Typ"` (AC1)
2. `figures.check.ts > "Posen beginnen und enden ruhig"` (AC2)
3. `settings.check.ts` und `cargo test` wie in Package 1, Fixture `minime-features.json` unverändert grün (AC3)

### Umsetzungsschritte

1. Tests, rot; `figures.ts`, grün.
2. Einstellungen in TS und Rust (Typen, Türme, Hüpfen), Fixture, Typen.
3. `three/Figure.tsx`, `three/Ridge.tsx`, `scenes/Minimes.tsx`, `minimes.css`.
4. `npm run verify`, Vorschau, Abnahme.

### Out of Scope

- Gefechte und Fraktionen (bewusst nicht in diesem Theme).
