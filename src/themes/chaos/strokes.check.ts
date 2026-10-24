// Check for strokes.ts: a brush stroke has a closed ragged body, bristles along it, splatter and drips below it; the
// compositions are deterministic and never symmetric; title drips and speckles stay in their box. Runs with npm test.
import assert from "node:assert/strict";
import { chance } from "./chance.ts";
import { pointsOf } from "./paths.ts";
import { brushStroke, dripAnchor, dripPath, gestureLayout, speckles, sprayPassAt, titleDrips } from "./strokes.ts";

// A horizontal stroke from 100 to 900 at y 500, 200 wide: closed body inside its band (a little ragged), many bristles,
// drops around it, drips that start in the lower half and run down
const stroke = brushStroke([100, 500], [900, 500], 200, chance(4));
assert.ok(stroke.body.startsWith("M") && stroke.body.endsWith("Z"));
assert.ok(pointsOf(stroke.body).every(([x, y]) => x > 90 && x < 910 && y >= 399 && y <= 601));
assert.ok(stroke.bristles.length >= 100 && stroke.bristles.some(bristle => bristle.light) && stroke.bristles.some(bristle => !bristle.light));
assert.ok(stroke.tail.length > 0 && stroke.drops.length > 0);
assert.ok(stroke.drips.every(drip => {
  const [[, top], ...rest] = pointsOf(drip);
  return top > 500 && rest.some(([, y]) => y > top + 25);
}));
assert.deepEqual(brushStroke([100, 500], [900, 500], 200, chance(4)), stroke);

// A drip runs down from its start and ends round
assert.equal(dripPath(10, 20, 30, 4), "M8 20 L8.6 50 Q10 55.6 11.4 50 L12 20 Z");

// Compositions: two X with six strokes in both colors, never mirrored; one X; one stroke; none
const two = gestureLayout("zweix", 1);
assert.equal(two.length, 6);
assert.deepEqual(new Set(two.map(part => part.color)), new Set(["cyan", "magenta"]));
const widths = two.map(part => Math.round(part.width));
assert.equal(new Set(widths).size, widths.length);
assert.equal(gestureLayout("x", 1).length, 2);
assert.equal(gestureLayout("strich", 1).length, 1);
assert.deepEqual(gestureLayout("keine", 1), []);
// Each scene moves its strokes a little by its seed, the same seed the same way
assert.deepEqual(gestureLayout("zweix", 1), two);
assert.notDeepEqual(gestureLayout("zweix", 2), two);
assert.ok(gestureLayout("zweix", 2).every((part, index) => Math.abs(part.from[0] - two[index].from[0]) <= 56));

// Title drips lie inside the title width; speckles around the box, mostly in the main color
const drips = titleDrips(3, 9);
assert.equal(drips.length, 9);
assert.ok(drips.every(drip => drip.at > 0 && drip.at < 1 && drip.length >= 25));
const spray = speckles(3, 800, 150, 900);
assert.equal(spray.length, 900);
assert.ok(spray.every(dot => dot.x >= -40 && dot.x <= 840 && dot.y >= -30 && dot.y <= 190));
assert.ok(spray.filter(dot => dot.hot).length < spray.length / 3);

// The spray front of a title: the middle at half the time, the ends a quarter of the way in, beside the title clamped
assert.ok(Math.abs(sprayPassAt(0.5) - 0.5) < 1e-6, "the middle is reached at half the time");
assert.ok(sprayPassAt(0) > 0.3 && sprayPassAt(0) < 0.4, "the left edge after the slow start of the ease");
assert.ok(Math.abs(sprayPassAt(0) + sprayPassAt(1) - 1) < 1e-6, "the ease is symmetric");
assert.equal(sprayPassAt(-1), 0);
assert.equal(sprayPassAt(2), 1);
assert.ok([0.1, 0.3, 0.6, 0.9].every((share, index, all) => index === 0 || sprayPassAt(share) > sprayPassAt(all[index - 1])), "later further right");

// Drips hang from the letters: two letters reaching down to 50, a gap between them, a bar ending higher at 30
const ink: (number | null)[] = [...Array<number>(10).fill(50), ...Array<null>(10).fill(null), ...Array<number>(10).fill(30), ...Array<number>(10).fill(49)];
assert.deepEqual(dripAnchor(0.1, 4, ink, 5), { x: 4.5, y: 46 }, "under a letter it stays and starts inside it");
assert.deepEqual(dripAnchor(0.37, 4, ink, 5), { x: 7.5, y: 46 }, "from the gap it moves to the nearest letter");
assert.deepEqual(dripAnchor(0.62, 4, ink, 5), { x: 32.5, y: 45 }, "from under the higher bar to the letter that reaches down");
assert.equal(dripAnchor(0.5, 30, ink, 5), null, "no letter wide enough");
assert.equal(dripAnchor(0.5, 4, [null, null, null], 5), null, "no letters at all");

console.log("chaos strokes ok");
