# Plan: Theme "Dogs"

Pixel-Art-Hunde: Sechs Rassen in je mehreren Fellvarianten leben auf einer sonnigen Wiese und in einem Wohnzimmer bei
Nacht. Im Starting wählt ein Pfoten-Marker den Hund des Streamers, im BRB geht er Gassi, im Ending schläft er im
Körbchen; Alerts bringt er mit seinem Spielzeug, bei einem Raid läuft für jeden Raider ein Hund durchs Bild. Chatter
werden als Minimes zu Pixel-Hunden. Gestaltung: [DESIGN-DOGS.md](DESIGN-DOGS.md).

Testbefehl: `npm test` (einzeln: `node <pfad>.check.ts`), Abschluss jedes Packages: `npm run verify`, wo der Server
betroffen ist auch `npm run contract`. Regeln: [CODING-RULES.md](../../../../CODING-RULES.md), Theme-Aufbau:
[THEMES.md](../../../../THEMES.md), Übersicht aller Pläne: [PLAN.md](../../../../PLAN.md).

## Überblick

| # | Package | Ziel in einem Satz | Abhängig von |
|---|---------|--------------------|--------------|
| 1 | Stil-Probe: Kit, Rassen, Starting | Das Theme `dogs` ist wählbar, das Pixel-Kit zeichnet alle sechs Rassen mit echten Abzeichen, Starting läuft; der Nutzer nimmt den Stil ab. | - |
| 2 | BRB, Ending und Skin | Gassi-Runde und Nachtzimmer mit echten Zahlen stehen, der Dashboard-Skin hat seine Szenerie. | 1 (Abnahme), Kern-Plan Statistik |
| 3 | Alerts mit Raid-Rudel | Alerts mit Spielzeug je Art, beim Raid ein Hund je Raider mit Grenze gleichzeitig. | 1, Kern-Plan Alert-Dauer 1 und 2 |
| 4 | Chat, Kamera, Musik, Effekte, Befehlsseite | Die übrigen Overlays zeigen die Schild-Ebene mit Hunden. | 1 |
| 5 | Stinger und Banner | Stinger, Profil- und Offline-Banner rendern deterministisch aus demselben Kit. | 2 |
| 6 | Minimes | Chatter erscheinen als Pixel-Hunde, Typ = Rasse, mit eigenen Animationen. | 1 |

Vorher fertig: [plans/PLAN-TOENE.md](../../../../plans/PLAN-TOENE.md) Package 1 (für die Töne ab Package 1),
[plans/PLAN-ALERTDAUER.md](../../../../plans/PLAN-ALERTDAUER.md) Packages 1 und 2 (für Package 3),
[plans/PLAN-STATS.md](../../../../plans/PLAN-STATS.md) (für Package 2, schon umgesetzt). Parallel möglich nach der
Abnahme von Package 1: 2, 3, 4 und 6 (verschiedene Szenen; gemeinsam sind nur `settings.ts`, `dogs.rs` und die Fixture,
wer später kommt, hängt seine Gruppen an). Package 1 endet mit einer Abnahme; ohne sie beginnt kein weiteres Package.

## Annahmen

- **Name und id** (entschieden 2026-10-21): Anzeigename "Dogs", id `dogs`, Ordner `src/themes/dogs/`, Klassen `dg-*`,
  Keyframes `dogs-*`.
- **Stil** (entschieden 2026-10-21): Pixel Art. Die Prototypen in [refs/](refs/) sind abgenommen (Corgi-Probe, alle
  sechs Rassen, Starting, Alert mit Raid-Rudel, BRB, Ending, Stinger). Nur sie sind Referenzen; jede sichtbare Arbeit
  wird neben ihnen gerendert und erst nach dem OK des Nutzers weitergebaut. 3D und Vektor-Figuren aus Code sind
  verworfen.
- **Technik** (entschieden 2026-10-21):
  - Das Pixel-Kit (Raster, Rassen, Fell, Posen, Welt, Requisiten) ist reines TypeScript in `.ts`-Modulen mit Checks und
    malt in ein Pixelbild (`PixelImage`: Breite, Höhe, Farbe je Pixel oder leer), ohne DOM.
  - Szenen zeigen Hunde, Requisiten und Teilchen auf einer PixiJS-Bühne (`PixiStage` aus `src/core/pixi`): jedes
    Pixelbild wird einmal zur Textur (Skalierung `nearest`, 5-fach), Sprites werden nur noch bewegt. Teilchen (Herzen,
    "Z", Staub, Pfoten) sind reine Funktionen von Startwert und Zeit in `particles.ts` (mit Check); die Bühne setzt jede
    Lage im Ticker aus `clock()`, damit Standbilder mit `?t=` stimmen. Abläufe mit vielen Schritten (Starting, Alert, Ending, Auftritte der
    Schilder) bauen eine GSAP-Timeline über `useTimeline` aus `src/core/motion`.
  - Stinger und Banner malen dasselbe Kit mit Canvas 2D (`draw(context, time)` aus `src/core/renderClip.ts`), als reine
    Funktion der Zeit; Teilchen dort mit `burstAt`, Kurven mit `easeAt`.
  - Die Schild-Ebene ist HTML und CSS (Pixel-Box mit gestuftem Rand aus `box-shadow`).
  - Das Theme steht in `MODULE_THEMES` in `scripts/bundle.ts`.
- **Projektstand geprüft** (2026-10-24, beim Übernehmen der Docs ins Repo): Seit dem Entwurf verlangt `ThemeModule`
  zusätzlich `panel` (Vorlage eines Twitch-Panels im Look des Themes, `src/core/panels.ts`) und `areas` (Grösse der
  OBS-Quellen aus den Werten, `areas.ts` mit `alertArea` und `musicArea` aus `src/core/sceneArea.ts`; Alerts rechnen mit
  `sceneFrame()` statt `innerWidth`). Es gibt die Szene `stats` (Statistik als eigenes Overlay). Banner sind Standbilder
  (das Dashboard speichert ein PNG). `stepParticles` gibt es im Kern nicht mehr. Der Plan ist darauf angepasst.
- **Posen-Cache:** Jede Pose eines Hundes (Bild der Lauf-Schleife, Wedelstufe, Blinzeln, Maul) wird einmal gemalt und
  danach wiederverwendet; im Prototyp kostete ein Bild mit 12 laufenden Hunden damit 0.13 ms statt 4.4 ms. Ändert sich
  eine Fellfarbe, verwirft das Kit die Posen dieses Fells.
- **Alles einstellbar** (entschieden 2026-10-21, Regeln 19 und 20): Texte, Farben (auch jede Fellfarbe), Grössen,
  Zeiten, Häufigkeiten, Mengen, Grenzen (z. B. Raid-Hunde gleichzeitig), Leistungsstufe, jedes Element einzeln an/aus.
  Fest bleiben nur Formen (Raster der Rassen und Requisiten in `.ts`) und Schutzgrenzen, jeweils mit `fixed: <Grund>`.
- **Zahlen in Szenen:** Szenen enthalten keine Zahlen über 1 (Regel aus `scripts/rules.check.ts`); Masse, Raster und
  Zeitpläne liegen in `.ts`-Modulen oder kommen aus den Einstellungen.
