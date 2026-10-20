# Design: Chaos

Charakter: Neon-Graffiti in der Nacht, Magenta und Cyan kritzeln, sprühen und leuchten auf fast Schwarz.
Grundsätze für alle Themes: [DESIGN.md](../../../../DESIGN.md). Plan des Themes: [PLAN-CHAOS.md](PLAN-CHAOS.md).

## Bildsprache

Vorbild ist ein Stil, keine Figur: Es gibt keine Person, kein Gesicht und keine fremden Schriftzüge. Alles besteht aus
drei Ebenen, die in jeder Szene, im Stinger, in den Bannern und im Dashboard-Skin gleich aussehen.

**Referenzbilder und Detailgrad:** Die vier Referenzbilder liegen nur lokal unter `.claude/refs/chaos/ref-1.webp` bis
`ref-4.webp` (git-ignoriert, fremde Rechte, nie committen). Jede Szene wird beim Bauen neben ihnen gerendert und
verglichen. Der Stil muss im **Detailgrad** gleich sein, nicht nur in den Farben:

- **Dichte:** die Wand ist voll; in einem Bild von 1920x1080 stehen 150 bis 250 Kritzeleien, nur die Mitte bleibt frei.
- **Linien:** mehrere Strichstärken nebeneinander (feine Kreidestriche, mittlere Markerstriche, einzelne dicke), jede
  Linie zittert und läuft an den Enden aus; Kreidestriche sind körnig gebrochen, nicht durchgezogen.
- **Pinselstrich:** sichtbare Borstenspuren als viele feine Parallellinien über die ganze Länge, ausgefranste Kanten,
  Spritzer und Tropfen daneben, Laufnasen nach unten.
- **Spray:** weicher Sprühnebel um Schriftzüge und Gesten, feine Sprühpunkte (Speckles) am Rand.
- **Körnung und Flecken:** Körnung über allem, dazu unregelmässige dunklere Flecken in Violett auf der Wand.
- **Licht:** Glow um Magenta und Cyan mit hellem Kern (fast Weiss) und weichem farbigem Rand.

**Grund (die Wand):**

- Fast schwarz mit einem Stich Violett (`ground`), zur Mitte hin leicht aufgehellt in dunkles Violett (`wall`), als
  weicher radialer Verlauf. Das ist der einzige Verlauf der Welt.
- Körnung über die ganze Fläche (SVG-Filter `feTurbulence`, Stärke einstellbar, 0 = aus), damit die Wand wie
  gesprühter Beton wirkt und nicht wie eine leere Fläche.

**Kritzeleien (die Wand ist voll davon):**

- Kleine Zeichen als offene Linien in Kreide- oder Markerstärke: fünfzackige Sterne, X, Pfeile mit Spitze, Blitze,
  Zickzack, Spiralen, Herzen, Kreise mit Strichen, kleine Monster mit Zackenzähnen, Totenkopf mit X-Augen, Krakel
  (unlesbare Schreibschrift), Striche in Bündeln.
- **Unruhige Linie:** jede Linie hat Strichstärke mit runden Enden und ein leichtes Zittern
  (`feDisplacementMap`, Stärke einstellbar), nie perfekt glatt. Keine Füllung, nur Linie.
- **Farben der Kritzeleien:** Magenta, Cyan, Violett hell und Flieder, gelegentlich Weiss. Je Zeichen eine Farbe.
- **Verteilung:** deterministisch aus `hash` (Position, Drehung, Grösse, Farbe, Art), dichter am Rand, die Mitte
  bleibt für den Inhalt frei. Dichte einstellbar.
- **Grösse:** klein bis mittel (etwa 1 bis 6 % der Bildbreite), einzelne grosse Zeichen als Blickfang.

**Grundsatz Chaos:** Nichts ist symmetrisch, parallel oder sauber ausgerichtet. Gesten, Kritzeleien und Laufnasen haben
verschiedene Grössen, Winkel und Kreuzungspunkte; was doppelt vorkommt (zwei X), unterscheidet sich deutlich (abgenommen
mit der Stilprobe vom 2026-10-20).

**Grosse Gesten (Blickfang):**

- **Pinselstriche:** breite Striche mit Borstenspuren über die ganze Länge, ausgefransten Kanten, trockenem Auslauf,
  Spritzern und Laufnasen nach unten. Sie liegen hinter dem Inhalt.
