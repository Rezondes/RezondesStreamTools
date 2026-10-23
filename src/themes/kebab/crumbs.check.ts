// Check for crumbs.ts: the burst follows the time alone, every third piece is a ring, nothing is left after its life.
// Runs with npm test.
import assert from "node:assert/strict";
import { CRUMB_LIFE, crumbsAt } from "./crumbs.ts";

const origin = { x: 300, y: 300 };
assert.deepEqual(crumbsAt(4, 30, 0.3, origin), crumbsAt(4, 30, 0.3, origin));
assert.equal(crumbsAt(4, 30, 0.3, origin).length, 30);
assert.deepEqual(crumbsAt(4, 30, 0.3, origin).map(crumb => crumb.ring).slice(0, 4), [true, false, false, true]);
assert.deepEqual(crumbsAt(4, 30, -0.1, origin), [], "not before the hit");
assert.deepEqual(crumbsAt(4, 30, CRUMB_LIFE, origin), [], "gone after their life");

// At the start they sit at the origin, later they flew away from it
const start = crumbsAt(4, 30, 0, origin);
assert.ok(start.every(crumb => Math.abs(crumb.x - 300) < 1e-9 && Math.abs(crumb.y - 300) < 1e-9));
assert.ok(crumbsAt(4, 30, 0.5, origin).some(crumb => Math.hypot(crumb.x - 300, crumb.y - 300) > 50));

console.log("kebab crumbs ok");
