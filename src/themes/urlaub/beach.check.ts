// Check for beach.ts: path building blocks give valid, closed paths, every shape has parts with paths.
// Runs with npm test (alone: node src/themes/urlaub/beach.check.ts).
import assert from "node:assert/strict";
import { circle, CLOUD, GULL, ICON_NAMES, ICONS, LEAF, PALM, petals, PLANE, spikes, type Shape } from "./beach.ts";

// Stars: count points give 2 * count points, closed
const star = spikes(50, 50, 40, 20, 5);
assert.match(star, /^M50 10 L/);
assert.equal(star.split("L").length, 10);
assert.ok(star.endsWith(" Z"));

// Circles and blossoms
assert.equal(circle(50, 50, 10), "M40 50 a10 10 0 1 0 20 0 a10 10 0 1 0 -20 0 Z");
assert.equal(petals(50, 50, 20, 8, 5).split("M").length - 1, 5);

// Every shape has at least one part, every path starts with M
const shapes: Shape[] = [PALM, CLOUD, GULL, LEAF, PLANE, ...ICON_NAMES.map(name => ICONS[name])];
for (const shape of shapes) {
  assert.ok(shape.parts.length > 0);
  for (const part of shape.parts) assert.match(part.d, /^M/);
}
assert.deepEqual(ICON_NAMES, ["muschel", "seestern", "sonne", "welle", "hibiskus", "boot", "kokosnuss", "ananas"]);

console.log("urlaub beach ok");
