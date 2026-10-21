# Design: Südfrucht-Plantage

Charakter: eine sonnige Mangoplantage als **Illustration mit Tiefe**. Baumreihen, Erde und Holzkisten als Welt, der
Streamer als Mangopflücker, Milchglas-Erntepapier als Träger für Text; verspielt, mit Mango-Soldaten als Augenzwinkern.
Grundsätze für alle Themes: [DESIGN.md](../../../../DESIGN.md). Plan des Themes: [PLAN-PLANTAGE.md](PLAN-PLANTAGE.md).

## Bildsprache: Illustration mit Tiefe

Gilt für Kulisse, Figur, Overlays, Stinger, Banner und Dashboard-Skin. Chat und Minimes behalten ihren eigenen Stil.

- **Keine Umrisse.** Formen heben sich über Licht- und Schattentöne ab, nicht über Konturen.
- **Licht von oben links.** Jede Fläche hat einen hellen und einen dunklen Ton (Baumkronen in drei Tönen, Mangos als
  Verlauf von Mango zu Rot mit Glanzpunkt, Holz oben heller als unten).
- **Luftperspektive.** Was weiter weg ist, mischt sich mit der Himmelsfarbe (ferne Hügel und Baumreihen blasser).
- **Weiche Schatten.** Dinge stehen auf dem Boden (Schatten auf der Erde) oder schweben über dem Bild (weicher,
  versetzter Schatten). Keine harten Versatzschatten.
- **Ein Licht für alles.** Was im Feld steht (Pflücker, Ticker), blendet mit der Kulisse ein und wird nachts mit ihr dunkler.

## Overlays

- **Farben (Standards in `settings.ts`):**
  - Text `#ffffff`, Text auf Holz und Papier `#3a2410`, Holz `#c8935a` und `#7a4a24`, Erntezettel `#fff6df`.
  - Erde `#8b5e3c` und `#5e3b22`, Blätter `#2f8f3a` und `#1d5e27`, Stamm `#6d4c2f`.
  - Mango `#ffb02e` mit Rot `#ff5e3a`, Akzent Mango-Orange `#ff8c1a`, zweiter Akzent Blattgrün `#4caf50`.
  - Himmel je Tageszeit, Sonne `#ffd23f`, Mond `#f5f1d6`, Hügel `#8fbf5a` und `#bcd88a`.
  - Zwischentöne entstehen per `color-mix` aus diesen Farben, nie als eigene Literale.
- **Schrift:** Baloo 2 für Text, Fredoka für Titel (Auswahl einstellbar).
- **Flächen (Tokens in `theme.css`):**
  - `--frost` / `.pl-card`: Milchglas-Erntepapier mit Weichzeichner, dünner heller Rand, Lichtkante oben.
  - `--lit-wood` / `.pl-wood`: beleuchtete Bretter mit weichen Fugen und dünnem dunklem Rand.
  - `--lift` für Karten und `--pill-shadow` für Pillen (Uhr, Sprüche, Namensschild, Live-Anzeige).
  - Symbole aus `field.ts` bekommen in `ShapeIcon.tsx` einen Glanz (hell oben, Schatten unten).
- **Formen:** Blatt, Sprühflugzeug und acht Symbole (Mango, Blatt, Kiste, Korb, Leiter, Sonne, Baum, Stern) als Pfade
  in `field.ts`, dazu Bausteine für Hügel, Kronen (`blobs`) und Furchen (`furrows`). Die Kulisse selbst ist eine
  SVG-Illustration in `Field.tsx`, der Pflücker eine in `Picker.tsx`.
- **Bewegung:** Fallen, Plopp, Gleiten, Blende oder keins; Bäume wiegen sich, Wolken ziehen, Sonnenstrahlen drehen sich
  langsam; Einschalten als Sonnenaufgang.
- **Szenen:**
  - Starting, BRB, Ending: Feld je Tageszeit mit Himmel, Sonne mit Schein, Wolken, Hügeln, bis zu drei Baumreihen in
    der Tiefe, Furchen, Grasbüscheln, Vögeln und Kisten (Kanalname auf der Kiste). Schild und Countdown auf
    Milchglas-Karten, Überzeile als blattgrüne Pille mit Mango-Punkt. Fortschritt als Korb, der sich füllt, oder als Ast.
    Ticker am Sprühflugzeug (Stoffbanner) oder als Holzleiste.
  - Pflücker: illustriert ohne Umrisse, Strohhut mit Band, Bambusstab, geflochtener Korb, Schatten auf der Erde.
    Greift beim Starting nach oben, pflückt beim BRB, winkt beim Ending mit vollem Korb. Namensschild als Pille.
  - Alerts: Papiermedaillon mit Symbol; Kiste, Milchglas-Zettel mit Klebestreifen oder zweifach geflochtener Korb;
    Blätter-Konfetti, Saftspritzer, Restzeit als schattierter Ast.
  - Chat: Erntezettel, Bretter am Baumstamm oder Mangoblätter.
  - Kamera: Rahmen als Kiste, Holz oder Seil, von oben beleuchtet mit Innenkante; Mangoblätter und Mango mit Schatten.
  - Musik: Transistorradio mit Glanz und eingelassenem Display, beleuchtete Kiste oder dunkles Milchglas; Ranke und
    Equalizer schattiert.
  - Effekte: Text auf einem Milchglas-Zettel. Befehlsseite: Milchglas-Karten vor dem Feld.