- **Zwei X (Standard-Komposition):** links ein grosses Cyan-X (ein breiter, flacher Strich bis unter die Mitte, ein
  schmaler, steiler Strich kreuzt ihn tief unten), rechts ein Magenta-X (ein steiler schmaler und ein flacher breiter
  Strich, der fast bis zur Mitte reicht, Kreuzung oben), dazu zwei kurze lose Striche in der jeweils anderen Farbe (oben
  links Magenta, unten rechts Cyan). Ein dunkler weicher Dunst hinter dem Textblock hält Titel und Zahlen lesbar.
- **Sprühschrift:** Titel als gesprühter Schriftzug: Schrift in Magenta mit weichem Leuchten (Glow), weichem
  Sprührand und zwei bis vier Laufnasen unter einzelnen Buchstaben.
- **Energie-Schwaden** (nur Alerts und Stinger): flammenartige, gezackte Flächen aus vielen kurzen Strichen in Magenta,
  Cyan und Violett, die von den Rändern hereinschlagen; innen hell (Flieder bis Weiss), aussen satt.

**Licht:** Neon-Leuchten (`feGaussianBlur` unter der Form, Stärke einstellbar) nur auf Magenta und Cyan. Violett
leuchtet nie, so bleibt es Hintergrund.

## Overlays

- **Farben (Standards in `settings.ts`):**
  - Grund `#120910`, Wand (Mitte des Verlaufs) `#22182f`, Fläche für Karten `#2b2041`, Fläche hell `#3a2c55`.
  - Signatur Magenta `#d123a0` (das, was man finden muss: Titel, Live, Countdown, Fortschritt), Magenta für Text
    `#ff5ccb`.
  - Zweiter Akzent Cyan `#09d0fe` (Hervorhebung, Pinselstrich, Kritzeleien).
  - Violett `#502a5f` (Schatten, Wandflecken), Violett hell `#986ea9` und Flieder `#d39dd4` (Kritzeleien, Schwaden).
  - Text `#ffffff`, gedämpft `#b8a6c4`, Text auf Cyan `#120910`.
  - Zwischentöne (Glow-Rand, Schwaden innen, Hover) entstehen per `color-mix` aus diesen Farben, nie als eigene
    Literale.
- **Kontraste (gerechnet):**
  - Text `#ffffff` auf Grund `#120910` 19.6:1, auf Fläche `#2b2041` 15.2:1, auf Fläche hell `#3a2c55` 12.6:1.
  - Gedämpft `#b8a6c4` auf Grund 8.7:1, auf Fläche 6.7:1, auf Fläche hell 5.6:1.
  - Magenta-Text `#ff5ccb` auf Grund 7.1:1, auf Fläche 5.5:1.
  - Signatur `#d123a0` gegen Grund 4.2:1 und gegen Fläche 3.2:1 (Fläche und Glow, nie kleiner Text); Weiss darauf
    4.7:1.
  - Cyan `#09d0fe` auf Grund 10.7:1, auf Fläche 8.3:1; Schrift auf Cyan immer `#120910` (10.7:1), nie Weiss (1.8:1).
- **Schrift:** Permanent Marker für Titel, Namen und grosse Zahlen (Marker-Look, ein Gewicht), Space Grotesk für Text
  (500 und 700). Kontrast über die zweite Familie und die Grösse. Titel bekommen Glow, Fliesstext nie.
- **Flächen:** Karten sind Fläche `#2b2041` mit einem rauen Rand aus Markerstrich (dieselbe unruhige Linie wie die
  Kritzeleien) in Magenta oder Cyan; Ecken leicht schief statt rund (Zettel). Klebeband-Streifen halten Zettel an der
  Wand. Keine Schlagschatten; Trennung nur über den Markerrand.
- **Bewegung:**
  - Kritzeleien zeichnen sich selbst (Strich läuft entlang des Pfads, `stroke-dashoffset`), nacheinander, Dauer und
    Abstand einstellbar.
  - Neon flackert leicht (Helligkeit, selten, einstellbar, 0 = aus).
  - Glitch: ab und zu ein kurzer Versatz in Magenta und Cyan über dem Titel (Häufigkeit und Stärke einstellbar).
  - Einschalten der Vollbild-Szenen: Sprühstoss, der Pinselstrich wird von links nach rechts gesprüht, danach
    zeichnen sich die Kritzeleien, zuletzt leuchtet der Titel auf.
  - Auftritte von Karten: schnell hereingeklatscht (kurz zu gross, dann an der Wand), Abgang als kurzer Glitch.
