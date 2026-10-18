# Design: Urlaub

Charakter: Strand und Ferien. Himmel, Meer und Sand als Welt, Holzschilder als Träger für Text, alles freundlich rund.
Grundsätze für alle Themes: [DESIGN.md](../../../../DESIGN.md). Plan des Themes: [PLAN-URLAUB.md](PLAN-URLAUB.md).

## Dashboard-Skin (`data-skin="urlaub"`)

- **Schrift:** Nunito für Text, Baloo 2 für Überschriften, Pacifico nur im Titel-Holzschild. Warum: Pacifico ist
  Schmuck; als Text wäre es schwer lesbar.
- **Farbe:**
  - Strand als Seite (`--page`: Himmel, Meer, Sand), cremige Karten `#fff8ea` mit braunem Text `#3b2412` (13.7:1),
    gedämpft `#7a5536` (6.3:1).
  - Signatur Meerblau `#0b6f8e` (`--accent`, weisse Schrift 5.7:1) für Primärknopf und aktiven Tab.
  - Hibiskus `#c2185b` (`--emph`, 5.6:1) für Hervorhebungen, `#ff4f8b` als Fokus.
- **Raum:** luftig, grosse Radien (`--radius` 22px, Knöpfe rund).
- **Abschluss:** Holzrand (2px `#d39a5c`) und Holzschatten unter Knöpfen und Karten. Titel als Holzschild.
- **Szenerie:** Sonne, Palmen links und rechts, fünf Strandsachen in der Titelzeile.

## Overlays

- **Farben (Standards in `settings.ts`):**
  - Text `#ffffff`, Text auf Holz `#3b2412`, Holz `#d39a5c` und `#8a5527`.
  - Meer `#1fb5c9` und `#0b6f8e`, Gischt `#f4fffd`, Sand `#f2d49b` und `#d9b26f`, Palme `#2e9e4f` und `#8b5a2b`.
  - Akzent Hibiskus `#ff4f8b`, zweiter Akzent Mango `#ffa62b`.
  - Himmel je Tageszeit (Morgen, Mittag, Abend, Nacht) mit eigenen Verläufen, Sonne `#ffd23f`, Mond `#f5f1d6`.
- **Schrift:** Fredoka für Text, Pacifico für Titel (beide in der Auswahl austauschbar).
- **Formen:** Holzbretter mit Fugen, runde Ecken, Seilmuster (`--rope-pattern`).
- **Bewegung:** Welle, Plopp, Gleiten, Blende oder keins; Einschalten als Sonnenaufgang.
- **Szenen:**
  - Starting, BRB, Ending: Strand je Tageszeit (Wellenschichten, Palmen, Boot, Möwen, Muscheln, Kanalname im Sand),
    Holzschild hängend oder am Pfahl, Fortschritt als Welle oder Seil mit Boje, Ticker am Flugzeug oder als Leiste.
  - Alerts: Postkarte mit Stempel, Surfbrett auf einer Welle oder Flaschenpost; Hibiskus-Konfetti, Wasserspritzer,
    Restzeit als Seil.
  - Chat: Luftblasen, Planken oder Muscheln.
  - Kamera: Rahmen aus Bambus, Holz oder Seil, Palmblätter in den Ecken, Hibiskusblüte.
  - Musik: Strandradio aus Holz, Muschel oder schlicht, Wellen-Equalizer.
  - Befehlsseite: Holzschilder vor dem Strand.
- **Minimes:** 16 Strandsachen mit Gesicht (Rettungsring, Badeente, Wasserball, ...), Farben je Typ einstellbar, hüpfen
  mit der Hüpf-Bewegung des Kerns. Animationen: Freudensprünge, Pirouette, Wackeln, Sonnenbrille, Umschauen, Schlafen,
  Wasserspritzer bei Chat.
- **Stinger:** eine Welle mit Gischt rollt herein, deckt am Übergangspunkt alles, zeigt Text und Palme.
- **Banner:** Strandpanorama am Tag, Offline-Banner im Sonnenuntergang mit Holzschild.

## Im Code

`.theme-urlaub`, Klassen `ul-*`, Keyframes `urlaub-*` und `urlaub-minime-*`, Dateien in `src/themes/urlaub/`.
