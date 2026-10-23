// Shapes of the backdrop of the Bärenbande theme in a 1920 x 1080 space (shapes only, the colors come from the settings),
// built as a world of planes with a ground line each: far hills; the far shore with the city standing on it; the water
// of a bay in front of it; a suspension bridge from the meadow over the water to the far shore, its towers on piers in
// the water; the cave hill and the forest edge on the left, broad-leaved trees and the meadow with a path in front, tufts
// and flowers, clouds. Every thing stands with its foot on the ground line of its plane (groundAt), so nothing floats
// and nothing stands in the water. SCENE holds the built paths for the watercolor (watercolor.ts) and the canvas (paint.ts).
// Check: world.check.ts.

export const WORLD = { width: 1920, height: 1080, horizon: 720 };

export type TimeOfDay = "morgen" | "mittag" | "abend" | "nacht";
// Where sun or moon stand per time of day
export const LIGHT: Record<TimeOfDay, readonly [number, number]> = { morgen: [360, 300], mittag: [980, 150], abend: [1500, 420], nacht: [1320, 180] };
type Point = readonly [number, number];

// A fir with three soft tiers, its foot at (x, base), height and width in px
export function firPath(x: number, base: number, height: number, width: number): string {
  const tier = height / 3;
  const half = width / 2;
  const top = base - height;
  return [
    `M${x} ${top}`,
    `C${x + half * 0.3} ${top + tier * 0.6} ${x + half * 0.5} ${top + tier * 0.9} ${x + half * 0.62} ${top + tier}`,
    `L${x + half * 0.4} ${top + tier}`,
    `C${x + half * 0.6} ${top + tier * 1.6} ${x + half * 0.8} ${top + tier * 1.9} ${x + half * 0.86} ${top + tier * 2}`,
    `L${x + half * 0.6} ${top + tier * 2}`,
    `C${x + half * 0.8} ${top + tier * 2.5} ${x + half} ${base - 6} ${x + half} ${base}`,
    `L${x - half} ${base}`,
    `C${x - half} ${base - 6} ${x - half * 0.8} ${top + tier * 2.5} ${x - half * 0.6} ${top + tier * 2}`,
    `L${x - half * 0.86} ${top + tier * 2}`,
    `C${x - half * 0.8} ${top + tier * 1.9} ${x - half * 0.6} ${top + tier * 1.6} ${x - half * 0.4} ${top + tier}`,
    `L${x - half * 0.62} ${top + tier}`,
    `C${x - half * 0.5} ${top + tier * 0.9} ${x - half * 0.3} ${top + tier * 0.6} ${x} ${top} Z`,
  ].join(" ");
}

// The shaded right half of a fir (light from the left)
function firShadePath(x: number, base: number, height: number, width: number): string {
  const half = width / 2;
  return `M${x} ${base - height} C${x + half * 0.5} ${base - height * 0.5} ${x + half} ${base - 6} ${x + half} ${base} L${x + half * 0.2} ${base} C${x + half * 0.3} ${base - height * 0.4} ${x + half * 0.2} ${base - height * 0.7} ${x} ${base - height} Z`;
}

// City blocks [x, width, height], each standing on its own base (and reaching below it into the ground)
type Block = readonly [number, number, number];
export const blocksPath = (blocks: readonly Block[], baseOf: (block: Block) => number, buried = 0) =>
  blocks.map(block => {
    const [x, width, height] = block;
    const base = baseOf(block);
    return `M${x} ${base + buried} L${x} ${base - height} L${x + width} ${base - height} L${x + width} ${base + buried} Z`;
  }).join(" ");

// Windows of the blocks as a grid of small squares (rows from the top, a margin to the edges)
export function windowsPath(blocks: readonly Block[], baseOf: (block: Block) => number, size = 8, gap = 14): string {
  const cells: string[] = [];
  for (const block of blocks) {
    const [x, width, height] = block;
    const base = baseOf(block);
    for (let top = base - height + gap; top + size < base - gap; top += gap + size) {
      for (let left = x + gap / 2; left + size < x + width - gap / 2; left += gap + size) {
        cells.push(`M${left} ${top} h${size} v${size} h${-size} Z`);
      }
    }
  }
  return cells.join(" ");
}

