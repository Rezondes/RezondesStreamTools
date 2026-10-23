// Shapes of the building site radio of the Dachdecker music overlay (DESIGN-DACHDECKER.md "Musik") as closed SVG paths
// in a box from 0 to 1 (wide) and 0 to HEIGHT: body, four corner bumpers, the roll bar on top, two speaker grilles and
// the display in the middle between them. The scene paints them in the colors of the settings. Check: radio.check.ts.
export const HEIGHT = 0.62;
export type Box = { x: number; y: number; width: number; height: number };
type RadioShapes = { body: string; bumpers: string[]; handle: string; grilles: [string, string]; display: Box };

const BODY: Box = { x: 0.06, y: 0.14, width: 0.88, height: 0.44 };
const ROUND = 0.04;
const BUMPER = 0.09;
const HANDLE = { inset: 0.16, top: 0.02, thickness: 0.035 };
const GRILLE = { radius: 0.13, inset: 0.18 };
const DISPLAY = { width: 0.34, height: 0.2 };

const rounded = ({ x, y, width, height }: Box, radius: number) =>
  `M${x + radius} ${y}H${x + width - radius}Q${x + width} ${y} ${x + width} ${y + radius}V${y + height - radius}` +
  `Q${x + width} ${y + height} ${x + width - radius} ${y + height}H${x + radius}Q${x} ${y + height} ${x} ${y + height - radius}` +
  `V${y + radius}Q${x} ${y} ${x + radius} ${y}Z`;
const circle = (x: number, y: number, radius: number) => `M${x - radius} ${y}A${radius} ${radius} 0 1 0 ${x + radius} ${y}A${radius} ${radius} 0 1 0 ${x - radius} ${y}Z`;

export function radioShapes(): RadioShapes {
  const middle = BODY.y + BODY.height / 2;
  const right = BODY.x + BODY.width;
  const bottom = BODY.y + BODY.height;
  const corner = (x: number, y: number) => rounded({ x: x - BUMPER / 2, y: y - BUMPER / 2, width: BUMPER, height: BUMPER }, ROUND / 2);
  // The roll bar: an arch from the left to the right top bumper
  const left = BODY.x + HANDLE.inset;
  const end = right - HANDLE.inset;
  const handle = `M${left} ${BODY.y}V${HANDLE.top + ROUND}Q${left} ${HANDLE.top} ${left + ROUND} ${HANDLE.top}H${end - ROUND}Q${end} ${HANDLE.top} ${end} ${HANDLE.top + ROUND}` +
    `V${BODY.y}H${end - HANDLE.thickness}V${HANDLE.top + HANDLE.thickness + ROUND / 2}H${left + HANDLE.thickness}V${BODY.y}Z`;
  return {
    body: rounded(BODY, ROUND),
    bumpers: [corner(BODY.x, BODY.y), corner(right, BODY.y), corner(right, bottom), corner(BODY.x, bottom)],
    handle,
    grilles: [circle(BODY.x + GRILLE.inset, middle, GRILLE.radius), circle(right - GRILLE.inset, middle, GRILLE.radius)],
    display: { x: 0.5 - DISPLAY.width / 2, y: middle - DISPLAY.height / 2, width: DISPLAY.width, height: DISPLAY.height },
  };
}

// Bars of the small equalizer in the display
export const EQ_BARS = 7;

const PERCENT = 100;
// Place of the display over the drawing as CSS percentages of its width and height
export const displayStyle = ({ x, y, width, height }: Box) => ({
  left: `${x * PERCENT}%`, top: `${(y / HEIGHT) * PERCENT}%`, width: `${width * PERCENT}%`, height: `${(height / HEIGHT) * PERCENT}%`,
});
