# Design: Dogs

Charakter: Pixel-Art-Hunde: sechs Rassen auf einer sonnigen Wiese und im Wohnzimmer, Creme-Schilder mit gestuftem
Pixelrand. Grundsätze für alle Themes: [DESIGN.md](../../../../DESIGN.md). Plan des Themes:
[PLAN-DOGS.md](PLAN-DOGS.md).

## Bildsprache

Zwei Ebenen: eine **Pixel-Welt** (Hunde, Wiese, Zimmer, Requisiten, Stinger, Banner, Minimes) und eine
**Schild-Ebene** (Texte, Karten, Alerts, Chat, Kamera, Musik, Befehlsseite). Beide sprechen dieselbe Sprache: harte
Pixel, eine dunkle Kontur, wenige flache Töne.

**Referenzen:** die abgenommenen Prototypen in [refs/](refs/) (Übersicht `px-index.html`; `pixeldogs.js`,
`pxworld.js`, `pxsheet.html`, `px-starting.html`, `px-alert.html`, `px-brb.html`, `px-ending.html`, `px-stinger.html` und die
Screenshots). Sie sind Massstab für Proportionen, Detailgrad, Farben und Ablauf; jede gebaute Szene wird neben ihnen
gerendert und verglichen. Offen aus den Prototypen und in Package 1 zu lösen: echte Abzeichen statt Farbflächen
(Sattel, Maske, Loh, Flecken), Corgi-Ohren grösser und Hals kürzer.

**Pixel-Welt:**

- **Raster:** Die Welt wird auf einem Pixelraster von 384 x 216 gezeichnet und 5-fach vergrössert (1920 x 1080), ohne
  Glättung. Jede Form liegt auf ganzen Pixeln, auch in Bewegung (Positionen werden gerundet).
- **Kontur:** Jede Figur und jede Requisite hat eine 1 Pixel breite Kontur in Tinte `ink`. Die Kontur entsteht
  automatisch um alles Gefüllte herum.
- **Schattierung:** genau drei Töne je Fläche: Grundton, Licht oben und rechts (Grundton 16 % zu Weiss), Schatten unten
  und links (Grundton 16 % zu Schwarz). Ferne Beine 24 % dunkler. Keine Verläufe auf Figuren.
- **Hunde (Seitenansicht, Blick nach rechts, gespiegelt nach links):** je Rasse ein eigenes Raster
  (Corgi 52 x 34, Shiba 50 x 39, Labrador 60 x 46, Dalmatiner 60 x 50, Dackel 64 x 30, Mops 44 x 36), gebaut aus
  Ellipsen, Polygonen und Rechtecken. Körper aus Hüfte, Rumpf und Brust; Kopf mit Schnauze, Nase 2 x 2, Auge 2 x 2 mit
  Lichtpunkt; Ohren je Rasse (Stehohren Corgi und Shiba, Schlappohren Labrador, Dalmatiner, Dackel, Klappohren Mops);
  Halsband in `accent` mit Marke in `ball`. Schwanz als eigene Ebene in fünf Wedelstufen (Ringelrute bei Shiba und
  Mops). Beine werden je Bild von der Hüfte zum Fuss gezogen (oben Fell, unten Abzeichen-Farbe, Pfote einen Pixel
  breiter).
- **Posen:** stehen, laufen (6 Bilder, diagonale Beinpaare, 1 Pixel Wippen), bellen (Maul auf und zu), liegen (Körper
  abgesenkt, Vorderpfoten vorn), hecheln (Zunge 2 x 2), blinzeln (alle 3.3 s). Jede Pose ist eine reine Funktion der
  Zeit; sie wird einmal als Bild gezeichnet und danach nur noch kopiert (Posen-Cache, im Prototyp 34-mal schneller).
