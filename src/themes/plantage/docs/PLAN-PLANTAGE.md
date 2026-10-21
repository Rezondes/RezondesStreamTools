# Plan: Theme "Südfrucht-Plantage" (Mangoplantage)

Mangofeld statt Strand: Der Streamer ist der Mangopflücker, die Zuschauer sind Mangos mit Sturmgewehren in Rollen
(Sturmsoldat, Medic, MG-Schütze, Scharfschütze, Grenadier). Die Mangos hüpfen und schiessen sich zufällig
gegenseitig ab, solange ein Medic da ist, der sie wiederbelebt. Kein Strandgefühl, alles dreht sich um
die Plantage.

Testbefehl: `npm run verify` (dazu `npm run contract`, wo der Server betroffen ist). Regeln:
[CODING-RULES.md](../../../../CODING-RULES.md), Theme-Aufbau: [THEMES.md](../../../../THEMES.md), Übersicht aller Pläne: [PLAN.md](../../../../PLAN.md).

## Überblick

| # | Package | Ziel in einem Satz | Abhängig von |
|---|---------|--------------------|--------------|
| 1 | Theme Südfrucht-Plantage | Das Theme `plantage` bringt alle Szenen, Stinger, Banner, Töne und hüpfende Mango-Soldaten im Plantagen-Look. | PLAN-MINIMES 8, 11 |
| 2 | Modernisierung: Stil-Probe Starting | Starting zeigt die Plantage als PixiJS-Welt in Tiefenebenen mit Sonnenaufgang, Parallax, Blättern und Lichtstaub, abgenommen neben dem Prototyp. | 1, PLAN-GRAFIK 1, 2, 5 und 8 |
| 3 | Modernisierung: BRB und Ending | BRB und Ending nutzen dieselbe Welt zu anderen Tageszeiten mit eigenen Abläufen des Pflückers. | 2 (Abnahme) |
| 4 | Modernisierung: Overlays | Der Alert lässt eine Mango auf das Medaillon fallen, Saft und Blätter spritzen; die übrigen Overlays bewegen sich mit GSAP. | 2 |
| 5 | Modernisierung: Stinger und Banner | Stinger und Banner zeigen die neue Welt, Blätter und Spritzer kommen aus `burstAt`. | 3, PLAN-GRAFIK 7 |

## Annahmen

- **Name und ID** (entschieden 2026-10-18): Anzeigename "Südfrucht-Plantage", id `plantage`.
- **Rollen** (entschieden 2026-10-18): Sturmsoldat (Sturmgewehr), Medic (Sanitätstasche, schiesst nicht), MG-Schütze (LMG),
  Scharfschütze (Gewehr mit Zielfernrohr), Grenadier (Granatwerfer, Treffer als kleine Explosion). Chat-Namen je Rolle einstellbar, eine Rolle mit leerer Namensliste ist aus.
  Die Rolle wählt der Zuschauer per Befehl (`!join medic`, `!rolle sniper`), ohne Angabe eine zufällige erlaubte Rolle
  (entschieden 2026-10-18).
- **Gefechte** (entschieden 2026-10-18: zufällig als Animation, nie per Chatbefehl): geschossen wird nur,
  wenn ein freier Medic da ist; Medics schiessen nicht und sind nie Ziel; ein Getroffener liegt, bis ein Medic ihn
  wiederbelebt, oder steht nach einer einstellbaren Liegezeit von selbst auf. Kein Blut.
- **Regeln der Gefechte:** Kern, siehe [PLAN-MINIMES.md](../../../../plans/PLAN-MINIMES.md) Packages 8 und 11.
- **Alles einstellbar** (Gedächtnis): Häufigkeit und Dauer jeder Animation, Gefechtsrate, Liegezeit, Rollen, Farben,
  Texte, Töne. Fest bleiben nur Formen (SVG) und Server-Schutzgrenzen.
- **Kern statt Theme:** Das Theme bindet Hüpfen und Gefechte aus dem Kern ein und liefert nur Aussehen,
  eigene Animationen und Standardwerte; es verweist auf kein anderes Theme.
- **Schema in Rust und TS:** `server-rs/crates/rst-domain/src/themes/<id>.rs` und `src/themes/<id>/settings.ts`, gleich
  gehalten über die Fixtures.
- **Commit-Grösse:** das Theme-Package liegt deutlich über 400 Zeilen; bewusste Ausnahme, steht in
  der Commit-Beschreibung.
