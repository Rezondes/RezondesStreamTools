// Check for flares.ts: a flare rises, bursts at its highest point and its sparks sink; pure function of the time; new
// flares follow in turn with their colors. Runs with npm test.
import assert from "node:assert/strict";
import { FLARE_LIFE, flaresAt } from "./flares.ts";

const options = { every: 2.2, sparks: 40, colors: 3 };
const first = (time: number) => flaresAt(7, time, options)[0];

// Rises: the rocket goes up before the burst, no sparks yet
const low = first(0.3).rocket!;
const high = first(1.2).rocket!;
assert.ok(high[1] > low[1], "rises");
assert.equal(first(1.2).sparks.length, 0);
// Bursts at the highest point: right after the burst the sparks sit near the top of the rise
const burst = first(1.45);
assert.equal(burst.rocket, null);
assert.equal(burst.sparks.length, 40);
const mean = (time: number) => {
  const sparks = first(time).sparks;
  return sparks.reduce((sum, spark) => sum + spark.position[1], 0) / sparks.length;
};
assert.ok(Math.abs(mean(1.41) - high[1]) < 2, "bursts at the top");
// Sparks sink and fade
assert.ok(mean(3.6) < mean(1.6), "sparks sink");
assert.ok(first(3.9).sparks.every(spark => spark.opacity < 1), "sparks fade");

// Pure function of the time
assert.deepEqual(flaresAt(7, 5.3, options), flaresAt(7, 5.3, options));
// Nothing before the start; later flares follow with the next color; old flares are gone after their life
assert.deepEqual(flaresAt(7, -1, options), []);
const later = flaresAt(7, 2.4, options);
assert.deepEqual(later.map(flare => flare.color), [0, 1]);
assert.ok(flaresAt(7, 10, options).every(flare => 10 - flare.index * options.every < FLARE_LIFE));
assert.deepEqual(flaresAt(7, 3, { ...options, every: 0 }), []);

console.log("koth flares ok");
