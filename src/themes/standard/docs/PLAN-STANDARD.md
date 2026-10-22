# Plan: Theme "Standard"

Klar und modern, ruhig im Hintergrund, ein Verlauf aus zwei Akzenten als Erkennungszeichen. Das Theme besteht seit der
ersten Version und ist die Vorlage für eigene Themes; dieser Plan beschreibt seine Modernisierung mit PixiJS und GSAP,
wie sie die anderen Themes bekommen haben. Gestaltung: [DESIGN-STANDARD.md](DESIGN-STANDARD.md).

Testbefehl: `npm test` (einzeln: `node <pfad>.check.ts`), Abschluss jedes Packages: `npm run verify`, wo der Server
betroffen ist auch `npm run contract`. Regeln: [CODING-RULES.md](../../../../CODING-RULES.md), Theme-Aufbau:
[THEMES.md](../../../../THEMES.md), Übersicht aller Pläne: [PLAN.md](../../../../PLAN.md).

## Überblick

| # | Package | Ziel in einem Satz | Abhängig von |
|---|---------|--------------------|--------------|
| 1 | Modernisierung: Stil-Probe Starting | Starting zeigt weiche Lichtfelder aus beiden Akzenten mit Lichtstaub und feinem Korn, Titel, Countdown und Fortschritt bewegen sich mit GSAP, abgenommen neben dem Prototyp. | PLAN-GRAFIK 1, 2, 5 und 8 |
| 2 | Modernisierung: BRB und Ending | BRB lässt die Lichtfelder ruhig atmen und die Pausenzeit rollen, Ending zählt die Stream-Zahlen hoch und blendet die Welt aus. | 1 (Abnahme), PLAN-STATS |
| 3 | Modernisierung: Overlays | Der Alert zeichnet seinen Verlaufsrand ein, sprüht Funken aus beiden Akzenten und verlässt die Bühne weich; die übrigen Overlays bewegen sich mit GSAP. | 1 |
| 4 | Modernisierung: Stinger und Banner | Stinger und Banner zeigen die Lichtfelder, den Lichtstaub und die Verlaufsstreifen als reine Funktion der Zeit. | 2, PLAN-GRAFIK 7 |

Vorher fertig: [plans/PLAN-GRAFIK.md](../../../../plans/PLAN-GRAFIK.md) Packages 1, 2, 5 und 8 (für Package 1) und 7
(für Package 4), [plans/PLAN-STATS.md](../../../../plans/PLAN-STATS.md) (für Package 2). Package 1 endet mit einer
Abnahme; ohne sie beginnt kein weiteres Package. 3 kann neben 2 laufen (verschiedene Szenen; `settings.ts`,
`standard.rs` und die Fixture hängen nur Gruppen an).

## Annahmen

- **Kernidee** bleibt: dunkler, ruhiger Grund, ein Verlauf aus `accent` und `accent2`, abgerundete Karten, nur Inter und
  die übrigen Sans-Schriften der Auswahl. Keine dritte Farbe, kein Schmuck-Font (DESIGN-STANDARD.md). "Ruhig" heisst:
  langsame Bewegung, kein Flackern, nichts lenkt vom Stream ab.
- **Vorlage für eigene Themes:** Standard zeigt danach, wie ein Theme PixiJS und GSAP über die Kern-Bausteine nutzt
  (`PixiStage`, `useTimeline`, `qualityField`, `burstAt`). Darum bleibt jede Datei kurz und kommentiert, und
  [THEMES.md](../../../../THEMES.md) verweist im Abschnitt zur Vorlage auf die neuen Dateien.
- **Referenz:** anders als bei den übrigen Themes gibt es noch keinen abgenommenen Prototyp. Package 1 beginnt deshalb
  mit `refs/starting.html` und `refs/alert.html` (eigenständige Seiten wie bei den anderen Themes, dürfen per CDN
  laden) und den Standbildern daneben (Alert: Eingang, Halten, Ausgang). Erst nach dem OK des Nutzers wird das Theme
  umgebaut; die Zahlen des Prototyps werden Standardwerte. Jedes Package mit sichtbarer Arbeit endet mit Renders neben
  der Referenz und dem OK des Nutzers. Das Theme selbst lädt nichts per CDN (Module aus `node_modules`).
