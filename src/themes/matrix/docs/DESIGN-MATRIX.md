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

## Modernisierung (entschieden 2026-10-21)

Abgenommene Prototypen: [refs/starting.html](refs/starting.html), [refs/alert.html](refs/alert.html) mit Standbildern.
Plan: [PLAN-MATRIX.md](PLAN-MATRIX.md). Monochrom bleibt; PixiJS zeichnet, GSAP bewegt.

- **Regen in drei Tiefenebenen:** fern klein, dunkel und unscharf; nah gross, hell und schnell; Köpfe fast weiss mit
  Glow, Spuren verblassen, Zeichen wechseln laufend.
- **Kanalname im Regen:** oben aus einem feinen Gitter von Regen-Zeichen mit leichtem Schein, eine Scanlinie läuft
  durch.
- **CRT:** schaltet sich ein wie eine Röhre (Linie, öffnet sich, Blitz) und am Ende aus (Linie, Punkt); Scanlinien,
  Vignette, Glitch in Streifen, bei dem der Regen mitzittert.
- **Texte:** Titel, Namen und Countdown entschlüsseln sich aus Katakana, Zeilen tippen sich, Fortschritt aus
  Blockzeichen, Boot-Log mit hervorgehobenem `[ OK ]`.
- **BRB:** "SIGNAL LOST", der Regen wird langsam, Wiederverbindungs-Versuche. **Ending:** "LOGOUT" mit Stream-Zahlen,
  der Regen fällt aus dem Bild.
- **Alerts:** Regen giesst sich über die Stelle, dort schaltet sich die Box ein, der Name entschlüsselt sich; am Ende
  zerfällt die Box in fallende Zeichen.

## Im Code

`.theme-matrix`, Keyframes `matrix-*`. Die Klassen haben historisch kein Präfix (`stage`, `crt`, ...), die Kapselung
leistet `.theme-matrix`. Dateien in `src/themes/matrix/`.
