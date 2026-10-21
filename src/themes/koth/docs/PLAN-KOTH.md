# Plan: Theme "King of the Hill" (KOTH)

Militärisch nach dem Modus King of the Hill aus Arma 3, Arma Reforger und Wardogs: ein Hügel in der Mitte, drei
Fraktionen kämpfen darum. Die Zuschauer sind kleine Soldaten in Rollen (Sturmsoldat, Medic, MG-Schütze,
Scharfschütze, Grenadier), die nicht laufen und nicht hüpfen.

Testbefehl: `npm run verify` (dazu `npm run contract`, wo der Server betroffen ist). Regeln:
[CODING-RULES.md](../../../../CODING-RULES.md), Theme-Aufbau: [THEMES.md](../../../../THEMES.md), Übersicht aller Pläne: [PLAN.md](../../../../PLAN.md).

## Überblick

| # | Package | Ziel in einem Satz | Abhängig von |
|---|---------|--------------------|--------------|
| 1 | Theme King of the Hill | Das Theme `koth` bringt alle Szenen, Stinger, Banner, Töne und stehende Soldaten-Minimes in drei Fraktionen. | PLAN-MINIMES 10, 11, 12 |
| 2 | Modernisierung: Stil-Probe Starting in 3D | Starting zeigt den Hügel als 3D-Welt mit Funkmast, Flagge, Lager, Rauch und Kamerafahrt so, dass der Nutzer den Stil neben dem Prototyp abnimmt. | 1, PLAN-GRAFIK 1 bis 4 und 8 |
| 3 | Modernisierung: BRB und Ending in 3D | BRB zeigt den Hügel in der Nacht, Ending die Siegerflagge mit Leuchtraketen und Einsatzbericht. | 2 (Abnahme), PLAN-STATS |
| 4 | Modernisierung: Overlays | Alerts kommen als Hundemarke mit Funkgerät, Chat, Kamera, Musik, Effekte und Befehlsseite bewegen sich mit GSAP. | 2 |
| 5 | Modernisierung: Stinger und Banner in 3D | Eine Rauchgranate füllt das Bild in 3D, im Rauch wechselt die Flagge; die Banner zeigen den 3D-Hügel. | 3, PLAN-GRAFIK 7 |
| 6 | Modernisierung: 3D-Soldaten als Minimes | Die Minimes sind 3D-Soldaten mit Helm, Rolle und Fraktionsfarbe, die zielen, nachladen und Gefechte zeigen. | 2 |

## Annahmen

- **Name und ID** (entschieden 2026-10-18): Anzeigename "King of the Hill", id `koth`.
- **Fraktionen** (entschieden 2026-10-18): Standard BLUFOR (blau), OPFOR (rot),
  INDFOR (grün), Name, Farbe und Chat-Namen je Fraktion einstellbar. Befehl `!join blau medic` (Reihenfolge egal) oder
  `!team rot`. Ohne Angabe die Fraktion mit den wenigsten Mitgliedern.
- **Rollen** (entschieden 2026-10-18): Sturmsoldat (Sturmgewehr), Medic (Sanitätstasche, schiesst nicht), MG-Schütze (LMG),
  Scharfschütze (Gewehr mit Zielfernrohr), Grenadier (Granatwerfer, Treffer als kleine Explosion). Chat-Namen je Rolle einstellbar, eine Rolle mit leerer Namensliste ist aus.
  Die Rolle wählt der Zuschauer per Befehl (`!join medic`, `!rolle sniper`), ohne Angabe eine zufällige erlaubte Rolle
  (entschieden 2026-10-18).
- **Gefechte** (entschieden 2026-10-18: zufällig als Animation, nie per Chatbefehl): geschossen wird nur,
  wenn ein freier Medic aus der Fraktion des Ziels da ist; Medics schiessen nicht und sind nie Ziel; ein Getroffener liegt, bis ein Medic ihn
  wiederbelebt, oder steht nach einer einstellbaren Liegezeit von selbst auf. Kein Blut.
