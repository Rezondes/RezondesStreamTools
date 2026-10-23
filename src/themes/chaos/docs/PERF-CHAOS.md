# Chaos: Messung der Leistung und Vorschläge

Stand 2026-10-23. Gemessen im Demo-Server (`npm run demo`, Theme chaos mit Standardwerten, `?demo&sound=0`) in Chrome bei
1920x1080 und Gerätefaktor 1, je 6 Sekunden nach dem Laden. "fps" sind die Bilder pro Sekunde des Browsers (60 Hz
Bildschirm), "lange Aufgaben" die Zeit in Aufgaben über 50 ms im Hauptthread.

## Ergebnis vorher

| Szene | fps | lange Aufgaben (6 s) | DOM-Knoten | Skripte / Daten |
|-------|-----|----------------------|------------|-----------------|
| Starting | 21 | 12, zusammen 1087 ms | 4649 | 49 Dateien, 1,5 MB |
| BRB | 24 | 4, zusammen 504 ms | 4703 | 49 Dateien, 1,5 MB |
| Ending | 21 | 14, zusammen 1183 ms | 4434 | 52 Dateien, 1,6 MB |
| Alerts | 160 | 2, zusammen 207 ms | 688 | 45 Dateien, 1,4 MB |
| Minimes | 165 | keine | 176 | 34 Dateien, 1,0 MB |

Nur die drei Bildschirme (Starting, BRB, Ending) sind schwer. Der Trace von Starting zeigt:

- Etwa drei Viertel der Bildzeit gehen in die SVG-Filter der Kritzeleien: 340 Marken mit je einem eigenen Filter
  (Rauheit über `feTurbulence` und `feDisplacementMap`, Neon über zwei `feGaussianBlur`). Weil jede Marke jedes Bild
  ein wenig treibt, rechnet der Browser alle Filter in jedem Bild neu. Ohne die Filter läuft Starting mit 99 statt 21 fps.
- Im Hauptthread schrieb die Schleife der Kritzeleien in jedem Bild rund 1700 Attribute (drei Takes je Marke, auch
  wenn sich nichts änderte); dazu kommt eine Stilberechnung über alle 4600 Knoten (rund 10 % der Zeit).
- Beim Start misst GSAP drawSVG jeden der rund 1000 Pfade (`getTotalLength`, `getBBox`, zusammen rund 600 ms erzwungenes
  Layout), obwohl die Pfade schon `pathLength="1"` haben.

## Schon umgesetzt (dieser Commit)

1. Die Schleife schreibt ein Attribut nur noch, wenn es sich ändert (Take, Verschiebung, Flackern). Die langen Aufgaben
   sinken bei Starting von 1087 auf 412 ms, bei Ending von 1183 auf 477 ms je 6 Sekunden. Optik unverändert.
2. Das Einzeichnen läuft über `stroke-dashoffset` von 1 auf 0 statt über drawSVG, ohne jeden Pfad zu vermessen. Optik
   unverändert (dieselbe Technik wie das Einsprühen im Modus "power-spray").
3. Bei der Leistungsstufe "niedrig" zeichnen die Kritzeleien ohne ihre Filter: Starting läuft dann mit 89 statt 22 fps.
   "mittel" und "hoch" bleiben wie bisher.

Die Bildrate bei "mittel" bleibt dadurch bei rund 23 fps, weil die Filter der Engpass sind.

## Vorschläge (noch nicht umgesetzt, brauchen eine Entscheidung)

1. **Marken vorrendern (empfohlen):** jede Marke mit ihren drei Takes einmal samt Filter in ein Bild rendern und danach
   nur noch die Bilder bewegen (Canvas oder Pixi). Der Filter wirkt im eigenen Koordinatensystem der Marke, das
   vorgerenderte Bild sieht beim Treiben deshalb gleich aus. Erwartung: Bildschirme wie bei "niedrig" (rund 90 fps), ohne
   die Optik zu ändern. Das Einzeichnen am Anfang bleibt SVG und wechselt danach auf die Bilder. Aufwand: mittel bis
   gross.
2. **Weniger Takes im Leerlauf:** statt drei nur zwei Takes je Marke (ein Drittel weniger Knoten). Kleine Änderung der
   Optik (das Brodeln wechselt seltener die Form).
3. **Treiben im Takt des Brodelns:** die Verschiebung nur mit `boilFps` statt mit jedem Bild ändern. Die Filter rechnen
   dann nur noch so oft neu. Kleine Änderung der Optik (die Bewegung wird stufig wie das Brodeln).
4. **Filter je Linienart statt je Marke:** ein Filter pro Linienart über einer Gruppe aller Marken dieser Art. Spart den
   Aufwand je Element, die Rauheit läge dann aber fest im Bild statt mit der Marke zu wandern. Kleine Änderung der Optik.
5. **Ladezeit:** die Takes der 340 Marken (Rough.js) werden bei jedem Aktivieren der Szene in OBS neu berechnet (Teil
   der langen Aufgaben beim Start). Sie hängen nur von den Werten ab und liessen sich im Browser zwischenspeichern oder
   in einem Web Worker rechnen. Optik unverändert.