- **Fell:** je Rasse und Fellvariante vier Farben (Grund, Abzeichen, dunkel, Nase). Abzeichen je Muster: weiss (Corgi
  Rot-Weiss), Zobel (dunkler Sattel), Tricolor (schwarzer Sattel), Urajiro (helle Brust, Wangen, Bauch beim Shiba),
  Sesam (gesprenkelt), Loh (Punkte über den Augen, Schnauze, Pfoten), Maske (Mops), Flecken (Dalmatiner, fester Zufall,
  keine Streifen).
- **Wiese:** Himmel als 6 bis 7 Bänder von `sky` zu `skyLow` (kein weicher Verlauf), Pixelwolken (drei Kreise, weiss
  mit hellblauer Unterkante), Hügel als halbe Ellipsen in drei Grüntönen, Bäume (Stamm mit Kontur, vier Kronenkugeln,
  manchmal rote Äpfel), weisser Lattenzaun mit spitzen Pfosten, Wiese `grass` mit heller Oberkante, Grasbüscheln und
  Blumen in Weiss, Gelb, Rosa und Flieder.
- **Zimmer (Ending, Offline):** Wand `night` mit Streifen, Fussleiste, Holzdielen, Fenster mit Nachthimmel, Mond und
  funkelnden Sternen, Bild mit Pfote, Beistelltisch mit Lampe und warmem Lichtkegel, lila Teppich, Körbchen mit rosa
  Kissen (hinterer Rand hinter, geflochtener vorderer Rand vor dem Hund).
- **Requisiten (Sprites):** Ball, Knochen, Frisbee, Leckerli, Herz, Pfote, "Z", Schmetterling (zwei Bilder).

**Schild-Ebene:**

- **Schrift:** Pixelify Sans; Titel mit 5 px Tinten-Kontur rundum und Schatten nach unten.
- **Pixel-Box:** Fläche `cream`, Rand 5 px Tinte mit gestufter Ecke (vier harte Schatten, keine Rundung), innen oben
  5 px Weiss, unten 5 px `edge`, Schatten 15 px nach unten in Tinte mit 28 %. Rote Variante mit `accent`.
- **Pillen:** rote Pixel-Box mit Pfoten-Symbol (5 x 5 Pixel) und gesperrter Grossschrift.
- **Sprechblase:** Pixel-Box mit gestuftem Zipfel unten links.

## Figuren

**Der Hund des Streamers** (`dog`, `coat`, `dogName`): erscheint in Starting (wird gewählt), Alerts, BRB, Ending,
Kamera, Musik, Stinger und Banner. Standard: Corgi Rot-Weiss, "Bello".

| Rasse | Raster | Fellvarianten (Standard zuerst) | Rute |
|---|---|---|---|
| Corgi | 52 x 34 | Rot-Weiss, Zobel-Weiss, Tricolor | Fuchsrute mit weisser Spitze |
| Shiba | 50 x 39 | Rot, Sesam, Schwarz-Loh, Creme | Ringelrute |
| Labrador | 60 x 46 | Gelb, Schwarz, Schokobraun | Otterrute |
| Dalmatiner | 60 x 50 | Schwarz getupft, Leberbraun getupft | lang, dünn |
| Dackel | 64 x 30 | Rot, Schwarz-Rot, Schoko-Rot | dünn |
| Mops | 44 x 36 | Beige, Apricot, Schwarz | Ringelrute eng |

**Minimes:** jeder Chatter ist ein Pixel-Hund in Minime-Grösse; der Typ ist die Rasse (Befehl `!rasse`), die
Fellvariante kommt fest aus dem Login (`hash`). Eigene Animationen: bellen, schnüffeln (kleine Staubwolke an der Nase),
hinlegen und schlafen (mit "Z"), wedeln, wenn der Chatter schreibt. Laufen mit der Lauf-Pose, ohne Hüpfen. Keine
Fraktionen, keine Gefechte, keine Türme.

## Overlays

