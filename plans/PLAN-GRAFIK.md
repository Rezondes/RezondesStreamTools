# Plan: Grafik- und Animationsmodule im Kern

Heute zeichnen Themes alles als SVG und CSS, animiert mit Keyframes; Stinger und Banner malen auf einen 2D-Canvas
(`draw(ctx, time)` in `src/core/renderClip.ts`). Neu kommen Module ins Projekt, die Themes wahlweise nutzen: GSAP
(Timelines und Plugins), Three.js mit react-three-fiber (3D-Szenen), PixiJS (2D über WebGL, viele Partikel) und
Rough.js (Skizzen-Look), dazu Kern-Bausteine, die die Projektregeln für diese Module erfüllen: Aufräumen, alles
einstellbar, Clips als reine Funktion der Zeit.

Kern-Plan nach der Regel in [PLAN.md](../PLAN.md). Packages 1 bis 5 haben keinen Rust-Anteil: Der Server kennt weder
Szenen noch Bibliotheken. Packages 7 und 8 brauchen neue Felder im Schema; deren Rust-Anteil steht in
[RUST-PLAN.md](../RUST-PLAN.md) Packages 53 und 54. Erster Nutzer ist das Theme Dachdecker. Am 2026-10-21 ist
entschieden, die Themes KOTH, Plantage, Chaos, Bärenbande, Urlaub und Matrix mit den Modulen zu modernisieren (je ein
Abschnitt "Modernisierung" im Plan des Themes); Packages 6 bis 8 liefern die Kern-Bausteine, die sie dafür gemeinsam
brauchen.

Testbefehl: `npm test` (einzeln: `node <pfad>.check.ts`), Abschluss jedes Packages: `npm run verify`. Regeln:
[CODING-RULES.md](../CODING-RULES.md), Theme-Aufbau: [THEMES.md](../THEMES.md).

## Überblick

| # | Package | Ziel in einem Satz | Abhängig von |
|---|---------|--------------------|--------------|
| 1 | Module und Regeln | Die Bibliotheken sind installiert, Regeln und Doku nennen sie, kein bestehendes Theme lädt sie mit. | - |
| 2 | Bewegung mit GSAP | Szenen bauen Timelines über einen Kern-Hook, der aufräumt und Zeiten aus den Einstellungen nimmt. | 1 |
| 3 | 3D-Bühne | Szenen zeigen eine 3D-Welt in 1920x1080 mit Bloom und Leistungsstufen über einen Kern-Baustein. | 1 |
| 4 | 3D-Clips | Stinger und Banner können eine 3D-Szene Bild für Bild deterministisch in den bestehenden Clip-Vertrag zeichnen. | 3 |
| 5 | PixiJS und Rough.js | Szenen nutzen eine PixiJS-Bühne und Rough-Formen über Kern-Bausteine mit Aufräumen und festem Zufall. | 1 |
| 6 | Stinger-Optionen im Kern | Ein Kern-Baustein gibt jedem Stinger Bildrate, Pause am Übergang, Bewegungskurve und Ausgabegrösse, ohne dass das Theme seine Zeichnung ändert. | 2 |
| 7 | Stinger-Optionen in allen Themes | Alle acht Themes bieten die vier Stinger-Optionen in der Gruppe "Stinger" an, in TS und Rust gleich. | 6, RUST-PLAN 53 |
| 8 | Bausteine für die Modernisierung | Partikel aus der Zeit, eine gemeinsame Leistungsstufe, Freigabe der Module je Theme und die Fallstricke aus den Prototypen stehen im Kern und in der Doku. | 5, RUST-PLAN 54 |

Parallel möglich: 2, 3 und 5 nach 1 (verschiedene Dateien); 4 nach 3. Das Theme Dachdecker braucht 1 bis 4; Package 5
bereitet die Modernisierung anderer Themes vor und blockiert nichts. 6 und 8 parallel (verschiedene Dateien); 7 nach 6.
Die Modernisierung eines Themes beginnt nach 8; ihr Stinger-Package braucht 7.

## Annahmen

- **Module** (entschieden 2026-10-21): `gsap` und `@gsap/react`, `three` mit `@types/three`, `@react-three/fiber`
  (Version 9, passt zu React 19), `@react-three/drei` (Version 10), `@react-three/postprocessing` (Version 3),
  `pixi.js` (Version 8), `roughjs`. Beim Umsetzen gilt jeweils die neueste stabile Version dieser Hauptversionen,
  exakt gepinnt wie `figlet`.
- **Nur Erweiterungen** (entschieden 2026-10-21): kein bestehendes Theme und kein bestehender Kern-Baustein ändert sein
  Verhalten. Bestehende Themes importieren die Module nicht; ein Bundle-Check stellt sicher, dass sie auch nicht im
  Haupt-Chunk landen (Themes laden ihre Szenen schon heute mit `React.lazy`). Gilt für Packages 1 bis 5; die
  Modernisierung (entschieden 2026-10-21) gibt die Module je Theme frei (Package 8, `MODULE_THEMES`).
