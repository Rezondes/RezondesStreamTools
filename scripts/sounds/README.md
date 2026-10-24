# Töne der Themes

Themes mit eingebauten Tönen (zuerst Dogs) spielen kurze OGG-Dateien aus `src/themes/<id>/sounds/`
(`plans/PLAN-TOENE.md`). Die Dateien entstehen in Code mit earshot, nicht aus Aufnahmen. Die Rezepte liegen
versioniert neben dem Theme, damit jeder Ton reproduzierbar neu gerendert werden kann.

## Ablage je Theme

- `src/themes/<id>/docs/sounds/`: die Rezepte in Python
  - `kit.py`: jedes Ereignis als Schichtung von Bank-Bausteinen und eigenen Stimmen, gleiche Lautheit (-20 LUFS),
    schreibt `out/kit/<ereignis>.wav` und `.ogg`, lässt earshot jeden Ton beschreiben und baut die Hörseite
  - eigene Stimmen und Suchen, bei Dogs `voices.py` (Bellen, Schnüffeln) und `search.py` (Stimmen per Hören suchen)
- `src/themes/<id>/docs/refs/sounds/`: was earshot je Ton hört (`kit.json`, `search-*.json`) und die Hörseite
- `src/themes/<id>/sounds/`: nur die fertigen `.ogg`, jede höchstens 64 KB (`scripts/rules.check.ts`, "Töne")

Python liegt nur unter `docs/`: nicht im Build, nicht im Server, nicht geprüft wie TypeScript.

## Einrichtung

1. earshot nach der Anleitung des Projekts installieren (eigene virtuelle Umgebung mit seinen Modellen).
2. ffmpeg auf den `PATH` legen (`ffmpeg -version` muss laufen).
3. In derselben Umgebung `numpy`, `soundfile` und `pyloudnorm` installieren.

## Einen Ton ändern

1. Rezept in `docs/sounds/kit.py` (oder die Stimme in `voices.py`) ändern. Alle Zufallswerte haben feste Startwerte,
   zweimal laufen lassen ergibt dieselben Dateien.
2. Im Ordner `src/themes/<id>/docs/sounds/` mit der earshot-Umgebung laufen lassen:

   ```bash
   python kit.py
   ```

   Eine Stimme neu suchen (dauert länger): `python search.py bark-small 12 24`.
3. Die Hörseite in `out/` öffnen, alle Töne nebeneinander anhören; `kit.json` zeigt, was earshot hört.
4. Nach der Abnahme die `.ogg` aus `out/kit/` nach `src/themes/<id>/sounds/` kopieren (Namen wie in `sounds.ts`
   des Themes) und die Hörseite mit `kit.json` nach `docs/refs/sounds/` legen.
5. `npm run verify`: die Regel "Töne" meldet falsche Dateiarten und Dateien über 64 KB.

Der Ordner `out/` ist Arbeitsmaterial und wird nicht eingecheckt.
