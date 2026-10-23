# Plan: Theme "Kebab"

Dönerbude als rote Strichzeichnung auf Papier, im Stil des gedruckten Imbiss-Logos: Ein Koch sägt am Spieß (Starting),
macht Teepause (BRB) und zieht den Rollladen herunter (Ending). Alerts sind Bons aus dem Drucker mit Stempel, der
Stinger faltet Einwickelpapier, die Minimes sind kleine Gerichte. Alles 2D mit Rough.js, GSAP und PixiJS.
Gestaltung: [DESIGN-KEBAB.md](DESIGN-KEBAB.md).

Testbefehl: `npm test` (einzeln: `node <pfad>.check.ts`), Abschluss jedes Packages: `npm run verify`, wo der Server
betroffen ist auch `npm run contract`. Regeln: [CODING-RULES.md](../../../../CODING-RULES.md), Theme-Aufbau:
[THEMES.md](../../../../THEMES.md), Übersicht aller Pläne: [PLAN.md](../../../../PLAN.md).

## Überblick

| # | Package | Ziel in einem Satz | Abhängig von |
|---|---------|--------------------|--------------|
| 1 | Bildsprache-Probe: Starting | Das Theme `kebab` ist wählbar und zeigt Starting mit Koch, Spieß und Bogenschrift so, dass der Nutzer die Linie neben Logo und Prototyp abnimmt. | - |
| 2 | BRB, Ending und Skin | BRB mit Teepause und Ending mit Rollladen und echtem Tagesabschluss stehen, der Dashboard-Skin hat seine Szenerie. | 1 (Abnahme), Kern-Plan Statistik (erledigt) |
| 3 | Töne mit earshot | Die Klänge des Themes sind mit earshot erzeugt, als Dateien im Theme abgelegt und vom Nutzer abgehört. | 1 |
| 4 | Overlays | Alerts (Bon, Tüte), Chat, Kamera, Musik, Effekte und Befehlsseite zeigen die Papier-Ebene. | 1, 3 |
| 5 | Stinger und Banner | Stinger (Papier, Messer), Profil- und Offline-Banner rendern deterministisch. | 1 |
| 6 | Minimes | Chatter erscheinen als Döner, Dürüm, Lahmacun und Pommes mit Hüpfen, Tellerstapel und eigenen Animationen. | 1, 3 |

Die Kern-Bausteine aus [plans/PLAN-GRAFIK.md](../../../../plans/PLAN-GRAFIK.md) (`roughPath`, `PixiStage`,
`useTimeline`, `burstAt`, Stinger-Optionen, Leistungsstufe) und die Kern-Statistik aus
[plans/PLAN-STATS.md](../../../../plans/PLAN-STATS.md) sind fertig. Package 1 endet mit einer Abnahme; ohne sie beginnt
kein weiteres Package. Danach parallel möglich: 2, 3 und 5 (verschiedene Dateien bis auf `settings.ts`, `kebab.rs` und
die Fixture; wer später kommt, hängt seine Gruppen an). 4 und 6 brauchen die Töne aus 3.

## Annahmen

- **Name und id** (entschieden 2026-10-23): Anzeigename "Kebab", id `kebab`, Ordner `src/themes/kebab/`, Klassen
  `kb-*`, Keyframes `kebab-*`. Charakter: "Dönerbude als rote Strichzeichnung auf Papier: Koch, Spieß und Bogenschrift
  zeichnen sich selbst."
- **Vorlage** (entschieden 2026-10-23): "Döner Kebab" ist ein Gattungsbegriff und darf als Text vorkommen. Das gedruckte
  Logo ist Vorlage für den Stil; der Koch ist neu gezeichnet. Das Logo wird in Dokumenten, Code, Commits und Oberfläche
  nicht als Vorlage benannt (in den Docs heisst es "das gedruckte Imbiss-Logo").
- **Stil** (entschieden 2026-10-23): Die Prototypen in [refs/](refs/) sind abgenommen: `starting.html`, `alert.html`
  (Bon ohne Koch, Stempel oben rechts als Teil des Papiers; Tüte als Variante), `stinger.html` (Papier, Messer als
  Variante). Jede sichtbare Arbeit wird neben ihnen und `refs/logo.jpg` gerendert und erst nach dem OK des Nutzers
  weitergebaut.
- **Technik** (entschieden 2026-10-23): 2D. Linien mit Rough.js über `roughPath` (`src/core/rough/roughSvg.ts`) als
  SVG-Pfade mit festem Startwert; Abläufe mit GSAP über `useTimeline` (`src/core/motion/useTimeline.ts`, `drawSVG`);
  Teilchen (Späne, Zwiebelringe, Dampf) mit PixiJS über `PixiStage` (`src/core/pixi/PixiStage.tsx`), im Ticker aus der
  Zeit gerechnet. Clips zeichnen mit Canvas 2D (`Path2D` aus denselben Rough-Pfaden). Kein Three.js. `kebab` kommt in
  `MODULE_THEMES` (`scripts/bundle.ts`).
- **Geometrie als Daten:** Koch, Spieß, Bogenschrift, Bon, Tüte, Papier und Figuren sind reine Funktionen in
  `.ts`-Modulen mit Checks (Pfade im 600 x 520-Raster); Szenen und Clips nutzen dieselben Module. Szenen enthalten keine
  Zahlen über 1 (Regel aus `scripts/rules.check.ts`), die Zahlen stehen in den Modulen.
- **Zufall:** jede Verteilung (Schraffur, Späne, Riss-Kante, Fleischscheiben) aus `hash` (`src/core/hash.ts`) mit einem
  Startwert aus den Einstellungen, nie `Math.random`.
- **Alles einstellbar** (Regeln 19 und 20): Texte, Farben, Grössen, Zeiten, Mengen, Häufigkeiten, Rauheit der Linie,
  jedes Element einzeln an/aus. Fest bleiben nur Formen und Schutzgrenzen (z. B. höchste Zahl Späne), mit
  `fixed: <Grund>`.
- **Schrift** (entschieden 2026-10-23): Titan One (neu in `index.html`) und Nunito (600, 800, 900; geladen ist Nunito
  400 bis 800, 900 kommt dazu). Im Feld `titleFont` wählbar zwischen Titan One, Baloo 2 und Fredoka, im Feld `font`
  zwischen Nunito, DM Sans und Manrope (alle geladen).
- **Szenen und Clips** (entschieden 2026-10-23): alle Szenen (`starting`, `brb`, `ending`, `alerts`, `chat`, `cam`,
  `music`, `fx`, `info`, `minimes`) und alle Clips (`stinger`, `profile`, `offline`).
- **Varianten** (entschieden 2026-10-23): Alerts `bon` (Standard) und `tuete`; Stinger `papier` (Standard) und `messer`.
- **Ending mit echten Zahlen:** der Bon "Tagesabschluss" nutzt `useStreamStats`, `parseStatLines` und `describeStats`
  (`src/core/stats/stats.ts`); welche Zahlen mit welchem Text erscheinen, ist eine Einstellung (`schlüssel|Text` je
  Zeile).