- **Technik:** Lichtfelder, Lichtstaub und Funken in einer `PixiStage` (weiche Kreis-Textur, additive Mischung, Unschärfe
  je Leistungsstufe), Korn als kleine wiederholte Textur; Karten, Texte, Countdown und Balken als HTML und CSS; Abläufe
  über `useTimeline`. Der Verlauf der Ränder bleibt CSS (`conic-gradient` bzw. `linear-gradient` aus den Akzenten).
- **Alter Look:** die CSS-Farbflecken (`standard-blobs`, `standard-drift`) werden ersetzt, kein Schalter. Die Schlüssel
  `blobs` und `blobSpeed` bleiben als Schalter und Tempo der Lichtfelder, damit gespeicherte Werte weiter gelten.
- **Zufall:** Lage, Grösse und Bahn der Lichtfelder und des Staubs aus `hash` bzw. `chance` mit Startwert; jede Lage aus
  der Zeit (Regel 21), damit `?t=` Standbilder stimmen.
- **Fallstrick:** Fortschrittsbalken und Zähler werden im Ticker aus dem Tween-Wert gesetzt, nicht in `onUpdate`
  ([THEMES.md](../../../../THEMES.md)). Deckkraft unter 1 auf einem Element mit `preserve-3d` vermeiden; einen
  Elternteil ausblenden.
- **Alles einstellbar** (Regeln 19 und 20), Leistungsstufe über `qualityField`; Schutzgrenzen (höchste Zahl Partikel)
  mit `fixed: <Grund>`.
- **Module:** `standard` kommt in `MODULE_THEMES` (`scripts/bundle.ts`), damit das Theme PixiJS und GSAP laden darf; die
  übrigen Themes und der Einstiegs-Chunk bleiben unverändert.
- **Schema in Rust und TS:** `server-rs/crates/rst-domain/src/themes/standard.rs` und
  `src/themes/standard/settings.ts`, Fixture `server-rs/crates/rst-domain/tests/fixtures/standard.json`, Typen
  `src/generated/themes/standard.ts`; jedes Package ergänzt beide Seiten im selben Commit.
- **Minimes:** das Theme hat keine; daran ändert sich nichts.
- **Commit:** je Package nach grünem `npm run verify`; über 400 Zeilen ist eine bewusste Ausnahme und steht in der
  Commit-Beschreibung.

---

## Package 1: Modernisierung: Stil-Probe Starting

**Ziel:** Starting zeigt weiche Lichtfelder aus beiden Akzenten mit Lichtstaub und feinem Korn, Titel, Countdown und
Fortschritt bewegen sich mit GSAP, abgenommen neben dem Prototyp.

**Abhängigkeiten:** PLAN-GRAFIK Packages 1, 2, 5 und 8

**Betroffene Dateien:**
- Neu in `src/themes/standard/docs/refs/`: `starting.html`, `alert.html` und die Standbilder `starting.png`,
  `alert-in.png`, `alert.png`, `alert-out.png` (Prototyp, Schritt 1)
- Neu in `src/themes/standard/`: `aurora.ts`, `aurora.check.ts` (Lichtfelder: Mittelpunkt, Radius und Farbe je Feld aus
  Startwert und Zeit, Farben zwischen `accent` und `accent2` gemischt, Bahnen bleiben im Bild), `digits.ts`,
  `digits.check.ts` (rollende Ziffern: welche Stellen sich ändern und wie weit eine Stelle gerollt ist)
- Neu: `pixi/Aurora.tsx` (Felder als weiche Sprites, additiv, Unschärfe je Leistungsstufe), `pixi/Dust.tsx`
  (Lichtstaub aus `particles.ts` des Kerns, steigt langsam auf und funkelt), `pixi/Grain.tsx`, `screen/Title.tsx`
  (Überzeile blendet ein, Titel steigt Buchstabe für Buchstabe mit Unschärfe auf), `screen/Countdown.tsx` (Ziffern
  rollen, Fortschritt mit wanderndem Glanzlicht)
- Ändern: `scenes/Screen.tsx` (Starting; BRB und Ending bis Package 2 alt), `settings.ts`, `theme.css` (Farbflecken
  entfallen für Starting), `server-rs/crates/rst-domain/src/themes/standard.rs`, Fixture, Typen, `scripts/bundle.ts`
  (`standard` in `MODULE_THEMES`), [THEMES.md](../../../../THEMES.md) (Vorlage nennt die neuen Dateien)