- **Zufall:** Flecken, Wolken, Blumen, Raid-Rudel und Pfoten im Stinger kommen aus `hash` (`src/core/hash.ts`) mit
  festen Startwerten, nie aus `Math.random`.
- **Hund des Streamers** (entschieden 2026-10-21): Einstellungen `dog` (Corgi), `coat` (Rot-Weiss), `dogName` ("Bello"),
  in allen Szenen und Clips gleich.
- **Farben** (entschieden 2026-10-21): Signatur `accent` `#c24535` statt `#c94a3a` aus dem Prototyp (Kontrast mit
  Creme 4.7:1 statt 4.33:1). Fellfarben je Rasse und Variante als eigene Einstellungen (18 Varianten mit je Grund,
  Abzeichen, dunkel, Nase), Standards aus den Prototypen.
- **Schrift** (entschieden 2026-10-21): Pixelify Sans, neu in `index.html`; im Feld `font` wählbar mit VT323 (schon
  geladen) und Silkscreen (neu).
- **Raid** (entschieden 2026-10-21): je Raider ein Hund, höchstens `raidMaxOnScreen` (12) gleichzeitig und höchstens
  `raidMaxDogs` (300) insgesamt; der Text nennt immer die echte Zahl. Zeitplan und Dauer aus dem Kern-Plan
  Alert-Dauer.
- **Minimes** (entschieden 2026-10-21): Typen statt Farben, Typ = Rasse (`!rasse`), Fellvariante fest aus dem Login;
  eigene Animationen bellen, schnüffeln, hinlegen, schlafen, Reaktion wedeln; kein Hüpfen, keine Fraktionen, Gefechte
  oder Türme.
- **Ending mit echten Zahlen** (entschieden 2026-10-21): `useStreamStats`, `parseStatLines`, `countedStats` aus dem
  Kern; welche Zahlen mit welchem Text erscheinen, ist eine Einstellung.
- **Töne** (neu geplant 2026-10-23, ersetzt die synthetischen Pieptöne): 26 Töne als OGG-Dateien in
  `src/themes/dogs/sounds/` (zusammen 312 KB), gemacht mit earshot 0.4 aus Bank-Bausteinen und eigenen Hundestimmen,
  angehört und bewertet von earshot; abgespielt über `playClip` aus dem Kern-Plan
  [plans/PLAN-TOENE.md](../../../../plans/PLAN-TOENE.md). Rezepte (`kit.py`, `search.py`, `voices.py`), `kit.json`
  und die Hörseite liegen in `docs/sounds/` und `docs/refs/sounds/`. Jedes Ereignis ist ein `sound`-Feld (eigene Datei
  oder eingebaut, Lautstärke, aus); `soundMaxVoices` (8) begrenzt gleichzeitige Töne. Welche Rasse welche Bellstimme
  hat, ist eine Einstellung (`barkVoice_<rasse>`: klein, mittel, gross). Schnüffeln ist standardmässig aus, weil
  earshot es nicht sicher als Hund erkennt. Die Töne der Hörseite sind abgenommen (2026-10-24).
- **Texte:** deutsch, freundlich, alle als Einstellung; Platzhalter `{channel}`, `{dog}`, `{user}`, `{amount}`,
  `{detail}`, `{text}`.
- **Persönliche Startwerte:** `personalize` setzt `channelName` (Login in Grossbuchstaben).
- **Einfache Ansicht:** Jedes Package markiert seine wichtigsten Felder mit `markBasic` (Liste `BASIC` in `settings.ts`,
  `mark_basic` in Rust), wie in [plans/PLAN-SETTINGS.md](../../../../plans/PLAN-SETTINGS.md).
- **Schema in Rust und TS:** `server-rs/crates/rst-domain/src/themes/dogs.rs` und `src/themes/dogs/settings.ts`, gleich
  gehalten über `server-rs/crates/rst-domain/tests/fixtures/dogs.json` (`node scripts/dumpSchema.ts`),
  `src/generated/themes/dogs.ts` per `npm run gen:types`. Die Fellfelder entstehen auf beiden Seiten aus einer Tabelle
  der Rassen und Varianten (TS `coatFields`, Rust eine Schleife über dieselbe Tabelle). Jedes Package ergänzt beide
  Seiten im selben Commit.
- **Kein Vorbild:** Das Theme ist keinem Werk nachempfunden.
- **Ablage der Docs:** Diese Dokumente und die Prototypen kommen erst mit Package 1 ins Repo (`src/themes/dogs/docs/`,
  Prototypen nach `docs/refs/`); so bleibt `registry.check.ts` bis dahin grün.
- **Commit-Grösse:** Packages 1, 3 und 6 liegen voraussichtlich über der Richtgrösse von 400 Zeilen; bewusste
  Ausnahme, steht in der Commit-Beschreibung. Commit je Package nach grünem `npm run verify` und Freigabe, nie pushen.
- **Manuelle Checks:** Vorschau `http://localhost:5173/<szene>.html?demo&preview`, Viewport 1600x900; Standbilder mit
  `?t=<sekunden>`. Nach jedem Package mit sichtbarer Arbeit Bilder neben den Prototypen zeigen und auf das OK warten.
- **OBS:** PixiJS braucht die Hardware-Beschleunigung der Browserquelle; die Leistungsstufe (`quality`) senkt Wolken,
  Blumen, Teilchen und die Grenze der Raid-Hunde.

---

## Package 1: Stil-Probe: Kit, Rassen, Starting

**Ziel:** Das Theme `dogs` ist wählbar, das Pixel-Kit zeichnet alle sechs Rassen mit echten Abzeichen, Starting läuft;
der Nutzer nimmt den Stil ab.

**Abhängigkeiten:** keine

**Betroffene Dateien:**

Neu in `src/themes/dogs/`:
- `pixels.ts`, `pixels.check.ts`: `PixelImage`, `pixelGrid(width, height)`, Formen `ellipse`, `polygon`, `rect`, `line`
  (optional nur auf erlaubte Schlüssel), `outline` (Kontur um alles Gefüllte), `shadeRims` (Licht oben und rechts,
  Schatten unten und links), `paintImage(grid, palette)` (Schlüssel zu Farbe, Rand-Merker zu Licht oder Schatten)
- `breeds.ts`, `breeds.check.ts`: `BREEDS` (sechs Rassen: Raster, Körperformen, Ohren, Schwanz, Hüftpunkte, Auge, Maul,
  Marke, Muster) als Daten; `buildBreed(id)` liefert Körper-Raster, Schwanz-Stufen und Beinpunkte
- `coats.ts`, `coats.check.ts`: `COATS` (18 Varianten mit Name, Muster und Standardfarben), `coatPalette(values, breed,
  coat)` (Palette aus den Einstellungen), `markings(breed, pattern)` (Abzeichen als Raster: Sattel, Urajiro, Sesam, Loh,
  Maske, Flecken)
- `poses.ts`, `poses.check.ts`: `poseAt({ time, mode, fps, wagSpeed })` liefert den diskreten Zustand (Bild der
  Lauf-Schleife, Wedelstufe, Blinzeln, Maul), `poseKey(state)`; `LEG_CYCLE` (6 Bilder)