- **Farben (Standards in `settings.ts`):**
  - Schild `cream` `#fff6e6`, Kante `edge` `#e9d2bd`, Tinte `ink` `#2e1d14`.
  - Text `textColor` `#4a3426`, gedämpft `muted` `#7a5a46`.
  - Signatur Halsband-Rot `accent` `#c24535`: das, was man finden muss (Pillen, Namen im Alert, Countdown, Marker,
    Halsband). Im Prototyp `#c94a3a`, das schafft mit Creme-Schrift nur 4.33:1.
  - Zweiter Akzent Ball-Gelb `ball` `#ffd23f`: Badge, Ball, Hundemarke, Sterne.
  - Welt: `sky` `#9fd6ff`, `skyLow` `#e3f5ff`, `grass` `#86c45f`, `night` `#3b3a63`, `nightSub` `#f1dcc0`, `rug`
    `#8f6fc7`, `lamp` `#ffe9a8`, Kissenfarben der sechs Plätze.
  - Hunde: je Rasse und Variante `base`, `mark`, `dark`, `nose` (Standards aus den Prototypen), dazu gemeinsam
    `dogEye` `#1d1412`, `dogTongue` `#e98a95`.
  - Zwischentöne (Licht, Schatten, ferne Beine, Schatten der Box) entstehen aus diesen Farben, nie als eigene Literale.
- **Kontraste (gerechnet):**
  - Text `#4a3426` auf `cream` 10.8:1, auf `edge` 8.0:1, auf `sky` 7.5:1, auf `ball` 8.0:1.
  - Gedämpft `#7a5a46` auf `cream` 5.8:1; auf `edge` nur 4.3:1, dort darum nur `textColor`.
  - Signatur `#c24535` als Text auf `cream` 4.7:1, Creme-Schrift auf der Signatur 4.7:1; gegen `edge` 3.4:1 (Fläche ab
    3:1 erfüllt). Auf `night` nur 2.1:1: im Zimmer keine rote Schrift, nur rote Flächen mit Creme-Schrift.
  - `cream` auf `night` 9.9:1, `nightSub` auf `night` 8.0:1, `ball` auf `ink` 11.2:1.
  - `cream` auf `sky` nur 1.5:1: Titel über dem Himmel immer mit Tinten-Kontur (Creme auf Tinte 15.0:1).
- **Schrift:** nur Pixelify Sans (400 bis 700), neu in `index.html`; im Feld `font` wählbar mit VT323 (schon geladen)
  und Silkscreen (neu). Kontrast über Grösse und Gewicht: Titel 700 und 84 bis 116 px mit Kontur, Pillen 600 und 26 px
  mit 3 px Sperrung, Etiketten 600 und 22 px gesperrt, Sätze 500 bis 600.
- **Flächen:** eine Trennsprache: die Pixel-Box (gestufter Tintenrand plus harter Schatten nach unten). Keine Rundung,
  keine weichen Schatten.
- **Bewegung:**
  - Alles springt auf ganze Pixel (Positionen in Vielfachen von 5 px), Einblendungen mit Überschwingen, auch in
    Pixelstufen.
  - Abläufe mit vielen Schritten (Starting, Alert, Ending) als GSAP-Timeline über `useTimeline`; Hunde, Requisiten und
    Teilchen (Herzen, "Z", Staub, Funken) auf einer PixiJS-Bühne (`PixiStage`) mit Texturen ohne Glättung.
  - Alle Zeiten, Häufigkeiten und Mengen sind Einstellungen, jedes Element einzeln abschaltbar.
