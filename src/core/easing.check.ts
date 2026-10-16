// Check für easing.ts: Begrenzen und Verläufe zwischen 0 und 1. Läuft mit npm test.
import assert from "node:assert/strict";
import { clamp01, easeIn, easeInOut } from "./easing.ts";

assert.deepEqual([clamp01(-1), clamp01(0.4), clamp01(2)], [0, 0.4, 1]);
// Verläufe beginnen bei 0, enden bei 1; easeInOut ist in der Mitte bei 0.5
assert.deepEqual([easeIn(0), easeIn(0.5), easeIn(1)], [0, 0.25, 1]);
assert.deepEqual([easeInOut(0), easeInOut(0.5), easeInOut(1)], [0, 0.5, 1]);
assert.ok(easeInOut(0.25) < 0.25 && easeInOut(0.75) > 0.75);

console.log("easing ok");
