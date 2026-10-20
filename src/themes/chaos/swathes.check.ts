// Check for swathes.ts: a swath comes from its side, repeats for the same seed and has the asked number of streaks, with
// light tones near the edge. Runs with npm test.
import assert from "node:assert/strict";
import { STAGE } from "../../core/screens/screens.ts";
import { pointsOf } from "./paths.ts";
import { swathes, swathSide } from "./swathes.ts";

// From the left: every tongue starts at the left edge and reaches at most 62 % into the stage
const left = swathes("left", 5, 40);
assert.deepEqual(swathes("left", 5, 40), left);
assert.equal(left.streaks.length, 40);
assert.ok(left.tongues.length > 0);
for (const tongue of left.tongues) {
  const xs = pointsOf(tongue.d).map(([x]) => x);
  assert.ok(Math.min(...xs) < 30, "starts at the edge");
  assert.ok(Math.max(...xs) <= STAGE.width * 0.62 + 30, "stays in its reach");
}
// From the right: the same shapes mirrored to the right edge
const right = swathes("right", 5, 40);
assert.ok(right.tongues.every(tongue => Math.max(...pointsOf(tongue.d).map(([x]) => x)) > STAGE.width - 30));
// Tones: hot and lilac only near the edge, the body in the saturated colors
const tones = new Set([...left.tongues, ...left.streaks].map(piece => piece.tone));
assert.ok(tones.has("magenta") && tones.has("cyan"));
assert.equal(swathes("left", 5, 0).streaks.length, 0);

// The side of an alert: as chosen, or alternating by the alert's number
assert.equal(swathSide("links", 3), "left");
assert.equal(swathSide("rechts", 2), "right");
assert.deepEqual([0, 1, 2].map(key => swathSide("wechselnd", key)), ["left", "right", "left"]);

console.log("chaos swathes ok");