- **Wer auf wen:** jeder gegen jeden (keine Fraktionen).
- **Treffer:** Mangosaft spritzt, die Mango kippt um und bekommt Kreuzchen-Augen; der Medic hüpft hin und belebt sie.

---

## Package 1: Theme Südfrucht-Plantage

**Ziel:** Das Theme `plantage` bringt alle Szenen, Stinger, Banner, Töne und hüpfende Mango-Soldaten im Plantagen-Look.

**Abhängigkeiten:** [PLAN-MINIMES.md](../../../../plans/PLAN-MINIMES.md) Packages 8 (Hüpfen) und 11 (Gefechte)

**Betroffene Dateien:** `src/themes/plantage/` (neu, Aufbau wie in THEMES.md), `src/themes/registry.ts`,
`src/themes/scenes.tsx`, `src/dashboard/skin.ts`, `server-rs/crates/rst-domain/src/themes/plantage.rs` und Registry,
Fixture, `src/generated/themes/plantage.ts`, `index.html` (Schriften), `README.md`.

### Gestaltung je Szene

- **Grundlayout:** Mangofeld in Reihen, Mangobäume mit hängenden Mangos, Erdwege, Holzkisten und Leitern; Licht nach
  Tageszeit einstellbar. Kein Strand, kein Meer.
- **Der Streamer** ist der Mangopflücker: Figur mit Hut, Pflückstange und Korb auf Starting, BRB (pflückt) und Ending
  (Korb voll), Name aus `{channel}`.
- **Alerts:** Kisten-Etikett oder Erntezettel, Follow = "frisch gepflückt", Sub = "in die Kiste", Raid = "Erntehelfer".
- **Chat:** Notizen auf Erntezetteln oder Brettern am Baumstamm.
- **Kamera-Rahmen:** Holzkiste mit Plantagen-Stempel oder Blätterrahmen.
- **Musik:** Transistorradio auf einer Kiste.
- **Effekte, Befehlsseite:** im gleichen Stil.
- **Stinger:** eine Mango fällt vom Baum und füllt das Bild; **Banner:** Mangofeld mit Kanalnamen.
- **Minimes:** Mangos mit Gesicht, Helm und Waffe je Rolle (Sturmgewehr, Pistole und Sanitätstasche, LMG,
  Scharfschützengewehr, Granatwerfer); sie hüpfen mit der Hüpf-Bewegung des Kerns. Eigene Animationen (zielen, nachladen, Helm richten, umschauen,
  schlafen) plus Gefechte mit Saftspritzern und Kreuzchen-Augen.

### Acceptance Criteria

- [ ] AC1: Alle Szenen, Stinger und Banner im Plantagen-Look; kein fester Wert im Theme-Code (Regel-Skript).
- [ ] AC2: Minimes wählen Rollen per Befehl (Namen einstellbar), hüpfen und kämpfen nach [PLAN-MINIMES.md](../../../../plans/PLAN-MINIMES.md) Package 11.
- [ ] AC3: Schema in Rust und TS gleich (Fixture), `GET /api/themes` liefert es, das Formular entsteht daraus.
- [ ] AC4: Stinger und Banner rendern deterministisch (Checks mit aufzeichnendem Canvas).

### Tests (TDD)

1. `settings.check.ts`, `render.check.ts`, `stinger.check.ts`, `banners.check.ts`, Formen-Check der Mangos und Waffen.
2. Rust: Schema-Test gegen die Fixture.
3. Manuell: alle Szenen in der Vorschau mit `?demo`, Gefechte mit mehreren Demo-Minimes inklusive Medic.

---

# Modernisierung (Packages 2 bis 5)

Entschieden 2026-10-21: Die Plantage bleibt eine Illustration mit Tiefe (keine Umrisse, Licht von oben links,
Luftperspektive, weiche Schatten), wird aber mit PixiJS gezeichnet und mit GSAP bewegt. Gestaltung:
[DESIGN-PLANTAGE.md](DESIGN-PLANTAGE.md), Abschnitt "Modernisierung". Kern-Bausteine:
[plans/PLAN-GRAFIK.md](../../../../plans/PLAN-GRAFIK.md) (`PixiStage`, `useTimeline`, `chance`, `burstAt`,
`qualityField`, Stinger-Optionen).

## Annahmen der Modernisierung

- **Referenz** (abgenommen 2026-10-21): [refs/starting.html](refs/starting.html), [refs/alert.html](refs/alert.html)
  und die Standbilder daneben. Jedes Package mit sichtbarer Arbeit endet mit Renders neben diesen Bildern und dem OK
  des Nutzers. Die Prototypen dürfen per CDN laden, das Theme nicht.