- **Modernisierung** (entschieden 2026-10-21): KOTH wird komplett 3D wie Dachdecker; Plantage, Chaos, Bärenbande, Urlaub
  und Matrix nutzen GSAP und PixiJS, Chaos und Bärenbande zusätzlich Rough.js, Urlaub für die Vollbild-Szenen three.js
  (realistischer Look). Der alte Look wird ersetzt, es gibt keinen Schalter zwischen alt und neu. Die abgenommenen
  Prototypen liegen je Theme in `src/themes/<id>/docs/refs/`.
- **Stinger-Optionen** (entschieden 2026-10-21): Bildrate, Pause am Übergang, Bewegungskurve und Ausgabegrösse (1080p
  oder 720p) in jedem Theme, auch Standard und Dachdecker.
- **Alles einstellbar** (entschieden 2026-10-21, Regeln 19 und 20): Die Kern-Bausteine nehmen Farben, Zeiten, Stärken
  und An/Aus nur als Parameter entgegen, nie als eigene Konstante; das Theme reicht seine Einstellungen durch. Fest im
  Kern sind nur Schutzgrenzen (z. B. höchste Partikelzahl), markiert mit `fixed: <Grund>`.
- **Aufräumen** (Regel 17): Jeder Baustein beendet beim Unmount, was er startet: GSAP-Kontexte (`useGSAP`), WebGL-Kontexte
  und eigene Puffer (R3F räumt seine Objekte selbst), PixiJS-Anwendungen (`app.destroy(true)`).
- **Clips bleiben reine Funktionen der Zeit** (Regel 21): Ein 3D-Clip setzt seine Szene für jede Zeit `t` vollständig
  aus `t` und einem festen Startwert (`hash` aus `src/core/hash.ts`), nie aus der vorigen Bildfolge oder `Math.random`.
- **Logik prüfbar:** Geometrie, Physik und Verteilungen liegen in reinen `.ts`-Modulen mit `*.check.ts`
  (Node-Tests, Coverage-Grenzen aus `package.json`); Komponenten mit WebGL werden manuell in der Vorschau geprüft.
- **Lizenzen:** three, R3F, drei, postprocessing, PixiJS und Rough.js stehen unter MIT. GSAP hat die "Standard no
  charge"-Lizenz; Package 1 liest den Lizenztext und hält im README fest, dass die Nutzung in diesem Projekt erlaubt ist,
  oder stoppt und fragt nach.
- **OBS:** WebGL braucht in OBS die Hardware-Beschleunigung der Browserquelle. Das steht im README; die 3D-Bühne bietet
  Leistungsstufen (Bloom aus, weniger Partikel, niedrigere Auflösung), damit schwächere PCs drosseln können.

---

## Package 1: Module und Regeln

**Ziel:** Die Bibliotheken sind installiert, Regeln und Doku nennen sie, kein bestehendes Theme lädt sie mit.

**Abhängigkeiten:** keine

**Betroffene Dateien:**
- `package.json`, `package-lock.json` (neu: die Module aus den Annahmen, exakt gepinnt)
- `vite.config.ts` (ändern: `build.manifest: true`)
- `scripts/bundle.ts` (neu: liest `dist/.vite/manifest.json` und prüft die Chunks), `scripts/bundle.check.ts` (neu)
- `package.json` Skript `verify` (ändern: nach `vite build` läuft `node scripts/bundle.ts`)
- `CODING-RULES.md` (ändern: Regel 21), `THEMES.md` (neu: Abschnitt "Grafik- und Animationsmodule"),
  `README.md` (neu: Abschnitt Drittanbieter und Lizenz, Hinweis Hardware-Beschleunigung in OBS)

### Kontext

`scripts/rules.check.ts` erlaubt Themes Importe aus npm-Paketen (wie `react`) und verbietet nur Importe aus anderen
Themes und dem Dashboard; daran ändert sich nichts. Szenen werden je Theme mit `React.lazy` geladen (`index.tsx` jedes
Themes), also landen die Module nur in den Chunks der Themes, die sie importieren.

### Acceptance Criteria

- [ ] AC1: Alle Module stehen exakt gepinnt in `dependencies`; `npm run verify` ist grün; keine Datei eines bestehenden
      Themes importiert eines der Module.
- [ ] AC2: `scripts/bundle.ts` meldet einen Fehler, wenn der Einstiegs-Chunk von `src/main.tsx` oder ein Chunk eines
      bestehenden Themes `three`, `pixi.js`, `gsap` oder `roughjs` enthält.
