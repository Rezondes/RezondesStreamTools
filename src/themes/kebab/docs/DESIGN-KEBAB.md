# Design: Kebab

Charakter: Dönerbude als rote Strichzeichnung auf Papier: Koch, Spieß und Bogenschrift zeichnen sich selbst, Bons
kommen aus dem Drucker, Papier faltet sich. Grundsätze für alle Themes: [DESIGN.md](../../../../DESIGN.md). Plan des
Themes: [PLAN-KEBAB.md](PLAN-KEBAB.md).

## Bildsprache

Alles ist **einfarbiger Druck**: rote Linien auf hellem Papier, wie auf Imbiss-Verpackung gedruckt. 2D, keine 3D-Welt.

**Referenzen** in [refs/](refs/):

- [logo.jpg](refs/logo.jpg): das gedruckte Imbiss-Logo, Vorlage für Stil und Aufbau. Übernommen werden die
  Strichführung (eine Farbe, gleichmässige mittelstarke Linie, keine Flächen, keine Schatten), die Bogenschrift aus
  hohlen, gerundeten Buchstaben über der Szene, der Aufbau Koch links, Spieß rechts, Messer quer davor, Theke als Linie,
  Teller darunter, und das Fleisch aus vielen kurzen Schraffur-Strichen. Der Koch ist neu gezeichnet (eigenes Gesicht,
  eigene Haltung), kein Nachbau.
- Abgenommene Prototypen (2026-10-23), Massstab für Komposition, Linie und Bewegung; jede gebaute Szene wird neben
  ihnen gerendert: [starting.html](refs/starting.html), [alert.html](refs/alert.html) (`?variant=bon`, `?variant=tuete`),
  [stinger.html](refs/stinger.html) (`?variant=papier`, `?variant=messer`). Standbilder mit `?t=<sekunden>`, die
  abgenommenen Standbilder liegen daneben als PNG.

**Linie:**

- Jede Kontur ist ein Rough.js-Pfad mit festem Startwert: Rauheit 0.55, Bogen 0.6, ohne Doppelstrich. Das wirkt wie
  von Hand gezeichnet und gedruckt, nie wie eine Skizze. Gleicher Startwert, gleiche Linie (Szene und Clip).
- Stärke im 600 x 520-Raster des Logos: Umrisse 3, Details 2.4, Spieß und Theke 3.4 bis 3.6, Schraffur 2. Enden und
  Ecken rund.
- Farbe der Linie: Signatur `red`. Auf Kraftpapier (Tüte) `redText`, weil `red` dort zu schwach ist.
- Flächen gibt es nur als Papier: Teile, die etwas verdecken (Mütze, Arm, Fleisch, Klinge), haben eine Füllung in der
  Papierfarbe, damit Linien dahinter verschwinden.

**Formen (Raster 600 x 520, Koordinaten als Daten in `chef.ts`):**

- **Bogenschrift:** Buchstaben auf einem Kreisbogen (Mittelpunkt 300/640, Radius 470, Winkel 66 Grad), breite Buchstaben
  bekommen mehr Winkel. Schrift Titan One, Füllung Papier, Kontur `red` 4 px (`paint-order: stroke`).
- **Koch:** Kochmütze mit drei Bauschen und Band, ovaler Kopf mit Ohren, Brauen, Augen als Bogen mit Punkt, Nase als
  Haken, grosser geschwungener Schnurrbart, Lächeln, Fliege, Jacke mit zwei Knopfreihen zu je drei Knöpfen. Rechter Arm
  angewinkelt vor dem Körper, die Hand hält das Messer.
- **Spieß:** T-Griff oben, Stange, Fleischkegel (oben breit, Mitte am breitesten, unten schmal) mit Schraffur aus
  kurzen Wellenstrichen in 32 Reihen. Die Schraffur wiederholt sich alle 42 Einheiten; sie seitlich zu schieben lässt
  den Spieß sich drehen, ohne Naht.
