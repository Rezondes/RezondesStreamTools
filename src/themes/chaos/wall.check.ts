// Check for wall.ts: blotches and dust lie on the stage, repeat for the same seed and mix their kinds. Runs with npm test.
import assert from "node:assert/strict";
import { STAGE } from "../../core/screens/screens.ts";
import { blotches, dust } from "./wall.ts";

// Blotches: on the stage, large, some deep; the same seed the same stains
const stains = blotches(4, 30);
assert.deepEqual(blotches(4, 30), stains);
assert.ok(stains.every(stain => stain.x >= 0 && stain.x <= STAGE.width && stain.radiusX >= 120 && stain.opacity <= 0.5));
assert.ok(stains.some(stain => stain.deep) && stains.some(stain => !stain.deep));

// Dust: fine, faint dots of all four colors over the stage
const dots = dust(4, 500);
assert.equal(dots.length, 500);
assert.ok(dots.every(dot => dot.radius < 1.5 && dot.opacity < 0.4 && dot.y >= 0 && dot.y <= STAGE.height));
assert.equal(new Set(dots.map(dot => dot.color)).size, 4);

console.log("chaos wall ok");