// A grass tuft of three blades at (x, base)
const tuftPath = (x: number, base: number, size: number) =>
  `M${x - size} ${base} Q${x - size * 0.8} ${base - size * 1.2} ${x - size * 1.1} ${base - size * 1.8} Q${x - size * 0.3} ${base - size} ${x - size * 0.2} ${base} ` +
  `M${x - size * 0.3} ${base} Q${x} ${base - size * 1.6} ${x + size * 0.2} ${base - size * 2.2} Q${x + size * 0.4} ${base - size * 1.2} ${x + size * 0.3} ${base} ` +
  `M${x + size * 0.2} ${base} Q${x + size * 0.9} ${base - size} ${x + size * 1.3} ${base - size * 1.5} Q${x + size} ${base - size * 0.6} ${x + size} ${base} Z`;

// A small flower with four petals around (x, y)
const flowerPath = (x: number, y: number, size: number) =>
  [[0, -1], [1, 0], [0, 1], [-1, 0]]
    .map(([dx, dy]) => {
      const cx = x + dx * size;
      const cy = y + dy * size;
      const petal = size * 0.7;
      return `M${cx - petal} ${cy} A${petal} ${petal} 0 1 0 ${cx + petal} ${cy} A${petal} ${petal} 0 1 0 ${cx - petal} ${cy} Z`;
    })
    .join(" ");

// --- Ground lines -------------------------------------------------------------------------------------------------
// A ground line is a row of points from left to right; drawn smooth (quadratic curves through the middles of its
// points), and groundAt gives the height of exactly that curve, so things set on it stand on the drawn edge.
type GroundLine = readonly Point[];
const mid = (first: Point, second: Point): Point => [(first[0] + second[0]) / 2, (first[1] + second[1]) / 2];
const round = (value: number) => Math.round(value * 10) / 10;

// The top edge of a ground line as a path (starts with M, no close)
export function linePath(line: GroundLine): string {
  const parts = [`M${line[0][0]} ${line[0][1]}`, `L${mid(line[0], line[1]).join(" ")}`];
  for (let index = 1; index < line.length - 1; index++) parts.push(`Q${line[index].join(" ")} ${mid(line[index], line[index + 1]).join(" ")}`);
  parts.push(`L${line[line.length - 1].join(" ")}`);
  return parts.join(" ");
}

// The surface under a ground line down to bottom, closed
const groundShape = (line: GroundLine, bottom: number) =>
  `${linePath(line)} L${line[line.length - 1][0]} ${bottom} L${line[0][0]} ${bottom} Z`;

// Height of the drawn ground line at x (flat past its ends)
export function groundAt(line: GroundLine, x: number): number {
  if (x <= line[0][0]) return line[0][1];
  if (x >= line[line.length - 1][0]) return line[line.length - 1][1];
  const start = mid(line[0], line[1]), end = mid(line[line.length - 2], line[line.length - 1]);
  const straight = (from: Point, to: Point) => from[1] + ((to[1] - from[1]) * (x - from[0])) / (to[0] - from[0]);
  if (x <= start[0]) return straight(line[0], start);
  if (x >= end[0]) return straight(end, line[line.length - 1]);
  for (let index = 1; index < line.length - 1; index++) {
    const [from, control, to] = [mid(line[index - 1], line[index]), line[index], mid(line[index], line[index + 1])];
    if (x > to[0]) continue;
    // x of a quadratic grows with t (the points go from left to right): find t by halving
    const along = (share: number, axis: 0 | 1) => (1 - share) * (1 - share) * from[axis] + 2 * share * (1 - share) * control[axis] + share * share * to[axis];
    let [low, high] = [0, 1];
    for (let step = 0; step < 40; step++) {
      const half = (low + high) / 2;
      if (along(half, 0) < x) low = half;
      else high = half;
    }
    return along((low + high) / 2, 1);
  }
  return end[1];
}

// The meadow in front (its top edge from the left edge to the right edge)
export const MEADOW: GroundLine = [
  [-20, 762], [150, 742], [300, 732], [450, 738], [600, 742], [750, 736], [900, 732], [1050, 727], [1200, 724], [1350, 732],
  [1500, 740], [1650, 736], [1800, 728], [1940, 722],
];
// The far shore behind the bay: rising out of the meadow on the left, the city stands on it
export const FAR_SHORE: GroundLine = [[980, 730], [1060, 712], [1180, 698], [1320, 692], [1480, 690], [1640, 688], [1800, 684], [1940, 683]];
// The top of the water of the bay, below the far shore and above the meadow
export const WATER_LINE: GroundLine = [[1000, 728], [1100, 716], [1240, 708], [1420, 705], [1620, 703], [1800, 700], [1940, 699]];