### Kontext

Heute zeigt `Screen.tsx` drei CSS-Farbflecken, die mit `standard-drift` hin und her wandern, darüber Kanal und Uhr, in
der Mitte Überzeile, Titel, Countdown und einen schlichten Balken. Alles erscheint mit `standard-in` auf einmal.

### Gestaltung

- **Lichtfelder:** vier grosse, weiche Felder (zwei im Akzent, zwei im zweiten Akzent, eines davon gemischt) ziehen
  langsam auf eigenen Bahnen, überlagern sich additiv und atmen leicht in der Helligkeit. Darüber feiner Lichtstaub, der
  langsam steigt und einzeln aufglimmt, und ein kaum sichtbares Korn gegen Farbstufen.
- **Ablauf beim Öffnen:** die Felder blenden in 1,2 s auf, die Überzeile blendet ein, der Titel steigt Buchstabe für
  Buchstabe mit Unschärfe auf, dann der Countdown und der Balken.
- **Countdown:** jede Ziffer rollt einzeln nach oben, wenn sie wechselt. Der Balken füllt sich im Verlauf, ein schmales
  Glanzlicht wandert alle paar Sekunden darüber. Nach dem Ende erscheint `countdownDone` mit demselben Aufstieg.
- **Kopf und Fuss:** Kanalname und Uhr wie bisher, der Hinweis unten läuft weich ein.

### Einstellungen (neue Gruppe "Hintergrund", bestehende bleiben)

| Gruppe | Schlüssel (Standard) |
|---|---|
| Hintergrund | `quality` (`qualityField`), `blobs` (an, jetzt Schalter der Lichtfelder), `blobSpeed` (24 s je Bahn), `worldSeed` (7), `auroraFields` (4, höchstens 8 mit `fixed: Leistung in OBS`), `auroraBlur` (90 px), `auroraStrength` (0.55), `dustOn` (an), `dustCount` (60, höchstens 400 mit `fixed: Leistung in OBS`), `grainOn` (an), `grainStrength` (0.05) |
| Starting, BRB, Ending | bestehende Texte bleiben; neu `introMs` (1200 ms), `titleRiseMs` (900 ms), `digitRollMs` (350 ms), `progressShine` (an), `shineEvery` (4 s) |

### Acceptance Criteria

- [ ] AC1: `auroraField(i, t)` ist für gleichen Startwert gleich; Mittelpunkte bleiben bei jeder Zeit innerhalb von
      1920x1080 plus Radius; nach `blobSpeed` Sekunden ist jedes Feld wieder am Anfang seiner Bahn (nahtlos).
- [ ] AC2: Die Farbe jedes Feldes liegt zwischen `accent` und `accent2`; mit gleichen Akzenten sind alle Felder gleich
      gefärbt.
- [ ] AC3: `rollDigits("04:59", "05:00", k)` meldet nur die geänderten Stellen und rollt sie von 0 bis 1; gleiche Texte
      rollen nichts.
- [ ] AC4: `auditTheme` ohne Befund; `scripts/rules.check.ts`, `scripts/bundle.ts` grün (`standard` lädt PixiJS und
      GSAP nur in seinem Chunk).
- [ ] AC5 (manuell): `starting.html?demo&preview&t=4` neben [refs/starting.png](refs/starting.png); mit `quality =
      niedrig` ohne Unschärfe und mit weniger Staub; mit `blobs` aus nur der ruhige Grund; Abnahme.

### Tests (TDD)

1. `aurora.check.ts > "Bahnen"` (AC1) 2. `aurora.check.ts > "Farben"` (AC2) 3. `digits.check.ts > "Rollen"` (AC3)
4. `settings.check.ts`, `cargo test`, `scripts/bundle.check.ts` (AC4)

### Umsetzungsschritte

1. Prototyp `refs/starting.html` und `refs/alert.html` bauen, Standbilder daneben legen, Abnahme abwarten.
2. Tests 1 bis 3, rot; `aurora.ts`, `digits.ts`, grün.
3. Einstellungen in TS und Rust, Fixture, Typen; `standard` in `MODULE_THEMES`.
4. Lichtfelder, Staub, Korn, Titel, Countdown, `Screen.tsx` für Starting; THEMES.md.
5. `npm run verify`, Vorschau rendern, neben den Prototyp legen, Abnahme abwarten (AC5).

