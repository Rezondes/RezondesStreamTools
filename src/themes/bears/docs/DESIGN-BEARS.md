# Design: Bärenbande

Charakter: drei Bärenbrüder (Eisbär, Grizzly, Panda) als **Cartoon mit klarer Kontur vor einer Aquarell-Welt**. Ein
Bär steht in jeder Szene im Mittelpunkt, auf Wunsch alle drei als Bärenturm. Gemütlich, trocken-komisch, nie hektisch.
Grundsätze für alle Themes: [DESIGN.md](../../../../DESIGN.md). Plan des Themes: [PLAN-BEARS.md](PLAN-BEARS.md).

## Bildsprache: zwei Ebenen

Gilt für alle Szenen, Stinger, Banner, Minimes und den Dashboard-Skin.

**Figuren und alles, was man anfasst** (Bären, Karten, Schilder, Handy, Requisiten):

- **Eine Kontur für alles.** Dicke, gleichmässige, fast schwarze Linie (`outline`, Standard `#1c1a19`), runde Enden und
  Ecken. Die Stärke ist eine Einstellung und skaliert mit der Figur (Standard etwa 1.4 % der Figurhöhe).
- **Flache Farbe plus genau ein Schattenton.** Kein Verlauf, kein Glanzpunkt, keine Textur. Der Schatten ist ein
  Band entlang der lichtabgewandten Kante (Licht von vorn links, Schatten rechts und hinten), als eigene Fläche ohne
  Kontur.
- **Offene Innenlinien.** Arme, Beine und Zehen sind einzelne Linien, die nicht geschlossen werden: Ein Arm ist eine
  Linie von der Schulter abwärts, die unten in die Pfote läuft und oben offen endet; Zehen sind zwei kurze Striche.
- **Kleines Gesicht weit vorn.** Punktaugen (klein, schwarz, weit auseinander), ovale schwarze Nase vorn an der
  Schnauze, Mund als kurzer Bogen darunter. Ausdruck entsteht über Mund und Augenform (offener Mund mit Zähnen beim
  Grizzly, halb geschlossene Augen beim Eisbären), nie über Augenbrauen.
- **Körper als eine Form.** Kopf und Rumpf sind eine weiche Bohnenform ohne Hals, die Schnauze beult die Silhouette
  auf der Blickseite aus. Kleine Halbkreis-Ohren (das hintere halb verdeckt), kurze Stummelbeine, Stummelschwanz als
  kleiner Kreis hinten.
- **Dreiviertelansicht.** Die Bären schauen meist zur Seite (Blickseite einstellbar), selten frontal.

**Welt** (Kulisse, Himmel, Bäume, Stadt, Höhle):

- **Aquarell statt Kontur.** Weiche, leicht gesättigte Pastellflächen mit Papierstruktur (SVG-Filter `feTurbulence`
  plus `feDisplacementMap`, Stärke einstellbar, 0 = aus).
- **Skizzenlinien im Ton der Fläche.** Dünne, leicht unruhige Linien, gemischt aus der Flächenfarbe und `outline`
  (`color-mix`, Anteil einstellbar), nie schwarz. Dadurch bleiben die Figuren immer die klarste Ebene.
- **Luftperspektive.** Was weiter weg ist, mischt sich mit der Himmelsfarbe (ferne Stadt und Hügel blasser).
- **Keine harten Schatten in der Welt**, nur ein weicher Bodenschatten unter Figuren.
- **Alles steht auf seinem Boden.** Die Welt besteht aus Ebenen mit je einer Bodenlinie (`world.ts`): ferne Hügel, das
  ferne Ufer mit der Stadt darauf, das Wasser einer Bucht davor, die Wiese vorn. Tannen, Bäume, Höhlenhügel und Höhle
  stehen auf der Wiesenlinie, die Stadtblöcke auf dem Ufer über dem Wasser, die Hängebrücke führt im flachen Bogen von
  der Wiese über das Wasser zum fernen Ufer, ihre Pylone stehen auf Sockeln im Wasser. SVG und Canvas nutzen dieselbe
  gebaute Anordnung (`SCENE`).

## Die drei Bären

Grössen relativ zueinander: Eisbär 1.0 (gross und schlank), Grizzly 0.88 (mittel, kräftig), Panda 0.8 (klein und
breit). Die Grösse je Szene ist eine Einstellung, das Verhältnis steckt in den Formen.

