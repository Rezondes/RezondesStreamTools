// Check for idle.ts of the Chaos theme: scribbles boil through three takes at the set rate and never all switch at the
// same moment, off means the first take; drips run, a drop forms and falls in a loop without a jump; drift and dust
// come from the time. Runs with npm test.
import assert from "node:assert/strict";
import { boilTake, dripAt, driftAt, dustAt, TAKES } from "./idle.ts";

// Kochen: three takes at fps, neighbours switch at other moments, off means take 0
const takes = new Set(Array.from({ length: 40 }, (_, step) => boilTake(0, step / 16, 8, true)));
assert.deepEqual([...takes].sort(), [0, 1, 2]);
assert.equal(boilTake(0, 0.1, 8, true), boilTake(0, 0.1 + TAKES / 8, 8, true), "repeats after three takes");
const switchesOf = (index: number) => Array.from({ length: 80 }, (_, step) => step).filter(step => boilTake(index, step / 80, 8, true) !== boilTake(index, (step + 1) / 80, 8, true));
assert.notDeepEqual(switchesOf(0), switchesOf(1), "neighbours switch at different moments");
assert.equal(boilTake(5, 3.3, 8, false), 0);
assert.equal(boilTake(5, 3.3, 0, true), 0);

// Laufnasen als Schleife: runs to its length, then a drop grows, falls and fades; the next one starts invisible
const drip = { length: 100, speed: 50 };
assert.deepEqual(dripAt(drip, 0, true), { run: 0, drop: null });
assert.equal(dripAt(drip, 1, true).run, 50);
assert.equal(dripAt(drip, 1, true).drop, null);
assert.equal(dripAt(drip, 2, true).drop?.size, 0, "the first drop starts small");
assert.deepEqual(dripAt(drip, 5, false), { run: 100, drop: null }, "without the loop the drip only runs");
const steps = 960;
for (let step = 1; step <= steps; step++) {
  const [before, now] = [dripAt(drip, 2 + ((step - 1) / steps) * 4.8, true), dripAt(drip, 2 + (step / steps) * 4.8, true)];
  assert.equal(now.run, 100, "the run never jumps back");
  const visible = (state: typeof now) => (state.drop ? state.drop.size * state.drop.alpha : 0);
  assert.ok(Math.abs(visible(now) - visible(before)) < 0.05, `no jump at ${step}`);
}

// Drift and dust
assert.deepEqual(driftAt(3, 4, 2.5, false), { x: 0, y: 0, rotate: 0 });
assert.ok(Math.abs(driftAt(3, 4, 2.5, true).x) <= 2.5);
assert.deepEqual(dustAt(9, 4, 2), dustAt(9, 4, 2));
for (const time of [0, 7, 300]) {
  const dust = dustAt(9, 4, time);
  assert.ok(dust.y >= 0 && dust.y < 1080, `dust stays on the stage at ${time}`);
}

console.log("chaos idle ok");
