# Design: Dashboard

Gilt für das Dashboard (`src/dashboard`). Es sieht aus wie das **aktive Theme** des Streamers: `/api/me` liefert das
Theme, `skin.ts` setzt `data-skin` am `<html>`, `skins.css` belegt die Tokens. `src/style.css` und `dashboard.css`
benutzen nur Tokens (`--bg`, `--surface`, `--fg`, `--accent`, `--radius`, `--font`, ...), nie feste Farben. Nach
"Als aktives Theme setzen" lädt die Seite neu und zeigt den neuen Skin. Die Overlays haben ihr Aussehen je Theme.

## Skins

### Standard (Standard-Theme)

- **Schrift:** Inter, wenig Grössenkontrast, Gewicht trägt die Hierarchie (Titel 800, Knöpfe 600).
- **Farbe:** dunkle, leicht kühle Flächen (`#0b0b12`, Karten `#14141c`), eine Signatur Violett `#6d4aff` (weisse
  Schrift 5.2:1) nur für Primärknopf und aktiven Tab; Cyan `#22d3ee` für Hervorhebungen und Fokus. Titel als Verlauf.
- **Raum:** ruhig, Karten mit 16px Innenabstand.
- **Abschluss:** weiche Karten (Radius 14px) mit Schatten, 1px-Linien innen.

### Matrix

- **Schrift:** eine Monospace-Familie (Share Tech Mono), bewusst niedriger Kontrast: Hierarchie über Grossbuchstaben,
  Klammern (`[ KNOPF ]`, per CSS) und Helligkeit. Terminal, kein Magazin.
- **Farbe:** Phosphorgrün auf Schwarz, monochrom. Primär und aktiv sind invertiert. Glühen am Titel und an Hervorhebungen.
- **Raum:** dicht.
- **Abschluss:** 1px-Linien, keine Rundungen, keine Schatten.

### Urlaub

- **Schrift:** Nunito für Text, Baloo 2 für Überschriften, Pacifico nur im Titel-Holzschild.
- **Farbe:** Strand als Seite (Himmel, Meer, Sand), cremige Karten `#fff8ea` mit braunem Text `#3b2412` (13.7:1).
  Signatur Meerblau `#0b6f8e` (weisse Schrift 5.7:1) für Primärknopf und aktiven Tab, Hibiskus für Hervorhebungen.
- **Raum:** luftiger, grosse Radien.
- **Abschluss:** Holzrand (2px) und Holzschatten unter Knöpfen und Karten, runde Knöpfe. Sonne, Palmen und Früchte
  aus dem Urlaub-Theme als Szenerie (`Scenery.tsx`); das Dashboard wird schmaler, damit die Palmen sichtbar bleiben.

## Layout: die Seite scrollt nie als Ganzes

Gilt in jedem Skin. Titel und Navigation stehen fest, nur der Bereich darunter scrollt in sich (`.dashboard` ist
`100dvh`, `.dashboard-content` scrollt). Seiten mit Einstellungen und Vorschau (Theme, Rendern) teilen den Bereich
in Spalten: Knöpfe und Auswahl oben bleiben stehen, die Einstellungen scrollen in ihrer Spalte, die Vorschau steht
daneben. Wird es eng (unter 720px Breite oder 560px Höhe), läuft die Navigation einzeilig seitlich und der Bereich
scrollt als Ganzes, die Seite weiterhin nicht.

Neue Seiten folgen dem: jeder Bereich liegt in einem `.panel`, lange Listen bekommen eine eigene scrollende Box, nie
wächst die Seite selbst. Texte von Knöpfen in normaler Schreibweise; Grossbuchstaben und Klammern macht der Skin.