- **Regeln der Gefechte und Fraktionen:** Kern, siehe [PLAN-MINIMES.md](../../../../plans/PLAN-MINIMES.md) Packages 10 bis 12.
- **Alles einstellbar** (Gedächtnis): Häufigkeit und Dauer jeder Animation, Gefechtsrate, Liegezeit, Rollen, Farben,
  Texte, Töne. Fest bleiben nur Formen (SVG) und Server-Schutzgrenzen.
- **Kern statt Theme:** Das Theme bindet Fraktionen und Gefechte aus dem Kern ein und liefert nur Aussehen,
  eigene Animationen und Standardwerte; es verweist auf kein anderes Theme.
- **Schema in Rust und TS:** `server-rs/crates/rst-domain/src/themes/<id>.rs` und `src/themes/<id>/settings.ts`, gleich
  gehalten über die Fixtures.
- **Commit-Grösse:** das Theme-Package liegt deutlich über 400 Zeilen; bewusste Ausnahme, steht in
  der Commit-Beschreibung.
- **Wer auf wen:** nur auf andere Fraktionen; ist nur eine Fraktion da, wird nicht geschossen.
- **Laufen und Hüpfen aus:** feste Plätze am Hügel (Theme-Standards für Kern-Felder, RUST-PLAN 48: `minimePlacement = slots`,
  "Häufigkeit: wandern" 0), Bewegung nur auf der
  Stelle (zielen, nachladen, Deckung, liegen, umschauen). Der Medic kriecht zum Getroffenen, das ist die einzige
  Ortsänderung.
- **Treffer:** Staubwolke, der Soldat fällt hin.

---

## Package 1: Theme King of the Hill

**Ziel:** Das Theme `koth` bringt alle Szenen, Stinger, Banner, Töne und stehende Soldaten-Minimes in drei Fraktionen.

**Abhängigkeiten:** [PLAN-MINIMES.md](../../../../plans/PLAN-MINIMES.md) Packages 10 (Fraktionen), 11 (Gefechte) und 12 (feste Plätze)

**Betroffene Dateien:** `src/themes/koth/` (neu), Registry, Scenes, Skin, `server-rs/crates/rst-domain/src/themes/koth.rs`
und Registry, Fixture, `src/generated/themes/koth.ts`, `index.html` (Schrift im Schablonen-Stil), `README.md`.

### Gestaltung je Szene

- **Grundlayout:** Hügel mit Funkmast und Flagge in der Mitte, Sandsäcke, Tarnnetze, Gelände in Oliv und Sand,
  Fraktionsfarben als Akzent; Anzeige, welche Fraktion den Hügel hält: die mit den meisten Minimes (entschieden 2026-10-18),
  bei Gleichstand umkämpft; gezählt mit `teamCounts` aus dem Kern, ohne eigenen Zustand. Die Anzeige gibt es nur
  in der Szene `minimes` (entschieden 2026-10-18); die anderen Szenen zeigen den Hügel als Kulisse.
- **Starting, BRB, Ending:** Einsatzbesprechung mit Lagekarte, Countdown als Einsatzbeginn; Ending als Einsatzbericht.
- **Alerts:** Funkspruch-Karte mit Rufzeichen (Follow = "neuer Rekrut", Sub = "Verstärkung", Raid = "Luftlandung").
- **Chat:** Funkprotokoll mit Zeitstempel.
- **Kamera-Rahmen:** Zielfernrohr- oder Helmkamera-Rahmen mit Markierungen.
- **Musik:** Feldfunkgerät.
- **Stinger:** Rauchgranate und Flaggenwechsel; **Banner:** Hügel mit Flagge und Kanalnamen.
- **Minimes:** kleine Soldaten mit Helm, Uniform in Fraktionsfarbe, Waffe je Rolle; feste Plätze am Hügel, kein Laufen
  und Hüpfen. Eigene Animationen auf der Stelle (zielen, nachladen, Deckung, hinlegen, umschauen, salutieren) plus
  Gefechte (nur zwischen Fraktionen) mit Staubwolke; der Medic kriecht zum Getroffenen.

### Acceptance Criteria

- [ ] AC1: Alle Szenen, Stinger und Banner im Militär-Look; kein fester Wert im Theme-Code.
- [ ] AC2: Minimes wählen Fraktion und Rolle per Befehl, stehen auf festen Plätzen, kämpfen nur zwischen Fraktionen.
- [ ] AC3: Schema in Rust und TS gleich, Formular aus dem Server-Schema; Fraktionen (Name, Farbe, Chat-Namen) einstellbar.
- [ ] AC4: Stinger und Banner rendern deterministisch.

