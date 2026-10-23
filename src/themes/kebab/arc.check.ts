// Check for arc.ts: letters sit symmetric around the top of the arc and get angle after their width. Runs with npm test.
import assert from "node:assert/strict";
import { arcLayout } from "./arc.ts";

const near = (actual: number, expected: number) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} is not ${expected}`);
const center = { x: 300, y: 640 };

// Three equal letters on 60 degrees: -20, 0, 20; the middle one straight above the center
const even = arcLayout([10, 10, 10], center, 470, 60);
near(even[0].angle, -20);
near(even[1].angle, 0);
near(even[2].angle, 20);
near(even[1].x, 300);
near(even[1].y, 170);
near(even[0].x, 600 - even[2].x);

// A letter twice as wide gets twice the angle: 15, 30, 15 degrees of 60
const wide = arcLayout([10, 20, 10], center, 470, 60);
near(wide[0].angle, -22.5);
near(wide[1].angle, 0);
near(wide[2].angle, 22.5);

// No width: all at the top
assert.deepEqual(arcLayout([0, 0], center, 100, 60), [{ x: 300, y: 540, angle: 0 }, { x: 300, y: 540, angle: 0 }]);

console.log("kebab arc ok");