// Fixed shapes (the backdrop around the grounds)
export const SHAPES = {
  hills: "M0 640 C220 560 420 600 640 572 C880 540 1080 600 1320 560 C1560 522 1760 578 1920 548 L1920 760 L0 760 Z",
  meadowPatches:
    "M120 900 C260 860 420 880 520 920 C420 960 220 960 120 900 Z M1300 980 C1460 940 1660 950 1780 990 C1640 1030 1420 1030 1300 980 Z M700 820 C820 800 940 810 1000 830 C900 850 780 850 700 820 Z",
  trunk: "M-8 0 C-10 -60 -6 -120 -4 -170 L6 -170 C8 -120 12 -60 10 0 Z",
  crown: "M-90 -170 C-110 -230 -60 -300 0 -296 C60 -310 120 -250 96 -186 C120 -140 70 -100 20 -120 C-20 -96 -100 -110 -90 -170 Z",
  crownShade: "M20 -296 C70 -296 120 -250 96 -186 C120 -140 70 -100 20 -120 C60 -150 70 -230 20 -296 Z",
  cloud: "M20 70 C0 70 0 40 24 38 C24 14 60 6 74 26 C84 2 128 2 136 30 C160 22 186 40 176 62 C190 70 180 80 168 80 L28 80 C22 80 18 76 20 70 Z",
  sun: "M-60 0 A60 60 0 1 0 60 0 A60 60 0 1 0 -60 0 Z",
  moon: "M-10 -46 A46 46 0 1 0 -10 46 A36 36 0 1 1 -10 -46 Z",
};

// Layout: firs [x, height, width] and broad-leaved trees [x, scale] on the meadow, city blocks on the far shore, tufts and
// flowers [x, y, size]
export const FIRS: readonly (readonly [number, number, number])[] = [
  [40, 330, 150], [130, 400, 170], [230, 360, 160], [470, 380, 165], [560, 300, 140], [640, 250, 120],
];
export const CITY: readonly Block[] = [
  [1200, 60, 120], [1270, 44, 170], [1320, 70, 90], [1400, 38, 210], [1444, 56, 140], [1540, 48, 120], [1600, 66, 180],
  [1680, 40, 110], [1790, 58, 150], [1856, 54, 100],
];
export const TREES: readonly (readonly [number, number])[] = [[860, 0.8], [1060, 0.6]];
const TUFTS: readonly (readonly [number, number, number])[] = [
  [90, 1000, 22], [330, 960, 18], [610, 1040, 24], [760, 900, 14], [1180, 1020, 22], [1460, 930, 16], [1700, 1050, 24], [1860, 960, 18],
];
export const FLOWERS: readonly (readonly [number, number, number])[] = [
  [160, 1040, 7], [190, 1028, 6], [420, 1000, 6], [1250, 1058, 7], [1600, 990, 6], [1630, 1004, 7], [1820, 1030, 6],
];

// --- The bridge: from the meadow over the bay to the far shore ----------------------------------------------------------
// Ends on land (left on the meadow, right on the far shore) with an abutment reaching outward into the ground, two
// towers standing on piers in the water, the main cable hanging between the towers, the side cables down to the ends,
// hangers from the main cable to the deck
export const BRIDGE = { left: 1150, right: 1900, towers: [1420, 1680], top: 470, sag: 120, thickness: 12, pier: 30, abutment: 30, clearance: 40 } as const;
export function bridgeShapes() {
  const { left, right, towers, top, sag, thickness, pier, abutment, clearance } = BRIDGE;
  const [leftY, rightY] = [groundAt(MEADOW, left) - 2, groundAt(FAR_SHORE, right) - 2];
  // The deck rises from its ends in a flat arch, high above the water in the middle
  const deckAt = (x: number) => leftY + ((rightY - leftY) * (x - left)) / (right - left) - clearance * Math.sin((Math.PI * (x - left)) / (right - left));
  const xs = Array.from({ length: 26 }, (_, index) => left + ((right - left) * index) / 25);
  const deck = `M${xs.map(x => `${round(x)} ${round(deckAt(x) - thickness)}`).join(" L")} L${[...xs].reverse().map(x => `${round(x)} ${round(deckAt(x))}`).join(" L")} Z`;
  // An abutment from the end outward onto the land, reaching into the ground
  const block = (from: number, to: number, y: number) => `M${from} ${round(y - thickness)} L${to} ${round(y - thickness)} L${to} ${round(y + 24)} L${from} ${round(y + 24)} Z`;
  const tower = (x: number) => {
    const water = groundAt(WATER_LINE, x);
    return `M${x - 8} ${top} L${x + 8} ${top} L${x + 10} ${round(water)} L${x - 10} ${round(water)} Z M${x - pier / 2} ${round(water - 6)} L${x + pier / 2} ${round(water - 6)} L${x + pier / 2} ${round(water + 10)} L${x - pier / 2} ${round(water + 10)} Z`;
  };
  // Main cable between the tower tops as a parabola with its sag, side cables straight down to the deck ends
  const [first, second] = towers;
  const cableAt = (x: number) => top + 4 * sag * ((x - first) / (second - first)) * (1 - (x - first) / (second - first));
  const cables = `M${left} ${round(leftY - thickness)} L${first} ${top} Q${(first + second) / 2} ${top + 2 * sag} ${second} ${top} L${right} ${round(rightY - thickness)}`;
  const hangers: string[] = [];
  for (let x = first + 40; x < second - 20; x += 40) hangers.push(`M${x} ${round(cableAt(x))} L${x} ${round(deckAt(x) - thickness)}`);
  return {
    solid: [deck, block(left - abutment, left, leftY), block(right, right + abutment, rightY), tower(first), tower(second)].join(" "),
    cables: `${cables} ${hangers.join(" ")}`,
    ends: [[left, leftY], [right, rightY]] as const,
    deckAt,
  };
}

