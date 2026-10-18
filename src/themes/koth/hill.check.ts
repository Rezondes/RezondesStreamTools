// Check for hill.ts: path building blocks give valid, closed paths, every shape has parts with paths.
// Runs with npm test (alone: node src/themes/koth/hill.check.ts).
import assert from "node:assert/strict";
import { circle, FLAG, HELI, HILL, ICON_NAMES, ICONS, NET, ridgePath, SANDBAGS, SMOKE, spikes, TOWER, type Shape } from "./hill.ts";

// Stars: count points give 2 * count points, closed
const star = spikes(50, 50, 40, 20, 5);
assert.match(star, /^M50 10 L/);
assert.equal(star.split("L").length, 10);
assert.ok(star.endsWith(" Z"));
assert.equal(circle(50, 50, 10), "M40 50 a10 10 0 1 0 20 0 a10 10 0 1 0 -20 0 Z");

// Ridge: from the bottom left over the peaks to the bottom right
assert.equal(ridgePath(1000, 200, [[0.25, 0.5], [0.5, 1], [0.75, 0.25]]), "M0 200 L250 100 L500 0 L750 150 L1000 200 Z");

// Every shape has at least one part, every path starts with M
const shapes: Shape[] = [HILL, TOWER, FLAG, SANDBAGS, NET, SMOKE, HELI, ...ICON_NAMES.map(name => ICONS[name])];
for (const shape of shapes) {
  assert.ok(shape.parts.length > 0);
  for (const part of shape.parts) assert.match(part.d, /^M/);
}
assert.deepEqual(ICON_NAMES, ["helm", "abzeichen", "stern", "kiste", "fallschirm", "granate", "funk", "flagge"]);

console.log("koth hill ok");