- [ ] AC3: Regel 21 lautet neu sinngemäss: CSS-Keyframes für einfache Bewegung; GSAP-Timelines über `useTimeline`
      (Package 2), `useFrame` in 3D und der PixiJS-Ticker sind erlaubt und räumen auf; Clips bleiben reine Funktionen
      der Zeit, auch in 3D.
- [ ] AC4: README nennt jedes Modul mit Lizenz; die GSAP-Lizenz ist gelesen und das Ergebnis steht dort.
- [ ] AC5: THEMES.md beschreibt, wann ein Theme welches Modul nimmt, und verweist auf die Kern-Bausteine.

### Tests (TDD)

1. `scripts/bundle.check.ts > "erkennt Module im Haupt-Chunk"` (AC2)
   - Gegeben: ein Manifest-Objekt, dessen Einstieg `node_modules/three/...` importiert
   - Erwartet: ein Befund mit Chunk und Modul
2. `scripts/bundle.check.ts > "erlaubt Module in Chunks neuer Themes"` (AC2)
   - Gegeben: Manifest, in dem nur der Chunk von `src/themes/dachdecker/...` `three` importiert; Liste der bestehenden
     Themes ohne `dachdecker`
   - Erwartet: kein Befund

### Umsetzungsschritte

1. Tests schreiben, rot; `scripts/bundle.ts` als reine Funktion über dem Manifest plus kleinem Aufruf, grün.
2. Module installieren und pinnen, `vite.config.ts` mit Manifest, `verify` erweitern.
3. Lizenzen lesen, README, CODING-RULES Regel 21, THEMES.md ergänzen.
4. `npm run verify`.

### Out of Scope

- Kern-Bausteine (Packages 2 bis 5); jede Änderung an bestehenden Themes.

---

## Package 2: Bewegung mit GSAP

**Ziel:** Szenen bauen Timelines über einen Kern-Hook, der aufräumt und Zeiten aus den Einstellungen nimmt.

**Abhängigkeiten:** Package 1

**Betroffene Dateien:**
- `src/core/motion/useTimeline.ts` (neu): `useTimeline(build, deps, scope)` auf Basis von `useGSAP`; registriert die
  freien Plugins einmal (`SplitText`, `ScrambleTextPlugin`, `DrawSVGPlugin`, `MotionPathPlugin`, `CustomEase`); mit
  `?t=` in der Adresse hält er die Timeline an dieser Zeit an (Standbilder der Vorschau) und setzt dafür
  `gsap.ticker.lagSmoothing(0)`, sonst bleibt der Standard
- `src/core/motion/ease.ts`, `ease.check.ts` (neu): benannte Kurven als Daten (z. B. `nagel` für Aufschlagen mit
  Nachfedern), damit Themes sie per Einstellung wählen
- `src/core/motion/seek.ts`, `seek.check.ts` (neu): `seekFromQuery(search)` liest `?t=`

### Kontext

Ohne gemeinsamen Hook würde jedes Theme `gsap.context` und Plugin-Registrierung selbst machen (Regel 16: gemeinsame
Logik einmal im Kern). `useGSAP` aus `@gsap/react` räumt Timelines beim Unmount auf. Beim Anhalten auf eine Zeit muss
die Timeline Callbacks und `onUpdate` ausführen (`tl.pause(); tl.seek(t, false)`), sonst bleiben Zähler auf 0 (gesehen
in den Prototypen).

### Acceptance Criteria

- [ ] AC1: `useTimeline` baut die Timeline nach dem Mount, baut sie bei geänderten `deps` neu und beendet sie beim
      Unmount (keine laufenden Tweens danach).
- [ ] AC2: Die Kurven aus `ease.ts` sind gültige `CustomEase`-Pfade (Start `M0,0`, Ende bei 1,1) mit eindeutigen
      deutschen Namen für eine Auswahl-Einstellung.
- [ ] AC3: `seekFromQuery("?t=4.2")` ergibt `4.2`; ohne oder mit ungültigem Wert `null`.

### Tests (TDD)

1. `src/core/motion/ease.check.ts > "Kurven"` (AC2): jeder Pfad beginnt mit `M0,0`, endet auf `1,1`, Namen eindeutig.
2. `src/core/motion/seek.check.ts > "Zeit aus der Adresse"` (AC3): `?t=4.2`, `?t=abc`, leer.
3. Manuell (AC1): Testszene im Demo-Modus mounten und entfernen; danach sind keine Tweens mehr aktiv.

### Umsetzungsschritte

1. Tests 1 und 2, rot; `ease.ts`, `seek.ts`, grün.
2. `useTimeline.ts` (Hook, ohne Check nach Regel 17).
3. `npm run verify`.

### Out of Scope

- Theme-eigene Timelines; das Theme Dachdecker baut seine Abläufe selbst mit diesem Hook.

