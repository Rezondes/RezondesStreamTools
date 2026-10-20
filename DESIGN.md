# Design: Grundsätze

Gilt für alles, was man sieht: Dashboard (`src/dashboard`), Overlays und Befehlsseite (`src/themes/<id>`). Die
Entscheidungen je Theme stehen im Ordner `docs` des Themes, neben seinem Plan (`src/themes/<id>/docs/DESIGN-<ID>.md`,
`PLAN-<ID>.md`):

| Theme | Datei | Charakter in einem Satz |
|---|---|---|
| `standard` | [DESIGN-STANDARD.md](src/themes/standard/docs/DESIGN-STANDARD.md) | klar und modern, ein Verlauf aus zwei Akzenten auf Dunkel |
| `matrix` | [DESIGN-MATRIX.md](src/themes/matrix/docs/DESIGN-MATRIX.md) | Terminal: Phosphorgrün auf Schwarz, eine Monospace-Schrift |
| `urlaub` | [DESIGN-URLAUB.md](src/themes/urlaub/docs/DESIGN-URLAUB.md) | Strand: Himmel, Meer, Sand und Holzschilder |
| `plantage` | [DESIGN-PLANTAGE.md](src/themes/plantage/docs/DESIGN-PLANTAGE.md) | Mangoplantage als Illustration mit Tiefe: Baumreihen, Erde, Kisten und Milchglas-Erntepapier |
| `koth` | [DESIGN-KOTH.md](src/themes/koth/docs/DESIGN-KOTH.md) | Militär: Hügel mit Funkmast, Oliv, Stahl und Schablonenschrift |
| `bears` | [DESIGN-BEARS.md](src/themes/bears/docs/DESIGN-BEARS.md) | drei Bärenbrüder als Cartoon mit Kontur vor einer Aquarell-Welt aus Wald, Höhle und Stadt |
| `chaos` | [DESIGN-CHAOS.md](src/themes/chaos/docs/DESIGN-CHAOS.md) | Neon-Graffiti in der Nacht: Magenta und Cyan kritzeln, sprühen und leuchten auf fast Schwarz |

Ein neues Theme bekommt seine eigene `DESIGN-<ID>.md` im selben Commit wie das Theme.

## Das Dashboard sieht aus wie das aktive Theme

`/api/me` liefert das Theme, `skin.ts` setzt `data-skin` am `<html>`, `skins.css` belegt die Tokens. Jedes Theme hat
einen eigenen Skin (`skin.check.ts` verlangt das). Nach "Als aktives Theme setzen" lädt die Seite neu und zeigt den
neuen Skin; der letzte Skin wird im Browser gemerkt, damit beim Laden nicht kurz der falsche aufblitzt.

- **Nur Tokens:** `src/style.css` und `dashboard.css` benutzen nur Tokens, nie feste Farben, Masse oder Schriften.
  Ein Skin belegt alle: `--bg`, `--page`, `--surface`, `--surface-2`, `--field`, `--fg`, `--fg-dim`, `--line`,
  `--border`, `--heading`, `--title-color`, `--accent`, `--accent-hover`, `--on-accent`, `--emph`, `--glow`, `--focus`,
  `--error`, `--error-bg`, `--on-error`, `--btn-*`, `--hover-*`, `--press`, `--border-w`, `--radius*`, `--shadow`,
  `--font`, `--font-title`, `--title-*`, `--heading-weight`, `--*-case`, `--checker`, `--scroll-*`.
  Warum: ein neuer Skin ist dann nur ein Block in `skins.css`, kein Umbau der Seiten.
- **Tokens nur an `[data-skin]`:** Overlays und Befehlsseite haben keinen Skin, sonst würden gleichnamige Tokens
  (`--border`, `--radius`, ...) die Variablen der Themes überschreiben.
- **Szenerie:** Themes mit eigener Welt zeigen hinter dem Dashboard Formen aus dem Theme (`Scenery.tsx`, eine Szenerie
  je Skin, sichtbar nur im passenden Skin). Das Dashboard wird dann schmaler (`--dash-max`), damit die Szenerie am Rand
  sichtbar bleibt. Unter 1100px Breite fallen die Figuren weg, unter 720px die ganze Szenerie.

