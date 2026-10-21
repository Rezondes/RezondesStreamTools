// Check for searchlight.ts: the beam swings periodically between the two angles of the settings. Runs with npm test.
import assert from "node:assert/strict";
import { searchlightAngle } from "./searchlight.ts";

const DEGREE = Math.PI / 180;
const angles = Array.from({ length: 400 }, (_, index) => searchlightAngle(index * 0.05, -50, 40, 1));
// Stays between the two angles and reaches both
assert.ok(angles.every(angle => angle >= -50 * DEGREE - 1e-9 && angle <= 40 * DEGREE + 1e-9));
assert.ok(Math.min(...angles) < -49 * DEGREE && Math.max(...angles) > 39 * DEGREE);
// Periodic: one swing later the same angle; faster with more speed
const period = (2 * Math.PI) / 0.5;
assert.ok(Math.abs(searchlightAngle(3, -50, 40, 1) - searchlightAngle(3 + period, -50, 40, 1)) < 1e-9);
assert.ok(Math.abs(searchlightAngle(3, -50, 40, 2) - searchlightAngle(3 + period / 2, -50, 40, 2)) < 1e-9);
// Speed 0 holds the middle
assert.ok(Math.abs(searchlightAngle(7, -50, 40, 0) - -5 * DEGREE) < 1e-9);

console.log("koth searchlight ok");
