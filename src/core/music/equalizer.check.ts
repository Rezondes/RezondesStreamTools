// Check for equalizer.ts: the levels stay between 0.2 and 1 and move over time. Runs with npm test.
import assert from "node:assert/strict";
import { equalizerLevels } from "./equalizer.ts";

for (const seconds of [0, 0.4, 1.7, 9.3]) {
  const levels = equalizerLevels(seconds, 7);
  assert.equal(levels.length, 7);
  for (const level of levels) assert.ok(level >= 0.2 && level <= 1);
}
assert.notDeepEqual(equalizerLevels(0.4, 7), equalizerLevels(0.9, 7));

console.log("equalizer ok");