## Eine Entscheidung je Achse

Jeder Skin und jedes Theme legt fest (und schreibt es in seine `DESIGN-<ID>.md`):

- **Schrift:** wo der Kontrast liegt (Grösse, Gewicht oder zweite Familie), höchstens zwei Familien. Jede Schrift
  wird in `index.html` geladen.
- **Farbe:** eine Signaturfarbe nur für Primärknopf und aktiven Tab (Dashboard) bzw. für das, was man finden muss
  (Overlays). Eine zweite Farbe für Hervorhebungen. Statusfarben (`--error`) nur für Status.
- **Raum:** dicht oder luftig, bewusst gewählt; eng innerhalb einer Gruppe, grosszügig dazwischen.
- **Abschluss:** eine Trennsprache je Skin (Linien, Schatten oder Flächen), nicht alles zugleich.

## Kontrast wird gerechnet, nicht geschätzt

Text auf Fläche mindestens 4.5:1, Signatur gegen ihre Fläche mindestens 3:1, Schrift auf der Signatur mindestens 4.5:1.
Die Werte stehen mit Verhältnis in der `DESIGN-<ID>.md`. Eine Farbe, die das nicht schafft, wird heller oder dunkler
gemacht oder ersetzt, nicht trotzdem benutzt.

## Overlays: alles einstellbar, nichts fest

- **Kein fester Wert im Theme-Code** (Regel 20, `scripts/rules.check.ts`): Farben, sichtbare Texte, Grössen und Zeiten
  kommen aus `settings.ts` und kommen als CSS-Variablen an (`var(--accent)`). Weitere Masse stehen als Standard in
  `var(--name, wert)`, damit man sie überschreiben kann. Ausnahmen nur mit `fixed: <Grund>` im Kommentar.
- **Gekapselt:** jedes Theme hängt unter `.theme-<id>`, seine Klassen haben ein eigenes Präfix, seine Keyframes heissen
  `<id>-*`. Warum: mehrere Themes laufen in einem Build, ohne sich zu stören.
- **Formen statt Bilder:** Kulissen, Symbole und Figuren sind SVG-Pfade im Theme (nur Formen, keine Farben); gefärbt wird
  über CSS-Klassen (`part-main`, `part-detail`, `part-line`). So bleiben alle Farben einstellbar.
- **Stinger und Banner** sind reine Funktionen der Zeit (deterministisch, Banner schliessen nach einer Schleife nahtlos).
- **Befehlsseite** (`/s/<login>/`): jedes Theme zeigt sie in seinem Look (`scenes/Info.tsx`). Sie ist eine normale,
  scrollbare Seite für Zuschauer, die Kulisse steht fest dahinter.

## Layout des Dashboards: die Seite scrollt nie als Ganzes

Gilt in jedem Skin. Titel und Navigation stehen fest, nur der Bereich darunter scrollt in sich (`.dashboard` ist
`100dvh`, `.dashboard-content` scrollt). Seiten mit Einstellungen und Vorschau (Theme, Rendern) teilen den Bereich
in Spalten: Knöpfe und Auswahl oben bleiben stehen, die Einstellungen scrollen in ihrer Spalte, die Vorschau steht
daneben. Wird es eng (unter 720px Breite oder 560px Höhe), läuft die Navigation einzeilig seitlich und der Bereich
scrollt als Ganzes, die Seite weiterhin nicht.

Neue Seiten folgen dem: jeder Bereich liegt in einem `.panel`, lange Listen bekommen eine eigene scrollende Box, nie
wächst die Seite selbst.

**Login** (ohne Sitzung oder ohne Freischaltung): Titel, Meldung und eine `.panel`-Karte mit dem Twitch-Knopf stehen als
eine schmale Spalte in der Fenstermitte, der Titel größer als Markenzeichen. Die Karte ist das `.panel` des Skins,
also in jedem Skin dessen Fläche und Trennsprache; eigene Farben hat der Login nicht.

## Sprache

Texte in der Oberfläche auf Deutsch. Knöpfe in normaler Schreibweise und als Verb ("Speichern", "Als aktives Theme
setzen"); Grossbuchstaben und Klammern macht der Skin (`--btn-case`, Matrix-Klammern per CSS).
