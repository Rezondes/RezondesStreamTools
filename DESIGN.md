# Design: Dashboard

Gilt für das Dashboard (`src/dashboard`, Tokens in `src/style.css`). Die Overlays haben ihr Aussehen je Theme.

## Charakter

- **Schrift:** eine Monospace-Familie (Share Tech Mono), bewusst niedriger Kontrast: Hierarchie über Grossbuchstaben,
  Klammern (`[ KNOPF ]`) und Helligkeit statt über Grössensprünge. Terminal, kein Magazin.
- **Farbe:** Phosphorgrün auf Schwarz, monochrom. `--green` (#39FF14) für Text und das Wichtige, `--green-dim` für
  Nebensachen, `--green-line` für Linien. Primäre und aktive Knöpfe sind invertiert (grüne Fläche, schwarze Schrift).
  Fehler sind die einzige Fremdfarbe.
- **Raum:** dicht. Kleine Abstände in Gruppen, Trennlinien zwischen Bereichen.
- **Abschluss:** 1px-Linien, keine Rundungen, keine Schatten. Glühen nur am Titel.

## Layout: die Seite scrollt nie als Ganzes

Wie im Terminal stehen Titel und Navigation fest, nur der Bereich darunter scrollt in sich (`.dashboard` ist
`100dvh`, `.dashboard-content` scrollt). Seiten mit Einstellungen und Vorschau (Theme, Rendern) teilen den Bereich
in Spalten: Knöpfe und Auswahl oben bleiben stehen, die Einstellungen scrollen in ihrer Spalte, die Vorschau steht
daneben. Wird es eng (unter 720px Breite oder 560px Höhe), läuft die Navigation einzeilig seitlich und der Bereich
scrollt als Ganzes, die Seite weiterhin nicht.

Neue Seiten folgen dem: lange Listen bekommen eine eigene scrollende Box, nie wächst die Seite selbst.
