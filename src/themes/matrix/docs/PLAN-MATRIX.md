# Plan: Theme "Matrix"

Terminal mit Phosphorgrün auf Schwarz: Code-Regen, CRT-Bildschirm, Glühen und Glitches. Das Theme besteht seit der
ersten Version; dieser Plan beschreibt seine Modernisierung mit PixiJS und GSAP (entschieden 2026-10-21).
Gestaltung: [DESIGN-MATRIX.md](DESIGN-MATRIX.md).

Testbefehl: `npm test` (einzeln: `node <pfad>.check.ts`), Abschluss jedes Packages: `npm run verify`, wo der Server
betroffen ist auch `npm run contract`. Regeln: [CODING-RULES.md](../../../../CODING-RULES.md), Theme-Aufbau:
[THEMES.md](../../../../THEMES.md), Übersicht aller Pläne: [PLAN.md](../../../../PLAN.md).

## Überblick

| # | Package | Ziel in einem Satz | Abhängig von |
|---|---------|--------------------|--------------|
| 1 | Modernisierung: Stil-Probe Starting | Starting zeigt den Code-Regen in drei Tiefenebenen mit Glow und dem Kanalnamen im Regen, der CRT schaltet sich ein, Titel und Countdown entschlüsseln sich, abgenommen neben dem Prototyp. | PLAN-GRAFIK 1, 2, 5 und 8 |
| 2 | Modernisierung: BRB und Ending | BRB verliert und findet die Verbindung, Ending meldet sich ab und zeigt die Stream-Zahlen, beide mit demselben Regen. | 1 (Abnahme), PLAN-STATS |
| 3 | Modernisierung: Overlays | Der Alert giesst Regen über die Stelle, schaltet dort eine Box wie einen CRT ein und zerfällt am Ende in Zeichen; die übrigen Overlays entschlüsseln sich mit GSAP. | 1 |
| 4 | Modernisierung: Stinger und Banner | Stinger und Banner zeigen den neuen Regen mit leuchtenden Köpfen als reine Funktion der Zeit. | 2, PLAN-GRAFIK 7 |

Vorher fertig: [plans/PLAN-GRAFIK.md](../../../../plans/PLAN-GRAFIK.md) Packages 1, 2, 5 und 8 (für Package 1) und 7
(für Package 4), [plans/PLAN-STATS.md](../../../../plans/PLAN-STATS.md) (für Package 2). Package 1 endet mit einer
Abnahme; ohne sie beginnt kein weiteres Package. 3 kann neben 2 laufen (verschiedene Szenen; `settings.ts`, `matrix.rs`
und die Fixture hängen nur Gruppen an).

## Annahmen

- **Kernidee** bleibt: monochromes Grün, nur Monospace-Schrift, Terminal, Regen, Glitches. Es kommt keine zweite Farbe
  dazu (DESIGN-MATRIX.md).
- **Referenz** (abgenommen 2026-10-21): [refs/starting.html](refs/starting.html), [refs/alert.html](refs/alert.html)
  und die Standbilder daneben (Alert: Eingang, Halten, Ausgang). Jedes Package mit sichtbarer Arbeit endet mit Renders
  daneben und dem OK des Nutzers. Die Prototypen dürfen per CDN laden, das Theme nicht (Module aus `node_modules`,
  Schriften selbst gehostet; die Halbbreiten-Katakana kommen aus einer selbst gehosteten Schrift oder einem
  vorgezeichneten Zeichen-Atlas).
- **Technik:** Regen, Köpfe, Glow und zerfallende Zeichen in einer `PixiStage` (ein Zeichen-Atlas als Textur, Sprites
  je Zeichen); CRT, Texte, Balken und Log als HTML und CSS; Abläufe über `useTimeline` (Entschlüsseln mit
  `ScrambleText`, Tippen mit `TextPlugin`).
- **Alter Look:** `MatrixRain.tsx` (Canvas-Regen) wird ersetzt, kein Schalter.
- **Zufall:** Zeichen, Geschwindigkeiten und Startzeiten aus `chance` bzw. `hash` mit Startwert; jede Lage aus der Zeit
  (Regel 21), damit `?t=` Standbilder stimmen.
- **Fallstrick:** Fortschrittsbalken und Zähler werden im Ticker aus dem Tween-Wert gesetzt, nicht in `onUpdate`
  ([THEMES.md](../../../../THEMES.md)).
- **Alles einstellbar** (Regeln 19 und 20), Leistungsstufe über `qualityField`; Schutzgrenzen (höchste Zahl Zeichen)
  mit `fixed: <Grund>`.
- **Schema in Rust und TS:** `server-rs/crates/rst-domain/src/themes/matrix.rs` und `src/themes/matrix/settings.ts`,
  Fixture `server-rs/crates/rst-domain/tests/fixtures/matrix.json`, Typen `src/generated/themes/matrix.ts`; jedes
  Package ergänzt beide Seiten im selben Commit.
