// Scribbles of the Chaos theme: the catalog of small hand-drawn marks (star, X, arrow, bolt, zigzag, spiral, heart, sun,
// monster, skull, scrawl, hatch, triangle, eye, bang, crown, ring, dots, plus, squiggle) as open lines in a unit box
// around 0, each drawn a little differently every time, and their layout on the 1920x1080 stage: dense at the edges,
// the free area around the content stays empty. Only shapes and places; colors come from the settings. Pure and
// deterministic from a seed. Check: scribbles.check.ts.
import { STAGE } from "../../core/screens/screens.ts";
import { between, chance, weighted, type Chance } from "./chance.ts";
import { linePath, polar, smoothPath, wobble, type Point } from "./paths.ts";

const TURN = Math.PI * 2;

const ring = (random: Chance, steps: number, radius: number, center: Point = [0, 0], shake = 0.02) =>
  smoothPath(wobble(random, Array.from({ length: steps }, (_, index) => {
    const [x, y] = polar(radius, (index / steps) * TURN);
    return [center[0] + x, center[1] + y] as const;
  }), shake), true);

const SHAPES = {
  star: random => {
    const spikes = weighted(random, [[5, 3], [6, 1], [4, 1]]);
    return [linePath(wobble(random, Array.from({ length: spikes * 2 + 1 }, (_, index) => polar(index % 2 ? 0.2 : 0.5, (index / (spikes * 2)) * TURN - Math.PI / 2)), 0.04))];
  },
  x: random => [linePath(wobble(random, [[-0.45, -0.45], [0.45, 0.45]], 0.05)), linePath(wobble(random, [[0.45, -0.45], [-0.45, 0.45]], 0.05))],
  arrow: random => [
    smoothPath(wobble(random, [[-0.5, 0.1], [0, between(random, -0.25, 0.25)], [0.45, 0]], 0.03)),
    linePath(wobble(random, [[0.25, -0.18], [0.48, 0], [0.25, 0.2]], 0.03)),
  ],
  bolt: random => [linePath(wobble(random, [[-0.1, -0.5], [0.2, -0.1], [-0.05, -0.05], [0.25, 0.5], [-0.25, 0.02], [0.02, 0], [-0.25, -0.4]], 0.02))],
  zigzag: random => {
    const teeth = Math.floor(between(random, 4, 9));
    return [linePath(wobble(random, Array.from({ length: teeth + 1 }, (_, index) => [-0.5 + index / teeth, index % 2 ? -0.15 : 0.15]), 0.03))];
  },
  spiral: random => [smoothPath(wobble(random, Array.from({ length: 60 }, (_, step) => polar(0.02 + step * 0.0075, step * 0.35)), 0.01))],
  heart: random => [smoothPath(wobble(random, Array.from({ length: 41 }, (_, step) => {
    const angle = (step / 40) * TURN;
    return [0.03 * 16 * Math.sin(angle) ** 3, -0.03 * (13 * Math.cos(angle) - 5 * Math.cos(2 * angle) - 2 * Math.cos(3 * angle) - Math.cos(4 * angle))] as const;
  }), 0.02))],
  sun: random => [ring(random, 12, 0.2), ...Array.from({ length: 9 }, (_, ray) => {
    const angle = (ray / 9) * TURN + between(random, -0.15, 0.15);
    return linePath([polar(0.28, angle), polar(between(random, 0.42, 0.5), angle)]);
  })],
  monster: random => [
    smoothPath(wobble(random, Array.from({ length: 18 }, (_, index) => polar(index % 3 === 0 ? 0.5 : 0.38, (index / 18) * TURN)), 0.03), true),
    ring(random, 8, 0.08, [-0.15, -0.08], 0.01),
    ring(random, 8, 0.06, [0.15, -0.1], 0.01),
    linePath(Array.from({ length: 7 }, (_, tooth) => [-0.22 + tooth * 0.073, 0.15 + (tooth % 2 ? 0.08 : 0)])),
  ],
  skull: random => [
    smoothPath(wobble(random, [...Array.from({ length: 14 }, (_, index) => polar(0.38, Math.PI * 0.9 + (index / 13) * Math.PI * 1.2)), [0.22, 0.25], [0.2, 0.45], [-0.2, 0.45], [-0.22, 0.25]], 0.02), true),
    linePath([[-0.2, -0.12], [-0.06, 0.02]]), linePath([[-0.06, -0.12], [-0.2, 0.02]]),
    linePath([[0.06, -0.12], [0.2, 0.02]]), linePath([[0.2, -0.12], [0.06, 0.02]]),
    linePath([[-0.1, 0.32], [-0.1, 0.44]]), linePath([[0, 0.32], [0, 0.44]]), linePath([[0.1, 0.32], [0.1, 0.44]]),
  ],
  scrawl: random => {
    const points: Point[] = [];
    for (let x = -0.5; x < 0.45;) {
      const loop = between(random, 0.04, 0.09);
      points.push([x, between(random, -0.05, 0.08)], [x + loop, -between(random, 0.1, 0.3)], [x + loop * 0.3, between(random, -0.02, 0.05)]);
      x += loop * between(random, 1.2, 2.2);
    }
    return [smoothPath(points)];
  },
  hatch: random => Array.from({ length: Math.floor(between(random, 3, 7)) }, (_, index) => linePath(wobble(random, [[-0.4 + index * 0.13, 0.4], [-0.1 + index * 0.13, -0.4]], 0.03))),
  triangle: random => [linePath(wobble(random, [[0, -0.45], [0.42, 0.35], [-0.42, 0.35], [0.02, -0.42]], 0.03))],
  eye: random => [smoothPath(wobble(random, [[-0.5, 0], [0, -0.28], [0.5, 0], [0, 0.28], [-0.5, 0]], 0.02)), ring(random, 10, 0.11, [0, 0], 0.01)],
  bang: random => [linePath(wobble(random, [[0, -0.5], [0.02, 0.15]], 0.02)), linePath(wobble(random, [[0.01, 0.32], [0.02, 0.38]], 0.01))],
  crown: random => [linePath(wobble(random, [[-0.45, 0.3], [-0.45, -0.25], [-0.2, 0.05], [0, -0.35], [0.2, 0.05], [0.45, -0.25], [0.45, 0.3], [-0.45, 0.3]], 0.03))],
  ring: random => [ring(random, 14, 0.4, [0, 0], 0.04), linePath(wobble(random, [[-0.25, -0.25], [0.25, 0.25]], 0.03))],
  dots: random => Array.from({ length: Math.floor(between(random, 3, 7)) }, () => {
    const [x, y] = [between(random, -0.4, 0.4), between(random, -0.4, 0.4)];
    return linePath([[x, y], [x + 0.01, y + 0.01]]);
  }),
  plus: random => [linePath(wobble(random, [[0, -0.4], [0, 0.4]], 0.04)), linePath(wobble(random, [[-0.4, 0], [0.4, 0]], 0.04))],
  squiggle: random => [smoothPath(wobble(random, Array.from({ length: 25 }, (_, step) => [-0.5 + step / 24, Math.sin(step * 1.1) * 0.15]), 0.02))],
} satisfies Record<string, (random: Chance) => string[]>;