---

## Package 3: 3D-Bühne

**Ziel:** Szenen zeigen eine 3D-Welt in 1920x1080 mit Bloom und Leistungsstufen über einen Kern-Baustein.

**Abhängigkeiten:** Package 1

**Betroffene Dateien:**
- `src/core/three/Stage3D.tsx` (neu): R3F-`Canvas` in der Bühnengrösse von `useStage` (`src/core/screens`), Props
  `background` (Farbe oder `null` = transparent), `fog`, `bloom` (`{ strength, radius, threshold }` oder `null`),
  `quality` (`hoch`, `mittel`, `niedrig`), `paused`; Kinder sind die Szene
- `src/core/three/quality.ts`, `quality.check.ts` (neu): Leistungsstufe zu Renderer-Werten und Partikel-Faktor
- `src/core/three/edges.ts`, `edges.check.ts` (neu): `mergedEdges(matrices, geometry)` fasst die Kanten vieler
  Instanzen zu einem Linienpuffer zusammen (eine Zeichenoperation statt hunderter)
- `src/core/three/beam.ts`, `beam.check.ts` (neu): `beamTransform(a, b)` liefert Position, Drehung und Länge eines
  Balkens zwischen zwei Punkten (für Wachsen entlang der Länge)
- `src/core/three/chance.ts`, `chance.check.ts` (neu): Zufallsfolge aus `hash` mit Startwert (für Regen, Funken,
  Kupferverteilung), dieselbe Schnittstelle für Szenen und Clips

### Kontext

Die Prototypen des Themes Dachdecker (`src/themes/dachdecker/docs/refs/`) zeigen, was die Bühne können muss: blauer
Hintergrund oder transparent (Alerts), Nebel, Bloom, Hunderte instanzierte Ziegel mit Plankanten, Balken, die entlang
ihrer Länge wachsen. Bloom mit transparentem Hintergrund ist unzuverlässig; die Bühne schaltet Bloom bei
`background: null` ab. Ein zu starker Bloom auf heller Fläche überstrahlt das ganze Bild (gesehen beim Blitz im
BRB-Prototyp); die Stärke hat darum eine Obergrenze (`fixed: Schutz vor Weissbild`).

### Acceptance Criteria

- [ ] AC1: `Stage3D` füllt die Bühne, skaliert wie die 2D-Szenen mit `useStage` und gibt beim Unmount den
      WebGL-Kontext frei.
- [ ] AC2: `quality("niedrig")` ergibt Pixelverhältnis 0.75, kein Bloom, kein Antialiasing, Partikel-Faktor 0.4;
      `mittel` 1, Bloom an, Faktor 0.7; `hoch` 1, Bloom an, Antialiasing, Faktor 1.
- [ ] AC3: `mergedEdges` liefert für n Matrizen genau n mal die Kantenpunkte einer Geometrie, transformiert.
- [ ] AC4: `beamTransform([0,0,0],[0,0,2])` ergibt Länge 2 und Blickrichtung +z; der Balken wächst mit `scale.z` von 0
      bis 1 vom Startpunkt aus.
- [ ] AC5: `chance(seed)` liefert für gleichen Startwert dieselbe Folge im Bereich 0 bis 1.

### Tests (TDD)

1. `quality.check.ts > "Leistungsstufen"` (AC2)
2. `edges.check.ts > "zusammengefasste Kanten"` (AC3): zwei Matrizen (Verschiebung um x 1 und 2), Würfelkanten
3. `beam.check.ts > "Balken zwischen zwei Punkten"` (AC4)
4. `chance.check.ts > "fester Zufall"` (AC5)
5. Manuell (AC1): Testwürfel im Demo, Bühnengrössen 1600x900 und 1920x1080, Wechsel der Szene ohne Kontext-Warnung.

### Umsetzungsschritte

1. Tests 1 bis 4, rot; Module umsetzen, grün.
2. `Stage3D.tsx` mit R3F, drei und postprocessing.
3. `npm run verify`.

### Out of Scope

- Theme-eigene Geometrie (Dachstuhl, Ziegel, Haus); Clips (Package 4).

---

## Package 4: 3D-Clips

**Ziel:** Stinger und Banner können eine 3D-Szene Bild für Bild deterministisch in den bestehenden Clip-Vertrag zeichnen.

**Abhängigkeiten:** Package 3

**Betroffene Dateien:**
- `src/core/three/glClip.ts` (neu): `glClip(setup)` gibt eine `draw(context, time)`-Funktion für `RenderClip` zurück.
  `setup(scene, camera)` baut die Szene einmal mit Vanilla-Three.js und liefert `update(time)`; `draw` rendert auf
  einen eigenen WebGL-Canvas gleicher Grösse und kopiert das Bild mit `drawImage` in den 2D-Kontext
