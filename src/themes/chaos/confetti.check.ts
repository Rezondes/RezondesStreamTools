// Check for confetti.ts of the Chaos theme: the throw follows from seed and time, pieces fly up and fall back, fade at the
// end and are gone after their life. Runs with npm test.
import assert from "node:assert/strict";
import { CONFETTI_LIFE, confettiAt } from "./confetti.ts";

const ORIGIN = { x: 960, y: 270 };

// Wurf aus der Zeit: deterministic, up first, then down under gravity, gone after the life
for (let index = 0; index < 34; index++) {
  assert.deepEqual(confettiAt(4, index, 0.7, ORIGIN), confettiAt(4, index, 0.7, ORIGIN));
  const early = confettiAt(4, index, index * 0.008 + 0.03, ORIGIN);
  const late = confettiAt(4, index, 2, ORIGIN);
  assert.ok(early.y < ORIGIN.y, `piece ${index} is thrown up`);
  assert.ok(late.y > early.y, `piece ${index} falls back`);
  assert.equal(confettiAt(4, index, CONFETTI_LIFE + 0.5, ORIGIN).alpha, 0, `piece ${index} is gone`);
  assert.equal(confettiAt(4, index, -0.1, ORIGIN).alpha, 0, `piece ${index} not before the throw`);
  assert.ok(confettiAt(4, index, index * 0.008 + CONFETTI_LIFE - 0.05, ORIGIN).alpha < 0.5, `piece ${index} fades at the end`);
}
assert.notDeepEqual(confettiAt(4, 0, 0.7, ORIGIN), confettiAt(5, 0, 0.7, ORIGIN));

console.log("chaos confetti ok");