- `dog.ts`, `dog.check.ts`: `paintDog(breed, palette, state)` liefert das `PixelImage` einer Pose (Schwanz, ferne Beine,
  Körper, Auge und Maul, nahe Beine; liegen mit Vorderpfoten), `dogCache(breed, palette)` (Posen-Cache, Schlüssel
  `poseKey`)
- `world.ts`, `world.check.ts`: Wiese als Pixelbilder (`skyBands`, `cloud`, `hill`, `tree`, `fence`, `meadow`,
  `cushion`), Mengen aus den Einstellungen
- `props.ts`, `props.check.ts`: Sprites als Zeilen (Herz, Pfote, Ball, Knochen, Frisbee, Leckerli, "Z", Schmetterling)
- `starting.ts`, `starting.check.ts`: `startingPlan(values, sizes)` liefert Plätze der Reihe, Ankunft je Hund,
  Reihenfolge des Markers (bis zum gewählten Hund und zurück), Landen, Sprung, Weg zum Teppich, Bellen; alles in
  Pixeln und Sekunden aus den Einstellungen
- `pixi/useDogStage.ts` (Hook: legt auf der `PixiStage` die Ebenen Welt, Hunde, Teilchen an, macht Pixelbilder zu
  Texturen mit `nearest`, räumt auf), `pixi/textures.ts` (Pixelbild zu Textur, in `WITHOUT_CHECK`, braucht WebGL)
- `ui/PixelBox.tsx`, `ui/Pill.tsx`, `ui/Bubble.tsx` (Schild-Ebene)
- `settings.ts`, `settings.check.ts`, `useDogs.ts`, `index.tsx` (nur `starting`), `theme.css`, `scenes/Starting.tsx`
- `render.ts` mit `dogsClips = () => []` (Clips in Package 5) und `dogsPanel` (Panel-Vorlage: Creme-Box mit Tintenrand,
  roter Pfoten-Pille und Titel in Pixelify Sans, aus `rectLayer` und `textLayer`)
- `areas.ts`, `areas.check.ts`: `dogsAreas(values)` (ab Package 3 Alerts, ab Package 4 Musik und Statistik; hier noch
  ohne Einträge, also `SCENE_SIZES`)
- `particles.ts`, `particles.check.ts`: Herzen, "Z", Staub und Pfoten als reine Funktionen von Startwert und Zeit
- `sounds.ts`, `sounds.check.ts`: Tabelle Ereignis zu Datei (Vite-Import `?url`) und Einstellung, `barkVoiceOf(breed,
  values)`, `playDogSound(event, values)` über `playSound` und `playClip`; Check: jedes Ereignis hat Datei und Feld
- `sounds/` mit den Tönen dieses Packages (`starting-land`, `starting-hop`, `starting-chosen`, `starting-card`,
  `alert-bark-small`, `alert-bark-medium`, `alert-bark-big` als OGG)
- `docs/` mit DESIGN-DOGS.md, PLAN-DOGS.md, `docs/refs/` (Prototypen und Screenshots aus dem Scratchpad),
  `docs/refs/sounds/` (Hörseite) und `docs/sounds/` (Rezepte `voices.py`, `search.py`, `kit.py`, Ergebnisse
  `search-*.json`, `kit.json`)

Ändern:
- `src/themes/registry.ts` (`THEME_MODULES`), `src/themes/scenes.tsx` (`THEME_VIEWS`), `scripts/dumpSchema.check.ts`
- `src/themes/registry.ts` (`{ schema, clips, panel, areas }`), `scripts/bundle.ts` (`MODULE_THEMES` um `dogs`
  ergänzen), `scripts/rules.check.ts` (`WITHOUT_CHECK`:
  `pixi/textures.ts`)
- `server-rs/crates/rst-domain/src/themes/dogs.rs` (neu), `themes/mod.rs`, `themes/registry.rs` (`THEMES`),
  `server-rs/crates/rst-domain/tests/fixtures/dogs.json` (neu), `src/generated/themes/dogs.ts` (erzeugt),
  `src/themes/generatedValues.check.ts`
- `src/dashboard/skin.ts` (`SKINS`), `src/dashboard/skins.css` (Block `[data-skin="dogs"]` mit den Tokens aus
  DESIGN-DOGS.md, noch ohne Szenerie)
- `index.html` (Pixelify Sans 400 bis 700, Silkscreen 400 und 700)
- `PLAN.md` (Zeile in "Weitere Pläne"), `DESIGN.md` (Zeile in der Theme-Tabelle), `README.md` (Liste der Themes)

### Kontext

Ein Theme ist ein Ordner und zwei Einträge (`THEME_MODULES`, `THEME_VIEWS`); `registry.check.ts`, `skin.check.ts` und
`renderers.check.ts` prüfen das. Starting nutzt `useStage` und `useScreen` aus `src/core/screens` (Countdown,
`?ticker`, `?next`). Die Bühne kommt aus `src/core/pixi/PixiStage.tsx`, Timelines aus
`src/core/motion/useTimeline.ts`. Die Prototypen `refs/pixeldogs.js` (Kit mit Posen-Cache), `refs/pxworld.js` (Welt und
Requisiten) und `refs/px-starting.html` zeigen Formen, Masse und Ablauf; ihre Zahlen werden Standardwerte. Die
Abzeichen sind im Prototyp noch Farbflächen; dieses Package zeichnet sie richtig (siehe DESIGN-DOGS.md "Fell").

### Gestaltung

- **Rassen:** wie DESIGN-DOGS.md "Bildsprache" und "Figuren"; Corgi mit grösseren Ohren und kürzerem Hals als im
  Prototyp. Ein Übersichtsbild aller Rassen und Varianten in allen Posen (Demo-Seite `starting.html?demo&preview&sheet`)
  dient der Abnahme.
- **Starting:** Wiese (Himmel bis 120 px, Hügel, vier Bäume, Zaun bei 107 px, Wiese ab 120 px), sechs Kissen in einer
  Reihe (Füsse bei 150 px), roter Teppich vorn in der Mitte (202 px). Ablauf (Standard): Hunde fallen ab 0.4 s
  nacheinander (je 0.2 s versetzt) mit Überschwingen; Marker ab 2.6 s, 0.45 s je Sprung, über die Reihe und zurück bis
  zum gewählten Hund; Hunde unter dem Marker bellen; Landung mit sieben Herzen, Sprung 0.4 s, Lauf zum Teppich mit
  48 px/s, Bellen 0.5 s nach Ankunft und dann alle 7 s; Karte 0.2 s nach dem Bellen.
- **Schild-Ebene:** Pille oben mittig, Titel mit Kontur, Unterzeile, Countdown-Box unten links, Karte unten rechts,
  Etiketten unter den Kissen (verblassen nach der Ankunft), Sprechblase neben dem Kopf.

### Einstellungen (Gruppen dieses Packages)