- `src/core/three/glClip.check.ts` (neu): Zeitlogik und Freigabe mit einem Fake-Renderer
- `scripts/rules.check.ts` (ändern: Clip-Dateien ohne `Math.random` und `performance.now`)
- `src/core/renderClip.ts` bleibt unverändert; der Vertrag bleibt 2D

### Kontext

`RenderClip.draw` ist eine reine Funktion der Zeit auf einem 2D-Canvas; das Dashboard schickt die Bilder als PNG an den
Server, ffmpeg baut WebM oder GIF (`server-rs/crates/rst-server/src/handlers/render.rs`). `ThemeModule` ist React-frei
(`src/core/theme.ts`), darum nutzen Clips Vanilla-Three.js statt R3F. Geometrie teilen Szene und Clip über die reinen
`.ts`-Module des Themes.

### Acceptance Criteria

- [ ] AC1: `draw(ctx, t)` ruft `update(t)` vor jedem Rendern; dieselbe Zeit ergibt denselben Aufruf, unabhängig von der
      Reihenfolge der Zeiten.
- [ ] AC2: Der WebGL-Canvas wird einmal je Clip angelegt und nach dem letzten Bild freigegeben (`dispose()`).
- [ ] AC3: Dateien, die `glClip` importieren, nutzen weder `Math.random` noch `performance.now` (Befund in
      `scripts/rules.check.ts`).

### Tests (TDD)

1. `glClip.check.ts > "Zeit an update"` (AC1): Fake-Renderer zählt Aufrufe; Zeiten 0.5, 0.1, 0.5 ergeben drei
   `update`-Aufrufe mit genau diesen Zeiten.
2. `glClip.check.ts > "Freigabe"` (AC2)
3. `scripts/rules.check.ts`: Testfall mit einer Clip-Datei, die `Math.random` nutzt, ergibt einen Befund (AC3).

### Umsetzungsschritte

1. Tests, rot; `glClip.ts` mit injizierbarem Renderer (für den Test), grün.
2. Regel in `rules.check.ts` ergänzen.
3. `npm run verify`; manuell einen Test-Clip im Rendern-Bereich des Dashboards als WebM rendern.

### Out of Scope

- Die Clips des Themes Dachdecker (dessen Plan, Package 4).

---

## Package 5: PixiJS und Rough.js

**Ziel:** Szenen nutzen eine PixiJS-Bühne und Rough-Formen über Kern-Bausteine mit Aufräumen und festem Zufall.

**Abhängigkeiten:** Package 1

**Betroffene Dateien:**
- `src/core/pixi/PixiStage.tsx` (neu): legt eine `Application` in Bühnengrösse an (transparent oder mit Farbe), gibt sie
  den Kindern per Callback, zerstört sie beim Unmount
- `src/core/pixi/particles.ts`, `particles.check.ts` (neu): zeitbasiertes Partikel-Update (Schwerkraft, Luftwiderstand,
  Lebensdauer mit Delta-Zeit), unabhängig von PixiJS prüfbar
- `src/core/rough/roughSvg.ts`, `roughSvg.check.ts` (neu): Rough-Formen als SVG-Pfade mit festem `seed`, damit Skizzen in
  Szene und Clip gleich aussehen; Strichstärke, Rauheit und Füllart als Parameter

### Kontext

Weder Dachdecker noch ein bestehendes Theme braucht diese Bausteine sofort; sie sind für spätere Modernisierungen
gedacht (entschieden 2026-10-21). Die Prototypen haben gezeigt, dass Partikel nach Bildrate statt nach Zeit
unterschiedlich lange leben; darum rechnet `particles.ts` mit Delta-Zeit.

### Acceptance Criteria

- [ ] AC1: `PixiStage` gibt die Anwendung beim Unmount mit `destroy(true)` frei.
- [ ] AC2: `stepParticles(list, dt)` bewegt und altert Partikel proportional zu `dt`; zwei Schritte mit `dt = 1` ergeben
      bis auf Rundung dasselbe wie ein Schritt mit `dt = 2` bei Bewegung ohne Luftwiderstand.
- [ ] AC3: `roughPath(shape, options, seed)` ergibt für gleichen Startwert denselben Pfad.

### Tests (TDD)

1. `particles.check.ts > "zeitbasiert"` (AC2)
2. `roughSvg.check.ts > "fester Zufall"` (AC3)
3. Manuell (AC1): Testszene mit PixiJS mounten und entfernen, kein verwaister Canvas.

### Umsetzungsschritte

1. Tests, rot; Module, grün; `PixiStage.tsx`.
2. `npm run verify`.

### Out of Scope

- Umbau bestehender Themes.

---

## Package 6: Stinger-Optionen im Kern