- **Technik:** Welt, Pflücker und Teilchen in einer `PixiStage`; Karten, Texte und Fortschritt als HTML und CSS
  (Milchglas mit `backdrop-filter` über der Welt); Abläufe über `useTimeline` mit den Kurven des Kerns (`federnd` für
  Karten, `bounce` für Mangos). Kein 3D.
- **Alter Look:** wird ersetzt (SVG-Kulisse `Field.tsx`), kein Schalter.
- **Geometrie als Daten:** Ebenen, Baumkronen, Furchen, Kisten und der Pflücker sind reine Funktionen in `.ts`-Modulen
  mit Checks, gemeinsam für die PixiJS-Szene und die Canvas-Clips.
- **Zufall:** aus `chance` mit Startwert, Teilchen aus `burstAt` oder aus geschlossenen Formeln der Zeit.
- **Abstände:** Text hält überall mindestens 48 px Abstand zu Medaillon, Mango und Rahmen (Feedback zur Stil-Probe des
  Alerts).
- **Alles einstellbar**, **Schema in Rust und TS** (`plantage.rs`, Fixture, Typen je Package), **Fallstricke** in
  [THEMES.md](../../../../THEMES.md), **Commit** je Package nach grünem `npm run verify`.
- **Minimes:** bleiben in diesem Abschnitt unverändert.

---

## Package 2: Modernisierung: Stil-Probe Starting

**Ziel:** Starting zeigt die Plantage als PixiJS-Welt in Tiefenebenen mit Sonnenaufgang, Parallax, Blättern und
Lichtstaub, abgenommen neben dem Prototyp.

**Abhängigkeiten:** Package 1, PLAN-GRAFIK Packages 1, 2, 5 und 8

**Betroffene Dateien:**
- Neu in `src/themes/plantage/`: `world.ts`, `world.check.ts` (Ebenen mit Tiefe: Wolken, zwei Hügel, drei Baumreihen,
  Feld mit Furchen, vordere Bäume, Kisten, Gras; je Ebene Parallax-Faktor, Unschärfe und Mischung mit dem Himmel),
  `tree.ts`, `tree.check.ts` (Krone in drei Tönen, Mangos mit Glanz, Wiegen als Neigung aus der Zeit), `picker.ts`,
  `picker.check.ts` (Pflücker als Teile mit Gelenk am Arm, Stab, Korb), `drift.ts`, `drift.check.ts` (fallende Blätter
  und Lichtstaub als Lage aus der Zeit)
- Neu: `pixi/WorldLayer.tsx` (zeichnet die Ebenen in die `PixiStage`), `pixi/Picker.tsx`, `pixi/Drift.tsx`,
  `cards/FrostCard.tsx` (Milchglas-Karte), `cards/Basket.tsx` (Mangos plumpsen als Fortschritt)
- Ändern: `scenes/Screen.tsx` (Starting aus der neuen Welt; BRB und Ending bis Package 3 alt), `settings.ts`,
  `theme.css`, `server-rs/crates/rst-domain/src/themes/plantage.rs`, Fixture, `src/generated/themes/plantage.ts`

### Gestaltung

- **Sonnenaufgang** in 3,2 s: Himmel blendet von Dämmerung zu Morgen, die Welt hellt auf (Farbmatrix), die Sonne
  steigt, Strahlen drehen sich langsam.
- **Parallax:** die Kamera schwenkt langsam hin und her; ferne Ebenen bewegen sich wenig und sind unscharf, nahe viel.
- **Leben:** Bäume und Gras wiegen sich, Wolken ziehen, Blätter fallen, Lichtstaub glitzert.
- **Pflücker:** greift mit dem Stab nach oben in den Baum (Arm federt ein).
- **Karten:** fallen wie reife Früchte herein und federn nach; Titelwörter springen einzeln; Pille, Untertitel,
  Sprüche; Mangos plumpsen nacheinander in den Korb als Fortschritt.

### Einstellungen (neue Gruppen)

| Gruppe | Schlüssel (Standard) |
|---|---|
| Welt | `quality` (`qualityField`), `worldSeed` (42), `sunriseOn` (an), `sunriseMs` (3200 ms), `parallaxOn` (an), `parallaxAmount` (120 px), `parallaxSeconds` (14 s), `treeRowsFar` (11), `treeRowsMid` (8), `farBlur` (1.5), `hazeFar` (55 %), `swayAmount` (Faktor 1), `leavesOn` (an), `leafCount` (18, Obergrenze 200 mit `fixed`), `motesOn` (an), `moteCount` (70, Obergrenze 500 mit `fixed`), `raysOn` (an) |
| Starting | bestehende Texte bleiben; neu `cardDropMs` (1100 ms), `basketMangos` (5), `pickerReach` (an) |