### Out of Scope

- BRB und Ending (2), Overlays (3), Clips (4), Dashboard-Skin.

---

## Package 2: Modernisierung: BRB und Ending

**Ziel:** BRB lässt die Lichtfelder ruhig atmen und die Pausenzeit rollen, Ending zählt die Stream-Zahlen hoch und
blendet die Welt aus.

**Abhängigkeiten:** Package 1 (Abnahme), [plans/PLAN-STATS.md](../../../../plans/PLAN-STATS.md)

**Betroffene Dateien:** `aurora.ts` (Helligkeit und Tempo als Faktor über die Zeit), neu `endStats.ts`,
`endStats.check.ts` (Zeilen der Stream-Zahlen mit echten Werten aus `describeStats`), `screen/StatCards.tsx`,
`scenes/Screen.tsx`, `theme.css` (Farbflecken entfallen ganz), `settings.ts`, `standard.rs`, Fixture, Typen

### Gestaltung

- **BRB:** die Felder werden langsamer und etwas dunkler und atmen in einem ruhigen Takt (hell, dunkel), die Pausenzeit
  rollt wie der Countdown, der Untertitel blendet weich ein.
- **Ending:** nach Titel und Überzeile erscheinen die Stream-Zahlen als kleine Karten nebeneinander und zählen hoch,
  danach sinken die Lichtfelder langsam nach unten und blenden aus; `endingNext` bleibt stehen.

### Einstellungen

| Gruppe | Schlüssel (Standard) |
|---|---|
| Starting, BRB, Ending | `brbBreatheSeconds` (6 s), `brbDim` (0.6), `endingStats` (Liste "follows\|Follows", "subs\|Abos", "raids\|Raids", "bits\|Bits", "chatMessages\|Nachrichten"), `countUpMs` (1200 ms), `endingFadeAt` (10 s) |

### Acceptance Criteria

- [ ] AC1: Ein Wechsel des Tempo-Faktors verschiebt die Felder stetig (kein Sprung); `brbDim` 1 ergibt dieselbe
      Helligkeit wie Starting.
- [ ] AC2: Die Karten zeigen echte Zahlen, in `?demo` die Demo-Werte, ohne Statistik Striche; unbekannte Schlüssel der
      Liste werden ausgelassen.
- [ ] AC3 (manuell): BRB und Ending neben Starting; Abnahme.

### Tests (TDD)

1. `aurora.check.ts > "Tempo ohne Sprung"` (AC1) 2. `endStats.check.ts > "Zeilen"` (AC2) 3. `settings.check.ts`,
`cargo test`

### Umsetzungsschritte

1. Tests, rot; Module, grün. 2. Einstellungen. 3. Szenen, alte Farbflecken aus `theme.css` entfernen.
4. `npm run verify`, Vorschau, Abnahme.

### Out of Scope

- Overlays (3), Clips (4).

---

## Package 3: Modernisierung: Overlays

**Ziel:** Der Alert zeichnet seinen Verlaufsrand ein, sprüht Funken aus beiden Akzenten und verlässt die Bühne weich;
die übrigen Overlays bewegen sich mit GSAP.

**Abhängigkeiten:** Package 1

**Betroffene Dateien:**
- Neu: `edgeTrace.ts`, `edgeTrace.check.ts` (Länge des sichtbaren Randes einer abgerundeten Karte aus der Zeit, Umfang
  aus Breite, Höhe und Radius), `pixi/Sparks.tsx` (Funken aus `burstAt` des Kerns, Farben aus beiden Akzenten)
- Ändern: `scenes/Alerts.tsx`, `scenes/Chat.tsx`, `scenes/Cam.tsx`, `scenes/Music.tsx`, `scenes/Fx.tsx`,
  `scenes/Info.tsx`, `settings.ts`, `standard.rs`, Fixture, Typen, `theme.css`

### Gestaltung