| Bär | Wesen | Fell | Schatten | Requisiten und Posen |
|---|---|---|---|---|
| Eisbär | ruhig, wortkarg, kann alles | `#ffffff` | `#d5dcda` | Pfanne und Kochlöffel, Wischmopp, Arme verschränkt, Daumen hoch, Stirnband |
| Grizzly | Anführer, begeistert, laut | `#96693f` | `#7d5533` | winkt mit offenem Mund, Pfoten vor der Brust, zeigt auf etwas; Mund innen `#6b3833`, Zunge `#e0868a` |
| Panda | sensibel, Technik-Fan | Weiss `#f3eeeb`, Schwarz `#64615c` | `#d9d2ce` auf Weiss, `#4e4b47` auf Schwarz | Handy (Hülle `#f4a493`, Schirm `#2d2926`), Kopfhörer, Selfie, sitzt gern |

Panda: schwarze Augenflecken (Augenpunkt darin), Ohren, Arme, Beine und ein Band über die Brust sind schwarz, ein
weisser Streifen über den Bauch. Augen und Nase aller Bären `#111111`.

**Bärenturm:** unten der Eisbär auf allen vieren, in der Mitte der Panda auf allen vieren (oft mit Handy), oben der
Grizzly, der einen Arm hochreisst. In den Szenen steht die Reihenfolge in den Formen, bei den Minimes ist sie eine
Einstellung des Kerns. Gestapelt wird aus dem Modell (`towerLayout`): die oberen Bären stehen mit eng gestellten Beinen
(`perch`), die Mitte ihrer Füsse über dem Rückenanker des Bären darunter; jedes Bein streckt sich bis auf die
Rückenlinie an seiner Stelle (der Rücken fällt zum Hinterteil ab). Dieselbe Rechnung gilt für den grossen Turm, Clips
und Minimes; `stackFit` korrigiert die Minimes je Stufe von Hand.

**Formen und Rig:** Jeder Bär ist ein 2D-Skelett (`rig.ts`): ein Körper-Blob je Haltung ohne Gliedmassen in der
Silhouette (`bears.ts`), Kopf mit Ohren, Gesicht und Panda-Augenflecken als eigener Knochen, Arme und Beine als je ein
Schlauch mit runder Pfote, gebaut aus zwei Knochen (Schulter oder Hüfte, Ellbogen oder Knie, Pfote oder Fuss) durch
einen Zwei-Knochen-Löser, dessen Gelenk nur leicht ausknickt (kein Arm als Schlaufe). Eine Pose ist die Haltung
(aufrecht oder auf allen vieren) mit den Zielpunkten der Pfoten und Füsse; Requisiten hängen an der Pfote oder am Kopf.
Das Headset folgt der Dreiviertelansicht: die nahe Muschel sitzt seitlich über dem nahen Ohr, Bügel und ferne Muschel
liegen hinter dem Kopf. Das Rig ist 2,5D: flache Teile im 3D-Raum, jeder Ansatzpunkt (Schulter, Hüfte, Gesicht, Ohren,
Muscheln) hat eine Tiefe; eine Drehung um die Hochachse (`turn`, zur Kamera höchstens 0.5, weg höchstens 0.4) schiebt
die Teile nach ihrer Tiefe und ordnet die Ebenen nach der gedrehten Tiefe. Hält der Bär etwas mit beiden Pfoten, greift
die ferne Pfote von hinten (hinter der Requisite); mit einer Pfote hängt der andere Arm. Gezeichnet wird in fester Tiefe: ferne Glieder, Schwanz und Ohren hinter dem Körper, nahe
Glieder, Gesicht, gehaltene Requisiten und Pfoten davor. SVG (`Bear.tsx`, eine Gruppe `bone-<name>` je Knochen mit
Drehpunkt) und Canvas (`paint.ts`) zeichnen dieselben Ebenen.

## Overlays

