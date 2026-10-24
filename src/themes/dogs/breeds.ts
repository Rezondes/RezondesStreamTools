// The six breeds of the Dogs theme as data (DESIGN-DOGS.md "Figuren", prototype refs/pixeldogs.js): per breed its grid,
// the shapes of hip, body, chest, neck, head, ears and muzzle in paint order, leg tops and hips, eye, mouth, tag, collar,
// tail and the areas where markings go (coats.ts). Side view facing right; foot row = height - 2, ground outline =
// height - 1. Keys: O coat, W mark, S saddle, T tan, M mask, X spots, d darker coat, P pink, N nose, R collar.
// buildBreed paints the body (without markings and outline, dog.ts finishes it) and the five wag stages of the tail.
// Check: breeds.check.ts.
import { fillShape, drawLine, finish, pixelGrid, setKey, type PixelGrid, type Point, type Shape } from "./pixels.ts";

export const BREED_IDS = ["corgi", "shiba", "labrador", "dalmatiner", "dackel", "mops"] as const;
export type BreedId = (typeof BREED_IDS)[number];

// part "ear": counted by the check (corgi ears at least 8 pixels high)
type Paint = { shape: Shape; key: string; only?: string; part?: "ear" };
type Tail =
  | { kind: "brush"; points: readonly Point[]; base: Point; tip?: string }
  | { kind: "ring"; center: Point; radius: Point; hole: number; base: Point; tip?: string };
// Areas of the markings: saddle on the back, light chest, cheeks and belly, tan above the eye, mask on the muzzle
export type MarkAreas = { back: Shape; chest: Shape; cheek: Shape; belly: Shape; muzzle: Shape; brow: Point };
export type Breed = {
  id: BreedId; name: string; width: number; height: number; body: readonly Paint[];
  legTop: number; legs: { upper: string; lower: string; hips: readonly [number, number, number, number] };
  eye: Point; mouth: Point; tag: Point; collar: readonly [Point, Point]; tail: Tail; areas: MarkAreas; spots?: true;
};

const ellipse = (x: number, y: number, rx: number, ry: number): Shape => ({ kind: "ellipse", center: [x, y], radius: [rx, ry] });
const polygon = (...points: Point[]): Shape => ({ kind: "polygon", points });
const rect = (x0: number, y0: number, x1: number, y1: number): Shape => ({ kind: "rect", from: [x0, y0], to: [x1, y1] });
const paint = (shape: Shape, key: string, only?: string): Paint => ({ shape, key, ...(only ? { only } : {}) });
const ear = (shape: Shape): Paint => ({ shape, key: "O", part: "ear" });

const CORGI: Breed = {
  id: "corgi", name: "Corgi", width: 52, height: 34,
  body: [
    paint(ellipse(10, 19, 5, 6), "O"), paint(ellipse(22, 20, 15, 7), "O"), paint(ellipse(34, 21, 6, 6), "W"),
    paint(rect(14, 25, 32, 27), "W", "O"),
    paint(polygon([28, 16], [32, 10], [39, 12], [38, 21], [31, 21]), "O"),
    paint(polygon([35, 14], [39, 13], [40, 18], [38, 23], [34, 21]), "W", "O"),
    ear(polygon([30.5, 10.5], [33, 0], [36.5, 9])), ear(polygon([35, 9], [39, 0], [42.5, 9.5])),
    paint(ellipse(37, 13, 6, 5), "O"),
    paint(polygon([31.5, 10], [33, 2.5], [35.2, 9]), "d", "O"), paint(polygon([36.6, 9], [39, 2.5], [41, 9]), "P"),
    paint(rect(39, 7, 40, 11), "W", "O"),
    paint(polygon([40, 12], [47, 13], [47, 16], [42, 18], [39, 16]), "W"),
    paint(rect(46, 13, 47, 14), "N"),
  ],
  legTop: 26, legs: { upper: "O", lower: "W", hips: [12, 15, 31, 34] },
  eye: [38, 11], mouth: [42, 18], tag: [34, 22], collar: [[30, 13], [33, 20]],
  tail: { kind: "brush", points: [[10, 15], [6, 12], [3, 6], [4, 2], [7, 3], [9, 8], [13, 13]], base: [11, 15], tip: "W" },
  areas: { back: polygon([6, 13], [33, 12.5], [33, 17.5], [6, 18]), chest: ellipse(34, 21, 6, 6), cheek: polygon([39, 15], [44, 17], [40, 19]), belly: rect(14, 25, 32, 27), muzzle: polygon([40, 12], [47, 13], [47, 16], [42, 18], [39, 16]), brow: [38, 9] },
};

