# Design: Matrix

Charakter: Terminal. Phosphorgrün auf Schwarz, eine Monospace-Schrift, Glühen und Glitches statt Formen.
Grundsätze für alle Themes: [DESIGN.md](../../../../DESIGN.md).

## Dashboard-Skin (`data-skin="matrix"`)

- **Schrift:** eine Monospace-Familie (Share Tech Mono). Bewusst niedriger Kontrast: die Hierarchie entsteht über
  Grossbuchstaben (`--title-case`, `--btn-case`), Klammern (`[ KNOPF ]`, per CSS) und Helligkeit. Terminal, kein Magazin.
- **Farbe:** monochrom. Grün `#39ff14` auf Schwarz `#000000` (15.5:1), gedämpft `#1e9e0f` (6.0:1), Linien `#0e4d07`.
  Primär und aktiv sind invertiert (Schwarz auf Grün). Glühen (`--glow`) am Titel und an Hervorhebungen. Fehler sind
  ebenfalls grün: der Skin hat bewusst keine zweite Farbe.
- **Raum:** dicht (`--leading` 1.25).
- **Abschluss:** 1px-Linien, keine Rundungen, keine Schatten.
- **Szenerie:** keine; die Seite ist schwarz.

## Overlays

- **Farben (Standards in `settings.ts`):** Hauptfarbe `#39ff14`, gedämpft `#1e9e0f`, Linien `#0e4d07`, Hintergrund
  `#000000`, Glühen `#39ff14`, Glitch `#b6ff9e`, Blitz `#d8ffcc`. Alles Schattierungen eines Grüns.
- **Schrift:** Share Tech Mono (Auswahl: Share Tech Mono, VT323, Fira Mono, IBM Plex Mono, Courier New), nur Monospace.
- **Bewegung:** Einblenden und Ausblenden als Glitch, Blende oder keins; Einschalten als Zoom, Blende oder keins.
- **Szenen:**
  - Starting, BRB, Ending: CRT-Bildschirm mit Kopfleiste, Terminalzeilen, Countdown und Ticker.
  - Alerts, Chat, Effekte: Terminalausgaben (Prompt, Badges) mit Glitch.
  - Kamera: Rahmen mit Ecken, Label, REC-Anzeige und Uhr.
  - Musik: Cover, Platte, Vinyl oder nichts, dazu Equalizer.
  - Befehlsseite: Terminalspalte über dem Matrix-Regen.
- **Minimes:** Neon-Geister im Kapuzenpulli ohne Beine, getragen von einer Düse aus fallenden Glyphen; Farbe je Chatter
  (`!color`), Gesicht `#000000` im Kapuzeninneren. Animationen: Backflip, Glitch, Umschauen, Drehen, Schlafen, Boost bei Chat.
- **Stinger:** Matrix-Spalten fallen herein und decken alles, das Logo entschlüsselt sich, am Übergangspunkt blitzt die
  Einschaltzeile, dann fallen die Spalten unten heraus.
- **Banner:** Matrix-Regen mit Texten, Dichte einstellbar, Schleife ohne Sprung.

## Im Code

`.theme-matrix`, Keyframes `matrix-*`. Die Klassen haben historisch kein Präfix (`stage`, `crt`, ...), die Kapselung
leistet `.theme-matrix`. Dateien in `src/themes/matrix/`.