- **Messer:** Griff und lange schmale Klinge, schräg nach rechts oben durch das Fleisch.
- **Theke und Teller:** waagerechte Linie, darunter ein Teller aus zwei Ellipsen.
- **Bon:** weisses Papier `bon`, unten gezackt, gestrichelte Trennlinien, Drucker als dunkler Balken mit Schlitz.
- **Tüte:** Kraftpapier `kraft`, oben gezackt, Seitenfalten als Linien, Aufdruck mit kleiner Bogenschrift und Spieß.
- **Einwickelpapier:** Papier mit gestreutem Aufdruck kleiner Spieße (je Kachel 220 px zwei Spieße, leicht gedreht).

## Figuren

**Koch** (Starting, BRB, Banner, Skin-Szenerie): Teile als getrennte Gruppen, damit sie sich bewegen: Mütze, Augen,
Schnurrbart, Arm mit Messer, Körper.

- Sägen: der Arm dreht um die Schulter (plus minus 2.6 Grad) und schiebt entlang der Klinge (5 Einheiten), Tempo 5.2
  je Sekunde.
- Mütze wippt (1.6 Grad), Schnurrbart zuckt ab und zu, Blinzeln alle 4.2 s für 0.12 s.
- BRB: der Arm hält ein Teeglas statt des Messers, das Messer liegt auf der Theke; aus dem Glas steigt Dampf.

**Minimes:** vier Imbiss-Gerichte als kleine Figuren in derselben Linie, mit Gesicht (Augen als Bogen mit Punkt,
Lächeln) und Füsschen:

| Typ | Form | eigene Bewegung |
|---|---|---|
| Döner | Brot-Tasche mit Füllung oben | dreht sich, Soße spritzt |
| Dürüm | gerollter Wrap, schräg angeschnitten | rollt sich auf und wieder zu |
| Lahmacun | flacher Fladen, aufgestellt | wird gefaltet, klappt wieder auf |
| Pommes | Tüte mit Stäbchen | Stäbchen wackeln, eins fliegt hoch |

Alle laufen mit Hüpfen (Kern), winken und reagieren auf Chat mit einem Sprung und einer Dampfwolke. Türme aus dem Kern
sind ein **Tellerstapel**: Lahmacun unten, Dürüm in der Mitte, Pommes oben. Gefechte und Fraktionen gibt es nicht.

## Overlays

- **Farben (Standards in `settings.ts`):**
  - Signatur Logo-Rot `red` `#f85449`: Linien, Bogenschrift, alles Gezeichnete.
  - Textrot `redText` `#c8261b`: Name, Countdown, Überzeilen, Laufband-Fläche, Stempel.
  - Papier `paper` `#fff8ec` (Hintergrund der Vollbild-Szenen, Füllungen), Bon `bon` `#fffdf8`, Kraftpapier `kraft`
    `#f9ebd6`.
  - Text dunkel `brown` `#3a1a12` (auch Drucker und Rollladen), gedämpft `muted` `#8a5a4a`.
  - Dampf über dem Spiel `steam` `#fff8ec`; Dampf auf Papier in `red` mit wenig Deckkraft.
  - Zwischentöne (Rand des Papiers, Schatten) per `color-mix` aus diesen Farben, keine eigenen Literale.
- **Kontraste (gerechnet):**
  - `brown` auf `paper` 14.9:1, auf `bon` 15.5:1, auf `kraft` 13.4:1.
  - `muted` auf `paper` 5.5:1, auf `bon` 5.7:1, auf `kraft` 4.9:1.
  - `redText` auf `paper` 5.3:1, auf `bon` 5.5:1, auf `kraft` 4.8:1.
  - `paper` auf `redText` 5.3:1 (Laufband, Knopf).
  - `red` gegen `paper` 3.1:1 und gegen `bon` 3.3:1: Signatur, reicht für Linien, nie für Text.
  - `red` gegen `kraft` 2.8:1: darum auf der Tüte `redText`.
  - Das Kraftpapier `#f3dfc1` aus dem Prototyp schafft mit `redText` nur 4.3:1 und ist darum auf `#f9ebd6` aufgehellt.