- **Farben (Standards in `settings.ts`):**
  - Kontur `#1c1a19`, Text dunkel `#2b2522`, Text hell `#ffffff`, gedämpft `#6b5d55`.
  - Papier (Karten, Schilder) Creme `#fbf3e0`, Papier-Schatten `#e9dcc0`.
  - Akzent Ziegelrot `#e2573f` (das, was man finden muss: Live, Countdown, Fortschritt), Akzent für Text `#b83c28`,
    zweiter Akzent Himmelblau `#4d9de0` (Hervorhebung, Stirnband).
  - Welt: Himmel oben `#7fc3e8`, unten `#cfe9f5`, Wolke `#ffffff`, Wiese `#b9cf63` und `#8fb24a`, Tannen `#5e8f6a` und
    `#3f6b52`, ferne Hügel `#a9c7b9`, Stadt `#d8dde3` mit Fenstern `#9fb0c0`, Brücke `#d9573b`, Strasse `#8a8c8e`,
    Höhle `#6e4a3a` und `#8b6352`, Holz `#9a6a44`, Sofa `#c4703a`.
  - Je Bär Fell, Schatten und Details wie in der Tabelle oben.
  - Zwischentöne (Skizzenlinien, Abend und Nacht) entstehen per `color-mix` aus diesen Farben, nie als eigene Literale.
- **Kontraste (gerechnet):** Text `#2b2522` auf Papier `#fbf3e0` 13.7:1; gedämpft `#6b5d55` auf Papier 5.7:1; Kontur auf
  Papier 15.7:1; Weiss auf `#b83c28` 5.7:1. Das helle Ziegelrot `#e2573f` trägt nie Text, es ist Fläche mit Kontur
  (3.4:1 gegen Papier).
- **Schrift:** Sniglet (Titel, rund und dick, Gewicht 800) und Nunito (Text, 600 und 800). Kontrast über die zweite
  Familie und die Grösse. Titel bekommen dieselbe Kontur wie Figuren (`paint-order: stroke`), Fliesstext nie.
- **Flächen (Tokens in `theme.css`):**
  - `--sticker` / `.bb-card`: Papier mit Kontur, grossem Radius und einem Schattenband innen unten (derselbe
    Gedanke wie der eine Schattenton der Figuren), kein Weichzeichner, kein Schlagschatten.
  - `--ground-shadow`: weicher, flacher Bodenschatten unter Figuren und stehenden Schildern.
  - `.bb-pill` für Uhr, Live und Namensschild: Papier oder Akzent, Kontur, voll gerundet.
- **Bewegung:** Watscheln (leichtes Schaukeln beim Gehen), Plopp (kurz stauchen und strecken), Hereinlaufen von der
  Seite, Blende oder keins. Bären atmen (der Rumpf hebt sich minimal), blinzeln, wiegen den Kopf. Wolken ziehen, Tannen
  wippen kaum. Einschalten: die Kulisse malt sich als Aquarell von links nach rechts ein.
- **Szenen** (der Bär je Szene ist einstellbar: Eisbär, Grizzly, Panda und, wo angegeben, Bärenturm):
  - **Starting, BRB, Ending** (mit Turm; Standard Grizzly, Eisbär, Panda): Waldrand mit Höhleneingang links, Wiese,
    Weg in die Tiefe, ferne Stadtsilhouette mit roter Hängebrücke, Tageszeit je Szene. Schild als Papierkarte an einem
    Holzpfahl, Countdown als Pille. Starting: der Bär winkt. BRB: der Eisbär kocht, der Panda schaut aufs Handy, der
    Grizzly hält ein Schild. Ending: der Bär winkt zum Abschied, der Panda macht ein Selfie. Der Turm watschelt einmal
    ins Bild und bleibt stehen. Fortschritt als Weg, auf dem ein kleiner Bär läuft, oder als Balken mit Kontur. Ticker
    als Papierstreifen unten.
  - **Alerts** (mit Turm): Papierkarte mit Kontur, der Bär lugt von der Seite hinter der Karte hervor und reagiert je
    Art (Grizzly jubelt, Panda freut sich erschrocken, Eisbär nickt mit Daumen hoch). Konfetti aus kleinen
    Pfotenabdrücken und Blättern. Restzeit als schrumpfender Konturbalken.
  - **Chat** (ohne Turm): Der Bär hält ein grosses Handy, die Nachrichten erscheinen als Sprechblasen auf dem Schirm;
    alternativ Papierzettel an einer Schnur oder schlichte Sprechblasen ohne Bär.
  - **Kamera** (mit Turm): Rahmen aus Papier mit Kontur, Holz oder Polaroid; der Bär lehnt an einer Ecke oder schaut
    oben über den Rand, der Turm steht seitlich am Rahmen. Namensschild und Live-Pille.
  - **Musik** (mit Turm): Der Bär trägt Kopfhörer und wippt im Takt; das Cover steckt in einem Papierrahmen, Equalizer
    als Konturbalken. Alternativ ein altes Kofferradio oder schlicht.
  - **Effekte** (ohne Turm): Der Bär hält ein Schild oder eine Sprechblase mit dem Text.
  - **Befehlsseite** (mit Turm): Papierkarten vor der Kulisse, der Bär oder Turm im Kopf der Seite.
