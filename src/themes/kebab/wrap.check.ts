// Check for wrap.ts: the flaps fold in one after another and cover the middle when the paper is whole, the paper is
// one sheet at the cut, the tear is the same for both halves, the halves fly apart after it. Runs with npm test.
import assert from "node:assert/strict";
import { designTime, flapPolygon, flapShare, FLAPS, paperAt, PICTURE, tearEdge, WRAP } from "./wrap.ts";

// At the start all flaps sit at their edges, later ones start later
assert.ok(FLAPS.every((_, index) => flapShare(0, index) === 0));
assert.ok(flapShare(0.3, 0) > flapShare(0.3, 3));
// Before the paper is whole every flap is in: each tip lies beyond the middle, so the four triangles cover it all
const before = WRAP.whole - 0.001;
FLAPS.forEach((flap, index) => {
  assert.equal(flapShare(before, index), 1);
  const [, , tip] = flapPolygon(flap, 1);
  const across = flap === "top" || flap === "bottom" ? Math.abs(tip[1] - PICTURE.height / 2) : Math.abs(tip[0] - PICTURE.width / 2);
  const beyond = flap === "top" ? tip[1] > PICTURE.height / 2 : flap === "bottom" ? tip[1] < PICTURE.height / 2 : flap === "left" ? tip[0] > PICTURE.width / 2 : tip[0] < PICTURE.width / 2;
  assert.ok(beyond && across > 0, flap);
});

// At the cut the paper is one sheet without halves; before the flaps still fold, after the tear the halves fly
assert.deepEqual(paperAt(0.8), { flaps: null, whole: true, apart: 0 });
assert.equal(paperAt(0.2).flaps?.length, 4);
assert.equal(paperAt(WRAP.tear).apart, 0);
assert.equal(paperAt(WRAP.tear + WRAP.apart).apart, 1);
assert.ok(paperAt(1.2).apart > 0 && paperAt(1.2).apart < 1);

// The tear runs from top to bottom near the middle and is the same for the same seed
const edge = tearEdge(7, 4);
assert.equal(edge.length, WRAP.steps + 1);
assert.deepEqual(edge[0][1], 0);
assert.deepEqual(edge[edge.length - 1][1], PICTURE.height);
assert.ok(edge.every(([x]) => Math.abs(x - PICTURE.width / 2) <= 0.02 * PICTURE.width));
assert.deepEqual(tearEdge(7, 4), edge);
assert.notDeepEqual(tearEdge(8, 4), edge);

// Own length and cut map onto the drawing: the cut stays the cut, start and end stay start and end
assert.equal(designTime(1.2, 2.4, 1.2), 0.8);
assert.equal(designTime(0, 2.4, 1.2), 0);
assert.equal(designTime(2.4, 2.4, 1.2), 1.6);
assert.equal(designTime(0.6, 2.4, 1.2), 0.4);
assert.equal(designTime(0, 1, 0), 0.8, "a cut at 0 starts covered");
assert.equal(designTime(2, 1, 1), 1.6, "no time after the cut: the end");

console.log("kebab wrap ok");