- **Szenen:**
  - **Starting:** Wiese mit Hügeln, Bäumen, Zaun und ziehenden Wolken; die sechs Hunde fallen nacheinander auf
    Pastell-Kissen in einer Reihe; ein roter Pfoten-Marker hüpft über die Köpfe (Hunde bellen, wenn er über ihnen ist),
    landet auf dem Hund des Streamers, Herzen platzen, er springt, läuft zum roten Teppich vorn in der Mitte und bellt
    "Wuff!"; dann fährt die Karte "HEUTE AN MEINER SEITE" mit Name und Rasse ein. Oben Pille "RUDEL-STREAM", Titel
    "Gleich geht's los!", Unterzeile; unten links Countdown-Box.
  - **BRB:** seitlich scrollende Wiese mit Parallaxe (Wolken, Hügel, Bäume, Zaun, Weg); der Hund läuft an der Leine
    (Leine hinter dem Hund aus dem Bild nach oben rechts), bleibt alle 9 s stehen und schnüffelt ("Schnüff!"), ein
    Schmetterling kreist um den Kopf. Karte oben links "GASSI-PAUSE / Bin gleich zurück!", oben rechts Pausenzeit und
    Schritte.
  - **Ending:** Zimmer bei Nacht; der Hund läuft von rechts herein, legt sich ins Körbchen und schläft, "Z" steigen auf,
    die Lampe wird dunkler. Titel "Gute Nacht!", Unterzeile, rote Pille "Bis zum nächsten Mal!", Karte "HEUTE IM RUDEL"
    mit echten Zahlen des Streams.
  - **Alerts (transparent):** der Hund rennt mit dem Spielzeug der Alert-Art ins Bild (Ball, Knochen, Frisbee,
    Leckerli), lässt es hüpfend fallen, bellt, die Karte mit roter Pille, Name in Rot und Zeile springt ein; er hebt das
    Spielzeug auf und rennt hinaus. **Raid:** für jeden Raider läuft ein weiterer Hund (zufällige Rasse und
    Fellvariante, vier Laufspuren, leicht verschiedene Tempi) hinter dem Hund des Streamers durchs Bild, höchstens
    `raidMaxOnScreen` gleichzeitig und höchstens `raidMaxDogs` insgesamt; ein grosser Raid dauert entsprechend länger,
    der Hund wartet mit der Karte und bellt alle 5 s. Die Karte steht oberhalb der Laufbahn, damit kein Kopf
    verdeckt wird.
  - **Chat:** Nachrichten als Pixel-Schilder; links neben jedem Schild schaut der Hund des Chatters (Rasse und Fell aus
    dem Login) mit Kopf und Pfoten hervor. Varianten: Schilder mit Hund, Schilder, schlicht.
  - **Kamera:** Rahmen als Pixel-Box mit einem Hundehütten-Dach oben, an der unteren Ecke sitzt der Hund des Streamers
    und wedelt; Namensschild als Pille.
  - **Musik:** Pixel-Schild mit Cover, Titel als Lauftext und Fortschritt aus Pfotenspuren; daneben der Hund mit
    Kopfhörern, der im Takt wippt. Varianten: mit Hund, Schild, schlicht.
  - **Effekte:** transparent, nur der Kern-Baustein für Medien; ein optionaler Text als Titel mit Kontur.
  - **Befehlsseite:** Wiese als Hintergrund, Befehle auf Pixel-Schildern, oben der Hund des Streamers.