### Tests (TDD)

1. Settings-, Render-, Stinger- und Banner-Checks wie bei jedem Theme, dazu ein Check des Hügel-Halters (meiste Minimes, Gleichstand).
2. Vertragsfall: `!join blau medic` im Chat erscheint als Minime mit Fraktion und Rolle.
3. Manuell: Vorschau aller Szenen, Gefechte mit drei Fraktionen.

---

# Modernisierung (Packages 2 bis 6)

Entschieden 2026-10-21: KOTH wird komplett 3D wie das Theme Dachdecker. Der Hügel mit Funkmast, Flagge und drei
Fraktionen bleibt die Kernidee. Gestaltung: [DESIGN-KOTH.md](DESIGN-KOTH.md), Abschnitt "Modernisierung". Kern-Bausteine:
[plans/PLAN-GRAFIK.md](../../../../plans/PLAN-GRAFIK.md) (`Stage3D`, `useTimeline`, `glClip`, `chance`, `burstAt`,
`qualityField`, Stinger-Optionen).

## Annahmen der Modernisierung

- **Referenz** (abgenommen 2026-10-21): [refs/starting.html](refs/starting.html) und [refs/alert.html](refs/alert.html)
  mit den Standbildern daneben. Jedes Package mit sichtbarer Arbeit endet mit Renders neben diesen Bildern und dem OK
  des Nutzers; ohne OK beginnt kein weiteres Package. Die Prototypen dürfen per CDN laden, das Theme nicht (alle Module
  aus `node_modules`, Schriften selbst gehostet wie heute).
- **Technik:** 3D mit react-three-fiber über `Stage3D` (Vollbild-Szenen, Alerts, Minimes), Abläufe über `useTimeline`,
  Clips über `glClip` mit Vanilla-Three.js. 2D-Teile (Lagekarte, Funkdisplay, Funkgerät) bleiben HTML, CSS und SVG.
- **Alter Look:** wird ersetzt, es gibt keinen Schalter zwischen alt und neu.
- **Geometrie als Daten:** Gelände, Lager, Mast, Flagge, Rauch und Soldaten sind reine Funktionen in `.ts`-Modulen mit
  Checks; Szenen (R3F) und Clips (Vanilla) nutzen dieselben Module. Alles, was am Boden steht, bekommt seine Höhe aus
  der Geländefunktion; nichts schwebt (Feedback zur Stil-Probe: das schwebende Tarnnetz fiel weg).
- **Zufall:** jede Verteilung aus `chance` mit Startwert aus den Einstellungen, Teilchen aus `burstAt`; nie
  `Math.random`.
- **Alles einstellbar** (Regeln 19 und 20): Farben, Texte, Mengen, Dauern, jedes Element einzeln an und aus,
  Leistungsstufe über `qualityField`. Fest bleiben Formen und Schutzgrenzen mit `fixed: <Grund>`.
- **Schema in Rust und TS:** jedes Package ergänzt `settings.ts` und `koth.rs` im selben Commit, Fixture und erzeugte
  Typen neu.
- **Fallstricke** aus den Prototypen stehen in [THEMES.md](../../../../THEMES.md) (PLAN-GRAFIK Package 8).
- **Commit:** je Package nach grünem `npm run verify`; über 400 Zeilen ist eine bewusste Ausnahme und steht in der
  Commit-Beschreibung.

---

## Package 2: Modernisierung: Stil-Probe Starting in 3D

**Ziel:** Starting zeigt den Hügel als 3D-Welt mit Funkmast, Flagge, Lager, Rauch und Kamerafahrt so, dass der Nutzer
den Stil neben dem Prototyp abnimmt.

**Abhängigkeiten:** Package 1, PLAN-GRAFIK Packages 1 bis 4 und 8

