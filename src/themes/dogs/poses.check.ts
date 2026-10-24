// Check of poses.ts (PLAN-DOGS.md package 1, AC6): walking at 9 fps runs 9 frames of the 6-frame cycle in a second,
// equal states give equal keys, blink, bark and pant follow the time. Run: node src/themes/dogs/poses.check.ts
import assert from "node:assert/strict";
import { LEG_CYCLE, poseAt, poseKey, type PoseInput } from "./poses.ts";

const input: PoseInput = { time: 0, mode: "walk", fps: 9, wagSpeed: 10, blinkEvery: 3.3, pant: true };

// Posen: in one second of walking the frame changes 8 times, so 9 frames show, all from the cycle of 6
const frames: number[] = [];
for (let step = 0; step < 1000; step++) {
  const { frame } = poseAt({ ...input, time: step / 1000 });
  if (frames.at(-1) !== frame) frames.push(frame);
}
assert.equal(frames.length, 9);
assert.equal(LEG_CYCLE.length, 6);
assert.ok(frames.every(frame => frame >= 0 && frame < 6));
assert.equal(poseAt({ ...input, mode: "stand", time: 0.5 }).frame, 0, "standing keeps frame 0");

// Equal states give equal keys, different ones different keys
assert.equal(poseKey(poseAt({ ...input, time: 0.2 })), poseKey(poseAt({ ...input, time: 0.2 })));
assert.notEqual(poseKey(poseAt({ ...input, time: 0.2 })), poseKey(poseAt({ ...input, time: 0.5 })));

// Tail stages 0 to 4, blinking at the start of each period, lying dogs keep their eyes shut and do not pant
const tails = new Set(Array.from({ length: 100 }, (_, step) => poseAt({ ...input, time: step / 37 }).tail));
assert.deepEqual([...tails].sort(), [0, 1, 2, 3, 4]);
assert.equal(poseAt({ ...input, mode: "stand", time: 3.35 }).blink, true);
assert.equal(poseAt({ ...input, mode: "stand", time: 1 }).blink, false);
assert.equal(poseAt({ ...input, mode: "stand", time: 0.1, blinkEvery: 0 }).blink, false, "0 = never blink");
const lying = poseAt({ ...input, mode: "lie", time: 1 });
assert.deepEqual([lying.blink, lying.mouth], [true, ""]);

// Barking opens the jaw every other sixth of a second; panting shows the tongue while walking
assert.equal(poseAt({ ...input, mode: "bark", time: 0.05 }).mouth, "open");
assert.equal(poseAt({ ...input, mode: "bark", time: 0.2 }).mouth, "pant");
assert.equal(poseAt({ ...input, time: 0.4 }).mouth, "pant");
assert.equal(poseAt({ ...input, time: 0.4, pant: false }).mouth, "");
assert.equal(poseAt({ ...input, mode: "stand", time: 0.4 }).mouth, "", "standing pants every other third");

console.log("dogs poses ok");
