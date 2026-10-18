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
- **Abschluss:** Holzrand (2px) und Holzschatten unter Knöpfen und Karten, runde Knöpfe. Sonne, Palmen und Strandsachen
  aus dem Urlaub-Theme als Szenerie (`Scenery.tsx`); das Dashboard wird schmaler, damit die Palmen sichtbar bleiben.

### Plantage

- **Schrift:** Baloo 2 für Text, Fredoka für Überschriften und das Titel-Kistenetikett.
- **Farbe:** Himmel über grünen Feldreihen und Erde als Seite, Erntezettel-Karten `#fff6df` mit braunem Text `#3a2410`
  (13.5:1). Signatur Blattgrün `#2e7d32` (weisse Schrift 5.1:1) für Primärknopf und aktiven Tab, Mango-Orange `#b24d00`
  (4.9:1) für Hervorhebungen.
- **Raum:** luftig, mittlere Radien.
- **Abschluss:** Kistenrand (2px) und Holzschatten, Titel als Kistenetikett mit orangem Stempelrand. Sonne, Mangobäume
  und Mango-Soldaten aus dem Plantage-Theme als Szenerie.

### KOTH

- **Schrift:** Inter für Text, Black Ops One (Schablone) für Titel; Titel, Labels und Knöpfe in Grossbuchstaben.
- **Farbe:** dunkles Oliv `#171a0e` als Seite, Karten `#22261a` mit Text `#e9e4d0` (12.1:1). Signatur Signal-Orange
  `#ff8a1f` mit dunkler Schrift (7.2:1) für Primärknopf und aktiven Tab, Funk-Grün `#7cff6b` für Hervorhebungen und Fokus.
- **Raum:** dicht.
- **Abschluss:** 2px-Linien in Oliv, fast eckig, Titel auf einer Platte mit Warnstreifen. Hügel mit Funkmast und je ein
  Soldat jeder Fraktion als Szenerie.

Die öffentliche Befehlsseite (`/s/<login>/`) hat in jedem Theme ihr eigenes Aussehen (`scenes/Info.tsx` des Themes).

## Layout: die Seite scrollt nie als Ganzes

Gilt in jedem Skin. Titel und Navigation stehen fest, nur der Bereich darunter scrollt in sich (`.dashboard` ist
`100dvh`, `.dashboard-content` scrollt). Seiten mit Einstellungen und Vorschau (Theme, Rendern) teilen den Bereich
in Spalten: Knöpfe und Auswahl oben bleiben stehen, die Einstellungen scrollen in ihrer Spalte, die Vorschau steht
daneben. Wird es eng (unter 720px Breite oder 560px Höhe), läuft die Navigation einzeilig seitlich und der Bereich
scrollt als Ganzes, die Seite weiterhin nicht.

Neue Seiten folgen dem: jeder Bereich liegt in einem `.panel`, lange Listen bekommen eine eigene scrollende Box, nie
wächst die Seite selbst. Texte von Knöpfen in normaler Schreibweise; Grossbuchstaben und Klammern macht der Skin.