| Gruppe | Schlüssel (Standard) |
|---|---|
| Allgemein | `channelName` ("RUDEL-STREAM"), `font` (Pixelify Sans: Pixelify Sans, VT323, Silkscreen), `fontSize` (26 px), `titleSize` (100 px), `cream` (`#fff6e6`), `edge` (`#e9d2bd`), `ink` (`#2e1d14`), `textColor` (`#4a3426`), `muted` (`#7a5a46`), `accent` (`#c24535`), `onAccent` (`#fff6e6`), `ball` (`#ffd23f`), `boxShadow` (28 %), `quality` (mittel: hoch, mittel, niedrig), `pixelScale` (5) |
| Hund | `dog` (Corgi: sechs Rassen), `coat` (Rot-Weiss), `dogName` ("Bello"), `dogEye` (`#1d1412`), `dogTongue` (`#e98a95`), `blinkEvery` (3.3 s), `wagSpeed` (10), `walkFps` (9), `pant` (an), je Rasse `barkVoice_<rasse>` (klein: Corgi, Dackel, Mops; mittel: Shiba; gross: Labrador, Dalmatiner) |
| Töne | `soundMaxVoices` (8), `soundStartingLand` (eingebaut, 40 %), `soundStartingHop` (eingebaut, 40 %), `soundStartingChosen` (eingebaut, 60 %), `soundStartingCard` (eingebaut, 50 %), `soundBark` (eingebaut, 70 %), `startingBarkSound` (an) |
| Fell: Corgi, Fell: Shiba, Fell: Labrador, Fell: Dalmatiner, Fell: Dackel, Fell: Mops | je Variante `<rasse><Variante>Base`, `...Mark`, `...Dark`, `...Nose` (Standards aus `refs/pixeldogs.js`, z. B. `corgiRotweissBase` `#cc7633`), Dalmatiner zusätzlich `dalmatinerSpots` (Anteil 42 %), `spotSeed` (1) |
| Welt | `sky` (`#9fd6ff`), `skyLow` (`#e3f5ff`), `grass` (`#86c45f`), `grassLight` (`#a3d97a`), `hillColors` (drei Grüntöne), `treeTrunk` (`#a8754a`), `treeLeaf` (`#6fbf5a`), `fence` (an), `clouds` (6), `cloudSpeed` (4 px/s), `trees` (an), `flowers` (56), `flowerColors` (Weiss, Gelb, Rosa, Flieder) |
| Starting | `startingPill` ("RUDEL-STREAM"), `startingTitle` ("Gleich geht's los!"), `startingSubtitle` ("Wer begleitet uns heute?"), `countdown`, `countdownLabel` ("LOS GEHT'S IN"), `cardLabel` ("HEUTE AN MEINER SEITE"), `cardBreed` ("{breed} · {coat}"), `bark` ("Wuff!"), `cushionColors` (sechs Pastelltöne), `rugColor` (`#c24535`), `dropEvery` (0.2 s), `markerStart` (2.6 s), `markerHop` (0.45 s), `hearts` (7), `walkSpeed` (48 px/s), `barkEvery` (7 s), `labels` (an), `ticker` (""), `tickerSpeed` |

### Acceptance Criteria

- [ ] AC1: `dogs` steht in `THEME_MODULES`, `THEME_VIEWS`, `SKINS`, `MODULE_THEMES` und in Rust `THEMES`;
      `registry.check.ts`, `skin.check.ts`, `dumpSchema.check.ts` und der Bundle-Check sind grün.
- [ ] AC2: Das Rust-Schema gleicht dem TS-Schema (Fixture-Test in `dogs.rs`), `personalize("neo")` ergibt
      `{ channelName: "NEO" }`; jede der 18 Varianten hat vier Fellfelder auf beiden Seiten.
- [ ] AC3: `outline` setzt um jedes gefüllte Pixel eine Kontur, nie in gefüllte Pixel; `shadeRims` markiert oben und
      rechts Licht, unten und links Schatten, nur auf Fellflächen.
- [ ] AC4: Jede Rasse passt in ihr Raster (Corgi 52 x 34 bis Mops 44 x 36), steht mit allen Pfoten auf der Fusszeile,
      hat genau ein Auge 2 x 2 und eine Nase 2 x 2; Corgi-Ohren sind mindestens 8 Pixel hoch.
- [ ] AC5: `markings` liefert je Muster eine nicht leere Fläche innerhalb des Körpers (Sattel auf dem Rücken, Urajiro
      an Brust und Wangen, Loh über den Augen und an den Pfoten, Maske an der Schnauze); Flecken sind deterministisch,
      ihr Anteil liegt bei `dalmatinerSpots` plus minus 8 Prozentpunkte, kein Streifen über 4 Pixel.
- [ ] AC6: `poseAt` liefert in einer Sekunde Laufen mit `walkFps` 9 genau 9 Bilder der 6er-Schleife; `poseKey` ist für
      gleiche Zustände gleich; der Cache malt jede Pose höchstens einmal.
- [ ] AC7: `startingPlan` setzt keinen Platz der Reihe ausserhalb von 0 bis 384 px, keine zwei Hunde übereinander; der
      Marker landet auf dem gewählten Hund; mit `dog: "mops"` endet die Reihenfolge auf Platz 6.
- [ ] AC8: `auditTheme` findet keinen ungenutzten Schlüssel, die Standardwerte bestehen das Schema;
      `scripts/rules.check.ts` ist grün (keine Farbliterale, keine Zahlen über 1 in Szenen).
- [ ] AC9 (manuell): Das Übersichtsbild aller Rassen liegt neben `refs/shots/sheet.png`, Starting bei `?t=6.2` und
      `?t=12` neben `refs/shots/s1.png` und `s2.png`; Proportionen, Kontur, Farben und Ablauf treffen die Prototypen,
      die Abzeichen sind echte Formen. Der Nutzer nimmt den Stil ab.

### Tests (TDD)

Reihenfolge: Test schreiben, rot, minimal implementieren, grün, refactoren.

1. `src/themes/dogs/pixels.check.ts > "Kontur und Schattierung"` (AC3)
   - Gegeben: ein Raster 8 x 8 mit einer Ellipse
   - Erwartet: Kontur rundum, keine Lücke, Licht nur oben und rechts, Schatten nur unten und links
2. `breeds.check.ts > "Rassen"` (AC4): je Rasse Raster, Fusszeile, Auge, Nase, Corgi-Ohren
3. `coats.check.ts > "Abzeichen"` (AC5): je Muster Fläche innerhalb des Körpers; Flecken zweimal gleich, Anteil, keine
   Streifen; `coatPalette` liest die Werte der Einstellungen
4. `poses.check.ts > "Posen"` (AC6) und `dog.check.ts > "Cache"` (AC6)
5. `starting.check.ts > "Reihe und Marker"` (AC7): Standardwerte, `dog: "mops"`, `dog: "corgi"`
6. `settings.check.ts > "Schema"` (AC8): `auditTheme(dogsSettings)` ohne Befund
7. `cargo test` in `dogs.rs > same_as_typescript`, `personalize_sets_channel_name`, `coat_fields_for_every_variant` (AC2)

### Umsetzungsschritte

1. Prototypen und Screenshots nach `src/themes/dogs/docs/refs/` kopieren, die Docs nach `docs/`.
2. Tests 1 bis 5 schreiben, rot; `pixels.ts`, `breeds.ts`, `coats.ts`, `poses.ts`, `dog.ts`, `world.ts`, `props.ts`,
   `starting.ts` aus dem Prototyp übertragen (Namen nach Regel 9, keine Abkürzungen), Abzeichen neu zeichnen, grün.