// The path: from the front edge up to the left abutment of the bridge, narrowing into the distance to the width of the
// abutment and ending on the meadow right in front of it
export const ROAD_END = { left: BRIDGE.left - BRIDGE.abutment, right: BRIDGE.left, y: round(groundAt(MEADOW, BRIDGE.left) + 4) };
const road = `M880 ${WORLD.height} C960 940 1070 800 ${ROAD_END.left} ${ROAD_END.y} L${ROAD_END.right} ${ROAD_END.y} C1120 820 1060 940 1036 ${WORLD.height} Z`;

// The meadow line from x to x (either way) as line segments, to close a shape along the ground
function alongGround(line: GroundLine, from: number, to: number, step = 20): string {
  const points: string[] = [];
  const direction = to >= from ? 1 : -1;
  for (let x = from; direction * (to - x) > 0; x += direction * step) points.push(`L${x} ${round(groundAt(line, x))}`);
  points.push(`L${to} ${round(groundAt(line, to))}`);
  return points.join(" ");
}
// The cave hill rises out of the meadow, the cave mouth reaches down to the meadow
const [MOUND_LEFT, MOUND_RIGHT, CAVE_LEFT, CAVE_RIGHT] = [-20, 590, 196, 404];
const caveArch = `C${CAVE_LEFT} 650 246 600 300 600 C354 600 ${CAVE_RIGHT} 650 ${CAVE_RIGHT} ${round(groundAt(MEADOW, CAVE_RIGHT))}`;

// The built backdrop, the same for SVG and canvas
const FAR_BOTTOM = 800;
export const blockBase = ([x, width]: Block) => Math.max(groundAt(FAR_SHORE, x), groundAt(FAR_SHORE, x + width));
const bridge = bridgeShapes();
export const SCENE = {
  farShore: groundShape(FAR_SHORE, FAR_BOTTOM),
  water: groundShape(WATER_LINE, FAR_BOTTOM),
  meadow: groundShape(MEADOW, WORLD.height),
  mound: `M${MOUND_LEFT} ${round(groundAt(MEADOW, MOUND_LEFT))} C40 650 180 560 330 566 C470 572 560 690 ${MOUND_RIGHT} ${round(groundAt(MEADOW, MOUND_RIGHT))} ${alongGround(MEADOW, MOUND_RIGHT, MOUND_LEFT)} Z`,
  cave: `M${CAVE_LEFT} ${round(groundAt(MEADOW, CAVE_LEFT))} ${caveArch} ${alongGround(MEADOW, CAVE_RIGHT, CAVE_LEFT)} Z`,
  caveRim: `M${CAVE_LEFT} ${round(groundAt(MEADOW, CAVE_LEFT))} ${caveArch}`,
  // The blocks reach a little into the shore, which is drawn over their feet
  cityBlocks: blocksPath(CITY, blockBase, 24),
  cityWindows: windowsPath(CITY, blockBase),
  bridgeSolid: bridge.solid,
  bridgeCables: bridge.cables,
  road,
  firs: FIRS.map(([x, height, width]) => {
    const base = groundAt(MEADOW, x);
    return { body: firPath(x, base, height, width), shade: firShadePath(x, base, height, width) };
  }),
  trees: TREES.map(([x, scale]) => ({ x, base: groundAt(MEADOW, x), scale })),
  tufts: TUFTS.map(([x, y, size]) => tuftPath(x, y, size)).join(" "),
  flowers: FLOWERS.map(([x, y, size]) => flowerPath(x, y, size)).join(" "),
};