**Betroffene Dateien:**
- Neu in `src/themes/koth/`: `terrain.ts`, `terrain.check.ts` (`hillHeight(x, z, dims)`, Hügel mit Rauschen,
  Bergkranz in der Ferne), `camp.ts`, `camp.check.ts` (Lage von Sandsäcken, Bunker, Zelten, Kisten, Zaunpfosten,
  Kiefern, Felsen, Jeep als Daten aus Startwert und Einstellungen), `mast.ts`, `mast.check.ts` (Gittermast als Segmente
  in Bau-Reihenfolge, Abspannseile, Schüssel, Plattform), `flag.ts`, `flag.check.ts` (Welle des Fahnentuchs als reine
  Funktion von Punkt und Zeit), `smoke.ts`, `smoke.check.ts` (Rauchsäulen als Lage je Teilchen aus der Zeit)
- Neu: `three/Terrain.tsx`, `three/Mast.tsx`, `three/Flag.tsx`, `three/Camp.tsx`, `three/Smoke.tsx`,
  `three/Helicopter.tsx`, `three/HillCamera.tsx` (Fahrt von der Flagge zurück, dann Kreisen), `three/World.tsx`
  (Himmel, Nebel, Sonne, Licht, Schatten)
- Neu: `briefing/BriefingMap.tsx` (Lagekarte, Höhenlinien, Route und Ziel zeichnen sich mit `drawSVG`),
  `briefing/RadioDisplay.tsx` (Funkdisplay mit Rauschen und Scramble), `briefing/RadioLines.tsx` (Funkzeilen tippen
  sich, Rauschen dazwischen)
- Ändern: `scenes/Screen.tsx` (Starting aus der 3D-Welt; BRB und Ending bleiben bis Package 3), `settings.ts`,
  `theme.css`, `server-rs/crates/rst-domain/src/themes/koth.rs`, Fixture, `src/generated/themes/koth.ts`

### Kontext

Der Prototyp [refs/starting.html](refs/starting.html) zeigt Aufbau, Kamera, Licht und Mengen (Gelände 160 m mit 90
Teilungen, Hügel 7,2 m, Mast 9,5 m, Kamera von Radius 9 auf 40 und Höhe 12 in 5,5 s). Seine Zahlen werden
Standardwerte. Szenen nutzen `useStage` und `useScreen` (Countdown, `?ticker`, `?next`) wie heute.

### Gestaltung

- **Welt:** Abendhimmel als Verlauf, Nebel in Horizontfarbe (Luftperspektive), tiefe Sonne mit Schein, Bergkranz in
  der Ferne, Low-Poly-Gelände mit flacher Schattierung (Oliv oben, Sand unten), weiche Schatten.
- **Hügel:** Funkmast mit Blinklicht, Abspannseilen, Schüssel und Plattform; Fahnenmast mit wehender Flagge (Farbe und
  Symbol der haltenden Fraktion); Sandsack-Ringe, Bunker mit Sehschlitz, zwei Zelte, Kistenstapel, Stacheldrahtzaun
  auf Pfosten, Kiefern und Felsen am Hang, Jeep, Fraktionsfähnchen am Fuss, Rauchsäulen, Staub im Licht, Hubschrauber
  in der Ferne.
- **Ablauf (Standard):** Gelände wächst ab 0,1 s, Mast baut sich ab 1,0 s Segment für Segment, Sandsäcke fallen ab
  1,4 s mit Abprallen, Flagge geht ab 2,4 s hoch, Schüssel und Seile ab 2,4 s, Fähnchen ab 3,2 s; Kamera fährt in 5,5 s
  zurück und kreist dann. Alles skaliert mit `buildSpeed`.
- **2D:** Kopfzeile "KOTH AN ALLE" oben links, Lagekarte darunter (Höhenlinien, Route, Ziel, Kreuz, Beschriftung
  tippen sich), Uhr oben rechts, Titel in Schablonenschrift Buchstabe für Buchstabe, Funkdisplay mit Countdown,
  Funkzeilen, Fraktionen unten rechts, Warnstreifen als Fortschritt.

### Einstellungen (neue Gruppen)