**Ziel:** Ein Kern-Baustein gibt jedem Stinger Bildrate, Pause am Übergang, Bewegungskurve und Ausgabegrösse, ohne dass
das Theme seine Zeichnung ändert.

**Abhängigkeiten:** Package 2 (Kurven in `ease.ts`)

**Betroffene Dateien:**
- `src/core/motion/ease.ts`, `ease.check.ts` (ändern: `easeAt(name, progress)` wertet die Kurven aus `EASES` ohne GSAP
  aus, dazu `linear`; `EASE_CHOICES` = `["linear", ...EASE_NAMES]` für eine Auswahl-Einstellung)
- `src/core/stingerOptions.ts`, `stingerOptions.check.ts` (neu): `stingerFields(group, defaults)`, `warpTime(time,
  timing)`, `withStingerOptions(clip, options)`

### Kontext

Jeder Stinger ist heute `draw(context, time)` mit fester Bildrate (`FPS = 60` in `stinger.ts` von KOTH, Plantage, Chaos,
Bärenbande, Urlaub; Dachdecker hat `stingerFps` und `stingerHold` als eigene Felder). Das Dashboard rendert Bild für Bild
mit `clip.fps` und schickt PNGs an den Server (`src/dashboard/Render.tsx`); der Server baut WebM oder GIF in jeder
Grösse, die Bilder bestimmen sie. Bildrate, Pause und Kurve lassen sich darum für alle Themes gleich lösen, indem der
Kern die Zeit umrechnet, bevor er die Zeichnung des Themes aufruft (Regel 16: gemeinsame Logik einmal im Kern).

### Gestaltung

- **Pause am Übergang (`stingerHold`, Anteil je Hälfte):** Die Zeichnung erreicht ihren Übergangspunkt früher und steht
  dort, bis die zweite Hälfte beginnt. Hineinlaufen: echte Zeit 0 bis `cut * (1 - hold)` wird zur Zeichnungszeit 0 bis
  `cut`; Herauslaufen: echte Zeit ab `cut + (duration - cut) * hold` bis `duration` wird `cut` bis `duration`. Der
  Schnitt im Video liegt weiter genau bei `cut`, mitten in der Pause.
- **Bewegungskurve (`stingerEase`):** formt die Zeichnungszeit je Hälfte (`linear`, `nagel`, `federnd`, `weich`,
  `stempel`).
- **Ausgabegrösse (`stingerSize`):** `1080p` (1920x1080) oder `720p` (1280x720); die Zeichnung bleibt in 1920x1080 und
  wird beim Zeichnen skaliert.
- **Bildrate (`stingerFps`):** 10 bis 60 Bilder pro Sekunde.

### Einstellungen

`stingerFields(group, defaults)` liefert in dieser Reihenfolge: `stingerFps` ("Bildrate (Bilder pro Sekunde)", 10 bis
60, Standard aus `defaults`, sonst 60), `stingerHold` ("Pause am Übergangspunkt (Anteil je Hälfte)", 0 bis 80 %,
Standard 0), `stingerEase` ("Bewegungskurve", Auswahl `EASE_CHOICES`, Standard `linear`), `stingerSize`
("Ausgabegrösse", `1080p` oder `720p`, Standard `1080p`). Die Schlüssel sind dieselben, die Dachdecker heute nutzt, damit
gespeicherte Werte bleiben.

### Acceptance Criteria

- [ ] AC1: `easeAt(name, 0)` ist 0 und `easeAt(name, 1)` ist 1 für alle Namen; `linear` ist die Identität; `nagel` und
      `federnd` überschiessen 1 irgendwo zwischen 0 und 1; das Ergebnis stimmt auf 0.01 mit `CustomEase` überein
      (Vergleichswerte aus GSAP einmal ermittelt und im Check als Zahlen festgehalten).
- [ ] AC2: `warpTime` mit `hold = 0` und `linear` ist die Identität; mit `hold = 0.2` ist die Zeichnungszeit im ganzen
      Bereich von `cut * 0.8` bis `cut + (duration - cut) * 0.2` gleich `cut`, bei 0 gleich 0 und bei `duration` gleich
      `duration`; sie fällt nie.
- [ ] AC3: `withStingerOptions` liefert einen Clip mit `fps` aus den Werten, mit `720p` Breite 1280 und Höhe 720, und
      ruft die Zeichnung des Themes mit skaliertem Kontext (Faktor 2/3) und umgerechneter Zeit auf; `cut`, `duration`,
      `group`, `prepare` bleiben.
- [ ] AC4: Die Option `ownHold: true` reicht die Pause nicht in `warpTime` (für Stinger, die sie selbst zeichnen, wie die
      Rolle von Dachdecker).
- [ ] AC5: `stingerFields` liefert vier Felder in der Gruppe, die Standards bestehen das Schema (`auditTheme` mit einem
      Probe-Theme).

