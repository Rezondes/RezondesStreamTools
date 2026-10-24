// Check for picker.ts of the Plantage theme: the reach begins at rest and ends in the grasp without a jump, the arm angle
// is a pure function of the time, the picker has body, arm with pole and basket. Runs with npm test.
import assert from "node:assert/strict";
import { aimAt, ARM, armAt, graspInto, pickAt, picker, poleTip, reach, settle, waveAt } from "./picker.ts";

// Greifen: rest at the start, grasp at the end, small steps in between
assert.equal(reach(0), ARM.rest);
assert.ok(Math.abs(reach(1) - ARM.grasp) < 1e-12);
assert.equal(reach(-1), ARM.rest);
assert.ok(Math.abs(reach(2) - ARM.grasp) < 1e-12);
const STEPS = 400;
for (let step = 1; step <= STEPS; step++) assert.ok(Math.abs(reach(step / STEPS) - reach((step - 1) / STEPS)) < 0.02, `no jump at ${step}`);
assert.ok(settle(0.3) > 1, "springs past the grasp");
assert.equal(armAt(5, 2, 1, false), ARM.rest);
assert.equal(armAt(1, 2, 1, true), ARM.rest, "before the reach the arm rests");
assert.equal(armAt(7.3, 2, 1, true), armAt(7.3, 2, 1, true));
assert.ok(Math.abs(armAt(3, 2, 0, true) - (ARM.grasp - Math.sin(3 * 2.2) * 0.06)) < 1e-12, "without a duration the arm holds the grasp");

// Parts
const COLORS = { hat: "#e8c770", band: "#ff8c1a", shirt: "#3f7fbf", skin: "#f1c27d", pants: "#5a3a22", eye: "#3a2410", pole: "#c8935a", basket: "#c8935a", shadow: "#3a220f" };
const parts = picker(COLORS);
assert.ok(parts.body.some(shape => shape.color === COLORS.hat));
assert.ok(parts.body.some(shape => shape.color === COLORS.shirt));
assert.ok(parts.pole.some(shape => shape.color === COLORS.pole) && parts.knob.length === 1, "the pole and its knob apart from the arm");
assert.ok(parts.basket.length > 2);
assert.ok(parts.shoulder.y < 0 && parts.basketAt.y < 0);

// Pflücken als Schleife: the loop begins and ends in the same pose, the mango falls into the basket and rests there
const EVERY = 2.4;
assert.equal(pickAt(0, EVERY, parts, true).arm, ARM.rest);
assert.ok(Math.abs(pickAt(EVERY - 1e-9, EVERY, parts, true).arm - ARM.rest) < 1e-6, "ends where it began");
assert.deepEqual(pickAt(1.1 + EVERY, EVERY, parts, true), pickAt(1.1, EVERY, parts, true));
// Before the top of the swing the mango hangs in the tree where the pole takes it, growing at the start of the loop
const hanging = pickAt(0.5, EVERY, parts, true).mango;
const taken = pickAt(EVERY * 0.449, EVERY, parts, true).mango;
assert.ok(hanging && taken && hanging.x === taken.x && hanging.y === taken.y && hanging.size === 1, "hangs still until it is picked");
assert.equal(pickAt(0, EVERY, parts, true).mango?.size, 0, "a new one starts to grow");
assert.ok(Math.abs(pickAt(EVERY * 0.1, EVERY, parts, true).mango!.size - 0.5) < 1e-9);
assert.deepEqual(pickAt(1, 0, parts, true).mango, null, "off: no mango");
// Aiming: the grasp points the pole at a spot, so the tip lies on the line from the shoulder through it
const spot = { x: -230, y: -400 };
const aimed = poleTip(parts, aimAt(parts, spot));
const cross = (aimed.x - parts.shoulder.x) * (spot.y - parts.shoulder.y) - (aimed.y - parts.shoulder.y) * (spot.x - parts.shoulder.x);
assert.ok(Math.abs(cross) < 1e-6 && aimed.y < spot.y, "the tip lies beyond the spot on the same line");
assert.ok(pickAt(EVERY / 2, EVERY, parts, true, { angle: aimAt(parts, spot), length: 330 }).arm === aimAt(parts, spot), "the top of the swing is the aimed grasp");
assert.ok(Math.abs(armAt(30, 2, 1, true, -0.9) - -0.9 + Math.sin(30 * 2.2) * 0.06) < 1e-12, "the reach ends at the given grasp");
// Into the crown: the tip ends inside the crown, at its upper crossing with the reach of the pole, near or far
const inside = (crown: { x: number; y: number; r: number }) => {
  const grasp = graspInto(parts, crown);
  const tipAt = poleTip(parts, grasp.angle, grasp.length);
  return Math.hypot(tipAt.x - crown.x, tipAt.y - crown.y) <= crown.r + 1e-6;
};
assert.ok(inside({ x: -330, y: -320, r: 95 }), "a tree beside the picker");
assert.ok(inside({ x: -200, y: -300, r: 120 }), "a tree close by: the pole is held shorter and ends in the crown");
assert.ok(graspInto(parts, { x: -200, y: -300, r: 120 }).length < 330);
assert.ok(inside({ x: -380, y: -400, r: 95 }), "a tree further away, still in reach");
const crossing = graspInto(parts, { x: -330, y: -320, r: 95 });
assert.equal(crossing.length, 330, "a crossing keeps the whole pole");
assert.ok(poleTip(parts, crossing.angle).y < -320, "the upper crossing");
const far = { x: -900, y: -300, r: 95 };
assert.deepEqual(graspInto(parts, far), { angle: aimAt(parts, far), length: 330 }, "out of reach: aimed at the middle");
const landed = pickAt(EVERY * 0.999, EVERY, parts, true).mango;
assert.ok(landed && Math.abs(landed.x - parts.basketAt.x) < 1e-9, "the mango lands in the basket");
const falling = pickAt(EVERY * 0.6, EVERY, parts, true).mango;
const tip = poleTip(parts, ARM.grasp);
assert.ok(falling && falling.y > tip.y - 1, "falls from the pole downwards");
assert.deepEqual(pickAt(EVERY * 0.9, EVERY, parts, false).mango, { x: parts.basketAt.x, y: parts.basketAt.y - 26, size: 1 }, "no hops without bounce");
assert.ok(pickAt(EVERY * 0.9, EVERY, parts, true).mango!.y < parts.basketAt.y - 26, "hops with bounce");
assert.equal(pickAt(1, 0, parts, true).arm, ARM.rest);

// Winken: a raised arm that swings
assert.ok(waveAt(0) < ARM.grasp && waveAt(0.4) !== waveAt(0));

console.log("plantage picker ok");