| Gruppe | Schlüssel (Standard) |
|---|---|
| Welt | `quality` (`qualityField`), `worldSeed` (301), `skyTop` (`#5d4a3a`), `skyHorizon` (`#f3dcb0`), `fogNear` (50 m), `fogFar` (210 m), `sunColor` (`#ffd29a`), `bloomStrength` (0.55), `shadows` (an), `hillHeight` (7.2 m), `hillColor` (`#6b7a3a`), `hillShade` (`#4a5628`), `sandColor` (`#b9a06a`), `mountainsOn` (an), `mountainColor` (`#6b7280`) |
| Lager | `mastHeight` (9.5 m), `mastWires` (an), `mastDish` (an), `beaconColor` (`#ff3b30`), `beaconEvery` (1.4 s), `flagSize` (2.8 m), `flagWind` (Faktor 1), `sandbagsOn` (an), `bunkerOn` (an), `tents` (2), `crateStacks` (3), `fenceOn` (an), `trees` (46, Obergrenze 200 mit `fixed`), `rocks` (30), `jeepOn` (an), `helicopterOn` (an), `markerFlagsOn` (an), `smokeColumns` (3), `smokeAmount` (22 je Säule), `dustCount` (300, Obergrenze 2000 mit `fixed`) |
| Kamera | `cameraIntro` (an), `cameraRadius` (40 m), `cameraHeight` (12 m), `cameraSpeed` (0.045), `buildSpeed` (Faktor 1) |
| Starting | bestehende Texte bleiben; neu `briefingMapOn` (an), `briefingLabel` ("LAGEKARTE  M 1:25 000"), `briefingTarget` ("ZIEL: HÜGEL 301"), `radioLinesOn` (an), `radioStaticMs` (350 ms) |

### Acceptance Criteria

- [ ] AC1: `hillHeight` ist am Gipfel am höchsten und am Rand der Welt nahe 0; gleiche Eingaben, gleiche Höhe.
- [ ] AC2: `campLayout` setzt jedes Objekt mit seiner Grundfläche auf die Geländehöhe (Abweichung höchstens 0,05 m),
      kein Objekt liegt im Gipfel-Freiraum des Mastes, Zahl und Art folgen den Einstellungen, gleicher Startwert gleiche
      Lage.
- [ ] AC3: `mastSegments` liefert die Segmente in Bau-Reihenfolge von unten nach oben; die Seile enden an Ankern auf
      dem Gelände.
- [ ] AC4: `flagOffset(point, t)` ist am Mast 0 und wächst zum freien Ende; reine Funktion der Zeit.
- [ ] AC5: `smokeAt(seed, i, t)` ist periodisch in der Lebensdauer und deterministisch.
- [ ] AC6: `auditTheme` findet keinen ungenutzten Schlüssel; `scripts/rules.check.ts` und `scripts/bundle.ts` sind grün.
- [ ] AC7 (manuell): `starting.html?demo&preview&t=9` liegt neben [refs/starting.png](refs/starting.png) und trifft
      Komposition, Licht und Detail; mit `quality = niedrig` läuft die Szene ohne Schatten und Bloom; der Nutzer nimmt den
      Stil ab.

### Tests (TDD)

1. `terrain.check.ts > "Hügel"` (AC1)
2. `camp.check.ts > "alles steht auf dem Boden"` (AC2)
3. `mast.check.ts > "Bau-Reihenfolge und Seile"` (AC3)
4. `flag.check.ts > "Welle"` (AC4)
5. `smoke.check.ts > "Rauch aus der Zeit"` (AC5)
6. `settings.check.ts > "Schema"` und `cargo test` (AC6)

### Umsetzungsschritte

1. Tests 1 bis 5, rot; Module, grün.
2. Einstellungen in TS und Rust, Fixture, Typen.
3. 3D-Komponenten, 2D-Bausteine, `Screen.tsx` für Starting.
4. `npm run verify`, Vorschau rendern, neben den Prototyp legen, Abnahme abwarten (AC7).

### Out of Scope

- BRB und Ending (3), Overlays (4), Clips (5), Minimes (6), Dashboard-Skin (bleibt).

---

## Package 3: Modernisierung: BRB und Ending in 3D

**Ziel:** BRB zeigt den Hügel in der Nacht, Ending die Siegerflagge mit Leuchtraketen und Einsatzbericht.

**Abhängigkeiten:** Package 2 (Abnahme), [plans/PLAN-STATS.md](../../../../plans/PLAN-STATS.md)