- **Minimes** (Neon-Geister) bleiben unverändert.
- **Commit:** je Package nach grünem `npm run verify`; über 400 Zeilen ist eine bewusste Ausnahme und steht in der
  Commit-Beschreibung.

---

## Package 1: Modernisierung: Stil-Probe Starting

**Ziel:** Starting zeigt den Code-Regen in drei Tiefenebenen mit Glow und dem Kanalnamen im Regen, der CRT schaltet
sich ein, Titel und Countdown entschlüsseln sich, abgenommen neben dem Prototyp.

**Abhängigkeiten:** PLAN-GRAFIK Packages 1, 2, 5 und 8

**Betroffene Dateien:**
- Neu in `src/themes/matrix/`: `rain.ts`, `rain.check.ts` (Spalten je Ebene: Startzeit, Geschwindigkeit, Spurlänge;
  Zeile des Kopfes und Zeichen je Zelle aus Zeit und Startwert; Ebenen fern, mittel, nah), `nameMask.ts`,
  `nameMask.check.ts` (Zellen innerhalb der Buchstaben des Kanalnamens aus einer gerasterten Schrift; Scanlinie aus der
  Zeit), `boot.ts`, `boot.check.ts` (Zeilen des Boot-Logs aus den Einstellungen, Fortschritt als Blöcke)
- Neu: `pixi/GlyphAtlas.ts` (Zeichen-Atlas als Textur), `pixi/Rain.tsx` (Ebenen mit Unschärfe, Köpfe mit Glow auf einer
  additiven Ebene), `pixi/NameInRain.tsx`, `crt/Crt.tsx` (Einschalten, Scanlinien, Vignette, Glitch in Streifen),
  `crt/BootLog.tsx`
- Ändern: `scenes/Screen.tsx` (Starting; BRB und Ending bis Package 2 alt), `settings.ts`, `theme.css`,
  `server-rs/crates/rst-domain/src/themes/matrix.rs`, Fixture, Typen, `scripts/bundle.ts` (`matrix` steht schon durch
  PLAN-GRAFIK Package 8 in `MODULE_THEMES`)

### Kontext

Heute zeichnet `MatrixRain.tsx` den Regen auf einem 2D-Canvas, `Screen.tsx` zeigt einen CRT-Rahmen mit ASCII-Logo,
Titel, Countdown, Balken und Terminalzeile. Der Prototyp [refs/starting.html](refs/starting.html) zeigt Ebenen,
Mengen und Ablauf; seine Zahlen werden Standardwerte.

### Gestaltung

- **Regen:** drei Ebenen (fern 15 px, dunkel und unscharf; mittel 24 px; nah 36 px, hell und schnell), Köpfe fast weiss
  mit Glow, Spuren verblassen, Zeichen wechseln laufend (an der Spitze schneller). Die Spalten starten versetzt.
- **Kanalname im Regen:** oben steht der Kanalname aus einem feinen Gitter von Regen-Zeichen mit leichtem Schein, eine
  Scanlinie läuft durch.
- **CRT:** schaltet sich bei 0,5 s ein (helle Linie, öffnet sich, Blitz), Kopfleiste tippt sich, der Titel entschlüsselt
  sich aus Katakana, der Countdown zählt sich ein, Fortschritt als Blöcke, Boot-Log tippt sich (`[ OK ]` hervorgehoben),
  Cursor blinkt; alle paar Sekunden ein Glitch in Streifen, der Regen zittert dabei mit.

### Einstellungen (neue Gruppen)

| Gruppe | Schlüssel (Standard) |
|---|---|
| Regen | `quality` (`qualityField`), `rainSeed` (1), `rainLayers` (3), `rainSizeFar` (15 px), `rainSizeMid` (24 px), `rainSizeNear` (36 px), `rainSpeed` (Faktor 1), `rainDensity` (Faktor 1, Obergrenze der Zeichen 12000 mit `fixed: Leistung in OBS`), `rainBlurFar` (1.5), `headGlow` (10), `glyphChange` (3 je s, an der Spitze 14), `glyphSet` (Katakana, Ziffern, Zeichen) |
| Name im Regen | `nameInRainOn` (an), `nameInRainText` ("{channel}"), `nameInRainSize` (250 px), `nameInRainY` (200 px), `nameCell` (13 px), `nameScanSpeed` (260 px je s) |
| Starting | bestehende Texte bleiben; neu `crtWidth` (1160 px), `crtHeight` (640 px), `crtOnMs` (600 ms), `bootLines` (Liste, z. B. "[ OK ] Mounting /dev/chat ...", "[WAIT] Waiting for operator {channel} ..."), `bootLineMs` (700 ms), `glitchEvery` (4.2 s), `glitchOn` (an) |