const SHIBA: Breed = {
  id: "shiba", name: "Shiba", width: 50, height: 39,
  body: [
    paint(ellipse(11, 19, 5, 6), "O"), paint(ellipse(22, 20, 13, 6), "O"), paint(ellipse(32, 21, 5, 6), "W"),
    paint(rect(15, 24, 30, 26), "W", "O"),
    paint(polygon([27, 16], [31, 8], [38, 9], [37, 20], [30, 21]), "O"),
    paint(polygon([35, 12], [39, 12], [39, 18], [36, 22], [33, 20]), "W", "O"),
    ear(polygon([32, 7], [34, 1], [36, 7])), ear(polygon([36, 6], [38, 0], [41, 6])),
    paint(ellipse(37, 10, 6, 5), "O"),
    paint(polygon([37, 6], [38, 2], [40, 6]), "P"),
    paint(ellipse(40, 13, 4, 2.6), "W", "O"),
    paint(polygon([41, 10], [47, 11], [47, 14], [42, 16], [40, 14]), "W"),
    paint(rect(38, 7, 38, 7), "W"),
    paint(rect(46, 11, 47, 12), "N"),
  ],
  legTop: 25, legs: { upper: "O", lower: "W", hips: [13, 16, 30, 33] },
  eye: [39, 9], mouth: [42, 16], tag: [34, 21], collar: [[30, 11], [33, 19]],
  tail: { kind: "ring", center: [12, 10], radius: [4.5, 4.2], hole: 1.8, base: [11, 15], tip: "W" },
  areas: { back: polygon([7, 14], [31, 13.5], [31, 17], [7, 18]), chest: ellipse(32, 21, 5, 6), cheek: ellipse(40, 13, 4, 2.6), belly: rect(15, 24, 30, 26), muzzle: polygon([41, 10], [47, 11], [47, 14], [42, 16], [40, 14]), brow: [39, 7] },
};

const LABRADOR: Breed = {
  id: "labrador", name: "Labrador", width: 60, height: 46,
  body: [
    paint(ellipse(12, 23, 6, 7), "O"), paint(ellipse(26, 24, 16, 8), "O"), paint(ellipse(38, 25, 7, 8), "O"),
    paint(ellipse(41, 27, 4, 5), "W", "O"),
    paint(polygon([32, 20], [37, 10], [46, 12], [44, 25], [35, 26]), "O"),
    paint(ellipse(45, 12, 7, 6), "O"),
    paint(polygon([49, 11], [57, 13], [57, 17], [50, 19], [47, 16]), "O"),
    ear(polygon([39, 7], [44, 7], [46, 15], [42, 18], [39, 13])),
    paint(polygon([39, 7], [44, 7], [46, 15], [42, 18], [39, 13]), "d"),
    paint(rect(56, 13, 57, 14), "N"),
  ],
  legTop: 31, legs: { upper: "O", lower: "O", hips: [15, 18, 37, 40] },
  eye: [48, 10], mouth: [52, 19], tag: [40, 25], collar: [[36, 14], [39, 24]],
  tail: { kind: "brush", points: [[12, 18], [2, 19], [1, 21], [11, 23]], base: [12, 20] },
  areas: { back: polygon([7, 16], [42, 15], [42, 20], [7, 21]), chest: ellipse(41, 27, 4, 5), cheek: ellipse(50, 16, 3, 2), belly: rect(16, 29, 38, 31), muzzle: polygon([49, 11], [57, 13], [57, 17], [50, 19], [47, 16]), brow: [48, 8] },
};