- **Minimes:** Mango-Soldaten mit Gesicht, Helm und der Waffe ihrer Rolle (Sturmgewehr, Sanitätstasche mit Kreuz, LMG,
  Scharfschützengewehr, Granatwerfer). Sie hüpfen mit der Hüpf-Bewegung des Kerns.
  Animationen: Nachladen, Helm richten, Umschauen, Schlafen, Freudensprung bei Chat.
  Gefechte: Zielen, Mündungsfeuer, Explosion beim Grenadier, Saftspritzer, Umkippen mit Kreuzchen-Augen,
  ein Kreuz steigt beim Wiederbeleben auf. Kein Blut.
- **Stinger:** eine glänzende Mango mit weichem Schatten fällt ins Bild, wächst, bis sie das Bild füllt, zeigt Text und
  schattierte Blätter mit Ader, fällt unten heraus.
- **Banner:** Mangofeld am Tag mit Kanalnamen, Offline-Banner am Abend mit beleuchtetem Kistenschild; Sonne mit Schein,
  Hügel in Luftperspektive, dreitönige Kronen, Furchen zum Horizont.

## Dashboard-Skin (`data-skin="plantage"`)

- **Schrift:** Baloo 2 für Text, Fredoka für Überschriften und das Titel-Kistenetikett. Beide rund und freundlich,
  Kontrast über Gewicht 700 und die zweite Familie.
- **Farbe:**
  - Hinter dem Dashboard steht die Kulisse der Szenen (`Field.tsx`, Mittag, Standardeinstellungen).
  - Milchglas-Karten aus Erntepapier (`#fff6df` zu 88 %) mit braunem Text `#3a2410`, gedämpft `#8a5a2b`.
  - Signatur Blattgrün `#2e7d32` (`--accent`, weiße Schrift 5.1:1) für Primärknopf und aktiven Tab.
  - Mango-Orange `#b24d00` (`--emph`, 4.9:1) für Hervorhebungen, `#ff8c1a` als Fokus.
- **Raum:** luftig, mittlere Radien (`--radius` 18px, Knöpfe 12px).
- **Abschluss:** weiche, versetzte Schatten und eine Lichtkante oben statt harter Holzschatten. Titel als Kistenetikett
  aus beleuchteten Brettern. Login-Zeile und Benutzer als Milchglas-Pille, damit sie vor dem Himmel lesbar bleiben.
- **Szenerie:** die illustrierte Kulisse, die fünf Mango-Soldaten in der Titelzeile.

## Modernisierung (entschieden 2026-10-21)

Abgenommene Prototypen: [refs/starting.html](refs/starting.html), [refs/alert.html](refs/alert.html) mit Standbildern.
Plan: [PLAN-PLANTAGE.md](PLAN-PLANTAGE.md) Packages 2 bis 5. Die Bildsprache "Illustration mit Tiefe" bleibt; gezeichnet
wird mit PixiJS, bewegt mit GSAP.

- **Tiefe:** die Welt besteht aus Ebenen (Wolken, zwei Hügel, drei Baumreihen, Feld, vordere Bäume, Kisten, Gras);
  ferne Ebenen sind unscharf und mischen sich mit dem Himmel, die Kamera schwenkt langsam (Parallax).
- **Licht:** Einschalten als Sonnenaufgang (Himmel von Dämmerung zu Morgen, die Welt hellt auf, Strahlen drehen sich),
  Ending als Sonnenuntergang mit Glühwürmchen.
- **Leben:** Bäume und Gras wiegen sich, Blätter fallen, Lichtstaub glitzert; der Pflücker greift mit dem Stab in den
  Baum (Starting), pflückt (BRB), winkt mit vollem Korb (Ending).
- **Karten:** Milchglas fällt wie reife Früchte herein und federt nach (`federnd`); Mangos plumpsen als Fortschritt in
  den Korb.
- **Alerts:** eine glänzende Mango fällt auf das Papiermedaillon, staucht sich und federt nach, Saft und Blätter
  spritzen, die Karte wächst aus dem Medaillon, der Ast verliert als Restzeit seine Blätter. Zwischen Medaillon und
  Text mindestens 48 px; das Ganze steht mittig.

## Im Code

`.theme-plantage`, Klassen `pl-*`, Keyframes `plantage-*` und `plantage-minime-*`, Dateien in `src/themes/plantage/`.
