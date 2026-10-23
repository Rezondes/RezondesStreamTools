// Letters on an arc like the printed logo (DESIGN-KEBAB.md "Bogenschrift"): each letter gets a share of the angle
// after its width, so wide letters take more room; the letters sit around the middle of the arc. Angles in degrees,
// 0 = straight up. Check: arc.check.ts.

export type ArcLetter = { x: number; y: number; angle: number };

const RADIANS = Math.PI / 180;

export function arcLayout(widths: readonly number[], center: { x: number; y: number }, radius: number, spanDeg: number): ArcLetter[] {
  const total = widths.reduce((sum, width) => sum + width, 0);
  if (total <= 0) return widths.map(() => ({ x: center.x, y: center.y - radius, angle: 0 }));
  let run = 0;
  return widths.map(width => {
    const angle = -spanDeg / 2 + (spanDeg * (run + width / 2)) / total;
    run += width;
    return { x: center.x + radius * Math.sin(angle * RADIANS), y: center.y - radius * Math.cos(angle * RADIANS), angle };
  });
}
