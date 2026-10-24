// Check of walk.ts (PLAN-DOGS.md package 2, AC1 and AC2): the way is steady and never falls, one period covers the
// speed times 6.5 s, the dog sniffs exactly from 6.4 s to 8.6 s of the period; the leash starts at the collar, ends at
// the walker and sags more while standing. Run: node src/themes/dogs/walk.check.ts
import assert from "node:assert/strict";
import { leashPoints, sniffBubbleAt, sniffing, sniffStart, stepsAt, walkDistance, walkSoundsBetween, type WalkTiming } from "./walk.ts";

const timing: WalkTiming = { period: 9, sniff: 2, pxPerSecond: 24 };

// Strecke und Schnüffeln: steady (no jump between close times), never falling, 6.5 s of walking per period
let before = walkDistance(0, timing);
for (let step = 1; step <= 4000; step++) {
  const way = walkDistance(step / 100, timing);
  assert.ok(way >= before - 1e-9, `falls at ${step / 100}`);
  assert.ok(way - before < 0.5, `jumps at ${step / 100}`);
  before = way;
}
assert.equal(walkDistance(0, timing), 0);
assert.ok(Math.abs(walkDistance(9, timing) - 24 * 6.5) < 1e-9);
assert.ok(Math.abs(walkDistance(27, timing) - 3 * 24 * 6.5) < 1e-9);
assert.equal(sniffing(6.3, timing), false);
assert.equal(sniffing(6.5, timing), true);
assert.equal(sniffing(8.5, timing), true);
assert.equal(sniffing(8.7, timing), false);
assert.equal(sniffing(9 + 7, timing), true, "every period");
assert.ok(Math.abs(sniffStart(16, timing) - 15.4) < 1e-9);
assert.equal(stepsAt(9, timing, 3), 52);
assert.equal(stepsAt(9, timing, 0), 156, "a step of 0 counts pixels");

// Leine: from the collar to the walker, one point per pixel, sagging more when the sag is bigger
const walking = leashPoints([210, 180], [386, 112], 8);
const standing = leashPoints([210, 180], [386, 112], 16);
assert.deepEqual(walking[0], [210, 180]);
assert.deepEqual(walking.at(-1), [386, 112]);
const middle = (points: readonly (readonly [number, number])[]) => points[Math.floor(points.length / 2)][1];
assert.ok(middle(standing) > middle(walking), "sags more while standing");
assert.equal(leashPoints([5, 5], [5, 5], 3).length, 1);


// Bubble and sounds: the bubble shows during the sniff only; the steps at the start of a period, the sniff at its stop
assert.equal(sniffBubbleAt(3, timing), 0);
assert.ok(sniffBubbleAt(7.5, timing) > 0.9);
assert.equal(sniffBubbleAt(8.9, timing), 0);
assert.deepEqual(walkSoundsBetween(timing, 0, 18).map(sound => [sound.kind, sound.at]), [["sniff", 6.4], ["steps", 9], ["sniff", 15.4], ["steps", 18]]);
assert.deepEqual(walkSoundsBetween(timing, 5, 5), []);
console.log("dogs walk ok");