3. Schema `settings.ts` mit `coatFields` aus `COATS`, `useDogs.ts`, Test 6; `dogs.rs` mit derselben Tabelle, Fixture,
   `npm run gen:types`, Test 7.
4. `pixi/useDogStage.ts`, `pixi/textures.ts`, Schild-Bausteine, `scenes/Starting.tsx` mit `useTimeline`, `theme.css`.
5. Registrierung, Skin-Tokens, `index.html`, `MODULE_THEMES`, Einträge in `PLAN.md`, `DESIGN.md`, `README.md`.
6. `npm run verify`; Renders neben die Prototypen legen, dem Nutzer zeigen, auf das OK warten.

### Out of Scope

- Szenerie des Skins (Package 2), alle anderen Szenen und Clips.

---

## Package 2: BRB, Ending und Skin

**Ziel:** Gassi-Runde und Nachtzimmer mit echten Zahlen stehen, der Dashboard-Skin hat seine Szenerie.

**Abhängigkeiten:** Package 1 (Abnahme), [plans/PLAN-STATS.md](../../../../plans/PLAN-STATS.md)

**Betroffene Dateien:**
- Neu: `walk.ts`, `walk.check.ts` (`walkDistance(time, values)`: Strecke als geschlossene Funktion der Zeit mit Gehen,
  Abbremsen, Schnüffeln, Anfahren; `sniffing(time, values)`; Leine als Bogen `leashPoints`), `room.ts`, `room.check.ts`
  (Zimmer als Pixelbilder: Wand, Dielen, Fenster mit Sternen, Bild, Tisch, Lampe, Teppich, Körbchen vorn und hinten),
  `ending.ts`, `ending.check.ts` (Zeitplan: Hereinlaufen, Stehen, Hinlegen, Schlafen, "Z", Licht)
- Neu: `scenes/Brb.tsx`, `scenes/Ending.tsx`; Töne `sounds/brb-sniff.ogg`, `sounds/brb-steps.ogg`,
  `sounds/ending-lie.ogg`, `sounds/ending-lamp.ogg`, `sounds/ending-snore.ogg`
- Ändern: `settings.ts`, `dogs.rs`, Fixture, `src/generated/themes/dogs.ts`, `index.tsx` (`brb`, `ending`),
  `theme.css`, `sounds.ts` (Liste der Töne)
- Ändern: `src/dashboard/Scenery.tsx` (Szenerie `dogs`), `src/dashboard/skins.css` (Szenerie und `--dash-max`)

### Kontext

BRB nutzt `useScreen` (Pausenzeit), Ending `useStreamStats`, `parseStatLines` und `countedStats` aus `src/core/stats`.
Die Prototypen `refs/px-brb.html` und `refs/px-ending.html` zeigen Ablauf und Masse. Schritte im BRB sind Strecke durch
`stepPx`; die Strecke ist eine geschlossene Funktion der Zeit, damit Standbilder mit `?t=` stimmen.

### Gestaltung

- **BRB:** wie DESIGN-DOGS.md; Hund bei x 200 px, Füsse bei 198 px, Weg 186 bis 206 px; Parallaxe Wolken 0.05,
  Hügel 0.15, Bäume 0.45, Zaun und Wiese 0.8, Weg 1; Periode 9 s (6 s gehen, 0.5 s bremsen, 2 s schnüffeln, 0.5 s
  anfahren), 24 px/s; Leine hinter dem Hund mit Durchhang 8 px (gehend) und 16 px (stehend); Schmetterling kreist.
- **Ending:** wie DESIGN-DOGS.md; Hereinlaufen 2.2 s von rechts, Hinlegen bei 2.8 s, Schlafen ab 4.0 s mit drei "Z"
  (1.8 s je Aufstieg), Licht von 5 s bis 7.5 s auf 35 %, Raum dunkelt entsprechend ab; Karte mit Zahlen zählt hoch.
- **Skin-Szenerie:** wie DESIGN-DOGS.md "Dashboard-Skin" (SVG-Rechtecke, kein WebGL im Dashboard).

### Einstellungen (Gruppen dieses Packages)

| Gruppe | Schlüssel (Standard) |
|---|---|
| BRB | `brbPill` ("GASSI-PAUSE"), `brbTitle` ("Bin gleich zurück!"), `brbSubtitle` ("{dog} und ich drehen eine Runde."), `brbPauseLabel` ("PAUSE SEIT"), `brbStepsLabel` ("SCHRITTE"), `brbSniff` ("Schnüff!"), `walkPxPerSecond` (24), `walkPeriod` (9 s), `sniffSeconds` (2 s), `stepPx` (3), `leash` (an), `leashColor` (`#c24535`), `leashSag` (8 px), `butterfly` (an), `butterflyColor` (`#f7a6c1`), `pathColor` (`#e3c49a`), `parallax` (an) |
| Ending | `endingTitle` ("Gute Nacht!"), `endingSubtitle` ("Danke fürs Zuschauen. {dog} schläft schon."), `endingBye` ("Bis zum nächsten Mal!"), `endingCardLabel` ("HEUTE IM RUDEL"), `endingStats` (Zeilen "follows\|neue Follower", "subs\|Abos", "raids\|Raids"), `night` (`#3b3a63`), `nightSub` (`#f1dcc0`), `floor` (`#7d5233`), `rug` (`#8f6fc7`), `lamp` (`#ffe9a8`), `basket` (`#c48a4f`), `pillow` (`#ffc9d9`), `stars` (16), `moon` (an), `lampDim` (35 %), `lampDimFrom` (5 s), `lampDimTo` (7.5 s), `zzz` (an), `zzzEvery` (1.8 s) |
| Töne | `soundBrbSniff` (eingebaut, aus), `soundBrbSteps` (eingebaut, aus), `soundEndingLie` (eingebaut, 50 %), `soundEndingLamp` (eingebaut, 40 %), `soundEndingSnore` (eingebaut, 30 %), `snoreEvery` (4 s) |

### Acceptance Criteria

- [ ] AC1: `walkDistance` ist stetig und nie fallend; in einer Periode legt der Hund `walkPxPerSecond` mal 6.5 s zurück;
      `sniffing` ist genau zwischen 6.4 s und 8.6 s der Periode wahr.
- [ ] AC2: `leashPoints` beginnt am Halsband und endet ausserhalb des Bildes oben rechts; der Durchhang ist stehend
      grösser als gehend.
- [ ] AC3: `room` setzt das Körbchen so, dass der liegende Hund mit dem unteren Rand hinter dem vorderen Rand liegt; die
      Sterne sind deterministisch.
- [ ] AC4: `ending.ts` liefert die Zeiten aus der Gestaltung; das Licht geht von 1 auf `lampDim`.
- [ ] AC5: Ending zeigt die Zeilen aus `endingStats` mit `countedStats`; in `?demo` die Demo-Werte.
- [ ] AC6: `skin.check.ts` grün, die Szenerie erscheint nur im Skin `dogs`.
- [ ] AC7 (manuell): BRB bei `?t=3.3` und `?t=16.5`, Ending bei `?t=1.2` und `?t=8` neben den Prototypen; der Nutzer
      nimmt ab.

