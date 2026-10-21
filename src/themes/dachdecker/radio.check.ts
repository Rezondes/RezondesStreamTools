// Check for radio.ts of the Dachdecker theme: closed paths inside the box, the display in the middle between the two
// grilles. Runs with npm test.
import assert from "node:assert/strict";
import { displayStyle, HEIGHT, radioShapes } from "./radio.ts";

const shapes = radioShapes();
const paths = [shapes.body, ...shapes.bumpers, shapes.handle, ...shapes.grilles];
assert.equal(shapes.bumpers.length, 4);
assert.equal(shapes.grilles.length, 2);
for (const path of paths) {
  assert.ok(path.trim().endsWith("Z"), "closed");
  const numbers = path.match(/-?\d+(\.\d+)?/g)!.map(Number);
  assert.ok(numbers.every(value => value >= -1e-9 && value <= 1 + 1e-9), path);
}

// Display between the grilles, centred
const centre = (path: string) => Number(path.match(/^M(-?[\d.]+)/)![1]);
const display = shapes.display;
assert.ok(Math.abs(display.x + display.width / 2 - 0.5) < 1e-9);
assert.ok(display.x > centre(shapes.grilles[0]) && display.x + display.width < centre(shapes.grilles[1]) + 0.5);
assert.ok(display.y > 0 && display.y + display.height < HEIGHT);
assert.deepEqual(Object.keys(displayStyle(display)), ["left", "top", "width", "height"]);

console.log("dachdecker radio ok");