**Betroffene Dateien:**
- Neu: `flares.ts`, `flares.check.ts` (Leuchtraketen über `burstAt`: Aufstieg, Ausbruch, sinkende Funken),
  `searchlight.ts`, `searchlight.check.ts` (Schwenk des Suchscheinwerfers aus der Zeit), `report.ts`, `report.check.ts`
  (Zeilen des Einsatzberichts aus `describeStats`), `three/Searchlight.tsx`, `three/Flares.tsx`, `three/Campfire.tsx`,
  `briefing/Report.tsx` (zählt hoch, Stempel "AUFTRAG ERFÜLLT")
- Ändern: `scenes/Screen.tsx` (BRB und Ending aus der 3D-Welt), `settings.ts`, `koth.rs`, Fixture, Typen, `tones.ts`
  (Raketenzischen, Standard aus)

### Gestaltung

- **BRB:** dieselbe Welt in der Nacht (Himmel, Nebel und Licht aus eigenen Farben), Mondlicht, Suchscheinwerfer auf
  dem Bunker schwenkt über den Hang, Lagerfeuer vor den Zelten mit Funken, Blinklicht deutlich, Kamera kreist tiefer;
  2D wie Starting mit Pausenzeit statt Countdown.
- **Ending:** Abenddämmerung, die Flagge der stärksten Fraktion wird neu gehisst, Leuchtraketen in den Fraktionsfarben
  in Abständen, Kamera startet an der Flagge und fährt zurück; links der Einsatzbericht (echte Zahlen über
  `useStreamStats`), dann Stempel; Titel und `endingNext`.

### Einstellungen (neue Gruppen)

| Gruppe | Schlüssel (Standard) |
|---|---|
| BRB | `brbSkyTop` (`#0b1020`), `brbSkyHorizon` (`#2a3150`), `moonOn` (an), `searchlightOn` (an), `searchlightSpeed` (Faktor 1), `campfireOn` (an), `brbCameraHeight` (9 m) |
| Ending | `endingSkyTop` (`#3a2a4a`), `endingSkyHorizon` (`#e9a46a`), `flaresOn` (an), `flaresEvery` (2.2 s), `flareSparks` (80, Obergrenze 400 mit `fixed`), `flareSound` (aus), `reportOn` (an), `reportTitle` ("EINSATZBERICHT"), `reportLines` ("follows\|Neue Rekruten", "subs\|Verstärkung", "raids\|Verbündete Trupps", "bits\|Munition", "chatMessages\|Funksprüche"), `countUpMs` (1000 ms), `stampText` ("AUFTRAG ERFÜLLT"), `stampAt` (6 s) |

### Acceptance Criteria

- [ ] AC1: `flareAt(seed, i, t)` steigt, platzt am höchsten Punkt und lässt Funken sinken; reine Funktion der Zeit.
- [ ] AC2: Der Suchscheinwerfer schwenkt periodisch zwischen zwei Winkeln aus den Einstellungen.
- [ ] AC3: Der Bericht zeigt die Zeilen aus `reportLines` mit echten Zahlen, in `?demo` die Demo-Werte, ohne Statistik
      Striche.
- [ ] AC4 (manuell): BRB und Ending in der Vorschau; Abnahme durch den Nutzer.

### Tests (TDD)

1. `flares.check.ts > "Rakete aus der Zeit"` (AC1)
2. `searchlight.check.ts > "Schwenk"` (AC2)
3. `report.check.ts > "Zeilen"` (AC3)
4. `settings.check.ts`, `cargo test`

### Umsetzungsschritte

1. Tests, rot; Module, grün. 2. Einstellungen TS und Rust. 3. Komponenten, `Screen.tsx`. 4. `npm run verify`, Vorschau,
Abnahme.

### Out of Scope

- Overlays (4), Clips (5), Minimes (6).

---

## Package 4: Modernisierung: Overlays

**Ziel:** Alerts kommen als Hundemarke mit Funkgerät, Chat, Kamera, Musik, Effekte und Befehlsseite bewegen sich mit
GSAP.

**Abhängigkeiten:** Package 2

