// Check for figures.ts of the Dachdecker theme: every type has head, body, limbs, helmet and its own tool inside a box of
// one unit; every pose starts and ends at rest and is pure in the time. Runs with npm test.
import assert from "node:assert/strict";
import { ANIMATIONS, FIGURE_SET, FIGURE_TYPES, figure, pose } from "./figures.ts";

const tools = new Set<string>();
for (const type of FIGURE_TYPES) {
  const parts = figure(type);
  for (const joint of ["head", "torso", "armL", "armR", "legL", "legR", "tool"]) assert.ok(parts.some(part => part.joint === joint), `${type}: ${joint}`);
  assert.ok(parts.some(part => part.tone === "helmet" && part.shape === "dome"), `${type}: helmet`);
  for (const part of parts) {
    const centre = part.pivot.map((value, axis) => value + part.offset[axis]);
    assert.ok(centre[1] >= 0 && centre[1] <= 1 && Math.abs(centre[0]) <= 0.5, `${type}: part outside the box`);
  }
  tools.add(JSON.stringify(parts.filter(part => part.joint === "tool")));
}
assert.equal(tools.size, FIGURE_TYPES.length, "every type has its own tool");

// Poses begin and end at rest, in between they move, the same time gives the same pose
for (const animation of ANIMATIONS) {
  for (const end of [0, 1]) for (const value of Object.values(pose(animation, end))) assert.ok(Math.abs(value) < 1e-9, `${animation} at ${end}`);
  assert.ok([0.3, 0.45].some(part => Object.values(pose(animation, part)).some(value => Math.abs(value) > 0.01)), `${animation} moves`);
  assert.deepEqual(pose(animation, 0.3), pose(animation, 0.3));
}
assert.ok(Object.values(pose("unknown", 0.5)).every(value => value === 0));

// The chat types are the figure types
assert.deepEqual(FIGURE_SET.variants.map(variant => variant.id), [...FIGURE_TYPES]);

console.log("dachdecker figures ok");
