// Scribble monsters of the Chaos theme, the minimes: per chatter a small monster as shaky lines (round, spiky or lumpy
// body, two eyes of different size, zigzag mouth, arms, two or three short legs, now and then horns or an antenna), the
// form from the login, so the same chatter always gets the same monster. Plus the spray splat of the chat reaction. Box
// of a figure: x from -0.6 to 0.6, y from -0.75 up to the ground at 0.5. Only shapes; colors come from the chatter and
// the settings. Pure and deterministic. Check: monsters.check.ts.
import { seedOf } from "../../core/hash.ts";
import { between, chance, weighted, type Chance } from "./chance.ts";
import { linePath, polar, smoothPath, wobble, type Point } from "./paths.ts";

// Where the feet stand
export const GROUND = 0.5;

const TURN = Math.PI * 2;
// Middle of the body and how flat it is
const CENTER_Y = -0.08;
const FLAT = 0.88;

type BodyKind = "round" | "spiky" | "lumpy";
type TopKind = "none" | "horns" | "antenna";

export type Monster = {
  form: string;
  body: string;
  eyes: readonly string[];
  pupils: readonly string[];
  mouth: string;
  grin: string;
  arms: readonly string[];
  legs: readonly string[];
  extras: readonly string[];
};

const ring = (random: Chance, center: Point, radius: number, steps = 8) =>
  smoothPath(wobble(random, Array.from({ length: steps }, (_, index) => {
    const [x, y] = polar(radius, (index / steps) * TURN);
    return [center[0] + x, center[1] + y] as const;
  }), radius * 0.15), true);

// Outline around the middle: radius per step, stretched sideways by width
function outline(random: Chance, kind: BodyKind, width: number): string {
  const steps = { round: 10, spiky: 16, lumpy: 7 }[kind];
  const radius = (index: number) => {
    if (kind === "spiky") return index % 2 ? 0.3 : between(random, 0.38, 0.43);
    if (kind === "lumpy") return between(random, 0.3, 0.42);
    return between(random, 0.34, 0.38);
  };
  const points = Array.from({ length: steps }, (_, index): Point => {
    const [x, y] = polar(radius(index), (index / steps) * TURN);
    return [x * width, CENTER_Y + y * FLAT];
  });
  return kind === "spiky" ? `${linePath(wobble(random, points, 0.015))} Z` : smoothPath(wobble(random, points, 0.02), true);
}

// Zigzag across the face; the grin is wider, bent upwards and has longer teeth
function zigzag(random: Chance, half: number, y: number, tooth: number, bend: number): string {
  const teeth = Math.floor(between(random, 5, 9));
  return linePath(Array.from({ length: teeth + 1 }, (_, index): Point => {
    const x = -half + (index / teeth) * half * 2;
    return [x, y - bend * (1 - (x / half) ** 2) + (index % 2 ? tooth : 0)];
  }));
}

// A short leg from the body down to the ground, the foot bent to the outside
function leg(random: Chance, x: number, side: number): string {
  const knee: Point = [x + between(random, -0.04, 0.04), between(random, 0.34, 0.4)];
  const heel: Point = [x + between(random, -0.02, 0.02), GROUND];
  return linePath([[x, 0.2], knee, heel, [heel[0] + side * between(random, 0.06, 0.1), GROUND]]);
}

function top(random: Chance, kind: TopKind): string[] {
  if (kind === "horns") {
    return [-1, 1].map(side => linePath(wobble(random, [[side * 0.08, -0.43], [side * between(random, 0.2, 0.28), -between(random, 0.56, 0.64)], [side * 0.22, -0.38]], 0.01)));
  }
  if (kind === "antenna") {
    const tip: Point = [between(random, -0.08, 0.08), -0.6];
    return [smoothPath([[0, -0.42], [tip[0] * 0.3 + 0.04, -0.52], tip]), ring(random, [tip[0], tip[1] - 0.06], 0.055)];
  }
  return [];
}

// The monster of a chatter: the same login always gives the same monster
export function monsterOf(login: string): Monster {
  const random = chance(seedOf(login));
  const body = weighted<BodyKind>(random, [["round", 3], ["spiky", 3], ["lumpy", 2]]);
  const head = weighted<TopKind>(random, [["none", 3], ["horns", 2], ["antenna", 2]]);
  const legCount = weighted(random, [[2, 3], [3, 1]]);
  const width = between(random, 0.88, 1.12);
  const eyeAt: Point[] = [[between(random, -0.18, -0.1), between(random, -0.2, -0.12)], [between(random, 0.08, 0.16), between(random, -0.22, -0.12)]];
  const eyeSize = [between(random, 0.06, 0.1), between(random, 0.05, 0.11)];
  const feet = legCount === 2 ? [-0.14, 0.14] : [-0.18, 0, 0.18];
  return {
    form: `${body}-${head}-${legCount}`,
    body: outline(random, body, width),
    eyes: eyeAt.map((center, index) => ring(random, center, eyeSize[index])),
    pupils: eyeAt.map(([x, y], index) => {
      const [dx, dy] = polar(eyeSize[index] * 0.35, random() * TURN);
      return linePath([[x + dx, y + dy], [x + dx + 0.002, y + dy]]);
    }),
    mouth: zigzag(random, 0.17, 0.06, 0.05, 0),
    grin: zigzag(random, 0.24, 0.1, 0.08, -0.06),
    arms: [-1, 1].map(side => smoothPath(wobble(random, [[side * 0.32 * width, 0], [side * 0.46, -0.06], [side * 0.54, between(random, -0.2, -0.08)]], 0.015))),
    legs: feet.map(x => leg(random, x * width, Math.sign(x) || 1)),
    extras: top(random, head),
  };
}

// The spray splat of a chat reaction: a ragged blob and a few droplets around it, from the seed
export function splatOf(seed: number): string[] {
  const random = chance(seed);
  const steps = 14;
  const blob = smoothPath(Array.from({ length: steps }, (_, index) => polar(index % 2 ? between(random, 0.16, 0.22) : between(random, 0.26, 0.34), (index / steps) * TURN)), true);
  const drops = Array.from({ length: Math.floor(between(random, 4, 7)) }, () =>
    ring(random, polar(between(random, 0.38, 0.5), random() * TURN), between(random, 0.02, 0.05), 6));
  return [blob, ...drops];
}