### Acceptance Criteria

- [ ] AC1: `worldLayers` liefert die Ebenen von fern nach nah mit fallendem Parallax-Faktor und fallender Mischung mit
      dem Himmel; gleicher Startwert, gleiche Lage.
- [ ] AC2: `tree(k, haze)` färbt alle Töne mit `haze` zum Himmel; Mangos nur bei `haze` unter 0,5.
- [ ] AC3: `leafAt(seed, i, t)` und `moteAt` sind periodisch und deterministisch.
- [ ] AC4: `picker.reach(t)` beginnt in Ruhe und endet in der Greifhaltung, ohne Sprung.
- [ ] AC5: `auditTheme` ohne Befund; `scripts/rules.check.ts`, `scripts/bundle.ts` grün.
- [ ] AC6 (manuell): `starting.html?demo&preview&t=7` neben [refs/starting.png](refs/starting.png); Abnahme.

### Tests (TDD)

1. `world.check.ts > "Ebenen"` (AC1) 2. `tree.check.ts > "Luftperspektive"` (AC2) 3. `drift.check.ts > "aus der Zeit"`
(AC3) 4. `picker.check.ts > "Greifen"` (AC4) 5. `settings.check.ts`, `cargo test` (AC5)

### Umsetzungsschritte

1. Tests, rot; Module, grün. 2. Einstellungen TS und Rust. 3. PixiJS-Ebenen, Karten, `Screen.tsx`. 4. `npm run verify`,
Vorschau, Abnahme.

### Out of Scope

- BRB und Ending (3), Overlays (4), Clips (5), Minimes, Skin.

---

## Package 3: Modernisierung: BRB und Ending

**Ziel:** BRB und Ending nutzen dieselbe Welt zu anderen Tageszeiten mit eigenen Abläufen des Pflückers.

**Abhängigkeiten:** Package 2 (Abnahme)

**Betroffene Dateien:** `picker.ts` (Abläufe pflücken und winken), `drift.ts` (Glühwürmchen), `scenes/Screen.tsx`,
`settings.ts`, `plantage.rs`, Fixture, Typen

### Gestaltung

- **BRB:** Mittag, der Pflücker pflückt (Stab hoch, Mango fällt mit Abprallen in den Korb, wieder von vorn), Pausenzeit
  auf der Milchglas-Karte.
- **Ending:** Sonnenuntergang (Sonne sinkt, Welt wird warm und dunkler), Glühwürmchen, der Pflücker winkt mit vollem Korb,
  Karte mit `endingNext`.

### Einstellungen

| Gruppe | Schlüssel (Standard) |
|---|---|
| BRB | `brbPickEvery` (2.4 s), `brbMangoBounce` (an) |
| Ending | `sunsetOn` (an), `sunsetMs` (4000 ms), `firefliesOn` (an), `fireflyCount` (40, Obergrenze 300 mit `fixed`) |

### Acceptance Criteria

- [ ] AC1: Der Ablauf "pflücken" beginnt und endet in derselben Haltung (Schleife ohne Sprung).
- [ ] AC2: Glühwürmchen sind deterministisch aus Startwert und Zeit.
- [ ] AC3 (manuell): BRB und Ending in der Vorschau; Abnahme.

### Tests (TDD)

1. `picker.check.ts > "Pflücken als Schleife"` (AC1) 2. `drift.check.ts > "Glühwürmchen"` (AC2) 3. `settings.check.ts`,
`cargo test`

### Umsetzungsschritte

1. Tests, rot; Module, grün. 2. Einstellungen. 3. Szene. 4. `npm run verify`, Vorschau, Abnahme.

### Out of Scope

- Overlays (4), Clips (5).

---

## Package 4: Modernisierung: Overlays

**Ziel:** Der Alert lässt eine Mango auf das Medaillon fallen, Saft und Blätter spritzen; die übrigen Overlays bewegen
sich mit GSAP.

**Abhängigkeiten:** Package 2

