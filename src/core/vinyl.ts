// ASCII-Schallplatte als reine Funktion des Drehwinkels. Zeichen sind etwa doppelt so hoch
// wie breit, darum hat das Raster doppelt so viele Spalten wie Zeilen.
const RAMP = " .:-=+*#%@";

// Radius des Etiketts (Anteil vom Plattenradius)
export const LABEL = 0.36;

// onCover: die Platte liegt über einem Cover-Bild. Dann nur dünne Rillenringe, Rand und Lichtreflex,
// alles andere bleibt frei, damit das Cover über die ganze Platte durchscheint.
export function vinyl(angle: number, rows = 21, onCover = false): string {
  const cols = rows * 2;
  const lines: string[] = [];
  for (let row = 0; row < rows; row++) {
    let line = "";
    for (let column = 0; column < cols; column++) {
      const dx = ((column - cols / 2 + 0.5) / cols) * 2;
      const dy = ((row - rows / 2 + 0.5) / rows) * 2;
      const radius = Math.hypot(dx, dy);
      const turn = Math.atan2(dy, dx) - angle; // Winkel auf der Platte, dreht mit
      const glint = Math.cos(turn * 2 + radius * 3) > 0.96 ? 0.4 : 0; // heller Streifen, dreht mit
      let brightness: number;
      if (radius > 1 || radius < 0.08) brightness = 0; // ausserhalb oder Mittelloch
      else if (radius > 0.94) brightness = 0.85; // Rand
      else if (onCover) brightness = (Math.sin(radius * 70) > 0.85 ? 0.22 : 0) + glint; // nur feine Ringe über dem Cover
      else if (radius < LABEL) brightness = Math.cos(turn) > 0.2 ? 0.95 : 0.6; // Etikett, halb hell: daran sieht man das Drehen
      else brightness = (Math.sin(radius * 70) > 0 ? 0.35 : 0.22) + glint; // Rillen
      line += RAMP[Math.min(RAMP.length - 1, Math.round(brightness * (RAMP.length - 1)))];
    }
    lines.push(line);
  }
  return lines.join("\n");
}
