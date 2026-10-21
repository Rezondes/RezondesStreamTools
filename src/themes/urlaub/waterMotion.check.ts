// Check for waterMotion.ts: bubbles rise, stay in the area and come back at the bottom; the equalizer levels stay
// between 0.2 and 1 and move. Runs with npm test.
import assert from "node:assert/strict";
import { bubbleAt, equalizerLevels } from "./waterMotion.ts";

const area = { width: 400, height: 900 };

// Bubbles rise: a moment later every bubble is higher or has wrapped back to the bottom
for (let index = 0; index < 20; index++) {
  const now = bubbleAt(index, 3, area, 60);
  const soon = bubbleAt(index, 3.1, area, 60);
  assert.ok(soon.y < now.y || soon.y > area.height * 0.9, `bubble ${index}`);
  assert.ok(now.y >= -now.radius && now.y <= area.height + now.radius);
  assert.ok(now.alpha >= 0 && now.alpha <= 1);
  assert.deepEqual(bubbleAt(index, 3, area, 60), now);
}

// Levels stay in range and move over time
for (const seconds of [0, 0.4, 1.7, 9.3]) {
  const levels = equalizerLevels(seconds, 7);
  assert.equal(levels.length, 7);
  for (const level of levels) assert.ok(level >= 0.2 && level <= 1);
}
assert.notDeepEqual(equalizerLevels(0.4, 7), equalizerLevels(0.9, 7));

console.log("urlaub waterMotion ok");