**Betroffene Dateien:**
- Neu: `dogtag.ts`, `dogtag.check.ts` (Umriss mit Loch, Prägezeilen aus den Texten, Kugelkette), `three/DogTag.tsx`
  (metallisch mit Umgebungslicht, geprägter Name als Bump-Map aus einem Canvas, Pendel an der Kette),
  `three/SmokePuff.tsx` (Rauchstoss über `burstAt`), `radio/RadioSet.tsx` (Funkgerät mit LED, Gitter, Display,
  Rauschen aus festem Zufall)
- Ändern: `scenes/Alerts.tsx`, `scenes/Chat.tsx`, `scenes/Cam.tsx`, `scenes/Music.tsx`, `scenes/Fx.tsx`,
  `scenes/Info.tsx`, `settings.ts`, `koth.rs`, Fixture, Typen, `theme.css`

### Gestaltung

- **Alerts** (wie [refs/alert.html](refs/alert.html)): Die Hundemarke fällt an der Kette herein und pendelt aus
  (`elastic`), ein Rauchstoss dahinter, das Funkgerät knallt von der Marke aus auf (`stempel`), Rauschen im Display,
  dann tippen Kopfzeile und Zeile, der Name entschlüsselt sich, die LED blinkt, Restzeit als Warnstreifen; Abgang:
  Rauschen, Funkgerät schliesst, die Marke wird nach oben gezogen. Die Prägung zeigt Kanal, Name, Art, Fraktion.
- **Chat:** Funkprotokoll; neue Zeilen tippen sich mit kurzem Rauschen, Zeitstempel zählt hoch.
- **Kamera:** Helmkamera; Fadenkreuz zieht beim Einblenden zusammen, REC blinkt, Akku-Anzeige.
- **Musik:** Feldfunkgerät; Frequenzskala läuft beim Titelwechsel durch (Scramble), Equalizer als Signalbalken.
- **Effekte, Befehlsseite:** Funkzettel und Einsatzblätter fallen mit GSAP herein.

### Einstellungen

| Gruppe | Schlüssel (Standard) |
|---|---|
| Alerts | `alertStyle` (marke: marke, funk, akte), `dogtagOn` (an), `dogtagLines` ("{channel}", "{user}", "{amount}", "O POS"; Platzhalter wie bei den Alert-Texten), `dogtagMetal` (`#d9dde1`), `dogtagSwing` (Faktor 1), `alertSmokeOn` (an), `radioChannel` ("KANAL 7 // 41.250 MHZ"), `radioStaticMs` (500 ms), `alertOpenMs` (450 ms), `alertCloseMs` (350 ms); bestehende Texte je Art bleiben |

### Acceptance Criteria

- [ ] AC1: `dogtagShape` liefert einen geschlossenen Umriss mit Loch; die Prägezeilen füllen die Platzhalter.
- [ ] AC2: Jede Alert-Art zeigt ihre Texte wie bisher (`describeAlert`); mit `dogtagOn` aus nur das Funkgerät.
- [ ] AC3: Alle Overlays bleiben transparent; `?t=` zeigt jede Phase als Standbild.
- [ ] AC4 (manuell): Alert neben [refs/alert.png](refs/alert.png); Abnahme durch den Nutzer.

### Tests (TDD)

1. `dogtag.check.ts > "Umriss und Prägung"` (AC1)
2. bestehende Alert-Checks bleiben grün (AC2)
3. `settings.check.ts`, `cargo test`

### Umsetzungsschritte

1. Test, rot; `dogtag.ts`, grün. 2. Einstellungen. 3. Szenen. 4. `npm run verify`, Vorschau, Abnahme.

### Out of Scope

- Clips (5), Minimes (6).

---

## Package 5: Modernisierung: Stinger und Banner in 3D

**Ziel:** Eine Rauchgranate füllt das Bild in 3D, im Rauch wechselt die Flagge; die Banner zeigen den 3D-Hügel.

**Abhängigkeiten:** Package 3, PLAN-GRAFIK Package 7

**Betroffene Dateien:**
- Neu: `clips3d.ts` (Vanilla-Three.js-Szenen für Stinger und Banner mit `glClip`, lädt nur in `prepare`),
  `smokeStinger.ts`, `smokeStinger.check.ts` (Granate rollt, Rauchwolke wächst aus `burstAt` bis zur vollen Deckung am
  Übergangspunkt, Flaggenwechsel im Rauch, Rauch verzieht sich)
