// Shavings and steam of the spit as pure functions of the time (DESIGN-KEBAB.md "Bewegung"): every gap a shaving
// leaves the knife, falls in an arc onto the plate and stays there, the pile domes up; three wisps of steam rise over
// the spit and fade in a loop. Positions in grid units, angles in radians. Check: food.check.ts.
import { hash } from "../../core/hash.ts";

export type Point = { x: number; y: number };
export type ShavingOptions = { start: number; gapMs: number; fallMs: number; max: number; seed: number; from: Point; plate: Point };
type Shaving = Point & { angle: number; size: number; landed: boolean };
type SteamOptions = { from: Point; height: number };
type Wisp = { points: Point[]; alpha: number };

// fixed: how far shavings scatter at the knife and on the plate, how high the pile grows over how many shavings,
// their size and spin, like the prototype
const SCATTER = { knifeX: 30, knifeY: 22, plate: 48, drift: 30 };
const PILE = { height: 10, full: 90, jitter: 3, lift: 2 };
const SIZE = { min: 10, spread: 7 };
const SPIN = { min: 3, spread: 5, rest: 0.9 };
// fixed: salts of the random values per shaving
const SALT = { x: 0, sourceY: 7, spread: 3, landY: 9, drift: 11, angle: 5, spin: 13, size: 17, seed: 1000, index: 31 };
// fixed: steam: three wisps of eight segments, rise rate per second (one loop takes 1 / rate seconds), sway
export const STEAM = { wisps: 3, points: 8, rate: 0.32, sway: 9, gap: 22, wave: 5, alpha: 0.45 };

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
const SECOND_MS = 1000;

function shaving(time: number, index: number, options: ShavingOptions): Shaving {
  const random = (salt: number) => hash(options.seed * SALT.seed + index * SALT.index + salt);
  const fall = Math.max(options.fallMs / SECOND_MS, 1e-3);
  const progress = clamp((time - options.start - (index * options.gapMs) / SECOND_MS) / fall, 0, 1);
  const spread = (random(SALT.spread) - 0.5) * 2;
  const pile = (Math.min(index, PILE.full) / PILE.full) * PILE.height * (1 - spread * spread);
  const land = { x: options.plate.x + spread * SCATTER.plate, y: options.plate.y - PILE.lift - pile - random(SALT.landY) * PILE.jitter };
  const source = { x: options.from.x + (random(SALT.x) - 0.5) * SCATTER.knifeX, y: options.from.y + (random(SALT.sourceY) - 0.5) * SCATTER.knifeY };
  return {
    x: source.x + (land.x - source.x) * progress + Math.sin(progress * Math.PI) * (random(SALT.drift) - 0.5) * SCATTER.drift,
    y: source.y + (land.y - source.y) * progress * progress,
    angle: (random(SALT.angle) - 0.5) * SPIN.rest + (1 - progress) * (SPIN.min + random(SALT.spin) * SPIN.spread),
    size: SIZE.min + random(SALT.size) * SIZE.spread,
    landed: progress >= 1,
  };
}

export function shavingsAt(time: number, options: ShavingOptions): Shaving[] {
  const gap = options.gapMs / SECOND_MS;
  const count = gap > 0 ? clamp(Math.floor((time - options.start) / gap) + 1, 0, options.max) : 0;
  return Array.from({ length: count }, (_, index) => shaving(time, index, options));
}

export function steamAt(time: number, options: SteamOptions): Wisp[] {
  return Array.from({ length: STEAM.wisps }, (_, wisp) => {
    const phase = (time * STEAM.rate + wisp / STEAM.wisps) % 1;
    const baseX = options.from.x + (wisp - 1) * STEAM.gap;
    const points = Array.from({ length: STEAM.points + 1 }, (_, step) => {
      const along = step / STEAM.points;
      return {
        x: baseX + Math.sin(along * STEAM.wave + phase * 2 * Math.PI + wisp * 2) * STEAM.sway * along,
        y: options.from.y - (phase * options.height) / 2 - (along * options.height) / 2,
      };
    });
    return { points, alpha: Math.sin(phase * Math.PI) * STEAM.alpha };
  });
}