### Tests (TDD)

1. `walk.check.ts > "Strecke und Schnüffeln"` (AC1), `"Leine"` (AC2)
2. `room.check.ts > "Körbchen und Sterne"` (AC3)
3. `ending.check.ts > "Ablauf"` (AC4)
4. `settings.check.ts > "Schema"`, `cargo test` in `dogs.rs`

### Umsetzungsschritte

1. Tests 1 bis 3, rot; `walk.ts`, `room.ts`, `ending.ts`, grün.
2. Szenen mit `useDogStage` und `useTimeline`, Töne über `sounds.ts`, Schema beider Seiten.
3. Szenerie im Dashboard, `npm run verify`, Renders zeigen, OK abwarten.

### Out of Scope

- Wetter im BRB, mehrere Hunde im Ending.

---

## Package 3: Alerts mit Raid-Rudel

**Ziel:** Alerts mit Spielzeug je Art, beim Raid ein Hund je Raider mit Grenze gleichzeitig.

**Abhängigkeiten:** Package 1, [plans/PLAN-ALERTDAUER.md](../../../../plans/PLAN-ALERTDAUER.md) Packages 1 und 2

**Betroffene Dateien:**
- Neu: `alert.ts`, `alert.check.ts` (Zeitplan eines Alerts: Hereinrennen, Fallenlassen mit Hüpfen, Bellen, Karte,
  Aufheben, Hinausrennen; bei Raid verlängert bis nach dem Rudel; Bellen alle `raidBarkEvery`), `toy.ts`, `toy.check.ts`
  (`toyHeight(time)` als geschlossene Funktion der Hüpfer)
- Neu: `scenes/Alerts.tsx`
- Neu: Töne `sounds/alert-run.ogg`, `alert-toy-ball.ogg`, `alert-toy-bone.ogg`, `alert-toy-frisbee.ogg`,
  `alert-toy-treat.ogg`, `alert-card.ogg`, `alert-leave.ogg`, `alert-raid.ogg`
- Ändern: `settings.ts`, `dogs.rs`, Fixture, erzeugte Typen, `index.tsx` (`alerts`), `theme.css`, `sounds.ts`,
  `areas.ts` (Alerts mit `alertArea`: Karte plus Laufbahn des Rudels, die Szene rechnet mit `sceneFrame()`)

### Kontext

`useAlerts` mit Dauer je Alert (Kern-Plan Alert-Dauer 1): die Funktion rechnet bei `raid` die Dauer aus `raidPack`
(Kern-Plan Alert-Dauer 2) mit den Einstellungen dieses Packages. Texte kommen aus `describeAlert` mit
`alertTextKeys("Tag")`. Töne: eine eigene Datei je Art aus `alertSoundFields` ersetzt die ganze Folge; eingebaut
spielt die Szene die Folge zu den Zeitpunkten des Ablaufs (Trappeln, Spielzeug der Art, "Wuff" in der Stimme der Rasse,
Karte, Hinausrennen), beim Raid Trappeln und Bellen des Rudels über `playClip` mit `soundMaxVoices`. Der Prototyp `refs/px-alert.html` zeigt Ablauf, Spielzeug und
Rudel; dort gemessen: 5, 15, 50, 100, 500 und 1000 Raider laufen alle, nie mehr als 12 gleichzeitig, Dauer 8.2 s bis
206.8 s. Aussehen je Raider: Rasse und Fellvariante aus `pick` des Laufs, Texturen aus dem Posen-Cache je Rasse und
Fell (höchstens 18 Caches, unabhängig von der Zahl der Raider).

### Gestaltung

- Wie DESIGN-DOGS.md "Alerts". Hund läuft auf 200 px, stoppt bei x 92 px; Karte rechts oberhalb der Laufbahn (oben
  440 px auf der Bühne), damit kein Kopf verdeckt wird; Sprechblase neben dem Kopf.
- Spielzeug je Art (Standard): Follow Ball, Abo Knochen, Bits Frisbee, Spende Leckerli, Raid Ball.
- Raid: Rudel hinter dem Hund des Streamers, vier Spuren (0, 3, 6, 9 px höher, ferne zuerst gezeichnet), Tempo-Streuung
  20 %, Hund wartet mit der Karte und bellt alle 5 s; danach Aufheben und Hinausrennen wie sonst.

### Einstellungen (Gruppen dieses Packages)

| Gruppe | Schlüssel (Standard) |
|---|---|
| Alerts | Texte je Art über `alertTextKeys` (z. B. `followTag` "NEUER FOLLOWER", `followLine` "gehört jetzt zum Rudel!", `raidLine` "kommt mit {amount} Hunden vorbei!", `raidLineOne` "kommt mit einem Hund vorbei!"), `alertDuration` (8.2 s), `alertBark` ("Wuff!"), Spielzeug je Art (`toyFollow` Ball, `toySub` Knochen, `toyCheer` Frisbee, `toyDonation` Leckerli, `toyRaid` Ball, `toyRedeem` Ball, `toyGift` Knochen, `toyHype` Frisbee), `toyColors` (Ball `#ffd23f`, Knochen `#fff6e6`, Frisbee `#c24535`, Leckerli `#a8754a`), `runSpeed`, `dropBounce` (14 px), `cardTop` (440 px), `alertSize` (60 %, Karte und Hunde kleiner, Boden und Quelle gleich), eigene Dateien je Art über `alertSoundFields`, eingebaut `soundAlertRun` (50 %), `soundAlertToy` (50 %), `soundAlertCard` (50 %), `soundAlertLeave` (40 %) |
| Raid | `raidPack` (an), `raidMaxOnScreen` (12), `raidMaxDogs` (300), `raidCrossMs` (2400 ms), `raidSpeedSpread` (20 %), `raidLanes` (4), `raidLaneGap` (3 px), `raidBarkEvery` (5 s), `raidSeed` (1), `raidBreeds` (alle sechs an), `soundRaid` (eingebaut, 50 %), `raidBarkShare` (25 % der Läufe bellen beim Erscheinen) |

### Acceptance Criteria

- [ ] AC1: `alert.ts` liefert ohne Raid die Zeiten des Prototyps (Stopp 1.25 s, Fallen 1.3 s, Karte 1.4 s, Bellen
      2.0 s, Aufheben 5.85 s, Rennen 6.2 s, Ende 8.2 s).
- [ ] AC2: Mit Raid endet das Warten 0.3 s nach dem letzten Lauf des Rudels; die Dauer des Alerts für 5, 15, 50, 100,
      500 und 1000 Raider stimmt mit den Messungen im Kontext überein (Grenze 12, `raidMaxDogs` hoch genug).
- [ ] AC3: Mit `raidMaxDogs` 300 laufen bei 1000 Raidern 300 Hunde, der Text nennt 1000.
- [ ] AC4: `toyHeight` ist am Boden 0, steigt nie über `dropBounce` und kommt nach drei Hüpfern zur Ruhe.
- [ ] AC5: Die Szene zeichnet je Bild nur die laufenden Hunde (`runnersAt`) und baut höchstens 18 Posen-Caches.
- [ ] AC6 (manuell): Standbilder mit `type=raid` und 5, 15, 1000 Raidern sowie `type=follow` und `type=sub` neben
      `refs/shots/r5.png`, `r1000.png`, `a1.png`; der Nutzer nimmt ab.