- **Minimes:** siehe Figuren; sie laufen auf einem schmalen Grasstreifen am unteren Rand (transparent).
- **Töne:** 26 kurze Töne als Dateien, mit earshot 0.4 in Code gemacht (keine Aufnahmen), alle auf -20 LUFS, je
  Ereignis abschaltbar und mit eigener Lautstärke. Klangcharakter: weich, holzig, verspielt; Hunde echt, alles andere
  wie Spielzeug. Referenz ist die Hörseite [refs/sounds/dogs-sounds.html](refs/sounds/dogs-sounds.html).
  - **Hundestimmen** (eigene Rezepte, per Suche gefunden und von earshot angehört): Bellen in drei Grössen (klein für
    Mops, Dackel, Corgi; mittel für Shiba; gross für Labrador, Dalmatiner; earshot hört je "a dog barking", Urteil
    "strong"), Fiepen ("plausible"), Schnarchen ("strong" gegen die Alternativen). Schnüffeln erkennt earshot nicht
    sicher ("no match"); es ist darum leise und standardmässig aus.
  - **Starting:** Landen auf dem Kissen (weicher Pop mit Pfotentupfer), Marker-Hüpfer (Boop mit kleinem Wisch),
    Auswahl (Glockenspiel-Lauf mit Tropfen als Herzen), Karte (Wisch, Pop, Celesta).
  - **Alerts:** Pfoten-Trappeln beim Hereinrennen, Spielzeug je Art (Ball hüpft als Blubb, Knochen als Holz-Klock,
    Frisbee als Zischen mit Plastik-Klack, Leckerli als leises Klock), doppeltes "Wuff" in der Grösse des Hundes, Karte
    (Pop mit zwei Glockentönen), Hinausrennen (Trappeln mit Wisch). Raid: Trappeln des Rudels und Bellen im Chor
    (verschiedene Grössen), höchstens so viele Stimmen gleichzeitig wie eingestellt.
  - **BRB:** Schnüffeln beim Stehenbleiben, leise Schritte (beides optional).
  - **Ending:** Hinlegen (Stoff-Wisch, dumpfer Tupfer), Lampe (Schalter), Schnarchen als leise Schleife.
  - **Stinger (in der Szene, nicht im Video):** Fläche wischt herein mit ploppenden Pfoten, Plakette (aufsteigender
    Glockenlauf mit leisem Fiepen), Fläche rollt weg (Peitschen-Wisch).
  - **Minimes:** Bellen, Schnüffeln, Wedeln (zwei weiche Wische).
- **Stinger:** eine Creme-Fläche mit gestufter, gezackter Diagonale schiebt sich von links ins Bild, auf ihr ploppen
  Pixel-Pfoten in den Fellfarben des Hundes, Halsband-Rot, Ball-Gelb und Braun auf; der Hund rennt in doppelter Grösse
  vor der Kante her. Am Übergangspunkt deckt die Fläche alles, in der Mitte erscheint die rote Plakette mit Pfote und
  Namen; danach rollt die Fläche nach rechts weg, die Pfoten verschwinden, der Hund läuft vorneweg.
- **Banner:** Profil: alle sechs Hunde auf der Wiese, der Kanalname als Titel mit Kontur. Offline: das Nachtzimmer mit
  dem schlafenden Hund und "Z" (beide Banner sind Standbilder).

## Dashboard-Skin (`data-skin="dogs"`)

- **Schrift:** Pixelify Sans für alles; Überschriften gross und fett, Etiketten gesperrt.
- **Farbe:**
  - Seite `#f6ead4`, Karten `#fff6e6`, Felder `#ffffff`.
  - Text `#4a3426` (9.7:1 auf Seite, 10.8:1 auf Karte, 11.6:1 auf Feld), gedämpft `#7a5a46` (5.2:1 auf Seite, 5.8:1
    auf Karte, 6.2:1 auf Feld).
  - Signatur `#c24535` für Primärknopf und aktiven Tab, Schrift darauf `#fff6e6` (4.7:1), gegen Karte 4.7:1.
  - Hervorhebung Wiesengrün `#3f7a2a` (4.9:1 auf Karte, 5.2:1 auf Feld); Fokusring Blau `#2e6fb5` (4.8:1 auf Karte).
  - Fehler Pflaume `#8e2a7a` (7.1:1 auf Karte, Schrift `#fff6e6` darauf 7.1:1), deutlich anders als das Signatur-Rot.
- **Raum:** luftig: grosse Abstände zwischen Karten, eng innerhalb.
- **Abschluss:** die Pixel-Box: gestufter Tintenrand 3 px, harter Schatten nach unten, keine Rundung.
- **Szenerie:** unten eine Pixel-Wiese mit Zaun und Wolken, rechts ein schlafender Hund, alles als SVG-Rechtecke
  (Pixel); unter 1100 px nur Wiese und Zaun, unter 720 px keine Szenerie.

## Im Code

`.theme-dogs`, Klassen `dg-*`, Keyframes `dogs-*`, Dateien in `src/themes/dogs/`.