- **Szenen:**
  - **Starting, BRB, Ending:** Wand mit Körnung, Kritzeleien rundum, die zwei X hinter dem Inhalt
    (Komposition je Szene einstellbar: zwei X, ein X, ein Strich, keine; jede Szene mit eigenem Startwert, so dass die
    Striche in jeder Szene anders liegen). Überzeile in
    Space Grotesk, Titel als Sprühschrift, Untertitel, Countdown oder Pausenzeit als Marker-Zahl in Cyan, wechselnde
    Sprüche, Fortschritt als Zickzack-Linie, die sich zeichnet, oder als Markerbalken. Ticker als Klebeband-Streifen
    unten.
  - **Alerts:** Energie-Schwaden schlagen von einer Seite herein (Seite einstellbar), darauf ein Zettel mit Markerrand:
    Name als Sprühschrift, Zeile und Zitat in Space Grotesk. Konfetti aus kleinen Kritzeleien (Sterne, X, Blitze).
    Restzeit als Markerstrich, der sich zurückzieht.
  - **Chat:** Nachrichten als schiefe Zettel mit Klebeband (Varianten: Zettel, Markerblasen, schlicht), Name in Marker,
    Farbe des Chatters als Rand; neue Nachrichten klatschen herein.
  - **Kamera:** Rahmen aus vier Markerstrichen mit Überstand, Kritzeleien an den Ecken, ein Pinselstrich hinter einer
    Ecke; Namensschild als Klebeband, Live-Pille in Magenta.
  - **Musik:** Cover mit Sprührand, Titel und Künstler auf Klebeband, Fortschritt als Zickzack, Equalizer als zitternde
    Striche; Varianten Zettel, Kassette mit Kritzeleien, schlicht.
  - **Effekte:** Text als Sprühschrift mitten im Bild, mit Laufnasen und Glow.
  - **Befehlsseite:** Zettel mit Markerrand vor der Wand mit Kritzeleien.
- **Minimes:** kleine Kritzel-Monster (runder oder zackiger Körper als unruhige Linie, zwei Augen, Zackenmund, kurze
  Beine) in der Farbe des Chatters (`!color`), Name in Marker darüber. Sie hüpfen (Hüpfen des Kerns). Animationen:
  Zappeln, Grinsen mit Zacken, Kritzel-Stern über dem Kopf, Umfallen und Aufstehen, Schlafen (aufsteigende Krakel).
  Reaktion auf Chat: ein kurzer Spray-Klecks in der eigenen Farbe.
- **Stinger:** Energie-Schwaden schlagen von links und rechts herein, treffen sich in der Mitte und decken am
  Übergangspunkt das ganze Bild; darauf der Text als Sprühschrift mit Glow; danach reissen die Schwaden nach oben und
  unten weg.
- **Banner:** Profilbanner als Wand mit Kritzeleien, grossem Cyan-Pinselstrich und dem Kanalnamen als Sprühschrift.
  Offline-Banner gleiche Wand, Magenta-X, Text "offline" als Sprühschrift, ein Monster schläft in der Ecke.

## Dashboard-Skin (`data-skin="chaos"`)

- **Schrift:** Permanent Marker für Überschriften und das Titelschild, Space Grotesk für alles andere.
- **Farbe:**
  - Seite Grund `#120910` mit Körnung, Karten Fläche `#2b2041`, Felder Fläche hell `#3a2c55`.
  - Text `#ffffff` (15.2:1 auf Karte), gedämpft `#b8a6c4` (6.7:1 auf Karte).
  - Signatur Magenta `#d123a0` (`--accent`, weisse Schrift 4.7:1, gegen Karte 3.2:1) für Primärknopf und aktiven Tab.
  - Cyan `#09d0fe` (`--emph`, 8.3:1 auf Karte) für Hervorhebungen und als Fokusring.
  - Fehler Orange `#ff6b4a` (5.4:1 auf Karte, Schrift `#120910` darauf 7.0:1), damit er sich vom Magenta abhebt.
- **Raum:** dicht innerhalb einer Karte, grosszügig zwischen Karten.
- **Abschluss:** Markerränder statt Schatten; jede Karte hat einen unruhigen Rand in Violett hell, die aktive in
  Magenta.
- **Szenerie:** Kritzeleien an den Rändern hinter dem Dashboard, ein Cyan-Pinselstrich unten links, ein Magenta-X oben
  rechts; unter 1100px nur noch die Kritzeleien, unter 720px keine Szenerie.

## Im Code

`.theme-chaos`, Klassen `ch-*`, Keyframes `chaos-*` und `chaos-minime-*`, Dateien in `src/themes/chaos/`.