### Tests (TDD)

1. `src/core/motion/ease.check.ts > "Kurven ohne GSAP"` (AC1)
2. `src/core/stingerOptions.check.ts > "Zeit mit Pause"` (AC2): Tabelle aus echten Zeiten und erwarteten Zeichnungszeiten
3. `stingerOptions.check.ts > "Clip mit Optionen"` (AC3, AC4): Aufzeichnungs-Kontext zählt `scale` und die Zeiten an
   `draw`
4. `stingerOptions.check.ts > "Felder"` (AC5)

### Umsetzungsschritte

1. Tests 1 bis 4, rot.
2. `easeAt` (kubische Bezier-Abschnitte aus dem Pfad, x per Bisektion), `warpTime`, `withStingerOptions`,
   `stingerFields`, grün.
3. `npm run verify`.

### Out of Scope

- Felder in den Themes (Package 7); Rust-Seite (RUST-PLAN 53).

---

## Package 7: Stinger-Optionen in allen Themes

**Ziel:** Alle acht Themes bieten die vier Stinger-Optionen in der Gruppe "Stinger" an, in TS und Rust gleich.

**Abhängigkeiten:** Package 6, [RUST-PLAN.md](../RUST-PLAN.md) Package 53 (im selben Commit)

**Betroffene Dateien:**
- `src/themes/<id>/settings.ts` für `standard`, `matrix`, `urlaub`, `plantage`, `koth`, `bears`, `chaos`, `dachdecker`
  (ändern: `...stingerFields(STINGER, { stingerFps: <bisherige Bildrate> })` in der Gruppe "Stinger"; Dachdecker
  entfernt seine eigenen Felder `stingerFps` und `stingerHold`)
- `src/themes/<id>/render.ts` (ändern: der Stinger-Clip geht durch `withStingerOptions`), `src/themes/<id>/stinger.ts`
  (ändern: die Konstante `FPS` fällt weg, wo sie nur die Bildrate des Clips war)
- `src/themes/<id>/render.check.ts` (ändern: Bildrate und Grösse kommen aus den Werten)
- `src/themes/renderers.check.ts` (ändern: jeder Stinger-Clip aller Themes folgt `stingerFps` und `stingerSize`)
- Fixtures `server-rs/crates/rst-domain/tests/fixtures/<id>.json` (`node scripts/dumpSchema.ts`), erzeugte Typen
  `src/generated/themes/<id>.ts` (`npm run gen:types`)

### Kontext

Bisherige Bildraten: 60 bei Standard, Matrix, Urlaub, Plantage, KOTH, Bärenbande und Chaos (je `FPS` in `stinger.ts`),
30 bei Dachdecker (`stingerFps`). Die Standards bleiben dieselben, damit gerenderte Stinger ohne Änderung der
Einstellungen gleich aussehen. Dachdecker zeichnet die Pause in seiner Rolle selbst (`roll.ts`), darum `ownHold: true`.

### Acceptance Criteria

- [ ] AC1: Jedes der acht Themes hat `stingerFps`, `stingerHold`, `stingerEase`, `stingerSize` in der Gruppe "Stinger";
      `auditTheme` findet keinen ungenutzten Schlüssel.
- [ ] AC2: Mit Standardwerten zeichnet jeder Stinger jedes Bild wie vorher (gleiche Aufrufe bei gleicher Zeit,
      Bildrate wie vorher).
- [ ] AC3: Mit `stingerSize = 720p` rendert jeder Stinger 1280x720; mit `stingerFps = 24` hat der Clip 24 Bilder pro
      Sekunde.
- [ ] AC4: Gespeicherte Werte von Dachdecker für `stingerFps` und `stingerHold` gelten weiter (gleiche Schlüssel).
- [ ] AC5: Die Fixtures stimmen mit Rust überein (`cargo test same_as_typescript` je Theme).

### Tests (TDD)

1. `src/themes/renderers.check.ts > "Stinger-Optionen in jedem Theme"` (AC1, AC3)
2. `src/themes/<id>/render.check.ts`: bestehende Checks bleiben grün (AC2)
3. `cargo test` (AC5)

### Umsetzungsschritte

1. Test 1, rot.
2. Je Theme Felder, `render.ts`, `stinger.ts`, Fixture, Typen; Rust-Seite nach RUST-PLAN 53.
3. `npm run verify`, `npm run contract`; je Theme einen Stinger mit 720p und Pause 20 % im Dashboard rendern und ansehen.

### Out of Scope

- Neue Stinger-Zeichnungen (Abschnitte "Modernisierung" der Theme-Pläne).

---

## Package 8: Bausteine für die Modernisierung

