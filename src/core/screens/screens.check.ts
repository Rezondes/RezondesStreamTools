// Check for screens.ts: countdown, break time, short clock, rotating quotes and the scaling of the stage.
// Runs with npm test.
import assert from "node:assert/strict";
import { countdown, rotating, shortClock, stageScale } from "./screens.ts";

// Countdown: rest in seconds and fraction of the elapsed time; over = 0 and 1; without duration done right away
assert.deepEqual(countdown(0, 60_000, 15_000), { left: 45, progress: 0.25 });
assert.deepEqual(countdown(0, 60_000, 90_000), { left: 0, progress: 1 });
assert.deepEqual(countdown(5, 5, 5), { left: 0, progress: 1 });

// Short clock: below one hour MM:SS, otherwise HH:MM:SS
assert.equal(shortClock(125), "02:05");
assert.equal(shortClock(3725), "01:02:05");

// Quotes rotate every everyMs in order, empty list = no quote, speed 0 = always the first
assert.equal(rotating(["a", "b", "c"], 1000, 2500), "c");
assert.equal(rotating(["a", "b", "c"], 1000, 3500), "a");
assert.equal(rotating([], 1000, 3500), "");
assert.equal(rotating(["a", "b"], 0, 3500), "a");

// Stage 1920x1080: as large as possible inside the source
assert.equal(stageScale(960, 1080), 0.5);
assert.equal(stageScale(3840, 1080), 1);

console.log("screens ok");