- **Minimes:** kleine Bären der drei Typen mit Namen auf einem Papierschild über dem Kopf. Sie watscheln (Laufen des
  Kerns, kein Hüpfen, keine Gefechte). Animationen: Selfie (Handy hoch, kurzer Blitz), Snack (etwas essen), Winken,
  Tanzen, Umschauen, Schlafen (aufsteigende "z"). Reaktion auf Chat: Winken. Türme aus dem Kern: die Bären laufen
  zusammen, klettern aufeinander, watscheln als Turm und steigen ab.
- **Stinger** (ein Bär oder Turm): Der Bär (oder der Turm) watschelt von links ins Bild, wird gross, bis sein Fell das
  Bild füllt, zeigt Text in Titelschrift und watschelt rechts hinaus.
- **Banner** (mit Turm): Profilbanner als Wiese mit Waldrand, Stadt und Brücke, Kanalname auf einem Papierschild, der
  gewählte Bär oder Turm davor. Offline-Banner am Abend vor der Höhle mit Lichterkette, der Bär schläft.

## Dashboard-Skin (`data-skin="bears"`)

- **Schrift:** Sniglet für Überschriften und das Titelschild, Nunito für alles andere.
- **Farbe:**
  - Hinter dem Dashboard steht die Kulisse (Waldrand, Mittag, Standardeinstellungen).
  - Karten aus Papier `#fbf3e0` mit Kontur `#1c1a19`, Text `#2b2522` (13.7:1), gedämpft `#6b5d55` (5.7:1).
  - Signatur Ziegelrot `#b83c28` (`--accent`, weisse Schrift 5.7:1, gegen Papier 5.1:1) für Primärknopf und aktiven Tab.
  - Himmelblau `#1f6fb2` (`--emph`, 4.8:1 auf Papier) für Hervorhebungen; Fokus `#4d9de0` als Ring mit Kontur.
  - Fehler Beere `#8e1b5c` (7.7:1 auf Papier, weisse Schrift darauf 8.5:1), damit er sich vom Ziegelrot abhebt.
- **Raum:** luftig, grosse Radien (`--radius` 20px, Knöpfe 14px).
- **Abschluss:** Konturen statt Schatten. Jede Fläche hat die Kontur und innen unten ein Schattenband; Knöpfe sinken
  beim Drücken um die Höhe des Bandes ein. Keine Weichzeichner, keine Schlagschatten.
- **Szenerie:** die Kulisse, rechts unten der Bärenturm, der ab und zu blinzelt.

## Modernisierung (entschieden 2026-10-21)

Abgenommene Prototypen: [refs/starting.html](refs/starting.html), [refs/alert.html](refs/alert.html) mit Standbildern.
Plan: [PLAN-BEARS.md](PLAN-BEARS.md) Packages 11 bis 14. Die zwei Ebenen bleiben.

- **Welt als Rough-Aquarell:** jede Fläche besteht aus mehreren weichen Lasuren mit unruhigem Rand, darüber eine
  Skizzenlinie im Ton der Fläche, dazu Papierkörnung. So sieht die Welt in Szenen, Stinger und Banner gleich aus (auch
  ohne SVG-Filter). Einschalten: die Welt malt sich von links nach rechts ein.
- **Welt-Modell:** der Weg führt bis zum Anfang der roten Brücke, die Brücke führt über das Wasser und landet am fernen
  Ufer, auf dem die Stadt steht. Nichts führt ins Leere.
- **Figuren:** immer aus dem Rig; GSAP bewegt die Knochen (watscheln mit Schaukeln, landen mit Stauchen und
  Nachfedern, winken, Kopf wiegen, blinzeln, atmen). Keine vereinfachten Bären.
- **Karten:** ploppen mit Stauchen und Strecken; Titelbuchstaben springen; der kleine Bär läuft den Weg als
  Fortschritt.
- **Alerts:** die Karte ploppt, der Bär lugt mit Federn dahinter hervor und jubelt, das Herz pocht, Pfoten und Blätter
  fliegen; Abgang: der Bär duckt sich weg.

## Im Code

`.theme-bears`, Klassen `bb-*`, Keyframes `bears-*` und `bears-minime-*`, Dateien in `src/themes/bears/`.
