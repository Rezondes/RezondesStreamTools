// Check for dishes.ts: every dish has body, face, feet and arm and the part of its own move, all inside the box from 0
// to 100 ("Teile je Typ"); every pose starts and ends at rest and moves in between ("Posen beginnen und enden ruhig");
// sauce only flies while the döner spins. Runs with npm test.
import assert from "node:assert/strict";
import { pathPoints } from "./chef.ts";
import { DISH_SET, DISH_TYPES, dishParts, dishPose, MINIME_REACTION, MOVE_OF, REST, sauceDrops } from "./dishes.ts";

// Teile je Typ
const inBox = ({ x, y }: { x: number; y: number }) => x >= 0 && x <= 100 && y >= 0 && y <= 100;
for (const type of DISH_TYPES) {
  const parts = dishParts(type);
  assert.ok(parts.body.lines.length > 0 && parts.body.fills.length > 0, `${type}: body`);
  assert.equal(parts.face.dots.length, 2, `${type}: two eyes`);
  assert.equal(parts.feet.lines.length, 2, `${type}: two feet`);
  assert.equal(parts.arm.lines.length, 1, `${type}: arm`);
  assert.equal(parts.move === null, type === "doener", `${type}: part of the own move`);
  for (const piece of [parts.body, parts.face, parts.feet, parts.arm, parts.move].filter(piece => piece !== null)) {
    for (const outline of [...piece.fills, ...piece.lines.flatMap(line => (line.shape.kind === "path" ? [line.shape.d] : []))]) {
      assert.ok(pathPoints(outline).every(inBox), `${type}: ${outline}`);
    }
    for (const line of piece.lines) {
      if (line.shape.kind === "ellipse") assert.ok(inBox({ x: line.shape.x - line.shape.width / 2, y: line.shape.y - line.shape.height / 2 }) && inBox({ x: line.shape.x + line.shape.width / 2, y: line.shape.y + line.shape.height / 2 }));
    }
    assert.ok(piece.dots.every(inBox));
  }
}
assert.deepEqual(DISH_SET.variants.map(variant => variant.id), [...DISH_TYPES]);

// Posen beginnen und enden ruhig
const close = (pose: typeof REST) => Object.entries(pose).every(([key, value]) => Math.abs(value - REST[key as keyof typeof REST]) < 1e-9);
for (const animation of [...Object.values(MOVE_OF), "wave", MINIME_REACTION]) {
  assert.ok(close(dishPose(animation, 0)), `${animation} starts at rest`);
  assert.ok(close(dishPose(animation, 1)), `${animation} ends at rest`);
  assert.ok(!close(dishPose(animation, 0.4)), `${animation} moves`);
}
assert.deepEqual(dishPose("walk", 0.5), REST);
assert.deepEqual(dishPose("roll", 2), dishPose("roll", 1), "share is clamped");

// Sauce: none before and after, five drops while it flies, inside the box
assert.equal(dishPose("spin", 0.1).sauce, 0);
assert.ok(dishPose("spin", 0.5).sauce > 0);
assert.deepEqual(sauceDrops(0), []);
assert.equal(sauceDrops(0.5).length, 5);
assert.ok([0.1, 0.5, 0.99].every(progress => sauceDrops(progress).every(inBox)));

console.log("kebab dishes ok");
