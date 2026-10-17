// ASCII record as a pure function of the rotation angle. Characters are about twice as high
// as wide, so the grid has twice as many columns as rows.
const RAMP = " .:-=+*#%@";

// Radius of the label (fraction of the record radius)
const LABEL = 0.36;

// onCover: the record lies over a cover image. Then only thin groove rings, edge and light reflection,
// everything else stays free, so the cover shows through the whole record.
export function vinyl(angle: number, rows = 21, onCover = false): string {
  const cols = rows * 2;
  const lines: string[] = [];
  for (let row = 0; row < rows; row++) {
    let line = "";
    for (let column = 0; column < cols; column++) {
      const dx = ((column - cols / 2 + 0.5) / cols) * 2;
      const dy = ((row - rows / 2 + 0.5) / rows) * 2;
      const radius = Math.hypot(dx, dy);
      const turn = Math.atan2(dy, dx) - angle; // angle on the record, turns along
      const glint = Math.cos(turn * 2 + radius * 3) > 0.96 ? 0.4 : 0; // bright stripe, turns along
      let brightness: number;
      if (radius > 1 || radius < 0.08) brightness = 0; // outside or center hole
      else if (radius > 0.94) brightness = 0.85; // Rand
      else if (onCover) brightness = (Math.sin(radius * 70) > 0.85 ? 0.22 : 0) + glint; // only fine rings over the cover
      else if (radius < LABEL) brightness = Math.cos(turn) > 0.2 ? 0.95 : 0.6; // label, half bright: that shows the turning
      else brightness = (Math.sin(radius * 70) > 0 ? 0.35 : 0.22) + glint; // Rillen
      line += RAMP[Math.min(RAMP.length - 1, Math.round(brightness * (RAMP.length - 1)))];
    }
    lines.push(line);
  }
  return lines.join("\n");
}