**Betroffene Dateien:**
- Neu: `mangoDrop.ts`, `mangoDrop.check.ts` (Fall, Stauchen beim Aufprall, Nachfedern als Werte aus der Zeit),
  `pixi/AlertBurst.tsx` (Saftspritzer und Blätter über `burstAt`), `cards/Medallion.tsx`, `cards/Branch.tsx` (Ast als
  Restzeit, Blätter fallen ab)
- Ändern: `scenes/Alerts.tsx`, `scenes/Chat.tsx`, `scenes/Cam.tsx`, `scenes/Music.tsx`, `scenes/Fx.tsx`,
  `scenes/Info.tsx`, `settings.ts`, `plantage.rs`, Fixture, Typen, `theme.css`

### Gestaltung

- **Alert** (wie [refs/alert.html](refs/alert.html)): die glänzende Mango fällt auf das Papiermedaillon, staucht sich,
  federt nach; Saft und Blätter spritzen; die Milchglas-Karte wächst aus dem Medaillon, der Name springt Buchstabe für
  Buchstabe; der Ast schrumpft als Restzeit und verliert seine Blätter; Abgang: Karte zurück, Mango rollt weg.
  Mindestens 48 px zwischen Medaillon und Text; das Ganze steht mittig.
- **Chat:** Erntezettel schweben wie Blätter herein und legen sich ab.
- **Kamera:** Kiste mit Blättern an den Ecken, die sich wiegen.
- **Musik:** Transistorradio, Equalizer in PixiJS, Ranke wächst beim Titelwechsel.
- **Effekte, Befehlsseite:** Milchglas-Karten fallen und federn.

### Einstellungen

| Gruppe | Schlüssel (Standard) |
|---|---|
| Alerts | `alertMangoOn` (an), `alertSquash` (28 %), `alertSplashOn` (an), `alertSplashDrops` (40), `alertLeaves` (16), `alertGap` (48 px, mindestens 24 mit `fixed: Lesbarkeit`), `alertBranchOn` (an) |

### Acceptance Criteria

- [ ] AC1: `mangoDrop(t)` landet zur eingestellten Zeit, staucht bis `alertSquash` und kehrt ohne Sprung zur Form
      zurück.
- [ ] AC2: Der Text hält `alertGap` zum Rand des Medaillons (geprüft über die berechnete Lage der Karte).
- [ ] AC3: Alle Overlays bleiben transparent; jede Alert-Art zeigt ihre Texte wie bisher.
- [ ] AC4 (manuell): neben [refs/alert.png](refs/alert.png); Abnahme.

### Tests (TDD)

1. `mangoDrop.check.ts > "Aufprall"` (AC1) 2. `mangoDrop.check.ts > "Abstand"` (AC2) 3. bestehende Alert-Checks (AC3)

### Umsetzungsschritte

1. Tests, rot; Module, grün. 2. Einstellungen. 3. Szenen. 4. `npm run verify`, Vorschau, Abnahme.

### Out of Scope

- Clips (5), Minimes.

---

## Package 5: Modernisierung: Stinger und Banner

**Ziel:** Stinger und Banner zeigen die neue Welt, Blätter und Spritzer kommen aus `burstAt`.

**Abhängigkeiten:** Package 3, PLAN-GRAFIK Package 7

**Betroffene Dateien:** `stinger.ts`, `stinger.check.ts`, `banners.ts`, `banners.check.ts`, `render.ts`,
`render.check.ts`, `settings.ts`, `plantage.rs`, Fixture, Typen

### Gestaltung

- **Stinger:** die glänzende Mango fällt ins Bild, wächst, bis sie es füllt (Übergangspunkt), Blätter wirbeln aus
  `burstAt`, Text auf der Mango, dann fällt sie unten heraus.
- **Banner:** dieselbe Welt (Ebenen aus `world.ts`) am Tag und am Abend, als Standbild auf Canvas.

### Acceptance Criteria

- [ ] AC1: Am Übergangspunkt deckt die Mango das ganze Bild; Blätter folgen aus Startwert und Zeit.
- [ ] AC2: Die Stinger-Optionen aus dem Kern gelten; gleiche Einstellungen, gleiche Bilder.
- [ ] AC3 (manuell): WebM und GIF im Dashboard; Abnahme.

### Tests (TDD)

1. `stinger.check.ts > "gedeckt am Übergang"` (AC1) 2. `render.check.ts > "Clips"` (AC2)

### Umsetzungsschritte

1. Tests, rot; `stinger.ts`, `banners.ts`, grün. 2. `render.ts`, Einstellungen. 3. `npm run verify`, rendern, Abnahme.

### Out of Scope

- Ton im Stinger.
