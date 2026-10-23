// Check for pattern.ts: the print covers the picture with two spits per tile, also beyond its edges. Runs with npm test.
import assert from "node:assert/strict";
import { printSpits, SPIT_ICON, TILE } from "./pattern.ts";

const spits = printSpits(1920, 1080);
const columns = Math.ceil((1920 + 2 * TILE) / TILE);
const rows = Math.ceil((1080 + 2 * TILE) / TILE);
assert.equal(spits.length, columns * rows * 2);
assert.ok(spits.some(spit => spit.x < 0) && spits.some(spit => spit.x > 1920));
assert.ok(spits.some(spit => spit.y < 0) && spits.some(spit => spit.y > 1080));
assert.equal(SPIT_ICON.length, 3);
assert.ok(SPIT_ICON[1].endsWith("Z"));

console.log("kebab pattern ok");