- **Schrift:** zwei Familien. Titan One (rund, fett) für Bogenschrift, Name, Countdown und Gerichte; Nunito (600, 800,
  900) für alles andere. Kontrast über die zweite Familie und die Grösse; Überzeilen in Nunito 900 mit 4 bis 5 px
  Sperrung, Zitate Nunito 600 kursiv.
- **Flächen:** eine Trennsprache: Papier. Bons, Tüten, Zettel und Schilder sind Papierstücke mit gezacktem oder geradem
  Rand und einem weichen Schatten nach unten (über dem Spiel); innen trennen gestrichelte Linien.
- **Bewegung:**
  - Linien zeichnen sich (`drawSVG`), Füllungen blenden kurz nach.
  - Buchstaben der Bogenschrift springen einzeln herein (Skalierung von 0, `back.out`).
  - Bons kommen ruckweise aus dem Drucker (`steps(14)` bis `steps(16)`).
  - Stempel knallen auf: von 2.6-facher Grösse in 0.18 s auf 1, danach wackelt das Papier kurz.
  - Fleischspäne, Zwiebelringe und Dampf sind PixiJS-Teilchen als reine Funktion der Zeit.
  - Vollbild-Szenen schalten sich ein wie Neonröhren: eine dunkle Fläche flackert zweimal und verschwindet.
  - Alle Zeiten, Mengen und Häufigkeiten sind Einstellungen, jedes Element einzeln abschaltbar.
- **Szenen:**
  - **Starting** (Prototyp `starting.html`): Papier, Licht flackert an, Bogenschrift springt herein, Koch, Spieß, Messer,
    Theke und Teller zeichnen sich; danach sägt der Koch, Späne fallen und häufen sich auf dem Teller, Dampf steigt.
    Rechts der Bestellbon unter einem Drucker: Ladenname, Bestellnummer, drei Posten, "FERTIG IN" mit Countdown in
    Titan One, Dankeszeile. Unten ein Laufband in `redText` mit Sprüchen.
  - **BRB:** dieselbe Bude, der Koch macht Pause (Teeglas statt Messer, das Messer liegt auf der Theke), der Spieß dreht
    allein weiter. Ein Schild hängt am Spieß ("BIN GLEICH ZURÜCK"), der Bon zeigt die Pausenzeit.
  - **Ending:** "Laden zu": ein Rollladen in `brown` mit grosser Bogenschrift in `paper` fährt herunter, davor der Bon
    "Tagesabschluss" mit den echten Zahlen des Streams (Kern-Statistik, zählt hoch), ein Stempel "BEZAHLT" knallt drauf,
    Titel "Danke und bis morgen!".
  - **Alerts** (Prototyp `alert.html`): Standard **Bon** ohne Koch: Drucker fällt herein, der Bon kommt ruckweise heraus
    (Laden, Bestellnummer, Art, Gericht, "für", Name in Titan One, Spruch, Posten mit "gratis"), der Stempel "MIT ALLES"
    knallt **oben rechts** auf das Papier mit Zwiebelringen und Fleischstücken. Der Stempel ist Teil des Papiers
    (`mix-blend-mode: multiply`): er wackelt, kippt, fällt und blendet mit dem Bon aus. Variante **Tüte**: Tüte fällt und
    federt nach, Aufdruck springt herein, Name, Spruch, Dampf. Je Alert-Art ein eigenes Gericht (Follow Döner, Sub Dürüm,
    Resub Dönerteller, Gift Runde für alle, Raid Familienplatte, Bits Extra-Soße, Kanalpunkte Ayran, Hype Train
    Grillparty).
  - **Chat:** Nachrichten als kleine Bestellzettel (Name in `redText`, Text in `brown`), Varianten zettel, liste, schlicht.
  - **Kamera:** Imbissfenster: Rahmen aus Linien, oben eine Markise mit Bögen und Streifen in `red`, unten die Theke mit
    Namensschild.
  - **Musik:** Kassenbon "Läuft gerade" mit Titel und Künstler als Lauftext, Cover optional, Fortschritt als Strichlinie.
    Varianten bon, schild, schlicht.
  - **Effekte:** transparent, Kern-Baustein für Medien, optionaler Text in Titan One.
  - **Befehlsseite:** Speisekarte: Papier, Bogenschrift oben, jeder Befehl ein Gericht mit gestrichelter Linie zur
    rechten Spalte mit dem Befehl.
