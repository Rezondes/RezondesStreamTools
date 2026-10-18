# Design: King of the Hill

Charakter: militärisch nach dem KOTH-Modus aus Arma 3, Arma Reforger und Wardogs. Ein Hügel mit Funkmast und Flagge in
der Mitte, drei Fraktionen kämpfen darum; Oliv, Sand und Stahl, Schablonenschrift, Funkgeräte und Lagekarten.
Grundsätze für alle Themes: [DESIGN.md](../../../../DESIGN.md). Plan des Themes: [PLAN-KOTH.md](PLAN-KOTH.md).

## Dashboard-Skin (`data-skin="koth"`)

- **Schrift:** Inter für Text, Black Ops One (Schablone) für Titel. Titel, Labels und Knöpfe in Grossbuchstaben
  (`--title-case`, `--label-case`, `--btn-case`). Kontrast über die Schablonenschrift, nicht über Grösse.
- **Farbe:**
  - Dunkles Oliv `#171a0e` als Seite mit einem Hügelschein unten (`--page`).
  - Karten `#22261a` mit Text `#e9e4d0` (12.1:1), gedämpft `#a8a58f` (6.2:1).
  - Signatur Signal-Orange `#ff8a1f` (`--accent`) mit dunkler Schrift `#1d1d1d` (7.2:1) für Primärknopf und aktiven Tab.
  - Funk-Grün `#7cff6b` (`--emph`, `--focus`, 12.0:1) für Hervorhebungen und Fokus.
- **Raum:** dicht.
- **Abschluss:** 2px-Linien in Oliv (`#4b5320`), fast eckig (`--radius` 4px), keine Holzschatten. Titel auf einer
  Oliv-Platte mit Warnstreifen (Orange und Schwarz) an der Unterkante.
- **Szenerie:** der Hügel mit Funkmast am unteren Rand, je ein Soldat jeder Fraktion in der Titelzeile.

## Overlays

- **Farben (Standards in `settings.ts`):**
  - Text `#f2f0e6`, Oliv `#4b5320` und `#2f3416`, Sand `#c2b280` und `#8f7f55`, Stahl `#3c4146`.
  - Papier `#e9e4d0` mit Schrift `#23251c`, Akzent Signal-Orange `#ff8a1f`, zweiter Akzent Funk-Grün `#7cff6b`.
  - Himmel je Tageszeit, Berge `#6b7280`, Hügel `#6b7a3a` mit Schattenseite `#4a5628`, Blinklicht `#ff3b30`.
  - Fraktionen BLUFOR `#2f6fd6`, OPFOR `#d63a2f`, INDFOR `#3a9a3a` (Name, Farbe und Chat-Namen einstellbar).
- **Schrift:** Inter für Text, Black Ops One für Titel (Auswahl: Stardos Stencil, Share Tech Mono, Inter).
  Share Tech Mono für Anzeigen (Countdown, Funkdisplay, Uhr, Funkprotokoll).
- **Formen:** Hügel, Funkmast, Flagge, Sandsäcke, Tarnnetz, Rauchsäule, Hubschrauber und acht Symbole (Helm, Abzeichen,
  Stern, Kiste, Fallschirm, Granate, Funkgerät, Flagge) als Pfade in `hill.ts`.
  Warnstreifen (`--stripes`), Stahlplatten (`--steel-plate`).
- **Bewegung:** Funkrauschen (abgehackt, `steps`), Plopp, Gleiten, Blende oder keins; Texte erscheinen wie getippt.
  Einschalten als Funkspruch-Rauschen.
- **Szenen:**
  - Starting, BRB, Ending: Kulisse je Tageszeit mit Bergen, Rauch, Hügel, Funkmast mit Blinklicht, Flagge, Sandsäcken,
    Tarnnetzen und Staub.
    Davor die Einsatzbesprechung als Lagekarte (Papier mit Raster, Markierungen, Klebestreifen).
    Countdown als grünes Funkdisplay, Fortschritt als Warnstreifen-Balken oder Signalbalken.
    Sprüche als Funkzeilen, Ticker am Hubschrauber oder als Stahlleiste.
  - Alerts: Funkspruch (Stahlgehäuse, grünes Display), Akte oder Schild mit Warnstreifen; Rufzeichen, Funkrauschen
    beim Einblenden, Restzeit als Warnstreifen.
  - Chat: Funkprotokoll mit Zeitstempel, als grünes Display, auf Papier getippt oder schlicht.
  - Kamera: Helmkamera (Stahlrahmen, Ecken, Akku, REC), Zielfernrohr (runde Sicht) oder schlicht, optional Fadenkreuz.
  - Musik: Feldfunkgerät (Oliv mit Nieten, Antenne, grünes Display), Munitionskiste oder schlicht;
    Fortschritt als Frequenzskala, Signalanzeige als Equalizer.
  - Effekte: Text auf einem Funkzettel. Befehlsseite: Einsatzblätter vor dem Hügel.
- **Minimes:** kleine Soldaten mit Helm, Uniform in Fraktionsfarbe (`--team`) und Waffe je Rolle.
  Sie stehen auf festen Plätzen, ohne Laufen und Hüpfen; zurück zum Platz und der Weg des Medics sind ein Kriechen.
  Animationen auf der Stelle: Anvisieren, Nachladen, Deckung, Hinlegen, Umschauen, Salutieren, Jubeln bei Chat.
  Gefechte nur zwischen Fraktionen: Mündungsfeuer, Explosion beim Grenadier, Staubwolke, Umfallen mit Kreuzchen-Auge.
  Oben eine Anzeige, welche Fraktion den Hügel hält (Flagge in Fraktionsfarbe), bei Gleichstand blinkende Warnstreifen.
- **Stinger:** eine Rauchgranate füllt das Bild, im Rauch wechselt die Flagge von der ersten zur zweiten Fraktion.
- **Banner:** Hügel mit Funkmast und wehender Flagge am Tag, Offline-Banner am Abend mit Einsatzblatt.

## Im Code

`.theme-koth`, Klassen `kh-*`, Keyframes `koth-*` und `koth-minime-*`, Dateien in `src/themes/koth/`.
