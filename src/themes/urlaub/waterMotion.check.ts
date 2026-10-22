// Check for waterMotion.ts: bubbles rise, stay in the area and come back at the bottom. Runs with npm test.
import assert from "node:assert/strict";
import { bubbleAt } from "./waterMotion.ts";

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

console.log("urlaub waterMotion ok");
