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
  for (let y = 0; y < rows; y++) {
    let line = "";
    for (let x = 0; x < cols; x++) {
      const dx = ((x - cols / 2 + 0.5) / cols) * 2;
      const dy = ((y - rows / 2 + 0.5) / rows) * 2;
      const r = Math.hypot(dx, dy);
      const a = Math.atan2(dy, dx) - angle; // Winkel auf der Platte, dreht mit
      const glint = Math.cos(a * 2 + r * 3) > 0.96 ? 0.4 : 0; // heller Streifen, dreht mit
      let v: number;
      if (r > 1 || r < 0.08) v = 0; // ausserhalb oder Mittelloch
      else if (r > 0.94) v = 0.85; // Rand
      else if (onCover) v = (Math.sin(r * 70) > 0.85 ? 0.22 : 0) + glint; // nur feine Ringe über dem Cover
      else if (r < LABEL) v = Math.cos(a) > 0.2 ? 0.95 : 0.6; // Etikett, halb hell: daran sieht man das Drehen
      else v = (Math.sin(r * 70) > 0 ? 0.35 : 0.22) + glint; // Rillen
      line += RAMP[Math.min(RAMP.length - 1, Math.round(v * (RAMP.length - 1)))];
    }
    lines.push(line);
  }
  return lines.join("\n");
}
