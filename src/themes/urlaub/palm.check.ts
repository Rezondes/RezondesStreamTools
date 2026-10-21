// Check for palm.ts: every palm stands with its foot in the sand at its height, leans in, its fronds hang down toward
// their tips, the sway follows the setting. Runs with npm test.
import assert from "node:assert/strict";
import { FROND, frondPoint, frondSway, palmLayout, trunkPoints } from "./palm.ts";
import { shoreHeight } from "./shore.ts";

// Steht im Sand: the foot a little below the sand at its spot, the crown above, as many palms per side as asked
const palms = palmLayout(2, 1);
assert.equal(palms.length, 3);
assert.equal(palmLayout(0, 0).length, 0);
for (const palm of palms) {
  const [x, y, depth] = palm.base;
  assert.ok(y < shoreHeight(x, depth) && y > shoreHeight(x, depth) - 0.5, `foot at ${x}`);
  const crown = trunkPoints(palm)[3];
  assert.ok(crown[1] > y + palm.height * 0.99);
  // Toward the middle of the view: left palms lean right, right palms left
  assert.ok(Math.sign(crown[0] - x) === -Math.sign(x));
}

// The fronds hang outward and down: the tip lower than the root, every step lower than the one before
assert.ok(Math.abs(frondPoint(0, 0)[2]) < 1e-9);
assert.ok(frondPoint(1, 0)[2] < -FROND.droop + 1e-9);
assert.ok(frondPoint(1, 0)[0] === FROND.length);
assert.ok(frondPoint(0.5, 0)[2] < frondPoint(0.25, 0)[2]);
// Narrower toward the tip
assert.ok(Math.abs(frondPoint(1, 0.5)[1]) < Math.abs(frondPoint(0, 0.5)[1]));

// Sway: none without degrees, within the degrees otherwise
assert.ok(Math.abs(frondSway(3, 1, 0, 0)) < 1e-12);
assert.ok(Math.abs(frondSway(3, 1, 0, 3)) <= (3 * Math.PI) / 180);

console.log("urlaub palm ok");
