// Check for life.ts: the pose follows the time alone; blinking lasts 0.12 s per period; switched off parts stay still.
// Runs with npm test.
import assert from "node:assert/strict";
import { chefPose, type PoseOptions } from "./life.ts";

const options: PoseOptions = { sawOn: true, sawSpeed: 5.2, sawAngle: 2.6, hatOn: true, stacheOn: true, blinkEvery: 4.2 };

// Same time, same pose
assert.deepEqual(chefPose(3.3, options), chefPose(3.3, options));

// Blink at the start of every period for 0.12 s
assert.equal(chefPose(0.05, options).blink, true);
assert.equal(chefPose(0.2, options).blink, false);
assert.equal(chefPose(4.25, options).blink, true);
assert.equal(chefPose(0.05, { ...options, blinkEvery: 0 }).blink, false, "0 = never");

// The saw swings within its angle and pushes along the blade
const swing = Array.from({ length: 100 }, (_, step) => chefPose(step / 10, options).armAngle);
assert.ok(Math.max(...swing) <= 2.6 && Math.min(...swing) >= -2.6 && Math.max(...swing) > 2);
assert.ok(chefPose(0.3, options).armShift.x !== 0);

// Off means still
const still = chefPose(0.3, { ...options, sawOn: false, hatOn: false, stacheOn: false });
assert.equal(still.armAngle, 0);
assert.equal(still.hatAngle, 0);
assert.equal(still.stacheAngle, 0);

// The moustache twitches only while the slow wave is high (around 1.7 s), not at 0.3 s
assert.equal(chefPose(0.3, options).stacheAngle, 0);
assert.notEqual(chefPose(1.75, options).stacheAngle, 0);

console.log("kebab life ok");
