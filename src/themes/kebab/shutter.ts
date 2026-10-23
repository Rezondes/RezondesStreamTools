// The roller shutter of the Ending (DESIGN-KEBAB.md "Ending"): how far it has come down at a time (0 = rolled up,
// 1 = down) as a pure function, easing out at the bottom; and the slats as lines over its height. Check: shutter.check.ts.

const SECOND_MS = 1000;

// Share of the way down at time (s) for a shutter that starts at start (s) and takes durationMs; eases out
export function shutterAt(time: number, start: number, durationMs: number): number {
  if (durationMs <= 0) return time >= start ? 1 : 0;
  const share = Math.min(1, Math.max(0, (time - start) / (durationMs / SECOND_MS)));
  return 1 - (1 - share) ** 3;
}

// Heights of the slat lines in a shutter of the given height, one every gap from the bottom up
export function shutterSlats(height: number, gap: number): number[] {
  if (gap <= 0) return [];
  return Array.from({ length: Math.floor(height / gap) }, (_, index) => height - (index + 1) * gap);
}
