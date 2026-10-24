// Raid pack of the alerts (plans/PLAN-ALERTDAUER.md package 2): for every raider one run of a figure across the
// stage, at most maxOnScreen at once; a big raid takes longer instead of crowding. Starts are crossMs / maxOnScreen
// apart and every run lasts at most crossMs, so no more than maxOnScreen overlap. Lane, tempo and pick (the look of the
// figure, 0 to 1) come from hash with the seed, the starts do not. Pure; check: raidPack.check.ts.
import { hash } from "../hash.ts";

// raiders: the amount of the raid; maxDogs: most runs in all; crossMs: the longest run; speedSpread: share by which a
// run may be shorter (0 to 1); lanes: how many lanes the theme has; seed: start value of the chance
export type RaidPackOptions = { raiders: number; maxDogs: number; maxOnScreen: number; crossMs: number; speedSpread: number; lanes: number; seed: number };
// One run: its index, when it starts and how long it takes (ms from the start of the pack), its lane, its look
export type RaidRunner = { index: number; startMs: number; durationMs: number; lane: number; pick: number };
// runners in the order of their starts; gapMs between two starts; endMs: when the last run is done (0 without runs)
export type RaidPack = { runners: RaidRunner[]; gapMs: number; endMs: number };

// fixed: each runner draws three numbers from the seed (tempo, lane, look); the spread uses 95 % of its range so a run
// with spread stays shorter than crossMs
const DRAWS = 3;
const SALT = 7919;
const SPREAD_USE = 0.95;

const chanceOf = (seed: number, index: number, draw: number) => hash(seed * SALT + index * DRAWS + draw);

export function raidPack({ raiders, maxDogs, maxOnScreen, crossMs, speedSpread, lanes, seed }: RaidPackOptions): RaidPack {
  const count = Math.max(0, Math.floor(Math.min(raiders, maxDogs)));
  const gapMs = crossMs / Math.max(1, Math.floor(maxOnScreen));
  const runners = Array.from({ length: count }, (_, index): RaidRunner => ({
    index,
    startMs: index * gapMs,
    durationMs: crossMs * (1 - speedSpread + speedSpread * SPREAD_USE * chanceOf(seed, index, 0)),
    lane: Math.floor(chanceOf(seed, index, 1) * Math.max(1, Math.floor(lanes))),
    pick: chanceOf(seed, index, 2),
  }));
  return { runners, gapMs, endMs: count ? (count - 1) * gapMs + crossMs : 0 };
}

// The runs on the way at elapsedMs (after their start, before their end) with their progress from 0 to 1; only the
// window of starts within the last crossMs is looked at, not the whole list
export function runnersAt(pack: RaidPack, elapsedMs: number): { runner: RaidRunner; progress: number }[] {
  const count = pack.runners.length;
  if (count === 0) return [];
  const crossMs = pack.endMs - (count - 1) * pack.gapMs;
  const first = Math.max(0, Math.ceil((elapsedMs - crossMs) / pack.gapMs));
  const last = Math.min(count - 1, Math.floor(elapsedMs / pack.gapMs));
  const running: { runner: RaidRunner; progress: number }[] = [];
  for (let index = first; index <= last; index++) {
    const runner = pack.runners[index];
    if (elapsedMs > runner.startMs && elapsedMs < runner.startMs + runner.durationMs) running.push({ runner, progress: (elapsedMs - runner.startMs) / runner.durationMs });
  }
  return running;
}