- **Minimes:** siehe Figuren; sie laufen auf einer Thekenlinie am unteren Rand (transparent).
- **Stinger** (Prototyp `stinger.html`, 1.6 s, Übergang bei 0.8 s): Standard **Papier**: vier Klappen Einwickelpapier
  falten sich von den Rändern zur Mitte, Bogenschrift und grosser Spieß erscheinen; am Übergangspunkt ist das Bild ein
  einziges Stück Papier ohne Naht (die Hälften bekommen ihren Schatten erst beim Reissen); danach reisst es in der Mitte
  gezackt auf, beide Hälften fliegen zur Seite. Variante **Messer**: ein langes Messer schneidet diagonal, rote
  Fleischscheiben mit heller Schraffur schieben sich dahinter von links ins Bild, Späne fliegen; am Übergangspunkt ist
  alles rot mit der Bogenschrift in Papier; danach fallen die Scheiben herunter.
- **Banner** (Standbilder als PNG): Profil: Koch und Spieß mit Bogenschrift und dem Ladennamen auf Papier, Dampf über
  dem Spieß. Offline: Rollladen unten mit "Heute geschlossen", Dampf steigt darunter hervor.
- **Töne:** mit der earshot-Bibliothek erzeugte Klänge (Kasse klingelt, Stempel, Papier reisst, Messer schabt, Grill
  brutzelt, Plopp), ausgeliefert als Dateien des Themes, jeder Ton einzeln abschaltbar und durch eine eigene Datei
  ersetzbar.

## Dashboard-Skin (`data-skin="kebab"`)

- **Schrift:** Nunito für alles, Titel und Überschriften in Titan One.
- **Farbe:**
  - Seite `paper` `#fff8ec`, Karten `bon` `#fffdf8`, Felder `#ffffff`.
  - Text `brown` (15.5:1 auf Karte), gedämpft `muted` (5.7:1 auf Karte, 5.8:1 auf Feld).
  - Signatur `redText` `#c8261b` für Primärknopf und aktiven Tab, Schrift darauf `paper` (5.3:1), gegen Karte 5.5:1.
  - Hervorhebung `red` `#f85449` nur als Linie und Unterstrich (3.3:1 gegen Karte), nie als Text.
  - Fokusring `brown` (15.5:1 auf Karte).
  - Fehler Blau `#1d5fa6` (6.4:1 auf Karte, Schrift Weiss darauf 6.5:1), deutlich anders als die rote Signatur.
- **Raum:** luftig: Karten mit viel Innenabstand wie ein Bon, eng innerhalb einer Gruppe.
- **Abschluss:** Papier: Karten mit gezacktem unteren Rand und weichem Schatten, innen gestrichelte Trennlinien, keine
  Rahmen.
- **Szenerie:** Koch mit Spieß als statische Rough-Linien unten rechts, Bogenschrift oben links; unter 1100 px nur die
  Bogenschrift, unter 720 px keine Szenerie.

## Im Code

`.theme-kebab`, Klassen `kb-*`, Keyframes `kebab-*`, Dateien in `src/themes/kebab/`.
