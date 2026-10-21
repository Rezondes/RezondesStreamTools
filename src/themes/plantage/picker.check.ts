// Check for picker.ts of the Plantage theme: the reach begins at rest and ends in the grasp without a jump, the arm angle
// is a pure function of the time, the picker has body, arm with pole and basket. Runs with npm test.
import assert from "node:assert/strict";
import { ARM, armAt, picker, reach, settle } from "./picker.ts";

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
assert.ok(parts.arm.some(shape => shape.color === COLORS.pole));
assert.ok(parts.basket.length > 2);
assert.ok(parts.shoulder.y < 0 && parts.basketAt.y < 0);

console.log("plantage picker ok");