### Acceptance Criteria

- [ ] AC1: `rainColumn(layer, i)` ist für gleichen Startwert gleich; die Zeile des Kopfes wächst mit der Zeit und
      beginnt nach dem Durchlauf oben neu; vor der Startzeit ist die Spalte leer.
- [ ] AC2: `glyphAt(column, row, t)` wechselt an der Spitze häufiger als in der Spur; gleiche Eingaben, gleiches Zeichen.
- [ ] AC3: `nameCells(text, size, y)` liefert nur Zellen innerhalb der Buchstaben; leerer Text ergibt keine Zellen.
- [ ] AC4: `bootProgress(k)` liefert 40 Zeichen aus vollen und leeren Blöcken und die Prozentzahl.
- [ ] AC5: `auditTheme` ohne Befund; `scripts/rules.check.ts`, `scripts/bundle.ts` grün.
- [ ] AC6 (manuell): `starting.html?demo&preview&t=7` neben [refs/starting.png](refs/starting.png); mit `quality =
      niedrig` ohne Unschärfe und mit weniger Zeichen; Abnahme.

### Tests (TDD)

1. `rain.check.ts > "Spalten"` (AC1) 2. `rain.check.ts > "Zeichenwechsel"` (AC2) 3. `nameMask.check.ts > "Zellen im
Namen"` (AC3) 4. `boot.check.ts > "Fortschritt"` (AC4) 5. `settings.check.ts`, `cargo test` (AC5)

### Umsetzungsschritte

1. Tests 1 bis 4, rot; Module, grün.
2. Einstellungen in TS und Rust, Fixture, Typen.
3. Atlas, Regen, Name, CRT, Boot-Log, `Screen.tsx` für Starting.
4. `npm run verify`, Vorschau rendern, neben den Prototyp legen, Abnahme abwarten (AC6).

### Out of Scope

- BRB und Ending (2), Overlays (3), Clips (4), Minimes, Dashboard-Skin.

---

## Package 2: Modernisierung: BRB und Ending

**Ziel:** BRB verliert und findet die Verbindung, Ending meldet sich ab und zeigt die Stream-Zahlen, beide mit
demselben Regen.

**Abhängigkeiten:** Package 1 (Abnahme), [plans/PLAN-STATS.md](../../../../plans/PLAN-STATS.md)

**Betroffene Dateien:** `rain.ts` (Tempo-Faktor über die Zeit), neu `logout.ts`, `logout.check.ts` (Zeilen der
Abmeldung mit echten Zahlen aus `describeStats`), `crt/SignalLost.tsx`, `scenes/Screen.tsx`, `MatrixRain.tsx`
(entfällt), `settings.ts`, `matrix.rs`, Fixture, Typen

### Gestaltung

- **BRB:** "SIGNAL LOST": der Regen wird langsam und dunkel, der CRT zeigt Rauschen und die Pausenzeit; alle paar
  Sekunden ein Wiederverbindungs-Versuch (Regen zieht kurz an, Zeile tippt sich, Glitch).
- **Ending:** "LOGOUT": Zeilen der Abmeldung mit den Stream-Zahlen zählen hoch, dann fällt der Regen nach unten aus dem
  Bild und der CRT schaltet sich aus (Linie, Punkt), danach `endingNext`.

### Einstellungen

| Gruppe | Schlüssel (Standard) |
|---|---|
| BRB | `brbRainSpeed` (Faktor 0.35), `brbRetryEvery` (6 s), `brbRetryText` ("> reconnecting ...") |
| Ending | `logoutLines` ("follows\|new users", "subs\|subscriptions", "raids\|incoming raids", "bits\|bits", "chatMessages\|messages"), `countUpMs` (1000 ms), `crtOffAt` (8 s) |

### Acceptance Criteria

- [ ] AC1: Der Tempo-Faktor ändert die Lage der Köpfe stetig (kein Sprung beim Wechsel der Geschwindigkeit).
- [ ] AC2: Die Abmeldung zeigt echte Zahlen, in `?demo` die Demo-Werte, ohne Statistik Striche.
- [ ] AC3 (manuell): BRB und Ending; Abnahme.

### Tests (TDD)

1. `rain.check.ts > "Tempo ohne Sprung"` (AC1) 2. `logout.check.ts > "Zeilen"` (AC2) 3. `settings.check.ts`,
`cargo test`

### Umsetzungsschritte

1. Tests, rot; Module, grün. 2. Einstellungen. 3. Szenen, `MatrixRain.tsx` entfernen (auch aus Alerts und Befehlsseite,
dort Regen aus `pixi/Rain.tsx`). 4. `npm run verify`, Vorschau, Abnahme.

### Out of Scope

- Overlays (3), Clips (4).

---

## Package 3: Modernisierung: Overlays

