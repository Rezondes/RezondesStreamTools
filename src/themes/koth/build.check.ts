// Check for build.ts: steps scale with the build speed, the share of a step runs from 0 to 1 with its stagger, the
// curves keep their ends and the camera rides from the flag back to its circle. Runs with npm test.
import assert from "node:assert/strict";
import { cameraPose, inOutCubic, inOutQuad, nail, outBounce, outCubic, screenSteps, startingSteps, stepShare } from "./build.ts";

const near = (actual: number, expected: number, label: string) => assert.ok(Math.abs(actual - expected) < 1e-6, `${label}: ${actual} vs ${expected}`);

// Speed: twice as fast, everything at half the time
const normal = startingSteps(1);
const fast = startingSteps(2);
near(fast.flag.start, normal.flag.start / 2, "start scales");
near(fast.bags.stagger, normal.bags.stagger / 2, "stagger scales");
near(normal.mast.start, 1, "mast from the prototype");

// Screens: Starting builds, BRB and Ending show the hill built; the Ending hoists the flag again and counts up to the stamp
const timing = { stampAt: 6, countUpMs: 2000 };
assert.deepEqual(screenSteps("starting", 1, timing), normal);
const brb = screenSteps("brb", 1, timing);
near(stepShare(brb.mast, 0), 1, "BRB: mast stands");
near(stepShare(brb.flag, 0), 1, "BRB: flag is up");
near(stepShare(brb.title, 0), 0, "BRB: the briefing still reveals itself");
const ending = screenSteps("ending", 2, timing);
near(stepShare(ending.ground, 0), 1, "Ending: hill stands");
near(stepShare(ending.flag, 0), 0, "Ending: flag goes up again");
near(ending.flag.start, 0.3, "Ending: re-hoist scales with the speed");
near(ending.rows.duration, 2, "Ending: rows count up for countUpMs");
near(ending.stamp.start, 6, "Ending: stamp at stampAt");

// Share of a step: 0 before, 1 after, the middle in between; staggered items start later
near(stepShare(normal.mast, 0), 0, "before");
near(stepShare(normal.mast, 1.8), 0.5, "middle");
near(stepShare(normal.mast, 9), 1, "after");
assert.ok(stepShare(normal.bags, 1.6, 0) > stepShare(normal.bags, 1.6, 4), "stagger");
near(stepShare({ start: 1, duration: 0, stagger: 0 }, 1), 1, "a step without length jumps");
near(stepShare({ start: 1, duration: 0, stagger: 0 }, 0.5), 0, "not yet");

// Curves keep their ends, the bounce lands at 1
for (const curve of [outCubic, inOutCubic, inOutQuad, nail, outBounce]) {
  near(curve(0), 0, `${curve.name} start`);
  near(curve(1), 1, `${curve.name} end`);
}
assert.ok(outBounce(0.5) > 0.7 && outBounce(0.8) > 0.9);
near(inOutCubic(0.5), 0.5, "half way");

// Camera: close at the start, on its circle after the intro, then turning; without intro on the circle at once
const options = { intro: true, radius: 40, height: 12, speed: 0.045, top: 7.2 };
const distance = (time: number, intro = true) => {
  const [x, , depth] = cameraPose(time, { ...options, intro }).position;
  return Math.hypot(x, depth);
};
near(distance(0), 9, "starts close");
near(distance(6), 40, "on the circle");
near(cameraPose(6, options).position[1], 7.2 + 12, "height on the circle");
assert.notDeepEqual(cameraPose(10, options).position, cameraPose(20, options).position, "circles");
near(distance(0, false), 40, "without intro");
near(cameraPose(3, options).target[0], 0, "looks at the hill");

console.log("koth build ok");
