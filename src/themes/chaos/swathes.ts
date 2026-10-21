// Energy swathes of the Chaos theme: flame tongues and many short jagged streaks that strike in from one edge of the
// 1920x1080 stage, saturated outside and light near the edge they come from (like painted energy). Only shapes, places
// and a tone per piece; colors come from the settings. Pure and deterministic from a seed. Check: swathes.check.ts.
import { STAGE } from "../../core/screens/screens.ts";
import { between, chance, weighted, type Chance } from "./chance.ts";
import { linePath, type Point } from "./paths.ts";

export type SwathSide = "left" | "right";
// hot: almost white core; magenta, cyan, violet: the saturated body; lilac: the soft rim
export type SwathTone = "hot" | "magenta" | "cyan" | "violet" | "lilac";
export type Tongue = { d: string; tone: SwathTone; opacity: number };
export type Streak = { d: string; tone: SwathTone; width: number; opacity: number };
export type Swathes = { tongues: Tongue[]; streaks: Streak[] };

const TONGUES = 14;
// How far a swath reaches into the stage at most (share of the width)
const REACH = 0.62;

// A point measured from the side the swath comes from: inward runs into the stage
const fromSide = (side: SwathSide, inward: number, y: number): Point => [side === "left" ? inward : STAGE.width - inward, y];

const toneBy = (random: Chance, share: number): SwathTone =>
  share < 0.18 ? weighted(random, [["hot", 3], ["lilac", 2]]) : weighted(random, [["magenta", 5], ["cyan", 4], ["violet", 3], ["lilac", 1]]);

// A flame tongue: wide at the edge, jagged along both sides, a sharp tip that leans up
function tongue(random: Chance, side: SwathSide): Tongue {
  const [base, length, width] = [between(random, -60, STAGE.height + 60), between(random, 0.2, REACH) * STAGE.width, between(random, 60, 220)];
  const rise = between(random, -0.35, 0.05) * length;
  const steps = 7;
  const edge = (sign: number) => Array.from({ length: steps }, (_, step) => {
    const share = step / steps;
    return fromSide(side, share * length + between(random, -20, 20), base + rise * share + sign * (width / 2) * (1 - share) * between(random, 0.5, 1.3));
  });
  const tip = fromSide(side, length, base + rise);
  const outline = [...edge(-1), tip, ...edge(1).reverse()];
  return { d: `${linePath(outline)} Z`, tone: toneBy(random, length / STAGE.width - 0.15), opacity: between(random, 0.55, 0.95) };
}

// A streak: a short jagged line pointing inward, lighter near the edge
function streak(random: Chance, side: SwathSide): Streak {
  const start = between(random, 0, REACH * 0.9) * STAGE.width;
  const length = between(random, 40, 260);
  const y = between(random, -40, STAGE.height + 40);
  const lean = between(random, -0.5, 0.15);
  const points = Array.from({ length: 4 }, (_, step) => fromSide(side, start + (length * step) / 3, y + lean * (length * step) / 3 + between(random, -8, 8)));
  return { d: linePath(points), tone: toneBy(random, start / STAGE.width), width: weighted(random, [[between(random, 1.5, 3), 6], [between(random, 3, 7), 3], [between(random, 7, 14), 1]]), opacity: between(random, 0.4, 1) };
}

// The swath of one side: flame tongues and count streaks
export function swathes(side: SwathSide, seed: number, count: number): Swathes {
  const random = chance(seed);
  return {
    tongues: Array.from({ length: TONGUES }, () => tongue(random, side)),
    streaks: Array.from({ length: count }, () => streak(random, side)),
  };
}
