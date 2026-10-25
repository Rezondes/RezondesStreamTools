# Design: Dachdecker

Charakter: Bauplan in 3D: ein Dachstuhl aus leuchtenden Plan-Linien auf Blaupause wird gezeichnet, gedeckt und
gefeiert, in Terrakotta, Kupfer und Schiefer. Grundsätze für alle Themes: [DESIGN.md](../../../../DESIGN.md). Plan des
Themes: [PLAN-DACHDECKER.md](PLAN-DACHDECKER.md).

## Bildsprache

Zwei Ebenen: eine **3D-Welt** (Starting, BRB, Ending, Stinger, Banner, Minimes) und eine **2D-Planebene** (Texte,
Schilder, Alerts, Chat, Kamera, Musik, Befehlsseite). Beide sprechen dieselbe Sprache: technische Zeichnung.

**Referenzen:** die abgenommenen Prototypen in [refs/](refs/) (`starting`, `brb`, `ending` als HTML und PNG, `alert`
nur für das Schild). Sie sind Massstab für Komposition, Detailgrad und Bewegung; jede gebaute Szene wird neben ihnen
gerendert und verglichen. Beim Alert gilt nur das untere Schild mit Masslinie, der 3D-Giebel darüber entfällt
(entschieden 2026-10-21).

**3D-Welt:**

- **Grund:** Blaupause `blueprint` als Hintergrund, Nebel in derselben Farbe (Ferne verblasst), auf dem Boden ein
  perspektivisches Raster aus Weiss (Hauptlinien alle 2 m mit 13 % Deckkraft, Feinraster alle 0.2 m mit 3.5 %).
  Vignette und ein dunkler Verlauf am unteren Rand halten die Texte lesbar.
- **Balken:** jedes Holz ist ein schmaler Quader mit **weissen Plan-Kanten** (Deckkraft 62 %) und fast durchsichtiger
  blauer Füllung (10 %). Der vordere Binder ist die Signatur: Kanten in Terrakotta, Füllung in Terrakotta mit 22 %,
  mit Bloom-Leuchten. Nebenteile (Latten, Mauerauflage) mit 40 % Kanten.
- **Dachstuhl (Massstab in Metern):** Spannweite 8.4, Firsthöhe 3.25, fünf Binder im Abstand 1.5 (Tiefe 6), je Binder
  Sparren mit 12 % Überstand, Zugbalken, Kehlbalken auf 58 % der Höhe, Hängesäule, zwei Streben; Pfetten an First,
  Traufen und Mitte; Latten alle 8.5 % der Sparrenlänge; Mauerauflagen als flache Quader unter den Traufen.
- **Ziegel:** Schieferplatten (0.5 x 0.46, flach) als Instanzen, je Reihe versetzt und leicht gekippt, mit weissen
  Plankanten (55 %); etwa jede sechste Platte ist Kupfer, verteilt mit festem Zufall (keine Streifen). First als
  Kupferrohr. Licht: Halbkugel-Licht bläulich, ein Mondlicht von oben links; Kupfer glänzt (Phong, hoher Glanz).
- **Regen (BRB):** kurze Striche in Cyan (`rain`), etwa 2600 (mit der Leistungsstufe weniger), prallen an den
  Dachflächen ab und zerfallen in Spritzer, kleinere Spritzer auf dem Raster; Wind dreht den Fall; Blitze weit hinter
  dem Haus als gezackte weisse Linie, die den Himmel kurz aufhellen (gedämpft, nie Weissbild).
- **Abend (Ending):** Himmel als Verlauf von `blueprint` oben zu warmem Glühen `dusk` am Horizont; Fenster und Tür
  leuchten in Terrakotta; Rauch aus dem Schornstein als weiche, steigende Wolken; Feuerwerk als leuchtende Punkte in
  Terrakotta, Kupfer und Weiss.
- **Kamera:** langsam kreisend um den Dachstuhl; Starting fährt aus der Nähe heraus, Ending startet am Richtkranz.

**2D-Planebene:**

- **Schrift:** Roboto Mono, Grossbuchstaben mit weiter Sperrung für Überzeilen und Titel, normale Schreibung für Sätze.
- **Bauplan-Schild:** Fläche `blueprint` mit 94 % Deckkraft und Millimeterraster (50 px und 10 px), Rand 1.5 px Weiss,
  zwei Eckmarken in Terrakotta (oben links, unten rechts, 18 px, 3 px stark), Schatten nur als Abstand nach unten.
- **Masslinie:** dünne weisse Linie mit Begrenzungsstrichen und Schrägstrich an beiden Enden, Text in Kupfer darüber.
- **Schriftfeld:** Tabelle mit weissen Linien unten rechts (Projekt, Blatt, Datum oder Status).
- **Glow:** nur Terrakotta-Text (Countdown, Name, Titel) leuchtet; Weiss bekommt höchstens einen schwachen Schimmer.

