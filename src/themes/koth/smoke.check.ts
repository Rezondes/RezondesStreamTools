// Check for smoke.ts: a puff is periodic in its life, deterministic, rises and fades at both ends. Runs with npm test.
import assert from "node:assert/strict";
import { SMOKE_LIFE, smokeAt } from "./smoke.ts";

const near = (actual: number, expected: number, label: string) => assert.ok(Math.abs(actual - expected) < 1e-6, `${label}: ${actual} vs ${expected}`);

// Periodic in the life: the same puff after one life is at the same place
const puff = smokeAt(301, 4, 22, 3.3);
const later = smokeAt(301, 4, 22, 3.3 + SMOKE_LIFE);
for (const key of ["x", "y", "z", "scale", "opacity"] as const) near(later[key], puff[key], key);
// Deterministic; another seed sways differently
assert.deepEqual(smokeAt(301, 4, 22, 3.3), puff);
assert.notEqual(smokeAt(302, 4, 22, 3.3).x, puff.x);
// Rises over its life, invisible at birth, visible in the middle
near(smokeAt(1, 0, 22, 0).opacity, 0, "born invisible");
assert.ok(smokeAt(1, 0, 22, SMOKE_LIFE / 2).opacity > 0.5, "visible in the middle");
assert.ok(smokeAt(1, 0, 22, 2).y > smokeAt(1, 0, 22, 1).y, "rises");
// Puffs of a column are spread over the life; before the scene starts they still lie in the life
assert.notEqual(smokeAt(1, 0, 22, 1).y, smokeAt(1, 11, 22, 1).y);
assert.ok(smokeAt(1, 3, 22, -2).y >= 0);

console.log("koth smoke ok");