- **Töne** (entschieden 2026-10-23): mit earshot erzeugt (github.com/Leonxlnx/earshot, MIT, Klänge aus Code, keine
  Aufnahmen). Das Erzeugungs-Skript liegt in `docs/sounds/make.py`, die fertigen Dateien in `src/themes/kebab/sounds/`
  als OGG; `tones.ts` spielt sie über `playSound` (`src/core/sound.ts`) als eingebauten Ton. Ein Kern-Baustein für
  Ton-Dateien entsteht erst, wenn ein zweites Theme Dateien nutzt (`ponytail:`-Hinweis in `tones.ts`). Nichts kommt
  ohne Hör-Abnahme ins Repo.
- **Minimes** (entschieden 2026-10-23): im ersten Plan dabei, als Typen (Döner, Dürüm, Lahmacun, Pommes) mit Hüpfen und
  Türmen aus dem Kern. Gefechte und Fraktionen bewusst nicht (kein Medic, keine Lager im Imbiss).
- **Texte** (entschieden 2026-10-23): deutsch mit Imbiss-Sprüchen ("Mit alles?", "Scharf oder ohne?", "Einmal Döner
  für {user}!"); Platzhalter `{channel}`, `{shop}`, `{user}`, `{amount}`, `{detail}`, `{text}`, `{number}`.
- **Persönliche Startwerte** (entschieden 2026-10-23): `personalize` setzt `channelName` aus dem Login: endet er auf s, x
  oder z, "<Login>' Döner", sonst "<Login>s Döner" (`rezondes` ergibt "Rezondes' Döner", `neo` ergibt "Neos Döner").
- **Einfache Ansicht:** Jedes Package markiert seine wichtigsten Felder mit `markBasic` (Liste `BASIC` in `settings.ts`,
  `mark_basic` in Rust), wie in [plans/PLAN-SETTINGS.md](../../../../plans/PLAN-SETTINGS.md).
- **Schema in Rust und TS:** `server-rs/crates/rst-domain/src/themes/kebab.rs` und `src/themes/kebab/settings.ts`, gleich
  gehalten über `server-rs/crates/rst-domain/tests/fixtures/kebab.json` (`node scripts/dumpSchema.ts`),
  `src/generated/themes/kebab.ts` per `npm run gen:types`. Jedes Package ergänzt beide Seiten im selben Commit.
- **Docs vor Code** (entschieden 2026-10-23): In `src/themes/kebab/` liegt bis Package 1 nur `docs/`; das zählt als
  geplantes Theme (`src/themes/registry.check.ts` überspringt Ordner, die nur `docs/` enthalten).
- **Package-Schnitt** (entschieden 2026-10-23): wie vorgeschlagen, mit zwei Anpassungen: Die Probe in Package 1 braucht
  ein registriertes Theme, darum gehören Schema, Registrierung und Skin-Tokens zu Package 1; die Töne sind ein eigenes
  Package (3), weil sie eine Hör-Abnahme brauchen.
- **Commit-Grösse:** Packages 1, 2, 4 und 6 liegen voraussichtlich über der Richtgrösse von 400 Zeilen; bewusste
  Ausnahme, steht in der Commit-Beschreibung. Commit je Package nach grünem `npm run verify` und Freigabe, nie pushen.
- **Manuelle Checks:** Vorschau `http://localhost:5173/<szene>.html?demo&preview&sound=0`, Viewport 1600x900;
  Standbilder mit `?t=<sekunden>`. Nach jedem Package mit sichtbarer Arbeit Bilder neben die Prototypen legen, zeigen
  und auf das OK warten.

---

## Package 1: Bildsprache-Probe: Starting

**Ziel:** Das Theme `kebab` ist wählbar und zeigt Starting mit Koch, Spieß und Bogenschrift so, dass der Nutzer die
Linie neben Logo und Prototyp abnimmt.

**Abhängigkeiten:** keine

**Betroffene Dateien:**

Neu in `src/themes/kebab/`:
- `chef.ts`, `chef.check.ts`: Formen im 600 x 520-Raster als Daten: `chefParts()` liefert je Teil (`hat`, `head`,
  `face`, `eyes`, `stache`, `body`, `arm`, `knife`, `spit`, `meat`, `counter`, `plate`) eine Liste von Formen
  (`RoughShape` aus `src/core/rough/roughSvg.ts`) mit Stärke und dem Merker `cover` (bekommt eine Papierfüllung);
  `MEAT` (Umriss des Kegels), `SHOULDER` (Drehpunkt des Arms)
- `hatch.ts`, `hatch.check.ts`: `meatHatch(seed, rows, period)` liefert die Schraffur als Pfad, periodisch in `period`;
  `hatchOffset(t, speed, period)` die Verschiebung (dreht den Spieß)
- `arc.ts`, `arc.check.ts`: `arcLayout(widths, center, radius, spanDeg)` liefert je Buchstabe Lage und Winkel; breite
  Buchstaben bekommen mehr Winkel
- `life.ts`, `life.check.ts`: `chefPose(t, values)` liefert Armwinkel, Armschub, Mützenwinkel, Schnurrbartwinkel und
  Blinzeln als reine Funktion der Zeit
- `food.ts`, `food.check.ts`: `shavingsAt(t, options)` (Späne fallen vom Messer, landen und bleiben auf dem Teller,
  der Haufen wölbt sich) und `steamAt(t, options)` (drei Schwaden steigen in Schleife), beide rein aus Zeit und `hash`
- `ink/Ink.tsx` (zeichnet eine Liste von Formen über `roughPath` als SVG-Pfade mit Klasse `kb-ink`, optional
  Papierfüllung), `ink/Chef.tsx` (Koch, Spieß, Theke, Teller aus `chef.ts`, Pose aus `life.ts`), `ink/ArcTitle.tsx`
  (Bogenschrift: misst die Buchstaben, setzt sie mit `arcLayout`), `pixi/Food.tsx` (Späne und Dampf in eine
  `PixiStage`, im Ticker aus `clock()`), `screen/Bon.tsx` (Drucker und Bon mit gezacktem Rand), `screen/Ticker.tsx`
  (Laufband), `screen/Lights.tsx` (Einschalt-Flackern)
- `settings.ts`, `settings.check.ts`, `useKebab.ts`, `index.tsx` (nur `starting`), `theme.css`, `scenes/Starting.tsx`,
  `areas.ts`, `areas.check.ts`
- `render.ts` mit `kebabClips = () => []` (Clips in Package 5)

Schon angelegt: `src/themes/kebab/docs/refs/` mit `logo.jpg`, den Prototypen und ihren Standbildern.

Ändern:
- `src/themes/registry.ts` (`THEME_MODULES`), `src/themes/scenes.tsx` (`THEME_VIEWS`), `scripts/dumpSchema.check.ts`,
  `scripts/bundle.ts` (`MODULE_THEMES` um `kebab`)
- `server-rs/crates/rst-domain/src/themes/kebab.rs` (neu), `themes/mod.rs`, `themes/registry.rs` (`THEMES`),
  `server-rs/crates/rst-domain/tests/fixtures/kebab.json` (neu), `src/generated/themes/kebab.ts` (erzeugt),
  `src/themes/generatedValues.check.ts`
- `src/dashboard/skin.ts` (`SKINS`), `src/dashboard/skins.css` (Block `[data-skin="kebab"]` mit den Tokens aus
  DESIGN-KEBAB.md, noch ohne Szenerie)
- `index.html` (Titan One, Nunito 900)

### Kontext

Ein Theme ist ein Ordner und zwei Einträge (`THEME_MODULES`, `THEME_VIEWS`); `registry.check.ts`, `skin.check.ts` und
`renderers.check.ts` prüfen das. Starting nutzt `useStage` und `useScreen` aus `src/core/screens` (Countdown, `?ticker`,
`?next`), `rotating` für wechselnde Zeilen. Muster für PixiJS und GSAP: THEMES.md, Abschnitt "Aufbau" (Lagen als reine
Funktionen mit Check, der Ticker setzt jede Lage aus `clock()`, damit `?t=` stimmt). Fallstricke aus THEMES.md gelten:
Eine angehaltene Timeline ruft `onUpdate` nicht, darum setzt der Ticker Countdown und Späne aus der Zeit; SVG-Gruppen
drehen mit `svgOrigin`.

Der Prototyp `refs/starting.html` liefert die Standardwerte: Bogen Mittelpunkt 300/640, Radius 470, 66 Grad,
Buchstaben 72; Schraffur 32 Reihen, Periode 42, Tempo 18; Sägen Tempo 5.2, 2.6 Grad, 5 Einheiten; Blinzeln alle 4.2 s;
Späne alle 0.16 s, Fall 0.8 s, höchstens 140; Dampf 3 Schwaden, Höhe 70; Rough Rauheit 0.55, Bogen 0.6. Die SVG-Box
des Logos liegt bei 120/60 und ist 1238 x 940 px gross (Ausschnitt 30/70 bis 570/480 des Rasters). Die Pfade des Kochs
stehen dort in `drawChef` und werden nach `chef.ts` übernommen.

### Gestaltung

- Papier `paper` als Hintergrund mit leichtem Verlauf zum Rand.
- Ablauf (Standard, Sekunden): Licht flackert 0 bis 0.85; Bogenschrift ab 0.6 (je Buchstabe 0.06 versetzt); Koch zeichnet
  sich ab 1.0, Spieß und Fleisch ab 1.5, Schraffur ab 2.1, Arm, Theke und Teller ab 2.0; Füllungen ab 1.4; Drucker ab
  2.4, Bon ab 2.8 (ruckweise); Laufband ab 3.2; Späne ab 3.2, Dampf ab 2.4; Sägen, Wippen und Blinzeln ab 2.6. Alles
  skaliert mit `introSpeed`.
- Bon rechts: Ladenname (Nunito 900, gesperrt), Bestellnummer, drei Posten mit Zusatz rechts, "FERTIG IN", Countdown in
  Titan One `redText`, Dankeszeile in Nunito kursiv; gezackter Rand unten.
- Laufband unten in `redText`, Schrift `paper`.

### Einstellungen (Gruppen dieses Packages)

| Gruppe | Schlüssel (Standard) |
|---|---|
| Allgemein | `channelName` ("Döner", `personalize` siehe Annahmen), `titleFont` (Titan One), `font` (Nunito), `fontSize` (24 px), `red` (`#f85449`), `redText` (`#c8261b`), `paper` (`#fff8ec`), `bon` (`#fffdf8`), `kraft` (`#f9ebd6`), `brown` (`#3a1a12`), `muted` (`#8a5a4a`), `steam` (`#fff8ec`), `quality` (mittel, `qualityField`), `inkRoughness` (0.55), `inkBowing` (0.6), `inkWidth` (Faktor 1), `inkSeed` (11), `introSpeed` (Faktor 1), `lightsOn` (an) |
| Koch und Spieß | `arcText` ("DÖNER KEBAB"), `arcSize` (72), `arcSpan` (66 Grad), `arcStroke` (4 px), `spitSpeed` (18), `hatchRows` (32), `sawOn` (an), `sawSpeed` (5.2), `sawAngle` (2.6 Grad), `hatOn` (an), `stacheOn` (an), `blinkEvery` (4.2 s), `shavingsOn` (an), `shavingsEvery` (160 ms), `shavingsFall` (800 ms), `shavingsMax` (140, Obergrenze 300 mit `fixed`), `steamOn` (an), `steamHeight` (70) |
| Starting | `startingNumber` ("Bestellung Nr. 042"), `startingItems` (Liste `Posten\|Zusatz`: "1x Stream\|mit alles", "1x Gute Laune\|scharf", "1x Chat\|extra Soße"), `countdownLabel` ("FERTIG IN"), `countdown`, `countdownDone` ("GUTEN APPETIT!"), `startingThanks` ("Danke und guten Appetit!"), `startingLines` (Liste, wechselt mit der Dankeszeile), `linesEvery` (8 s), `bonOn` (an), `ticker` ("Frisch vom Spieß • Mit alles und scharf • Gleich geht's los • Zwiebeln? Klar!"), `tickerSpeed` (90 px/s), `tickerOn` (an) |

### Acceptance Criteria

- [ ] AC1: `kebab` steht in `THEME_MODULES`, `THEME_VIEWS`, `SKINS`, `MODULE_THEMES` und in Rust `THEMES`;
      `registry.check.ts`, `skin.check.ts`, `dumpSchema.check.ts` und `node scripts/bundle.ts` sind grün.
- [ ] AC2: Das Rust-Schema gleicht dem TS-Schema (Fixture-Test in `kebab.rs`); `personalize("rezondes")` ergibt
      `{ channelName: "Rezondes' Döner" }`, `personalize("neo")` ergibt `{ channelName: "Neos Döner" }`.
- [ ] AC3: `chefParts()` liefert alle zwölf Teile; alle Punkte liegen im Raster 0 bis 600 mal 0 bis 520; Mütze, Arm,
      Messer und Fleisch haben `cover`; das Messer kreuzt den Fleischkegel.
- [ ] AC4: `meatHatch` ist deterministisch und periodisch: um `period` verschoben ergibt sie dieselben Striche im
      Kegel; `hatchOffset(t + period / speed)` gleich `hatchOffset(t)`.
- [ ] AC5: `arcLayout` setzt die Buchstaben symmetrisch um Winkel 0, der erste und letzte liegen innerhalb von plus
      minus `spanDeg / 2`; ein doppelt so breiter Buchstabe bekommt doppelt so viel Winkel.
- [ ] AC6: `chefPose` ist rein aus der Zeit, Blinzeln dauert 0.12 s je `blinkEvery`; mit `sawOn` aus ist der Arm still.
- [ ] AC7: `shavingsAt` ist rein aus Zeit und Startwert, die Zahl steigt bis `shavingsMax` und nie darüber; gelandete
      Späne bewegen sich nicht mehr und liegen auf dem Teller; `steamAt` ist periodisch.
- [ ] AC8: `auditTheme` findet keinen ungenutzten Schlüssel, die Standardwerte bestehen das Schema;
      `scripts/rules.check.ts` ist grün (keine Farbliterale, keine Texte im JSX, keine Zahlen über 1 in Szenen).
- [ ] AC9 (manuell): `starting.html?demo&preview&sound=0` zeigt den Ablauf wie `refs/starting.html`; das Standbild bei
      `?t=20` liegt neben `refs/starting.png` und `refs/logo.jpg` und trifft Linie, Proportionen, Bogenschrift, Bon und
      Laufband; der Nutzer nimmt die Bildsprache ab.

### Tests (TDD)

Reihenfolge: Test schreiben, rot, minimal implementieren, grün, refactoren.

1. `chef.check.ts > "Teile des Kochs"` (AC3)
   - Gegeben: `chefParts()`
   - Erwartet: zwölf Teile mit den Namen oben; alle Koordinaten im Raster; `cover` an Mütze, Arm, Messer, Fleisch
2. `hatch.check.ts > "Schraffur dreht ohne Naht"` (AC4)
   - Gegeben: `meatHatch(11, 32, 42)` zweimal, `hatchOffset` bei 0 und bei `42 / 18` s
   - Erwartet: gleiche Pfade; gleiche Verschiebung
3. `arc.check.ts > "Bogen"` (AC5)
   - Gegeben: Breiten `[10, 10, 10]` und `[10, 20, 10]` bei 60 Grad
   - Erwartet: Winkel symmetrisch, Mitte bei 0; der breite Buchstabe hat den doppelten Anteil
4. `life.check.ts > "Pose aus der Zeit"` (AC6)
   - Gegeben: Standardwerte, t = 0.05, 0.2 und 4.25 s; dann `sawOn: false`
   - Erwartet: Blinzeln an, aus, an; ohne Sägen Armwinkel 0
5. `food.check.ts > "Späne und Dampf"` (AC7)
   - Gegeben: `shavingsAt` bei 0, 1 und 100 s mit `max` 140; ein Span 2 s und 5 s nach seiner Landung; `steamAt` bei t
     und t plus Periode
   - Erwartet: 0, wenige, 140; gleiche Lage; gleiche Schwaden
6. `settings.check.ts > "Schema"` (AC8): `auditTheme(kebabSettings)` ohne Befund
7. `cargo test` in `kebab.rs > same_as_typescript` und `personalize_sets_shop_name` (AC2)

### Umsetzungsschritte

1. Tests 1 bis 5, rot; `chef.ts` (Pfade aus `refs/starting.html` übernehmen), `hatch.ts`, `arc.ts`, `life.ts`,
   `food.ts`, grün.
2. `settings.ts` mit den Gruppen oben, `kebab.rs` gleich, Fixture schreiben, Typen erzeugen; Tests 6 und 7.
3. Registrieren (TS, Rust, `MODULE_THEMES`), `skin.ts` und `skins.css` (Tokens), `index.html`.
4. `ink/*`, `pixi/Food.tsx`, `screen/*`, `scenes/Starting.tsx` (nur Starting eingetragen), `theme.css`.
5. `npm run verify`, Vorschau rendern, neben Prototyp und Logo legen, dem Nutzer zeigen, Abnahme abwarten (AC9).

### Out of Scope

- BRB, Ending, Szenerie des Skins (Package 2); Töne (3); Overlays (4); Clips (5); Minimes (6).

---

## Package 2: BRB, Ending und Skin

**Ziel:** BRB mit Teepause und Ending mit Rollladen und echtem Tagesabschluss stehen, der Dashboard-Skin hat seine
Szenerie.

**Abhängigkeiten:** Package 1 (mit Abnahme), Kern-Plan Statistik (erledigt)

**Betroffene Dateien:**
- Neu: `pause.ts`, `pause.check.ts` (Formen der Teepause: Arm mit Teeglas, Messer auf der Theke, Schild am Spieß),
  `shutter.ts`, `shutter.check.ts` (Rollladen: Lamellen, Kasten, Lage aus der Zeit), `closing.ts`, `closing.check.ts`
  (Zeilen des Tagesabschlusses aus Statistik und Einstellung), `ink/Shutter.tsx`, `screen/ClosingBon.tsx` (mit
  Hochzählen), `screen/Stamp.tsx` (Stempel als Teil des Papiers), `scenes/Brb.tsx`, `scenes/Ending.tsx`
- Ändern: `settings.ts`, `index.tsx` (`brb`, `ending`), `theme.css`, `ink/Chef.tsx` (Pose `pause`), `kebab.rs`, Fixture,
  erzeugte Typen
- Skin: `src/dashboard/Scenery.tsx` (Szenerie `kebab`: Koch mit Spieß unten rechts, Bogenschrift oben links, als
  statische Rough-Pfade aus `chef.ts` und `arc.ts`), `src/dashboard/skins.css`
- Doku: `README.md` (Theme-Liste), `DESIGN.md` (Zeile ohne "(geplant)")

### Kontext

BRB nutzt `useScreen` (Pausenzeit), Ending `useScreen` (`?next`) und `useStreamStats` mit `parseStatLines` und
`describeStats` (`src/core/stats/stats.ts`). Ohne Statistik (`null`) zeigt der Bon Striche statt Zahlen. Der Stempel
ist wie im Alert-Prototyp ein Kind des Papiers (`multiply`) und bewegt sich mit ihm.

### Gestaltung

- **BRB:** Koch und Spieß aus Package 1, Arm mit Teeglas (Dampf aus dem Glas), Messer liegt auf der Theke, keine Späne;
  der Spieß dreht weiter; am T-Griff hängt ein Papierschild an einer Schnur und pendelt; der Bon zeigt "BIN GLEICH
  ZURÜCK" und die Pausenzeit; Laufband wie Starting.
- **Ending:** Bude aus Package 1 im Hintergrund; ein Rollladen in `brown` fährt in 1.6 s herunter (Lamellen als Linien
  in `paper`), auf ihm die Bogenschrift in `paper`; davor kommt der Bon "Tagesabschluss" aus dem Drucker, die Zeilen
  zählen hoch, dann knallt der Stempel "BEZAHLT" auf; Titel unten in Titan One.
- **Skin:** Szenerie als statische Rough-Linien in den Farben des Skins, ohne Bewegung.

### Einstellungen (Gruppen dieses Packages)

| Gruppe | Schlüssel (Standard) |
|---|---|
| BRB | `brbTitle` ("BIN GLEICH ZURÜCK"), `brbSign` ("Kurz Tee trinken"), `brbTimerLabel` ("PAUSE SEIT"), `brbItems` (Liste: "1x Çay\|heiß", "1x Pause\|kurz"), `brbLines`, `brbTeaOn` (an), `brbSignOn` (an), `brbSignSwing` (3 Grad), `brbTicker` ("Gleich geht's weiter • Der Spieß dreht sich weiter") |
| Ending | `endingTitle` ("Danke und bis morgen!"), `endingNext`, `shutterOn` (an), `shutterMs` (1600 ms), `shutterText` ("DÖNER KEBAB"), `closingTitle` ("TAGESABSCHLUSS"), `closingLines` ("follows\|Neue Stammkunden", "subs\|Abos", "raids\|Raids", "bits\|Bits", "chatMessages\|Bestellungen im Chat"), `countUpMs` (1000 ms), `stampOn` (an), `stampText` ("BEZAHLT"), `stampAt` (4 s) |

### Acceptance Criteria

- [ ] AC1: `pauseParts()` ersetzt Arm und Messer durch Arm mit Glas und Messer auf der Theke; das Messer liegt auf der
      Thekenlinie.
- [ ] AC2: `shutterAt(t, durationMs)` ist bei 0 oben, nach `durationMs` unten und dazwischen nie unter dem Boden.
- [ ] AC3: `closingRows(stats, lines)` liefert je Zeile Text und Zahl, in `?demo` die Demo-Werte, mit `null` Striche.
- [ ] AC4: Die Skin-Szenerie erscheint nur im Skin `kebab`, unter 1100 px nur die Bogenschrift, unter 720 px nichts.
- [ ] AC5 (manuell): BRB und Ending in der Vorschau, neben Starting und dem Prototyp; der Stempel bleibt auf dem Papier;
      Abnahme durch den Nutzer.

### Tests (TDD)

1. `pause.check.ts > "Teepause"` (AC1)
2. `shutter.check.ts > "Rollladen"` (AC2): `shutterAt` bei 0, 800 und 1600 ms
3. `closing.check.ts > "Zeilen"` (AC3): mit Demo-Werten und mit `null`
4. `settings.check.ts` und `cargo test` wie in Package 1

### Umsetzungsschritte

1. Tests 1 bis 3, rot; `pause.ts`, `shutter.ts`, `closing.ts`, grün.
2. Einstellungen in TS und Rust, Fixture, Typen.
3. `ink/Shutter.tsx`, `screen/ClosingBon.tsx`, `screen/Stamp.tsx`, `scenes/Brb.tsx`, `scenes/Ending.tsx`.
4. Skin-Szenerie, README, DESIGN.md.
5. `npm run verify`, Vorschau, Abnahme.

### Out of Scope

- Töne (3); Overlays (4); Clips (5); Minimes (6).

---

## Package 3: Töne mit earshot

**Ziel:** Die Klänge des Themes sind mit earshot erzeugt, als Dateien im Theme abgelegt und vom Nutzer abgehört.

**Abhängigkeiten:** Package 1

**Betroffene Dateien:**
- Neu: `src/themes/kebab/docs/sounds/make.py` (erzeugt alle Klänge mit earshot, gleiche Lautheit, schreibt OGG),
  `src/themes/kebab/docs/sounds/listen.html` (Hörseite mit allen Klängen, nicht im Build), `src/themes/kebab/sounds/`
  (`register.ogg`, `stamp.ogg`, `printer.ogg`, `tear.ogg`, `knife.ogg`, `sizzle.ogg`, `plop.ogg`, `bag.ogg`),
  `tones.ts` (je Klang eine Funktion `(volume) => void`, die die Datei abspielt)
- Ändern: `scripts/rules.check.ts` (`WITHOUT_CHECK` für `src/themes/kebab/tones.ts` wie die anderen `tones.ts`)

### Kontext

`playSound(sound, builtIn)` (`src/core/sound.ts`) spielt die eigene Datei des Streamers oder ruft den eingebauten Ton
mit der Lautstärke auf; mit `?sound=0` bleibt alles still. Der eingebaute Ton ist hier keine Oszillator-Folge wie
`beep`, sondern eine Datei des Themes: Vite liefert ihre URL über den Import (`import register from
"./sounds/register.ogg"`, Typen aus `vite/client`), `tones.ts` spielt sie mit `new Audio(url)` und der Lautstärke.
earshot läuft lokal in einer eigenen Python-Umgebung (Installation aus dem GitHub-Repo, dazu `numpy`, `soundfile`,
`pyloudnorm`); das Skript ist nicht Teil von `npm run verify`. Zu prüfen: Der Offline-Build (`vite build --mode
offline`) enthält die Dateien.

### Gestaltung (Klangcharakter)

- `register`: Kassenklingel, hell und kurz (Alert Bon, Ankunft).
- `stamp`: dumpfer Stempelschlag auf Papier mit kurzem Holzklang (Stempel in Alert und Ending).
- `printer`: ratterndes Ausdrucken, etwa 1 s, passend zum Bon.
- `tear`: Papier reisst (BRB-Schild, Vorschau des Stingers).
- `knife`: Messer schabt über Fleisch (Starting, leise, optional).
- `sizzle`: Grill brutzelt als kurze Schleife (Starting, BRB, leise, optional).
- `plop`: weiches Plopp (Minimes, Chat-Reaktion, Aufsteigen im Tellerstapel).
- `bag`: Papiertüte landet (Alert Tüte).

### Acceptance Criteria

- [ ] AC1: `make.py` erzeugt alle acht Dateien reproduzierbar (fester Startwert) mit gleicher Lautheit (LUFS innerhalb
      von 1 dB).
- [ ] AC2: `tones.ts` liefert für jeden Klang eine Funktion; mit `?sound=0` wird nichts abgespielt (über `playSound`).
- [ ] AC3: `npm run verify` und der Offline-Build sind grün, die Dateien liegen im Build.
- [ ] AC4 (manuell): Der Nutzer hört `docs/sounds/listen.html` ab und wählt je Klang; erst danach kommen die Dateien in
      den Commit.

### Tests (TDD)

1. `settings.check.ts` bleibt grün (die Ton-Felder kommen mit den Packages, die sie nutzen).
2. Lautheit und Länge prüft `make.py` selbst (`assert` je Datei), die Ausgabe steht im Commit-Text.

### Umsetzungsschritte

1. `make.py` schreiben, Klänge erzeugen, `listen.html` bauen.
2. Hör-Abnahme durch den Nutzer, Varianten nachlegen, bis jeder Klang gewählt ist.
3. Dateien nach `src/themes/kebab/sounds/`, `tones.ts`, `WITHOUT_CHECK`.
4. `npm run verify`, Offline-Build prüfen.

### Out of Scope

- Ein Kern-Baustein für Ton-Dateien (erst, wenn ein zweites Theme Dateien nutzt); Ton im Stinger-Clip (Clips sind stumm).

---

## Package 4: Overlays

**Ziel:** Alerts (Bon, Tüte), Chat, Kamera, Musik, Effekte und Befehlsseite zeigen die Papier-Ebene.

**Abhängigkeiten:** Package 1, Package 3

**Betroffene Dateien:**
- Neu: `alerts.ts`, `alerts.check.ts` (Schlüssel für `describeAlert` je Art, Gericht und Posten je Art), `bag.ts`,
  `bag.check.ts` (Formen der Tüte: Umriss, Zackenrand, Falten, Aufdruck), `crumbs.ts`, `crumbs.check.ts` (Zwiebelringe und
  Fleischstücke als Ausbruch über `burstAt` aus `src/core/motion/burst.ts`), `awning.ts`, `awning.check.ts` (Markise
  des Kamera-Fensters), `screen/AlertBon.tsx`, `screen/AlertBag.tsx`, `pixi/Crumbs.tsx`, `scenes/Alerts.tsx`,
  `scenes/Chat.tsx`, `scenes/Cam.tsx`, `scenes/Music.tsx`, `scenes/Fx.tsx`, `scenes/Info.tsx`, `overlays.css`
- Ändern: `settings.ts`, `index.tsx` (`alerts`, `chat`, `cam`, `music`, `fx`, `info`), `areas.ts` (Alert-Fläche mit
  `alertArea` aus `src/core/sceneArea.ts`: Bon oder Tüte plus Platz für die Krümel), `kebab.rs`, Fixture, erzeugte Typen

### Kontext

Kern-Bausteine: `useAlerts`, `describeAlert`, `alertTextKeys`, `alertQuote`, `useAlertSounds`, `alertSoundFields`
(`src/core/alerts`); `useChat`, `<MessageParts>`, `badgeLabel` (`src/core/chat`); `useNowPlaying`, `useTrackProgress`,
`useCover`, `<Marquee>` (`src/core/music`); `useFxScene`, `useFxItem`, `<FxMedia>` (`src/core/fx`,
`src/core/FxMedia.tsx`); `INFO_FIELDS`, `useCommands`, `describeCommands` (Befehlsseite). In Alerts statt `innerWidth`
immer `sceneFrame()`. Der Prototyp `refs/alert.html` gibt Ablauf und Masse vor: Drucker 460 x 50, Bon 400 breit,
Stempel 112 px oben rechts (10 px vom Rand, 12 Grad gedreht); Drucker ab 0 s, Bon 0.5 bis 1.5 s in 16 Rucken, Name ab
1.5 s, Stempel ab 2.0 s, Abgang ab 6.4 s.

### Gestaltung

- **Alerts, Bon** (Standard): wie DESIGN-KEBAB.md; der Stempel ist ein Kind des Bons (`mix-blend-mode: multiply`, 90 %
  Deckkraft); der Clip-Pfad des Bons wird nach dem Ausdrucken entfernt, damit der Stempel beim Aufschlag nicht
  abgeschnitten wird; der Ausbruch startet an der Stempelmitte; Abgang: der Bon kippt und fällt samt Stempel, der
  Drucker fährt hoch. Ton `printer` beim Ausdrucken, `stamp` beim Aufschlag, `register` beim Erscheinen (je
  abschaltbar).
- **Alerts, Tüte:** die Tüte fällt mit `bounce.out`, staucht beim Aufsetzen, der Aufdruck (Bogenschrift, kleiner Spieß)
  springt herein, Gericht, Name (wird bei langen Namen auf die Breite gestaucht) und Spruch stempeln sich nacheinander
  auf; Dampf in `steam` steigt aus der Öffnung; Abgang zur Seite. Linien auf Kraftpapier in `redText`. Ton `bag`.
- **Chat:** Bestellzettel mit gezacktem Rand, Name in `redText` (oder Chatfarbe), Text in `brown`; neue Zettel kommen
  ruckweise wie aus dem Drucker. Varianten zettel, liste, schlicht.
- **Kamera:** Imbissfenster: Rahmen aus Rough-Linien, Markise oben (Bögen, Streifen in `red`), Theke unten mit
  Namensschild; Varianten fenster, rahmen, aus.
- **Musik:** Kassenbon "Läuft gerade", Titel und Künstler im Lauftext, Cover optional, Fortschritt als Strichlinie; ohne
  Titel `musicIdle`. Varianten bon, schild, schlicht.
- **Effekte:** transparent, `<FxMedia>`, optionaler Text in Titan One.
- **Befehlsseite:** Speisekarte auf Papier mit Bogenschrift, Abschnitte als Überschriften, jeder Befehl eine Zeile mit
  gestrichelter Linie zum Befehl.

### Einstellungen (Gruppen dieses Packages)

| Gruppe | Schlüssel (Standard) |
|---|---|
| Alerts | `alertStyle` (bon: bon, tuete); je Art `<art>Tag`, `<art>Dish`, `<art>Line`, `<art>Item`: Follow ("NEUER FOLLOW", "1x Döner", "Einmal Döner für {user}!", "Follow\|gratis"), Sub ("NEUES ABO", "1x Dürüm", "{user} ist jetzt Stammkunde!", "Abo\|Stammkunde"), Resub ("ABO x{amount}", "1x Dönerteller", "{user} kommt seit {amount} Monaten!", "{amount} Monate\|treu"), Gift ("ABOS VERSCHENKT", "Runde für alle", "{user} gibt {amount} Döner aus!", "{amount}x Döner\|geschenkt"), Raid ("RAID", "Familienplatte", "{user} kommt mit {amount} Leuten rein!", "{amount} Gäste\|willkommen"), Bits ("{amount} BITS", "Extra-Soße", "{user} legt {amount} Bits auf die Theke!", "{amount} Bits\|danke"), Kanalpunkte ("KANALPUNKTE", "1x Ayran", "{user} löst {detail} ein.", "Punkte\|eingelöst"), Hype Train ("HYPE TRAIN", "Grillparty", "Alle an den Grill!", "Hype\|Level {amount}"; Ende "Grillparty Level {amount} geschafft!"); `alertNumber` ("Bestellung Nr. {number}"), `alertFor` ("für"), `alertQuote` (an), `quoteFormat` ("„{text}“"), `alertQuoteFallback` ("Mit alles?"), `alertDuration` (7000 ms), `alertWidth` (400 px), `alertStamp` (an), `alertStampText` ("MIT ALLES"), `alertStampSize` (112 px), `alertStampAt` (2000 ms), `alertCrumbs` (an), `alertCrumbCount` (34), `alertPrintSteps` (16), `alertSound` (an), `alertSoundFields` |
| Chat | `chatStyle` (zettel: zettel, liste, schlicht), `chatMax` (6), `chatLifetime` (30 s), `chatWidth` (480 px), `chatNameColor` (rot: rot, chatter), `chatBadges` und Kern-Felder, `chatPrintMs` (400 ms) |
| Kamera-Rahmen | `camStyle` (fenster: fenster, rahmen, aus), `camLabel` ("{shop}"), `camAwning` (an), `camAwningStripes` (8), `camCounter` (an) |
| Musik | `musicStyle` (bon: bon, schild, schlicht), `musicLabel` ("LÄUFT GERADE"), `musicIdle` ("Gerade keine Musik"), `musicCover` (an), `musicProgress` (an), `musicMarqueeSpeed` |
| Effekte | `fxText` (an), `fxTextSize` (96 px) |
| Befehlsseite | `INFO_FIELDS`, `infoTitle` ("SPEISEKARTE"), `infoWidth` (900 px) |

### Acceptance Criteria

- [ ] AC1: Jede Alert-Art zeigt Überzeile, Gericht, Zeile und Posten mit gefüllten Platzhaltern (`describeAlert` mit
      den eigenen Schlüsseln); ohne Text des Zuschauers erscheint `alertQuoteFallback`.
- [ ] AC2: Der Stempel liegt immer ganz auf dem Bon (Box des Stempels innerhalb der Box des Bons) und bewegt sich mit
      ihm (gleiches Elternelement).
- [ ] AC3: `bagParts()` liefert geschlossene Umrisse für Tüte und Aufdruck in der Box 0 bis 400 mal 0 bis 480; die
      Namenszeile hat eine höchste Breite (290), ein längerer Name wird gestaucht.
- [ ] AC4: `crumbsAt(seed, t, options)` ist rein aus der Zeit und nach `life` leer.
- [ ] AC5: Alle sichtbaren Texte kommen aus Einstellungen; `scripts/rules.check.ts` ist grün.
- [ ] AC6: Die Alert-Quelle ist so gross wie Bon oder Tüte plus Krümel-Rand (`areas.check.ts`).
- [ ] AC7 (manuell): Alerts beider Varianten neben `refs/alert.html` bei `?t=2.4` und `?t=6.7`; alle Overlays
      transparent; Töne nur mit `sound` an geprüft; Abnahme durch den Nutzer.

### Tests (TDD)

1. `alerts.check.ts > "Texte je Art"` (AC1): `alertTexts(alert, values)` für alle acht Arten und das Hype-Ende
2. `bag.check.ts > "Tüte"` (AC3)
3. `crumbs.check.ts > "Ausbruch aus der Zeit"` (AC4)
4. `areas.check.ts > "Alert-Fläche"` (AC6): Bon und Tüte bei Standardwerten
5. `settings.check.ts` und `cargo test` wie in Package 1 (AC5)

### Umsetzungsschritte

1. Tests 1 bis 4, rot; `alerts.ts`, `bag.ts`, `crumbs.ts`, `awning.ts`, `areas.ts`, grün.
2. Einstellungen in TS und Rust, Fixture, Typen.
3. `screen/AlertBon.tsx`, `screen/AlertBag.tsx`, `pixi/Crumbs.tsx`, Szenen, `overlays.css`, Töne anbinden.
4. `npm run verify`, Vorschau, Abnahme.

### Out of Scope

- Clips (5); Minimes (6).

---

## Package 5: Stinger und Banner

**Ziel:** Stinger (Papier, Messer), Profil- und Offline-Banner rendern deterministisch.

**Abhängigkeiten:** Package 1

**Betroffene Dateien:**
- Neu: `wrap.ts`, `wrap.check.ts` (Stinger Papier: Spitzen der vier Klappen aus der Zeit, gezackte Riss-Kante aus dem
  Startwert, Lage der Hälften), `slices.ts`, `slices.check.ts` (Stinger Messer: Lage des Messers, Einschub und Fall je
  Scheibe, Späne an der Klinge), `pattern.ts`, `pattern.check.ts` (Aufdruck des Einwickelpapiers: Kachel mit zwei kleinen
  Spießen), `stinger.ts`, `banners.ts`, `banners.check.ts`, `render.check.ts`
- Ändern: `render.ts` (`kebabClips` liefert `stinger`, `profile`, `offline`), `settings.ts` (mit `withStingerFields`
  aus `src/core/stingerOptions.ts`), `kebab.rs`, Fixture, erzeugte Typen

### Kontext

`RenderClip` (`src/core/renderClip.ts`) mit `draw(context, time)`; die Clips zeichnen mit Canvas 2D: Rough-Pfade aus
`chef.ts`, `arc.ts` und `pattern.ts` als `Path2D`, Schrift über `fillText` mit der geladenen Titan One. Späne und
Krümel kommen aus `food.ts` und `burstAt` als reine Funktion der Zeit. Stinger-Optionen (Bildrate, Halten, Kurve,
Grösse) über `readStingerOptions` und `withStingerOptions`. Der Prototyp `refs/stinger.html` hat gezeigt: Bekommen die
Hälften schon vor dem Reissen einen Schatten, sieht man am Übergangspunkt eine Naht; darum ist das Papier bis zum
Reissen ein Stück und der Schatten kommt erst mit dem Riss.

### Gestaltung

- **Stinger Papier** (Standard, 1.6 s, Übergang 0.8 s): Klappen oben, rechts, unten, links falten sich (je 0.05 s
  versetzt, 0.5 s, `power3.in`) zur Mitte; Bogenschrift und grosser Spieß ab 0.55 s; ab 0.92 s reisst das Papier
  gezackt in der Mitte und die Hälften fliegen mit Drehung zur Seite.
- **Stinger Messer:** das Messer fährt in 0.75 s von links unten nach rechts oben, neun Fleischscheiben schieben sich
  von unten nach oben versetzt herein, Späne fliegen von der Klinge; ab 0.9 s fallen die Scheiben mit Drehung.
- **Profil** (Standbild): Koch und Spieß mit Bogenschrift, Ladenname darunter, Dampf über dem Spieß.
- **Offline** (Standbild): Rollladen unten, darauf "Heute geschlossen", Dampf darunter.

### Einstellungen (Gruppen dieses Packages)

| Gruppe | Schlüssel (Standard) |
|---|---|
| Stinger | `stingerStyle` (papier: papier, messer), `stingerText` ("DÖNER KEBAB"), `stingerDuration` (1.6 s), `stingerCut` (0.8 s), `stingerTearJag` (4 %), `stingerSlices` (9), `stingerShavings` (an), `stingerSeed` (7), Kern-Felder aus `withStingerFields` |
| Profilbanner | `profileTitle` ("{shop}"), `profileSubtitle` ("Frisch vom Spieß"), `profileSteam` (an) |
| Offline-Banner | `offlineText` ("Heute geschlossen"), `offlineSteam` (an) |

### Acceptance Criteria

- [ ] AC1: `flapTips(t, timing)`: bei 0 liegen alle Spitzen am Rand, am Übergangspunkt über die Mitte hinaus (die vier
      Klappen überlappen, kein Pixel frei).
- [ ] AC2: `tearEdge(seed, jag)` ist deterministisch, beide Hälften teilen dieselbe Kante; vor dem Riss ist das Papier
      eine Fläche ohne Schatten.
- [ ] AC3: `sliceAt(row, t)`: am Übergangspunkt liegen alle neun Scheiben ohne Lücke über dem Bild; die unterste kommt
      zuerst.
- [ ] AC4: Profil- und Offline-Banner sind Standbilder (jedes Zeichnen gibt dasselbe Bild).
- [ ] AC5: Dieselben Einstellungen ergeben dieselben Bilder (zweimal rendern, gleiche Bytes eines Bildes).
- [ ] AC6 (manuell): Rendern im Dashboard als WebM und GIF, neben `refs/stinger.html`; Abnahme durch den Nutzer.

### Tests (TDD)

1. `wrap.check.ts > "Klappen decken am Übergang"` (AC1) und `"Riss-Kante"` (AC2)
2. `slices.check.ts > "Scheiben decken am Übergang"` (AC3)
3. `banners.check.ts > "Standbild"` (AC4)
4. `render.check.ts > "Clips"` (AC5): Liste der Clips und ihre Felder (`group`, `cut`, Grösse), zwei Renders gleich

### Umsetzungsschritte

1. Tests, rot; `wrap.ts`, `slices.ts`, `pattern.ts`, grün.
2. Einstellungen in TS und Rust, Fixture, Typen; `stinger.ts`, `banners.ts`, `render.ts`.
3. `npm run verify`, im Dashboard rendern, Abnahme.

### Out of Scope

- Ton im Stinger (Clips sind stumm wie bei allen Themes).

---

## Package 6: Minimes

**Ziel:** Chatter erscheinen als Döner, Dürüm, Lahmacun und Pommes mit Hüpfen, Tellerstapel und eigenen Animationen.

**Abhängigkeiten:** Package 1, Package 3

**Betroffene Dateien:**
- Neu: `dishes.ts`, `dishes.check.ts` (Formen je Typ als Rough-Formen mit Gesicht und Füsschen, Teile für die eigenen
  Bewegungen; Posen je Animation als reine Funktion der Zeit), `ink/Dish.tsx`, `scenes/Minimes.tsx`, `minimes.css`
  (Namensschilder als kleine Zettel, Aktionen über `action-<name>`)
- Ändern: `settings.ts` (`minimeVariants` mit den vier Typen, `MINIME_BASE_FIELDS`, `minimeVariantFields(set)`,
  `MINIME_HOP_FIELDS`, `minimeStackFields(set, defaults)` mit Türmen an und den Stufen Lahmacun, Dürüm, Pommes),
  `index.tsx` (`minimes`), `kebab.rs` (mit `minime_fields.rs`), Fixture, erzeugte Typen

### Kontext

`useMinimes({ catalog, reaction, widthPx, stack })` aus `src/core/hooks/useMinimes.ts`; Typen statt Farben wie in
THEMES.md beschrieben (`MinimeVariantSet`, Befehl `!typ`); in `?demo` wählt die Szene den Typ über
`hash(seedOf(login))`. Türme aus `src/core/minimeStack.ts` (`gather`, `brace`, `climb`, `stacked`, `stackWalk`,
`dismount`), Hüpfen aus `src/core/minimeHops.ts` mit `minimeHops.css` und `hopStyle`. Der eigene Katalog darf keine
Aktionsnamen des Kerns nutzen (`COMBAT_ACTIONS`, `STACK_ACTIONS`).

### Gestaltung

Wie DESIGN-KEBAB.md "Figuren": vier Typen in roter Linie auf Papierfüllung, Gesicht und Füsschen; eigene Animationen
drehen und Soße spritzen (Döner), aufrollen (Dürüm), falten (Lahmacun), Stäbchen werfen (Pommes), winken; Reaktion auf
Chat: Sprung mit Dampfwolke (ohne Ton); Tellerstapel als Turm (Lahmacun unten, Dürüm Mitte, Pommes oben), die
Höhe je Stufe ist eine Einstellung. Namensschilder als kleine Bestellzettel über der Figur. Die Figuren laufen auf
einer Thekenlinie am unteren Rand.

### Einstellungen (Gruppen dieses Packages)

| Gruppe | Schlüssel (Standard) |
|---|---|
| Minimes: Aussehen | `minimeSize` (96 px), `minimeCounter` (an), `minimeLabels` (an), `minimeLabelSize` (16 px), `minimeLevelHeight` (70 %) |
| Minimes: Animationen | je Animation Häufigkeit und Dauer: `minimeSpinWeight` (5), `minimeSpinMs` (1600 ms), `minimeRollWeight` (4), `minimeRollMs` (2000 ms), `minimeFoldWeight` (4), `minimeFoldMs` (1800 ms), `minimeFriesWeight` (4), `minimeFriesMs` (1400 ms), `minimeWaveWeight` (3), `minimeWaveMs` (1500 ms), `minimeJumpMs` (700 ms) |
| Minimes: Typen | aus `minimeVariantFields(set)`: Befehl `!typ`, je Typ Name und Chat-Namen (Döner, Dürüm, Lahmacun, Pommes) |
| Minimes: Türme | aus `minimeStackFields(set, defaults)` mit Türmen an und den Stufen Lahmacun, Dürüm, Pommes; Ton beim Aufsteigen `plop` |
| Kern-Gruppen | `MINIME_COMMANDS`, `MINIME_RULES`, `MINIME_MOTION`, `MINIME_HOP` |

### Acceptance Criteria

- [ ] AC1: `dishParts(type)` liefert für jeden der vier Typen Körper, Gesicht und Füsschen und die Teile der eigenen
      Bewegung; alle Formen liegen in der Box 0 bis 100.
- [ ] AC2: `dishPose(animation, t)` ist eine reine Funktion der Zeit und beginnt und endet in der Ruhe.
- [ ] AC3: Der Katalog nutzt keine Aktionsnamen des Kerns (geprüft im Kern).
- [ ] AC4: Mit Türmen an stehen drei Figuren der Typen Lahmacun, Dürüm und Pommes übereinander.
- [ ] AC5 (manuell): `minimes.html?demo&preview&sound=0` mit Demo-Minimes: Laufen mit Hüpfen, Animationen, Reaktion,
      Tellerstapel; Abnahme durch den Nutzer.

### Tests (TDD)

1. `dishes.check.ts > "Teile je Typ"` (AC1)
2. `dishes.check.ts > "Posen beginnen und enden ruhig"` (AC2)
3. `settings.check.ts` und `cargo test` wie in Package 1, Fixture `minime-features.json` unverändert grün (AC3)

### Umsetzungsschritte

1. Tests, rot; `dishes.ts`, grün.
2. Einstellungen in TS und Rust (Typen, Türme, Hüpfen), Fixture, Typen.
3. `ink/Dish.tsx`, `scenes/Minimes.tsx`, `minimes.css`.
4. `npm run verify`, Vorschau, Abnahme.

### Out of Scope

- Gefechte und Fraktionen (bewusst nicht in diesem Theme).