const DALMATINER: Breed = {
  id: "dalmatiner", name: "Dalmatiner", width: 60, height: 50,
  body: [
    paint(ellipse(13, 23, 5, 6), "O"), paint(ellipse(26, 24, 15, 7), "O"), paint(ellipse(37, 25, 6, 7), "O"),
    paint(polygon([32, 20], [37, 8], [45, 9], [44, 24], [35, 26]), "O"),
    paint(ellipse(44, 10, 6, 5), "O"),
    paint(polygon([48, 9], [56, 11], [56, 14], [49, 16], [46, 13]), "O"),
    ear(polygon([39, 6], [44, 6], [45, 13], [41, 15], [39, 11])),
    paint(polygon([39, 6], [44, 6], [45, 13], [41, 15], [39, 11]), "X"),
    paint(rect(55, 11, 56, 12), "N"),
  ],
  legTop: 30, legs: { upper: "O", lower: "O", hips: [15, 18, 36, 39] },
  eye: [47, 8], mouth: [51, 16], tag: [39, 24], collar: [[35, 12], [38, 23]], spots: true,
  tail: { kind: "brush", points: [[12, 19], [1, 23], [1, 24], [12, 21]], base: [12, 20] },
  areas: { back: polygon([8, 17], [40, 16], [40, 21], [8, 22]), chest: ellipse(37, 26, 5, 5), cheek: ellipse(49, 13, 3, 2), belly: rect(15, 28, 36, 30), muzzle: polygon([48, 9], [56, 11], [56, 14], [49, 16], [46, 13]), brow: [47, 6] },
};

const DACKEL: Breed = {
  id: "dackel", name: "Dackel", width: 64, height: 30,
  body: [
    paint(ellipse(12, 16, 5, 6), "O"), paint(ellipse(30, 17, 20, 6), "O"), paint(ellipse(46, 18, 6, 7), "O"),
    paint(ellipse(47, 21, 4, 4), "T", "O"),
    paint(polygon([42, 13], [47, 6], [53, 8], [51, 19], [44, 20]), "O"),
    paint(ellipse(51, 8, 5, 4), "O"),
    paint(polygon([54, 7], [63, 9], [63, 11], [56, 13], [53, 11]), "T"),
    ear(polygon([46, 6], [51, 6], [52, 14], [48, 16], [46, 11])),
    paint(polygon([46, 6], [51, 6], [52, 14], [48, 16], [46, 11]), "d"),
    paint(rect(53, 5, 53, 5), "T"),
    paint(rect(62, 8, 63, 9), "N"),
  ],
  legTop: 22, legs: { upper: "O", lower: "T", hips: [15, 18, 44, 47] },
  eye: [53, 6], mouth: [57, 13], tag: [47, 19], collar: [[44, 10], [46, 18]],
  tail: { kind: "brush", points: [[10, 13], [2, 17], [1, 18], [10, 16]], base: [10, 15] },
  areas: { back: polygon([7, 11], [48, 10.5], [48, 14], [7, 15]), chest: ellipse(47, 21, 4, 4), cheek: ellipse(55, 11, 2, 1.5), belly: rect(14, 20, 44, 22), muzzle: polygon([54, 7], [63, 9], [63, 11], [56, 13], [53, 11]), brow: [53, 5] },
};