## Figuren

**Minimes: kleine 3D-Bauplan-Figuren.** Jeder Chatter ist eine Figur aus Plan-Linien wie der Dachstuhl: Kopf als Kugel
mit weissen Kanten, Rumpf und Glieder als schmale Quader, Füllung fast durchsichtig, ein **Helm** als gefüllte Halbkugel
in der Farbe des Typs. Grösse etwa ein Viertel der Firsthöhe. Name in Roboto Mono als Bauplan-Etikett darüber.

| Typ | Helm | Werkzeug | eigene Bewegung |
|---|---|---|---|
| Dachdecker | Terrakotta | Hammer | hämmern |
| Zimmerer | Kupfer | Zollstock | messen (Zollstock klappt auf) |
| Spengler | Weiss | Rinne | Rinne schultern |
| Azubi | Cyan | Ziegelstapel | Ziegel tragen, stolpern |
| Polier | Ziegelrot | Bauplan | Plan aufrollen, zeigen |

Alle können laufen (mit Hüpfen aus dem Kern), winken, Brotzeit machen und bei Chat den Helm lupfen. Türme, Gefechte
und Fraktionen gibt es nicht (Türme passen nur zur Bärenbande).

## Overlays

- **Farben (Standards in `settings.ts`):**
  - Hintergrund Blaupause `blueprint` `#192a56`, Seite dunkler `page` `#121e40`, Karte `card` `#22356a`.
  - Signatur Terrakotta `accent` `#e67e22`: das, was man finden muss (Countdown, Name, vorderer Binder, Eckmarken).
  - Ziegelrot `brick` `#d35400`: nur Flächen und Glow, nie Schrift.
  - Zweiter Akzent Kupfer `copper` `#d4a373`: Überzeilen, Masslinien-Text, Kupferziegel.
  - Schiefer `slate` `#2c3e50` und `slateDark` `#1a252f`: Ziegel, Regenhimmel.
  - Plan-Linien und Text `line` `#ffffff`, gedämpft `muted` `#b4c2e0`, Regen `rain` `#7fe3ff`, Abendglühen `dusk`
    `#8a3d16`.
  - Zwischentöne (Füllungen mit Deckkraft, Glow-Rand) entstehen aus diesen Farben, nie als eigene Literale.
- **Kontraste (gerechnet):**
  - Weiss auf `blueprint` 13.9:1, auf `page` 16.3:1, auf `card` 11.8:1, auf `slateDark` 15.6:1.
  - Gedämpft auf `blueprint` 7.8:1, auf `card` 6.6:1.
  - Terrakotta als Text auf `blueprint` 4.9:1, auf `page` 5.7:1, auf `slateDark` 5.5:1; auf `card` nur 4.1:1, dort nur
    ab 24 px fett oder als Fläche (Signatur gegen Fläche ab 3:1 erfüllt).
  - Kupfer auf `blueprint` 6.2:1, auf `card` 5.2:1, auf `slateDark` 6.9:1.
  - Ziegelrot auf `blueprint` 3.3:1: darum keine Schrift in Ziegelrot.
  - Cyan auf `blueprint` 9.5:1, auf `slateDark` 10.6:1.
  - Schrift auf Terrakotta immer `page` (5.7:1), nie Weiss (2.8:1).
- **Schrift:** nur Roboto Mono (400, 500, 700). Kontrast über Gewicht, Grösse und Sperrung: Titel 700 und 72 bis 96 px
  mit 10 bis 14 px Sperrung, Überzeilen 500 und 20 px mit 6 px Sperrung, Sätze 500 normal gesperrt.
- **Flächen:** eine Trennsprache: Plan-Linien (Rand 1.5 px Weiss plus Eckmarken). Keine weichen Schatten ausser dem
  Abstand des Schildes zum Spiel.
- **Bewegung:**
  - Plan-Linien zeichnen sich (Balken wachsen entlang ihrer Länge, SVG-Linien per `drawSVG`).
  - Texte entschlüsseln sich (Zeichen-Wirbel), Titel flackern selten wie eine Lampe über dem Zeichentisch.
  - Ziegel landen wie ein eingeschlagener Nagel (kurz gestaucht, nachfedernd).
  - Schilder öffnen sich von der Mitte nach aussen, schliessen umgekehrt.
  - Alle Zeiten, Stärken und Häufigkeiten sind Einstellungen, jedes Element einzeln abschaltbar.
