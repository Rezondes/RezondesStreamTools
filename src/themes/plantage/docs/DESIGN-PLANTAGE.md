# Design: Südfrucht-Plantage

Charakter: eine sonnige Mangoplantage. Baumreihen, Erde und Holzkisten als Welt, der Streamer als Mangopflücker,
Erntezettel als Träger für Text; verspielt, mit Mango-Soldaten als Augenzwinkern.
Grundsätze für alle Themes: [DESIGN.md](../../../../DESIGN.md). Plan des Themes: [PLAN-PLANTAGE.md](PLAN-PLANTAGE.md).

## Dashboard-Skin (`data-skin="plantage"`)

- **Schrift:** Baloo 2 für Text, Fredoka für Überschriften und das Titel-Kistenetikett. Beide rund und freundlich,
  Kontrast über Gewicht 700 und die zweite Familie.
- **Farbe:**
  - Himmel über grünen Feldreihen und Erde als Seite (`--page`).
  - Erntezettel-Karten `#fff6df` mit braunem Text `#3a2410` (13.5:1), gedämpft `#8a5a2b` (5.5:1).
  - Signatur Blattgrün `#2e7d32` (`--accent`, weisse Schrift 5.1:1) für Primärknopf und aktiven Tab.
  - Mango-Orange `#b24d00` (`--emph`, 4.9:1) für Hervorhebungen, `#ff8c1a` als Fokus.
- **Raum:** luftig, mittlere Radien (`--radius` 18px, Knöpfe 12px).
- **Abschluss:** Kistenrand (2px `#c8935a`) und Holzschatten. Titel als Kistenetikett aus Brettern mit orangem
  Stempelrand.
- **Szenerie:** Sonne, Mangobäume links und rechts, die fünf Mango-Soldaten in der Titelzeile.

## Overlays

- **Farben (Standards in `settings.ts`):**
  - Text `#ffffff`, Text auf Holz und Papier `#3a2410`, Holz `#c8935a` und `#7a4a24`, Erntezettel `#fff6df`.
  - Erde `#8b5e3c` und `#5e3b22`, Blätter `#2f8f3a` und `#1d5e27`, Stamm `#6d4c2f`.
  - Mango `#ffb02e` mit Rot `#ff5e3a`, Akzent Mango-Orange `#ff8c1a`, zweiter Akzent Blattgrün `#4caf50`.
  - Himmel je Tageszeit, Sonne `#ffd23f`, Mond `#f5f1d6`, Hügel `#8fbf5a` und `#bcd88a`.
- **Schrift:** Baloo 2 für Text, Fredoka für Titel (Auswahl einstellbar).
- **Formen:** Mangobaum, Wolke, Blatt, Sprühflugzeug, Vögel, Kiste und acht Symbole (Mango, Blatt, Kiste, Korb, Leiter,
  Sonne, Baum, Stern) als Pfade in `field.ts`; Bretter mit Fugen, Erntezettel mit Klebestreifen.
- **Bewegung:** Fallen, Plopp, Gleiten, Blende oder keins; Bäume wiegen sich; Einschalten als Sonnenaufgang.
- **Szenen:**
  - Starting, BRB, Ending: Feld je Tageszeit mit Baumreihen, Hügeln, Wolken, Vögeln und Kisten (Kanalname auf der
    Kiste). Der Pflücker greift beim Starting nach oben, pflückt beim BRB, hat beim Ending den Korb voll.
    Schild hängend oder am Pfahl, Fortschritt als Korb, der sich füllt, oder als Ast mit Mango.
    Sprüche auf Erntezetteln, Ticker am Sprühflugzeug oder als Leiste.
  - Alerts: Kistenetikett mit Stempel, Erntezettel oder Korb; Blätter-Konfetti, Saftspritzer, Restzeit als Ast.
  - Chat: Erntezettel, Bretter am Baumstamm oder Mangoblätter.
  - Kamera: Rahmen als Kiste, Holz oder Seil, Mangoblätter in den Ecken, eine Mango in der Ecke.
  - Musik: Transistorradio auf einer Kiste (Lautsprechergitter, Antenne), Mangokiste oder schlicht; Fortschritt als Ranke.
  - Effekte: Text auf einem Erntezettel. Befehlsseite: Holzschilder vor dem Feld.
- **Minimes:** Mango-Soldaten mit Gesicht, Helm und der Waffe ihrer Rolle (Sturmgewehr, Sanitätstasche mit Kreuz, LMG,
  Scharfschützengewehr, Granatwerfer). Sie hüpfen mit der Hüpf-Bewegung des Kerns.
  Animationen: Nachladen, Helm richten, Umschauen, Schlafen, Freudensprung bei Chat.
  Gefechte: Zielen, Mündungsfeuer, Explosion beim Grenadier, Saftspritzer, Umkippen mit Kreuzchen-Augen,
  ein Kreuz steigt beim Wiederbeleben auf. Kein Blut.
- **Stinger:** eine Mango fällt vom Baum, wächst, bis sie das Bild füllt, zeigt Text und fliegende Blätter, fällt unten heraus.
- **Banner:** Mangofeld am Tag mit Kanalnamen, Offline-Banner am Abend mit Kistenschild.

## Im Code

`.theme-plantage`, Klassen `pl-*`, Keyframes `plantage-*` und `plantage-minime-*`, Dateien in `src/themes/plantage/`.
