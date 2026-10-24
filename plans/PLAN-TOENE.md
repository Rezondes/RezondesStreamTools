# Plan: Eingebaute Töne als Dateien

Heute sind die eingebauten Töne der Themes synthetische Pieptöne: `beep` in `src/core/sound.ts` spielt einen Oszillator,
`playSound(sound, builtIn)` ruft ohne eigene Datei die Funktion des Themes auf (`tones.ts`). Mit earshot
(github.com/Leonxlnx/earshot, MIT, Version 0.4) lassen sich bessere Töne in Code erzeugen: eine Sound-Bank aus 252
in Code gebauten Effekten (keine Aufnahmen) und eigene Rezepte, die earshot anhört und bewertet. Diese Töne entstehen
ausserhalb des Builds als kleine OGG-Dateien; der Kern spielt sie als eingebaute Töne ab. Erster Nutzer ist das Theme
Dogs (26 Töne, zusammen 312 KB). Das Theme Kebab spielt seine earshot-Dateien heute selbst (`src/themes/kebab/tones.ts`,
mit `ponytail:`-Vermerk); es kann danach auf `playClip` wechseln (nicht Teil dieses Plans).

Kern-Plan nach der Regel in [PLAN.md](../PLAN.md). Einen Rust-Anteil gibt es nicht: die Dateien gehören zum Build der
Overlays, der Server liefert sie wie jede andere Datei des Builds aus.

Testbefehl: `npm test` (einzeln: `node <pfad>.check.ts`), Abschluss jedes Packages: `npm run verify`. Regeln:
[CODING-RULES.md](../CODING-RULES.md), Theme-Aufbau: [THEMES.md](../THEMES.md).

## Überblick

| # | Package | Ziel in einem Satz | Abhängig von |
|---|---------|--------------------|--------------|
| 1 | Töne aus Dateien | Ein Theme spielt eingebaute Töne aus mitgelieferten Dateien, mit Lautstärke, Vorladen und Grenze gleichzeitiger Stimmen. | - |
| 2 | Werkzeug und Regeln | Rezepte der Töne liegen versioniert neben dem Theme, ein Skript rendert sie reproduzierbar mit earshot. | 1 |

## Annahmen

- **Kein Laufzeit-earshot** (entschieden 2026-10-23): earshot (Python, Modelle für das Hören) läuft nur auf dem
  Rechner des Entwicklers. Im Repo liegen die fertigen OGG-Dateien und die Rezepte; der Build braucht kein Python.