- **Szenen:**
  - **Starting:** Kopfzeile "BAUPLAN 01 // DACHSTUHL 3D // KANAL", der Dachstuhl baut sich auf (Mauerauflagen,
    vorderer Binder, weitere Binder, Pfetten, Latten, zuletzt die ersten Schindelreihen), Kamera fährt heraus und
    kreist. Unten Titel, Countdown in Terrakotta, rechts unten das Schriftfeld. Fortschritt optional als Masskette.
  - **BRB:** derselbe Dachstuhl, jetzt komplett gedeckt, im Regen; Titel "BIN GLEICH ZURÜCK", Unterzeile "DAS DACH
    HÄLT DICHT" in Kupfer, Pausenzeit in Terrakotta, Schriftfeld mit Wetter und Status.
  - **Ending:** fertiges Haus mit Fachwerk-Wänden, Richtkranz mit wehenden Bändern, Abendhimmel; Fenster gehen an,
    links das **Abnahmeprotokoll** mit echten Zahlen des Streams (Kern-Statistik, zählt hoch), Stempel "ABGENOMMEN"
    schlägt auf, Titel "FEIERABEND!", danach Feuerwerk.
  - **Alerts:** nur das Bauplan-Schild (transparent): Masslinie mit Text (z. B. "+1 DACHDECKER") zeichnet sich, das
    Schild öffnet sich, Kopfzeile und Name entschlüsseln sich, die Zeile erscheint; Abgang umgekehrt. Je Alert-Art eigene
    Texte und eigener Masslinien-Text.
  - **Chat:** Nachrichten als kleine Bauplan-Zettel, Name in Kupfer über einer kurzen Masslinie, Text in Weiss;
    Varianten Zettel, Liste, schlicht.
  - **Kamera:** Rahmen aus Plan-Linien mit Eckmarken, Massketten an Ober- und Seitenkante (Text z. B. "1920 x 1080"),
    Namensschild als Schriftfeld.
  - **Musik:** ein robustes **Baustellenradio** als 2D-Zeichnung: Gehäuse in Schiefer, Eckpuffer und Überrollbügel in
    Terrakotta, zwei Lautsprechergitter, in der Mitte ein Display in Cyan mit Titel und Künstler als Lauftext und einem
    kleinen Equalizer; das Cover optional links im Display; Fortschritt als Masskette unter dem Radio. Varianten Radio,
    Schild, schlicht.
  - **Effekte:** transparent, nur der Kern-Baustein für Medien; ein optionaler Text im Stil des Titels.
  - **Befehlsseite:** ein Bauplan-Blatt (Millimeterraster, Schriftfeld), Befehle als Schilder.
- **Minimes:** siehe Figuren; sie laufen auf einem schmalen Firststreifen am unteren Rand (3D, transparent).
- **Stinger:** Schiefer- und Kupferplatten klappen in Reihen von unten nach oben übers ganze Bild (wie Eindecken) und
  decken es am Übergangspunkt komplett; ein Glanz läuft darüber; danach klappen sie von oben nach unten wieder weg.
- **Banner:** Profil: das fertige Haus im Abendlicht mit dem Kanalnamen als Titel und einem Schriftfeld. Offline: das
  gedeckte Dach im Regen mit "OFFLINE // DACH DICHT", nahtlose Schleife.

## Dashboard-Skin (`data-skin="dachdecker"`)

- **Schrift:** Roboto Mono für alles; Überschriften in Grossbuchstaben mit Sperrung.
- **Farbe:**
  - Seite `page` `#121e40` mit Millimeterraster, Karten `card` `#22356a`, Felder `#2a3f7a`.
  - Text Weiss (11.8:1 auf Karte, 10.0:1 auf Feld), gedämpft `#b4c2e0` (6.6:1 auf Karte, 5.6:1 auf Feld).
  - Signatur Terrakotta `#e67e22` für Primärknopf und aktiven Tab, Schrift darauf `#121e40` (5.7:1), gegen Karte 4.1:1.
  - Hervorhebung Kupfer `#d4a373` (5.2:1 auf Karte, auf Feldern nicht als Text); Fokusring Cyan `#7fe3ff` (8.0:1 auf
    Karte).
  - Fehler `#ff7a7a` (4.7:1 auf Karte, Schrift `#121e40` darauf 6.5:1), deutlich anders als Terrakotta.
- **Raum:** dicht innerhalb einer Karte, grosszügig dazwischen.
- **Abschluss:** Plan-Linien: jede Karte hat 1.5 px weissen Rand mit 40 % und Eckmarken in Terrakotta, keine Schatten.
- **Szenerie:** ein gezeichneter Dachstuhl als SVG-Linien (kein WebGL im Dashboard) unten rechts, eine Masskette am
  linken Rand, oben rechts ein Schriftfeld; unter 1100 px nur das Raster, unter 720 px keine Szenerie.

## Im Code

`.theme-dachdecker`, Klassen `dd-*`, Keyframes `dachdecker-*`, Dateien in `src/themes/dachdecker/`.