### Tests (TDD)

1. `alert.check.ts > "Ablauf"` (AC1), `"Raid verlängert"` (AC2), `"Höchstzahl"` (AC3)
2. `toy.check.ts > "Hüpfen"` (AC4)
3. `settings.check.ts > "Schema"`, `cargo test` in `dogs.rs`

### Umsetzungsschritte

1. Tests, rot; `alert.ts`, `toy.ts`, grün.
2. `scenes/Alerts.tsx` mit `useAlerts(alert => ...)`, Rudel über `runnersAt`, GSAP für Karte und Blase.
3. Schema beider Seiten, `npm run verify`, Renders zeigen, OK abwarten.

### Out of Scope

- Rudel für andere Alert-Arten, Namen der Raider.

---

## Package 4: Chat, Kamera, Musik, Effekte, Befehlsseite

**Ziel:** Die übrigen Overlays zeigen die Schild-Ebene mit Hunden (dazu die Statistik).

**Abhängigkeiten:** Package 1

**Betroffene Dateien:**
- Neu: `lookOf.ts`, `lookOf.check.ts` (`lookOf(login, values)`: Rasse und Fell aus `seedOf(login)` und `hash`, nur aus
  erlaubten Rassen), `peek.ts`, `peek.check.ts` (Ausschnitt "Kopf und Pfoten" eines Hundes für den Chat),
  `headphones.ts` (Kopfhörer als Pixelbild je Rasse, Check in `peek.check.ts`)
- Neu: `scenes/Chat.tsx`, `scenes/Cam.tsx`, `scenes/Music.tsx`, `scenes/Fx.tsx`, `scenes/Info.tsx`, `scenes/Stats.tsx`
  (Statistik als Reihe von Pixel-Boxen mit `countedStats`), `overlays.css`
- Ändern: `settings.ts`, `dogs.rs`, Fixture, erzeugte Typen, `index.tsx`, `areas.ts` (Musik mit `musicArea`,
  Statistik aus der Zahl der Zeilen)

### Kontext

Chat: `useChat`, `<MessageParts>`, `badgeFields`, `badgeLabel`. Musik: `useNowPlaying`, `useTrackProgress`,
`useCover`, `<Marquee>`. Effekte: `useFxScene`, `useFxItem`, `<FxMedia>`. Befehlsseite: `INFO_FIELDS`, `INFO_GROUP`,
`useCommands`, `describeCommands`. Kleine Hunde neben Schildern laufen auf einer `PixiStage` je Szene; mit niedriger
Leistungsstufe stehen sie still (eine Textur je Hund).

### Gestaltung

- Wie DESIGN-DOGS.md "Chat", "Kamera", "Musik", "Effekte", "Befehlsseite".
- Chat: Hund des Chatters schaut links neben dem Schild hervor (Kopf und Pfoten), wedelt beim Erscheinen.
- Musik: Fortschritt als Pfotenspur, Hund wippt im Takt (Standard 2 Wipper je Sekunde), Cover optional.

### Einstellungen (Gruppen dieses Packages)

| Gruppe | Schlüssel (Standard) |
|---|---|
| Chat | `chatStyle` (mit Hund: mit Hund, Schilder, schlicht), `chatMax` (6), `chatWidth` (480 px), `chatDogs` (an), `chatBreeds` (alle sechs an), `chatNameColor` (`#c24535`), Abzeichen über `badgeFields` |
| Kamera | `camRoof` (an), `camRoofColor` (`#c24535`), `camDog` (an), `camLabel` ("{channel}"), `camBorder` (5 px) |
| Musik | `musicStyle` (mit Hund: mit Hund, Schild, schlicht), `musicCover` (an), `musicLabel` ("JETZT LÄUFT"), `musicBob` (2 pro s), `musicPaws` (an), `marqueeSpeed` (40 px/s), `hideWhenPaused` (an) |
| Effekte | Kern-Felder `fxMax`, `fxDuration`, `fxSize`, `fxMargin`, dazu `fxText` ("") |
| Befehlsseite | `INFO_FIELDS`, `infoBackground` (Wiese: Wiese, Creme) |

### Acceptance Criteria

- [ ] AC1: `lookOf` ist für denselben Login gleich, wählt nur erlaubte Rassen und gültige Fellvarianten.
- [ ] AC2: `peek` schneidet Kopf und Vorderpfoten jeder Rasse ohne leere Ränder aus; die Kopfhörer sitzen bei jeder
      Rasse auf dem Kopf.
- [ ] AC3: Alle Szenen nutzen nur Kern-Hooks; `scripts/rules.check.ts` und `auditTheme` grün.
- [ ] AC4 (manuell): Chat, Kamera, Musik, Effekte, Befehlsseite in der Vorschau; der Nutzer nimmt ab.

### Tests (TDD)

1. `lookOf.check.ts > "Aussehen aus dem Login"` (AC1)
2. `peek.check.ts > "Ausschnitt"`, `"Kopfhörer"` (AC2)
3. `settings.check.ts > "Schema"`, `cargo test` in `dogs.rs`

### Umsetzungsschritte

1. Tests, rot; `lookOf.ts`, `peek.ts`, `headphones.ts`, grün.
2. Szenen und `overlays.css`, Schema beider Seiten, `npm run verify`, Renders zeigen, OK abwarten.

### Out of Scope

- Eigene Animationen je Chatbefehl (das sind Minimes).

---

## Package 5: Stinger und Banner

**Ziel:** Stinger, Profil- und Offline-Banner rendern deterministisch aus demselben Kit.

**Abhängigkeiten:** Package 2

**Betroffene Dateien:**
- Neu: `stinger.ts`, `stinger.check.ts` (`drawDogsStinger(context, time, options)`: Fläche mit gestufter Kante,
  Pfoten, Hund in doppelter Grösse, Plakette mit Namen), `banners.ts`, `banners.check.ts` (Profil: Wiese mit allen
  sechs Hunden und Titel; Offline: Nachtzimmer mit schlafendem Hund und "Z", beides Standbilder), `canvasImage.ts`
  (`PixelImage` auf einen Canvas-Kontext malen, mit Skalierung; Check in `stinger.check.ts` über einen Fake-Kontext)
- Ändern: `render.ts` (`dogsClips` mit `withStingerOptions`, `readStingerOptions`), `settings.ts` (Gruppen `Stinger`,
  `Banner`, `stingerFields`), `dogs.rs`, Fixture, erzeugte Typen. Die Töne `stinger-in`, `stinger-badge`,
  `stinger-out` gehören nicht in den Clip (Videos sind stumm); sie liegen für eine spätere Stinger-Szene bereit und
  kommen erst mit ihr ins Repo.

### Kontext

