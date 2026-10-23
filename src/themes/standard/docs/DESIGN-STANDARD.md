# Design: Standard

Charakter: klar und modern, ruhig im Hintergrund, ein Verlauf aus zwei Akzenten ist das Erkennungszeichen.
Grundsätze für alle Themes: [DESIGN.md](../../../../DESIGN.md).

## Dashboard-Skin (`data-skin="standard"`)

- **Schrift:** Inter für alles (`--font`, `--font-title`). Wenig Grössenkontrast, das Gewicht trägt die Hierarchie
  (Titel 800, Knöpfe 600). Warum: ein Werkzeug, kein Magazin.
- **Farbe:**
  - Seite `#0b0b12` mit einem violetten Schein oben (`--page`), Karten `#14141c`, Text `#f4f4f8` (16.7:1),
    gedämpft `#a1a1b5` (7.2:1). Dunkel und leicht kühl, damit Vorschauen der Overlays davor gut lesbar sind.
  - Signatur Violett `#6d4aff` (`--accent`, weisse Schrift 5.2:1) nur für Primärknopf und aktiven Tab.
  - Cyan `#22d3ee` (`--emph`, `--focus`, 10.1:1) für Hervorhebungen und Fokus. Titel als Verlauf Violett zu Cyan.
- **Raum:** ruhig, Karten mit 16px Innenabstand.
- **Abschluss:** weiche Karten (`--radius` 14px, Knöpfe 10px) mit Schatten (`--shadow`), 1px-Linien innen.
- **Szenerie:** keine.

## Overlays

- **Farben (Standards in `settings.ts`):** Akzent `#7c5cff`, zweiter Akzent `#22d3ee` (Verlauf), Text `#ffffff`,
  gedämpft `#a1a1b5`, Karte `#14141c`, Hintergrund der Vollbild-Szenen `#0b0b12`. Der Verlauf aus beiden Akzenten
  zieht sich durch Ränder, Fortschritt und Stinger.
- **Schrift:** Inter (Auswahl: Inter, Manrope, DM Sans, Space Grotesk), alles Sans, kein Schmuck-Font.
- **Formen:** abgerundete Karten (Eckenradius 16px einstellbar), weiche Übergänge.
- **Szenen:**
  - Starting, BRB, Ending: ruhiger Hintergrund mit langsam wandernden Farbflächen, in der Mitte Überzeile und Titel,
    darunter Countdown mit Fortschritt, Pausenzeit oder nächster Stream.
  - Alerts: abgerundete Karte mit Verlaufsrand, Kopfzeile je Art, Zeile mit Namen, optional Nachricht und Restzeit-Balken.
  - Chat: Nachrichten als abgerundete Karten untereinander, optional Badges und Ausblenden.
  - Kamera: abgerundeter Rahmen im Verlauf, Namensschild unten links, optional Live-Anzeige.
  - Musik: Karte mit Cover, Überzeile, Titel, Interpret und Fortschritt.
  - Befehlsseite: Titel im Verlauf, je Abschnitt eine Karte mit den Befehlen als Chips.
- **Minimes:** keine (die Szene bleibt leer, der Server ignoriert die Befehle).
- **Stinger:** Streifen im Verlauf gleiten von links herein, decken am Übergangspunkt alles, zeigen kurz den Text.
- **Banner:** Standbild: dunkler Grund mit zwei Farbflächen, Titel und Text.

## Im Code

`.theme-standard`, Klassen und Keyframes `standard-*`, Dateien in `src/themes/standard/`.