**Ziel:** Partikel aus der Zeit, eine gemeinsame Leistungsstufe, die Freigabe der Module je Theme und die Fallstricke
aus den Prototypen stehen im Kern und in der Doku.

**Abhängigkeiten:** Package 5, [RUST-PLAN.md](../RUST-PLAN.md) Package 54 (im selben Commit)

**Betroffene Dateien:**
- `src/core/motion/burst.ts`, `burst.check.ts` (neu): `burstAt(seed, count, time, options)` liefert Lage, Drehung und
  Deckkraft jedes Teilchens eines Ausbruchs (Konfetti, Spritzer, Blätter, Funken) als reine Funktion der Zeit seit dem
  Start; Optionen Startpunkt, Richtung und Streuung, Geschwindigkeit von bis, Schwerkraft, Luftwiderstand, Lebensdauer
- `src/core/graphicsFields.ts`, `graphicsFields.check.ts` (neu): `qualityField(group)` mit dem Schlüssel `quality`
  (Auswahl `hoch`, `mittel`, `niedrig`, Standard `mittel`), passend zu `src/core/three/quality.ts`
- `src/themes/dachdecker/settings.ts` (ändern: eigenes Feld `quality` durch `qualityField` ersetzen, gleicher Schlüssel)
- `scripts/bundle.ts`, `scripts/bundle.check.ts` (ändern: `MODULE_THEMES` um `koth`, `plantage`, `chaos`, `bears`,
  `urlaub`, `matrix`)
- `THEMES.md` (ändern: Abschnitt "Grafik- und Animationsmodule" um "Fallstricke" und um die Referenz-Prototypen)

### Kontext

`src/core/pixi/particles.ts` rechnet Schritt für Schritt (gut für Szenen), Stinger und Banner brauchen aber Teilchen,
deren Lage nur aus Startwert und Zeit folgt (Regel 21). Die Prototypen haben dafür überall dieselbe Formel benutzt
(Startgeschwindigkeit, exponentieller Luftwiderstand, Schwerkraft). Fallstricke, die beim Bau der Prototypen
aufgefallen sind:
- Eine angehaltene GSAP-Timeline, die mit `?t=` hinter einen Tween springt, ruft dessen `onUpdate` nicht auf; Ausgaben,
  die von einem Tween-Wert abhängen (Fortschrittsbalken, Zähler), werden im Ticker aus dem Wert gesetzt.
- Deckkraft unter 1 an einem Element mit `transform-style: preserve-3d` macht es flach; die Rückseite erscheint
  gespiegelt. Ausgeblendet wird ein Elternelement.
- SVG-Gruppen drehen mit `svgOrigin` (Koordinaten im `viewBox`), nicht mit CSS `transform-origin`.
- `-webkit-mask-image` beschneidet `text-shadow` am Rand des Elements; nach einer Aufsprüh-Maske wird sie entfernt
  oder das Element bekommt Innenabstand.
- PixiJS 8 startet asynchron (`await app.init`); mit `autoStart: false` zeichnet der Ticker der Szene selbst
  (`app.renderer.render`), damit `?t=` Standbilder stimmen.

### Acceptance Criteria

- [ ] AC1: `burstAt` ist deterministisch (gleicher Startwert und gleiche Zeit, gleiche Werte); zwei Startwerte geben
      verschiedene Ausbrüche; vor dem Start und nach der Lebensdauer ist jedes Teilchen unsichtbar; ohne Schwerkraft
      und Widerstand liegt ein Teilchen nach 1 s um seine Geschwindigkeit vom Startpunkt entfernt.
- [ ] AC2: `qualityField("Allgemein")` liefert ein Auswahlfeld `quality` mit den drei Stufen; Dachdecker behält seine
      gespeicherten Werte.
- [ ] AC3: `scripts/bundle.ts` erlaubt die Module in den Chunks der sechs Themes und meldet sie weiter im
      Einstiegs-Chunk und im Chunk von `standard`.
- [ ] AC4: THEMES.md nennt die Fallstricke oben und den Ort der Referenz-Prototypen (`docs/refs/`, dürfen per CDN laden).

### Tests (TDD)

1. `src/core/motion/burst.check.ts > "Ausbruch aus der Zeit"` (AC1)
2. `src/core/graphicsFields.check.ts > "Leistungsstufe"` (AC2)
3. `scripts/bundle.check.ts > "Module in modernisierten Themes"` (AC3)

### Umsetzungsschritte

1. Tests 1 bis 3, rot; `burst.ts`, `graphicsFields.ts`, `bundle.ts`, grün.
2. Dachdecker auf `qualityField`, Rust nach RUST-PLAN 54, Fixture, Typen.
3. THEMES.md.
4. `npm run verify`, `npm run contract`.

### Out of Scope

- Theme-eigene Teilchen-Formen und Abläufe (Pläne der Themes).