const MOPS: Breed = {
  id: "mops", name: "Mops", width: 44, height: 36,
  body: [
    paint(ellipse(9, 19, 5, 6), "O"), paint(ellipse(18, 20, 11, 7), "O"), paint(ellipse(27, 21, 5, 7), "O"),
    paint(polygon([22, 15], [26, 9], [33, 10], [33, 22], [25, 23]), "O"),
    paint(ellipse(30, 11, 7, 6), "O"),
    paint(ellipse(36, 12.5, 4, 3.8), "M"),
    paint(ellipse(32.5, 9, 2.6, 2.4), "M", "O"),
    ear(polygon([25, 6], [29, 5], [29, 9], [26, 9])),
    paint(polygon([25, 6], [29, 5], [29, 9], [26, 9]), "M"),
    paint(rect(30, 6, 31, 6), "d"), paint(rect(32, 7, 32, 7), "d"),
    paint(rect(38, 11, 39, 12), "N"),
  ],
  legTop: 26, legs: { upper: "O", lower: "O", hips: [11, 14, 26, 28] },
  eye: [32, 8], mouth: [36, 16], tag: [27, 22], collar: [[24, 13], [26, 22]],
  tail: { kind: "ring", center: [9, 12], radius: [3.3, 3.2], hole: 1.2, base: [9, 15] },
  areas: { back: polygon([5, 14], [26, 13.5], [26, 17], [5, 18]), chest: ellipse(27, 22, 4, 5), cheek: ellipse(33, 14, 2.5, 2), belly: rect(10, 24, 26, 26), muzzle: ellipse(36, 12.5, 4, 3.8), brow: [32, 6] },
};

export const BREEDS: Readonly<Record<BreedId, Breed>> = { corgi: CORGI, shiba: SHIBA, labrador: LABRADOR, dalmatiner: DALMATINER, dackel: DACKEL, mops: MOPS };

export const isBreed = (id: string): id is BreedId => (BREED_IDS as readonly string[]).includes(id);

// fixed: the tail bends by the wag (-1 to 1) in five stages, the top bends most, like the prototype
const WAG_STAGES = [-1, -0.5, 0, 0.5, 1];
const BEND = { brush: 1.6, reach: 10, back: -0.4, ring: 0.8, tipHeight: 0.55, tipWidth: 0.4 };

function tailGrid(breed: Breed, wag: number): PixelGrid {
  const grid = pixelGrid(breed.width, breed.height);
  const tail = breed.tail;
  const [baseX, baseY] = tail.base;
  if (tail.kind === "ring") {
    const centerX = tail.center[0] + wag * BEND.ring;
    const [radiusX, radiusY] = tail.radius;
    fillShape(grid, ellipse(centerX, tail.center[1], radiusX, radiusY), "O");
    fillShape(grid, ellipse(centerX, tail.center[1], tail.hole, tail.hole), ".");
    fillShape(grid, ellipse(centerX + 0.5, tail.center[1] + radiusY * BEND.tipHeight, radiusX * BEND.tipHeight, radiusY * BEND.tipWidth), tail.tip ?? "O", "O");
    fillShape(grid, polygon([baseX - 1, baseY + 1], [centerX - 1, tail.center[1] + radiusY - 1], [centerX + 2, tail.center[1] + radiusY - 1], [baseX + 2, baseY + 1]), "O");
  } else {
    const bent = tail.points.map(([x, y]): Point => [x + wag * BEND.brush * Math.min(1, Math.hypot(x - baseX, y - baseY) / BEND.reach) * (baseY - y >= 0 ? 1 : BEND.back), y]);
    fillShape(grid, polygon(...bent), "O");
    if (tail.tip) fillShape(grid, ellipse(bent[3][0], bent[3][1] + 1, 2, 2), tail.tip, "O");
  }
  return finish(grid);
}

export type BreedBuild = { breed: Breed; body: PixelGrid; tails: readonly PixelGrid[]; foot: number };

// The body of a breed (keys only: markings and outline follow in dog.ts) and its tails, built once per breed
const builds = new Map<BreedId, BreedBuild>();
export function buildBreed(id: BreedId): BreedBuild {
  const cached = builds.get(id);
  if (cached) return cached;
  const breed = BREEDS[id];
  const body = pixelGrid(breed.width, breed.height);
  for (const part of breed.body) fillShape(body, part.shape, part.key, part.only);
  drawLine(body, breed.collar[0], breed.collar[1], "R", 2);
  setKey(body, breed.tag[0], breed.tag[1], "Y");
  const build = { breed, body, tails: WAG_STAGES.map(wag => tailGrid(breed, wag)), foot: breed.height - 2 };
  builds.set(id, build);
  return build;
}
