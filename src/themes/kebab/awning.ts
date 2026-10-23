// The awning over the window frame of the camera (DESIGN-KEBAB.md "Kamera") in a box of 1000 x 150 that the scene
// stretches over the width of the frame: alternating stripes and a scalloped bottom edge, one scallop per stripe.
// Only shapes; the stripes in red and paper come from the CSS. Check: awning.check.ts.

export const AWNING_BOX = { width: 1000, height: 150 };
// fixed: the stripes end above the scallops, the scallops hang this deep (their control points twice as deep)
const BAND = 100;
const SCALLOP = 22;

export type Awning = { stripes: { x: number; width: number; red: boolean }[]; edge: string };

export function awning(stripes: number): Awning {
  const count = Math.max(1, Math.round(stripes));
  const width = AWNING_BOX.width / count;
  const bands = Array.from({ length: count }, (_, index) => ({ x: index * width, width, red: index % 2 === 0 }));
  const scallops = [...bands].reverse().map(band => `Q${band.x + band.width / 2} ${BAND + SCALLOP * 2} ${band.x} ${BAND}`).join(" ");
  return { stripes: bands, edge: `M0 0 L${AWNING_BOX.width} 0 L${AWNING_BOX.width} ${BAND} ${scallops} Z` };
}