- **Alert** (wie [refs/alert.html](refs/alert.html)): die Karte gleitet mit leichter Feder herein, der Verlaufsrand
  zeichnet sich einmal ringsum ein, ein weicher Schein pulsiert kurz, aus der Mitte des Randes sprühen Funken in beiden
  Akzenten. Kopfzeile blendet ein, der Name steigt wie der Titel auf, Nachricht und Restzeit-Balken folgen (Balken mit
  Glanzlicht wie im Countdown). Abgang: die Karte wird unscharf, kippt leicht nach hinten und blendet aus.
- **Chat:** neue Karten gleiten mit Feder herein, ältere rücken weich nach; Ausblenden mit leichter Unschärfe.
- **Kamera:** der Verlauf des Rahmens wandert langsam ringsum (`conic-gradient`, Winkel aus der Zeit), Namensschild und
  Live-Anzeige blenden weich ein.
- **Musik:** beim Titelwechsel kippt das Cover, Titel und Interpret blenden über; der Fortschritt im Verlauf.
- **Effekte, Befehlsseite:** Einblenden und Wechsel über `useTimeline` statt CSS-Keyframes.

### Einstellungen

| Gruppe | Schlüssel (Standard) |
|---|---|
| Alerts | `alertTraceOn` (an), `alertTraceMs` (700 ms), `alertGlow` (24 px), `alertSparksOn` (an), `alertSparks` (36, höchstens 300 mit `fixed: Leistung in OBS`), `alertExit` ("Unschärfe", Auswahl "Unschärfe", "Gleiten", "Blenden") |
| Kamera-Rahmen | `camSpinOn` (an), `camSpinSeconds` (8 s) |

### Acceptance Criteria

- [ ] AC1: Die sichtbare Randlänge steigt von 0 bis zum vollen Umfang in `alertTraceMs` und bleibt dann voll; der
      Umfang stimmt für Radius 0 und für den grössten Radius (halbe Höhe).
- [ ] AC2: Funken starten nur auf dem Rand, ihre Zahl ist `alertSparks`, ihre Lage folgt aus Startwert und Zeit; nach
      ihrer Lebensdauer ist die Bühne leer.
- [ ] AC3: Alle Overlays transparent; jede Alert-Art zeigt ihre Texte und Töne wie bisher.
- [ ] AC4 (manuell): Eingang, Halten und Ausgang neben [refs/alert-in.png](refs/alert-in.png),
      [refs/alert.png](refs/alert.png), [refs/alert-out.png](refs/alert-out.png); Abnahme.

### Tests (TDD)

1. `edgeTrace.check.ts > "Rand"` (AC1) 2. `edgeTrace.check.ts > "Funken auf dem Rand"` (AC2) 3. bestehende
Alert-Checks, `cargo test` (AC3)

### Umsetzungsschritte

1. Tests, rot; Module, grün. 2. Einstellungen. 3. Szenen. 4. `npm run verify`, Vorschau, Abnahme.

### Out of Scope

- Clips (4).

---

## Package 4: Modernisierung: Stinger und Banner

**Ziel:** Stinger und Banner zeigen die Lichtfelder, den Lichtstaub und die Verlaufsstreifen als reine Funktion der Zeit.

**Abhängigkeiten:** Package 2, PLAN-GRAFIK Package 7

**Betroffene Dateien:** `stinger.ts` (Verlaufsstreifen gleiten herein wie bisher, dahinter Lichtfelder aus `aurora.ts`,
Staub aus `particles.ts`, der Text steigt am Übergangspunkt auf), `stinger.check.ts`, `banners.ts` (Lichtfelder als
Standbild in der Mitte ihrer Bahn, Staub, Titel und Text), `banners.check.ts`, `render.ts`, `render.check.ts`

### Acceptance Criteria

- [ ] AC1: Am Übergangspunkt decken die Streifen das ganze Bild; jede Lage folgt aus Startwert und Zeit.
- [ ] AC2: Stinger-Optionen aus dem Kern; gleiche Einstellungen, gleiche Bilder.
- [ ] AC3 (manuell): WebM und Banner im Dashboard; Abnahme.

### Tests (TDD)

1. `stinger.check.ts > "gedeckt am Übergang"` (AC1) 2. `render.check.ts > "Clips"` (AC2)

### Umsetzungsschritte

1. Tests, rot; `stinger.ts`, `banners.ts`, grün. 2. `npm run verify`, rendern, Abnahme.

### Out of Scope

- Ton im Stinger, Dashboard-Skin.
