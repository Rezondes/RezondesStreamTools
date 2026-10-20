// Check for paths.ts: smooth and straight paths through their points, wobble stays near the points. Runs with npm test.
import assert from "node:assert/strict";
import { chance } from "./chance.ts";
import { linePath, pointsOf, polar, smoothPath, wobble } from "./paths.ts";

// A straight polyline names every point once
assert.equal(linePath([[0, 0], [0.5, -0.25], [1, 1]]), "M0 0 L0.5 -0.25 L1 1");

// A smooth line starts at the first point, ends at the last, one curve per segment; closed adds the way back
const open = smoothPath([[0, 0], [0.5, 0.5], [1, 0]]);
assert.ok(open.startsWith("M0 0 C") && open.endsWith(" 1 0"));
assert.equal(open.split("C").length - 1, 2);
const closed = smoothPath([[0, 0], [1, 0], [1, 1]], true);
assert.ok(closed.endsWith(" 0 0 Z"));
assert.equal(closed.split("C").length - 1, 3);

// Wobble moves each point by at most the amount, the same seed the same way
const square = [[0, 0], [1, 0], [1, 1], [0, 1]] as const;
const moved = wobble(chance(3), square, 0.1);
assert.ok(moved.every(([x, y], index) => Math.abs(x - square[index][0]) <= 0.1 && Math.abs(y - square[index][1]) <= 0.1));
assert.deepEqual(wobble(chance(3), square, 0.1), moved);

// Polar points lie on their circle; pointsOf reads the pairs back
const [x, y] = polar(2, Math.PI / 2);
assert.ok(Math.abs(x) < 1e-9 && Math.abs(y - 2) < 1e-9);
assert.deepEqual(pointsOf("M1 2 L-3.5 4"), [[1, 2], [-3.5, 4]]);

console.log("chaos paths ok");