Clips sind reine Funktionen der Zeit (`src/core/renderClip.ts`, Regel 21): kein `Math.random`, kein PixiJS, kein GSAP;
Kurven mit `easeAt`, Funken mit `burstAt`. Der Prototyp `refs/px-stinger.html` zeigt Ablauf und Masse: 2.4 s, Schnitt
bei 1.2 s, Wischen 0.82 s, Pfoten im Abstand 30 px, Neigung 0.45, Stufen 6 px.

### Gestaltung

- Wie DESIGN-DOGS.md "Stinger" und "Banner". Pfotenfarben aus dem Fell des Hundes, Halsband-Rot, Ball-Gelb und Braun;
  Farben, die zu nah an der Fläche liegen (Helligkeit über 85 %), fallen weg.

### Einstellungen (Gruppen dieses Packages)

| Gruppe | Schlüssel (Standard) |
|---|---|
| Stinger | `stingerDuration` (2.4 s), `stingerCut` (1.2 s), `stingerSweep` (0.82 s), `stingerPawSpacing` (30 px), `stingerSlant` (0.45), `stingerStep` (6 px), `stingerDog` (an), `stingerBadge` (an), `stingerText` ("{dog}"), `stingerCover` (`#fff6e6`), Kern-Felder aus `stingerFields` |
| Banner | `bannerTitle` ("{channel}"), `bannerProfileText` ("Willkommen im Rudel!"), `bannerOfflineTitle` ("OFFLINE"), `bannerOfflineText` ("{dog} schläft. Bis bald!") |

### Acceptance Criteria

- [ ] AC1: Zwei Aufrufe mit gleichem `time` malen dieselben Pixel (Fake-Kontext zeichnet Aufrufe auf).
- [ ] AC2: Bei `stingerCut` ist jede Zeile der Bühne von der Fläche gedeckt; bei 0 und am Ende ist nichts gedeckt.
- [ ] AC3: Beide Banner sind Standbilder: zwei Aufrufe malen dieselben Pixel, unabhängig von der Zeit.
- [ ] AC4: `renderers.check.ts` grün (Clips `stinger`, `profile`, `offline`).
- [ ] AC5 (manuell): Stinger bei 0.5 s, 1.1 s und 1.7 s neben `refs/shots/st0.5.png`, `st1.1.png`, `st1.7.png`; Banner
      in der Render-Seite des Dashboards; der Nutzer nimmt ab.

### Tests (TDD)

1. `stinger.check.ts > "deterministisch"` (AC1), `"deckt am Schnitt"` (AC2)
2. `banners.check.ts > "Standbild"` (AC3)
3. `render.check.ts > "Clips"` (AC4), `cargo test` in `dogs.rs`

### Umsetzungsschritte

1. Tests, rot; `canvasImage.ts`, `stinger.ts`, `banners.ts`, grün.
2. `render.ts`, Schema beider Seiten, `npm run verify`, Renders zeigen, OK abwarten.

### Out of Scope

- 3D-Clips, Videos mit Ton.

---

## Package 6: Minimes

**Ziel:** Chatter erscheinen als Pixel-Hunde, Typ = Rasse, mit eigenen Animationen.

**Abhängigkeiten:** Package 1

**Betroffene Dateien:**
- Neu: `minimeVariants.ts` (Set der Typen: sechs Rassen mit Name und Standard-Namen im Chat, z. B. Corgi: "corgi",
  "welsh"), `minimes.ts`, `minimes.check.ts` (Pose je Aktion: `walk` Laufen, `idle` Stehen, `bark` Bellen, `sniff`
  Schnüffeln mit Staub, `lie` Liegen, `sleep` Liegen mit "Z", Reaktion `wag` schnelles Wedeln; Grösse aus
  `minimeScale`), `scenes/Minimes.tsx`, `minimes.css`
- Ändern: `settings.ts` (`minimeVariants`, `...MINIME_BASE_FIELDS` mit `withDefaults`, `...minimeVariantFields(set)`,
  eigene Gruppe `Minimes: Hunde`), `dogs.rs` (gleiches Set, `with_defaults`), Fixture, erzeugte Typen, `index.tsx`
  (`minimes`), `groupScenes`

### Kontext

`useMinimes({ catalog, reaction, widthPx })` aus `src/core/hooks/useMinimes.ts`; Typen wie in THEMES.md "Typen statt
Farben" (`variant` am Minime, in `?demo` ohne Typ: Rasse aus `hash(seedOf(login))`). Fellvariante fest aus dem Login
(`lookOf` aus Package 4, hier eingeführt, wenn Package 4 später kommt). Laufen über `fromX`/`toX` mit `durationMs`,
Blickrichtung `facing` spiegelt die Textur. Kein `MINIME_HOP_FIELDS`. Die Aktionsnamen meiden `COMBAT_ACTIONS` und
`STACK_ACTIONS`.

### Gestaltung

- Wie DESIGN-DOGS.md "Minimes". Hunde laufen auf einem Grasstreifen am unteren Rand (transparent), Name als kleine
  Pille darüber; Grösse Standard 3-fach statt 5-fach.

### Einstellungen (Gruppen dieses Packages)

| Gruppe | Schlüssel (Standard) |
|---|---|
| Minimes: Töne | `soundMinimeBark` (eingebaut, 30 %), `soundMinimeSniff` (eingebaut, aus), `soundMinimeWag` (eingebaut, 20 %); Töne `sounds/minimes-bark.ogg`, `minimes-sniff.ogg`, `minimes-wag.ogg` |
| Minimes: Hunde | `minimeScale` (2), `minimeGrass` (an), `minimeNameTag` (an), `barkMs` (900 ms), `barkWeight` (3), `sniffMs` (2000 ms), `sniffWeight` (3), `lieMs` (4000 ms), `lieWeight` (2), `sleepMs` (6000 ms), `sleepWeight` (1), `wagOnChat` (an), `wagMs` (1200 ms) |
| Kern | `MINIME_COMMANDS`, `MINIME_RULES`, `MINIME_MOTION`, `MINIME_VARIANTS` (Befehl `!rasse`) |

### Acceptance Criteria

- [ ] AC1: Das Schema hat `minimeVariants` mit sechs Rassen; `hasMinimes` ist wahr; Rust gleich (Fixture).
- [ ] AC2: `minimes.ts` liefert für jede Aktion eine gültige Pose; `facing -1` spiegelt; Häufigkeit 0 nimmt die Aktion
      aus dem Katalog.
- [ ] AC3: Kein Aktionsname kollidiert mit `COMBAT_ACTIONS` oder `STACK_ACTIONS`.
- [ ] AC4 (manuell): `minimes.html?demo&preview` zeigt Hunde aller Rassen, die laufen, bellen, schnüffeln, liegen,
      schlafen und beim Chat wedeln; der Nutzer nimmt ab.

### Tests (TDD)

1. `minimes.check.ts > "Aktionen"` (AC2, AC3)
2. `settings.check.ts > "Schema"`, `cargo test` in `dogs.rs > minime_variants` (AC1)

### Umsetzungsschritte

1. Tests, rot; `minimeVariants.ts`, `minimes.ts`, grün.
2. `scenes/Minimes.tsx`, `minimes.css`, Schema beider Seiten, `npm run verify`, Renders zeigen, OK abwarten.

### Out of Scope

- Fraktionen, Gefechte, Türme, Hüpfen.
