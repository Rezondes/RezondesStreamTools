// Check of starting.ts (PLAN-DOGS.md package 1, AC7): the row stays inside the world without two dogs on top of each
// other, the marker hops to the end and back and lands on the chosen dog (with the mops on place 6), the chosen dog
// walks to the rug and barks again and again; labels, bubble and sounds follow the plan.
// Run: node src/themes/dogs/starting.check.ts
import assert from "node:assert/strict";
import { BREED_IDS } from "./breeds.ts";
import { dogCache } from "./dog.ts";
import { bubbleAt, bubblePlace, dogAt, headAt, labelAt, labelPlace, markerAt, soundsBetween, startingPlan, type StartingTiming } from "./starting.ts";

const colors = { base: "#cc7633", mark: "#fbf6ee", dark: "#a85a22", nose: "#1d1715", pattern: "solid" as const };
const shared = { ink: "#2e1d14", eye: "#1d1412", tongue: "#e98a95", collar: "#c24535", tag: "#ffd23f", light: "#ffffff" };
const dogs = BREED_IDS.map(breed => dogCache({ breed, colors, shared, spots: { share: 0, seed: 1 } }));
const sizes = { width: 384, height: 216, dogs };
const timing: StartingTiming = { chosen: 0, dropEvery: 0.2, markerStart: 2.6, markerHop: 0.45, walkSpeed: 48, barkEvery: 7 };
const planOf = (chosen: number) => startingPlan({ ...timing, chosen }, sizes);

// Reihe und Marker: every place inside 0 to 384, no two dogs overlap
const corgi = planOf(0);
corgi.xs.forEach((x, index) => {
  assert.ok(x >= 0 && x + dogs[index].width <= 384, `place ${index}`);
  if (index > 0) assert.ok(corgi.xs[index - 1] + dogs[index - 1].width <= x, `overlap at ${index}`);
});
assert.deepEqual(corgi.order, [0, 1, 2, 3, 4, 5, 4, 3, 2, 1, 0]);
assert.deepEqual(planOf(5).order.slice(-2), [5, 5], "the mops ends on place 6");
assert.equal(planOf(99).timing.chosen, 5, "a chosen index outside the row is clamped");
const mops = planOf(5);
const landing = markerAt(mops, mops.land);
const [headX, headY] = headAt(mops, 5, mops.land);
assert.ok(landing && Math.abs(landing.x - headX) <= 1 && landing.y < headY, "the marker lands over the chosen dog");
assert.equal(markerAt(corgi, 1), null, "no marker before it starts");
assert.equal(markerAt(corgi, corgi.walk + 1), null, "no marker after the walk began");

// The dogs drop onto their cushions, the one under the marker barks, the chosen one walks to the rug and barks
assert.ok(dogAt(corgi, 3, 0).y < dogAt(corgi, 3, 3).y, "dropping from above");
assert.equal(dogAt(corgi, 2, corgi.timing.markerStart + 2 * corgi.timing.markerHop).mode, "bark");
assert.equal(dogAt(corgi, 0, (corgi.walk + corgi.arrive) / 2).mode, "walk");
const front = dogAt(corgi, 0, corgi.arrive + 0.2);
assert.deepEqual([front.x, front.y], [corgi.frontX, corgi.front - dogs[0].height + 5]);
assert.equal(dogAt(corgi, 0, corgi.bark + 0.1).mode, "bark");
assert.equal(dogAt(corgi, 0, corgi.bark + 2).mode, "stand");
assert.equal(dogAt(corgi, 0, corgi.bark + 7.1).mode, "bark", "barks again after barkEvery");
assert.equal(dogAt(mops, 5, (mops.walk + mops.arrive) / 2).flip, true, "the mops walks left to the rug");

// Labels fade in, the chosen one goes when it walks; the bubble pops with each bark and is gone in between
assert.equal(labelAt(corgi, 1, 0).opacity, 0);
assert.equal(labelAt(corgi, 1, 2).opacity, 1);
assert.equal(labelAt(corgi, 0, corgi.walk + 0.1).opacity, 0);
assert.ok(labelAt(corgi, 3, corgi.timing.markerStart + 3 * corgi.timing.markerHop).highlight);
assert.deepEqual(labelPlace(corgi, 0), [corgi.xs[0] + dogs[0].width / 2, corgi.row + 6]);
assert.equal(bubbleAt(corgi, corgi.bark - 0.1), 0);
assert.equal(bubbleAt(corgi, corgi.bark + 1), 1);
assert.equal(bubbleAt(corgi, corgi.bark + 3), 0);
assert.ok(bubbleAt(corgi, corgi.bark + 7.6) > 0.9);
assert.equal(bubblePlace(corgi, corgi.arrive + 1)[0], headAt(corgi, 0, corgi.arrive + 1)[0] + 16);

// Sounds: six landings, the hops, the choice and the card once, the chosen dog's barks repeat
const first = soundsBetween(corgi, 0, corgi.bark + 1);
assert.equal(first.filter(sound => sound.kind === "land").length, 6);
assert.equal(first.filter(sound => sound.kind === "hop").length, 10);
assert.deepEqual(first.filter(sound => sound.kind === "chosen").map(sound => sound.at), [corgi.land]);
assert.equal(first.filter(sound => sound.kind === "card").length, 1);
assert.ok(first.every((sound, index) => index === 0 || first[index - 1].at <= sound.at), "in order");
assert.deepEqual(soundsBetween(corgi, corgi.bark + 1, corgi.bark + 15).map(sound => [sound.kind, sound.at]), [["bark", corgi.bark + 7], ["bark", corgi.bark + 14]]);
assert.deepEqual(soundsBetween(corgi, 5, 5), []);

console.log("dogs starting ok");