- **Werkzeug ausserhalb des Projekts:** earshot, seine venv, die Modelle (CLAP `laion/larger_clap_general` @ `16c8cc3`,
  AST `MIT/ast-finetuned-audioset-10-10-0.4593` @ `f826b80`) und ffmpeg liegen auf `F:\Tools\` (nicht im Repo).
- **Format:** OGG Vorbis, 48 kHz, mono, Qualität 5, jeder Ton auf -20 LUFS gebracht; die Lautstärke bleibt eine
  Einstellung (`SoundValue.volume`).
- **Eigene Datei schlägt eingebauten Ton:** wie heute; `playSound` spielt zuerst die Datei aus der Mediathek des
  Streamers, sonst den eingebauten Ton.
- **Alles einstellbar:** die Grenze gleichzeitiger Stimmen und das Vorladen sind Einstellungen des Themes, der Kern hat
  nur eine Schutzgrenze (`fixed: browser audio voices`, 32 Stimmen).
- **Offline-Build:** `vite build --mode offline` bettet Dateien ein; die Töne eines Themes kommen nur mit, wenn das
  Theme sie importiert (Vite-Import `?url`), also nur für Themes, die sie haben.

---

## Package 1: Töne aus Dateien

**Ziel:** Ein Theme spielt eingebaute Töne aus mitgelieferten Dateien, mit Lautstärke, Vorladen und Grenze
gleichzeitiger Stimmen.

**Abhängigkeiten:** keine

**Betroffene Dateien:**
- `src/core/sound.ts`: `playClip(url, volume, options)` (Web Audio: Datei einmal laden und dekodieren, als
  `AudioBuffer` merken, abspielen; `?sound=0` schaltet aus), `preloadClips(urls)`
- `src/core/clipVoices.ts`, `src/core/clipVoices.check.ts` (neu): reine Regel, welche Stimme bei voller Grenze weichen
  muss (`admitVoice(active, limit, now)`: älteste zuerst, nie mehr als `limit`)
- `THEMES.md`: Abschnitt Töne ("eingebauter Ton als Datei")

### Kontext

`playSound(sound, builtIn)` bleibt; `builtIn` ist bei Themes mit Dateien `volume => playClip(url, volume)`. Bei einem
Raid mit vielen Hunden kommen viele Töne fast gleichzeitig; die Grenze gleichzeitiger Stimmen hält das hörbar und
leicht. Das Theme lädt seine Töne beim Start der Szene vor (`preloadClips`), damit der erste Ton nicht verspätet kommt.

### Acceptance Criteria

- [ ] AC1: `admitVoice` lässt bis `limit` Stimmen zu; darüber weicht die älteste; `limit` 0 lässt nichts zu.
- [ ] AC2: `playClip` dekodiert jede URL höchstens einmal (Cache), spielt mit der Lautstärke aus den Einstellungen und
      tut mit `?sound=0` nichts.
- [ ] AC3: Ein Fehler beim Laden oder Dekodieren wird geloggt (`console.warn`), bricht die Szene nicht ab.
- [ ] AC4 (manuell): In OBS mit "Audio über OBS steuern" erscheint der Ton im Mixer der Browserquelle; im Offline-HTML
      spielt er ohne Server.

### Tests (TDD)

1. `src/core/clipVoices.check.ts > "Grenze gleichzeitiger Stimmen"` (AC1)

### Umsetzungsschritte

1. Test, rot; `clipVoices.ts`, grün.
2. `playClip`, `preloadClips` in `sound.ts` (Web Audio, Cache, Grenze aus `clipVoices.ts`).
3. `THEMES.md`, `npm run verify`.

### Out of Scope

- Töne in Clips (Stinger-Videos sind stumm).

---

## Package 2: Werkzeug und Regeln

**Ziel:** Rezepte der Töne liegen versioniert neben dem Theme, ein Skript rendert sie reproduzierbar mit earshot.

**Abhängigkeiten:** Package 1

**Betroffene Dateien:**
- `scripts/sounds/README.md` (neu): Einrichtung auf einem Rechner (earshot nach der Anleitung des Projekts, ffmpeg,
  Modelle), Befehl je Theme
- `src/themes/<id>/docs/sounds/` (je Theme mit Tönen): `kit.py` (Ereignisse aus Bank-Bausteinen und eigenen Stimmen),
  eigene Rezepte (z. B. `search.py`), `kit.json` (was earshot je Ton hört), Hörseite
- `scripts/rules.check.ts`: Dateien unter `src/themes/*/sounds/` nur `.ogg`, jede höchstens 64 KB
  (`fixed: keep the overlay light`)

### Kontext

Python liegt nur in `docs/` (nicht im Build, nicht geprüft wie TypeScript). Ein neuer Ton entsteht so: Rezept ändern,
`kit.py` laufen lassen, earshot beschreibt jeden Ton (`kit.json`), die Hörseite zeigt alle Töne nebeneinander, der
Nutzer nimmt ab, die OGG-Dateien werden nach `src/themes/<id>/sounds/` kopiert.

### Acceptance Criteria

- [ ] AC1: `scripts/rules.check.ts` meldet eine Datei anderer Art oder über 64 KB unter `sounds/`.
- [ ] AC2: Zweimal `kit.py` mit denselben Rezepten ergibt dieselben Dateien (feste Startwerte).

### Tests (TDD)

1. `scripts/rules.check.ts > "Töne"` (AC1)

### Umsetzungsschritte

1. Test, rot; Regel, grün.
2. `scripts/sounds/README.md`, `npm run verify`.

### Out of Scope

- earshot im Build oder auf dem Server.