export type ScribbleKind = keyof typeof SHAPES;
export const SCRIBBLE_KINDS = Object.keys(SHAPES) as ScribbleKind[];

// How often each mark turns up
const KIND_WEIGHTS: readonly (readonly [ScribbleKind, number])[] = [
  ["star", 8], ["x", 9], ["arrow", 6], ["bolt", 6], ["zigzag", 7], ["spiral", 4], ["heart", 3], ["sun", 3], ["monster", 3], ["skull", 2],
  ["scrawl", 9], ["hatch", 6], ["triangle", 4], ["eye", 2], ["bang", 3], ["crown", 2], ["ring", 3], ["dots", 4], ["plus", 5], ["squiggle", 5],
];

// The lines of one mark in its unit box, drawn by this hand (random)
export const scribbleShape = (kind: ScribbleKind, random: Chance): string[] => SHAPES[kind](random);

// Color slot of a mark: the four scribble colors of the settings, white only when switched on
export type ScribbleColor = "color1" | "color2" | "color3" | "color4" | "white";
// Line: chalk (grainy, broken), marker (shaky) or neon (glowing)
export type ScribbleLine = "chalk" | "marker" | "neon";
export type Scribble = {
  kind: ScribbleKind; x: number; y: number; size: number; rotate: number; width: number; color: ScribbleColor; line: ScribbleLine; paths: string[];
};
// The free area in shares of the stage (an ellipse inside this box stays empty)
export type FreeArea = { x: number; y: number; width: number; height: number };

const insideFree = (free: FreeArea, x: number, y: number) => {
  const [radiusX, radiusY] = [(free.width * STAGE.width) / 2, (free.height * STAGE.height) / 2];
  const [centerX, centerY] = [free.x * STAGE.width + radiusX, free.y * STAGE.height + radiusY];
  return ((x - centerX) / radiusX) ** 2 + ((y - centerY) / radiusY) ** 2 < 1;
};
// Beyond the edge a mark may hang out of the picture a little
const BLEED = 20;
// Tries per mark before the layout gives up (a free area that covers everything)
const TRIES = 60;

// count marks on the stage in pixels, none with its middle in the free area
export function layoutScribbles(seed: number, count: number, free: FreeArea, white: boolean): Scribble[] {
  const random = chance(seed);
  const colors: readonly (readonly [ScribbleColor, number])[] = [["color1", 34], ["color2", 35], ["color3", 12], ["color4", 12], ["white", white ? 7 : 0]];
  const placed: Scribble[] = [];
  for (let attempt = 0; placed.length < count && attempt < count * TRIES; attempt++) {
    const [x, y] = [between(random, -BLEED, STAGE.width + BLEED), between(random, -BLEED, STAGE.height + BLEED)];
    if (insideFree(free, x, y)) continue;
    const size = weighted(random, [[between(random, 10, 26), 50], [between(random, 26, 56), 34], [between(random, 56, 110), 13], [between(random, 110, 190), 3]]);
    const width = weighted(random, [[1.4, 30], [2.2, 30], [3.2, 22], [4.8, 12], [7, 6]]) * (size > 90 ? 1.4 : 1);
    const line: ScribbleLine = width < 2.5 ? weighted(random, [["chalk", 6], ["marker", 4]]) : weighted(random, [["marker", 6], ["chalk", 2], ["neon", 2]]);
    const kind = weighted(random, KIND_WEIGHTS);
    placed.push({ kind, x, y, size, rotate: between(random, -40, 40), width, color: weighted(random, colors), line, paths: scribbleShape(kind, random) });
  }
  return placed;
}