**Ziel:** Der Alert giesst Regen über die Stelle, schaltet dort eine Box wie einen CRT ein und zerfällt am Ende in
Zeichen; die übrigen Overlays entschlüsseln sich mit GSAP.

**Abhängigkeiten:** Package 1

**Betroffene Dateien:**
- Neu: `curtain.ts`, `curtain.check.ts` (Regenvorhang über einer Fläche: Köpfe fallen bis zur Unterkante und verblassen;
  Zerfall der Fläche in fallende Zeichen, untere Zellen zuerst), `pixi/Curtain.tsx`, `crt/CrtBox.tsx`
- Ändern: `scenes/Alerts.tsx`, `scenes/Chat.tsx`, `scenes/Cam.tsx`, `scenes/Music.tsx`, `scenes/Fx.tsx`,
  `scenes/Info.tsx`, `settings.ts`, `matrix.rs`, Fixture, Typen, `theme.css`

### Gestaltung

- **Alert** (wie [refs/alert.html](refs/alert.html)): ein Regenvorhang giesst sich über die Stelle der Box, dort schaltet
  sie sich wie ein CRT ein (Linie, öffnet sich, Blitz), Kopfzeile tippt sich, der Name entschlüsselt sich aus Katakana,
  Zeile und Zitat tippen sich, Restzeit als Segment-Balken, kurzer Glitch in der Mitte; Abgang: die Box wird dunkel und
  zerfällt in fallende Zeichen.
- **Chat:** neue Zeilen entschlüsseln sich, Namen in der Farbe des Chatters nur als Helligkeit (keine zweite Farbe).
- **Kamera:** Rahmen schaltet sich ein, an den Kanten läuft feiner Regen.
- **Musik:** Titelwechsel entschlüsselt sich, Equalizer aus Blockzeichen.
- **Effekte, Befehlsseite:** Terminalausgaben tippen sich, Glitch beim Wechsel.

### Einstellungen

| Gruppe | Schlüssel (Standard) |
|---|---|
| Alerts | `alertCurtainOn` (an), `alertCurtainSize` (22 px), `alertCurtainSpeed` (Faktor 1), `alertCrtOnMs` (430 ms), `alertDissolveOn` (an), `alertDissolveMs` (1000 ms), `alertGlitchOn` (an) |

### Acceptance Criteria

- [ ] AC1: Kein Kopf des Vorhangs fällt unter die Unterkante der Box; nach dem Einschalten ist der Vorhang leer.
- [ ] AC2: Beim Zerfall fällt jede Zelle genau einmal und verschwindet nach `alertDissolveMs`; untere Zellen beginnen
      früher.
- [ ] AC3: Alle Overlays transparent; jede Alert-Art zeigt ihre Texte wie bisher.
- [ ] AC4 (manuell): Eingang, Halten und Ausgang neben [refs/alert-in.png](refs/alert-in.png),
      [refs/alert.png](refs/alert.png), [refs/alert-out.png](refs/alert-out.png); Abnahme.

### Tests (TDD)

1. `curtain.check.ts > "Vorhang endet an der Box"` (AC1) 2. `curtain.check.ts > "Zerfall"` (AC2) 3. bestehende
Alert-Checks, `cargo test` (AC3)

### Umsetzungsschritte

1. Tests, rot; Module, grün. 2. Einstellungen. 3. Szenen. 4. `npm run verify`, Vorschau, Abnahme.

### Out of Scope

- Clips (4).

---

## Package 4: Modernisierung: Stinger und Banner

**Ziel:** Stinger und Banner zeigen den neuen Regen mit leuchtenden Köpfen als reine Funktion der Zeit.

**Abhängigkeiten:** Package 2, PLAN-GRAFIK Package 7

**Betroffene Dateien:** `stinger.ts` (Spalten aus `rain.ts`, Köpfe mit `shadowBlur`, Logo entschlüsselt sich,
Einschaltzeile blitzt am Übergangspunkt), `stinger.check.ts`, `banners.ts` (Regen in drei Ebenen und Kanalname im
Regen als Standbild), `banners.check.ts`, `render.ts`, `render.check.ts`

### Acceptance Criteria

- [ ] AC1: Am Übergangspunkt decken die Spalten das ganze Bild; jede Lage folgt aus Startwert und Zeit.
- [ ] AC2: Stinger-Optionen aus dem Kern; gleiche Einstellungen, gleiche Bilder.
- [ ] AC3 (manuell): WebM, GIF und Banner im Dashboard; Abnahme.

### Tests (TDD)

1. `stinger.check.ts > "gedeckt am Übergang"` (AC1) 2. `render.check.ts > "Clips"` (AC2)

### Umsetzungsschritte

1. Tests, rot; `stinger.ts`, `banners.ts`, grün. 2. `npm run verify`, rendern, Abnahme.

### Out of Scope

- Ton im Stinger.