- Ändern: `render.ts`, `render.check.ts`, `stinger.ts` (alte 2D-Zeichnung entfällt), `banners.ts` (Banner aus der
  3D-Welt als Standbild), `settings.ts`, `koth.rs`, Fixture, Typen

### Acceptance Criteria

- [ ] AC1: `smokeCover(t)` ist am Übergangspunkt 1 (Bild gedeckt) und davor und danach kleiner; jede Lage folgt aus Zeit
      und Startwert.
- [ ] AC2: Die Stinger-Optionen aus dem Kern gelten (Bildrate, Pause, Kurve, Grösse).
- [ ] AC3: Gleiche Einstellungen, gleiche Bilder (zweimal rendern, gleiche Bytes eines Bildes).
- [ ] AC4 (manuell): Rendern als WebM und GIF im Dashboard; Abnahme.

### Tests (TDD)

1. `smokeStinger.check.ts > "gedeckt am Übergang"` (AC1)
2. `render.check.ts > "Clips"` (AC2, AC3)

### Umsetzungsschritte

1. Tests, rot; `smokeStinger.ts`, grün. 2. `clips3d.ts`, `render.ts`, Einstellungen. 3. `npm run verify`, rendern,
Abnahme.

### Out of Scope

- Ton im Stinger.

---

## Package 6: Modernisierung: 3D-Soldaten als Minimes

**Ziel:** Die Minimes sind 3D-Soldaten mit Helm, Rolle und Fraktionsfarbe, die zielen, nachladen und Gefechte zeigen.

**Abhängigkeiten:** Package 2

**Betroffene Dateien:**
- Neu: `soldiers3d.ts`, `soldiers3d.check.ts` (Teile je Rolle als Quader, Kapseln und Kugeln, Waffe je Rolle; Posen je
  Animation als Gelenkwinkel über die Zeit, beginnen und enden in der Ruhepose), `three/Soldier3D.tsx`,
  `three/CombatFx.tsx` (Mündungsfeuer, Explosion des Grenadiers, Staubwolke über `burstAt`)
- Ändern: `scenes/Minimes.tsx` (transparente `Stage3D` ohne Bloom, Lage aus den festen Plätzen des Kerns, Namensschilder
  2D), `minimes.css`, `settings.ts`, `koth.rs`, Fixture, Typen; `Soldier.tsx` und `soldiers.ts` entfallen

### Kontext

Fraktionen, Gefechte und feste Plätze kommen weiter aus dem Kern (PLAN-MINIMES 10 bis 12); das Theme liefert nur
Aussehen und Posen. Das Muster der 3D-Figuren in einer schmalen transparenten Bühne steht im Theme Dachdecker
(Package 5 dort) und wird hier nur über Kern-Bausteine genutzt, nicht kopiert.

### Acceptance Criteria

- [ ] AC1: `soldier(role)` liefert Helm, Kopf, Rumpf, Arme, Beine und die Waffe der Rolle; der Medic trägt die Tasche
      mit Kreuz und keine Waffe.
- [ ] AC2: `pose(animation, t)` beginnt und endet in der Ruhepose; reine Funktion der Zeit.
- [ ] AC3: Treffer, Liegen und Wiederbeleben folgen dem Kern; der Katalog nutzt keine Aktionsnamen des Kerns.
- [ ] AC4 (manuell): `minimes.html?demo&preview` mit drei Fraktionen und Gefechten; Abnahme.

### Tests (TDD)

1. `soldiers3d.check.ts > "Teile je Rolle"` (AC1)
2. `soldiers3d.check.ts > "Posen beginnen und enden ruhig"` (AC2)
3. bestehende Fixture `minime-features.json` und `cargo test` bleiben grün (AC3)

### Umsetzungsschritte

1. Tests, rot; `soldiers3d.ts`, grün. 2. Komponenten, Szene, Einstellungen. 3. `npm run verify`, Vorschau, Abnahme.

### Out of Scope

- Neue Rollen oder Regeln der Gefechte.
