// Check for camp.ts: everything stands on the ground, nothing lies in the free space of the mast, number and kind follow
// the settings, the same seed gives the same layout. Runs with npm test.
import assert from "node:assert/strict";
import { campLayout, type CampKind, type CampOptions, MAST_CLEARANCE } from "./camp.ts";
import { hillHeight } from "./terrain.ts";

const options: CampOptions = {
  seed: 301, hillHeight: 7.2, sandbags: true, bunker: true, tents: 2, crateStacks: 3, fence: true, trees: 46, rocks: 30, jeep: true, markerFlags: true,
};
const layout = campLayout(options);
const count = (kind: CampKind, items = layout) => items.filter(item => item.kind === kind).length;

// Every item stands with its base on the ground (at most 0.05 m off), stacked items lift above it
for (const item of layout) {
  assert.ok(Math.abs(item.y - hillHeight(item.x, item.z, options.hillHeight)) <= 0.05, `${item.kind} ${item.index} floats`);
  assert.ok(item.lift >= 0, `${item.kind} sinks`);
}
// The free space around the mast stays empty
assert.ok(layout.every(item => Math.hypot(item.x, item.z) > MAST_CLEARANCE), "in the free space of the mast");

// Number and kind follow the settings
assert.equal(count("tree"), 46);
assert.equal(count("rock"), 30);
assert.equal(count("tent"), 2);
assert.equal(count("crate"), 5 + 3 + 4);
assert.equal(count("bunker"), 1);
assert.equal(count("jeep"), 1);
assert.equal(count("marker"), 2);
assert.equal(count("pole"), 1);
assert.ok(count("sandbag") > 0 && count("post") > 0);
assert.ok(layout.some(item => item.kind === "sandbag" && item.lift > 0), "a second row of sandbags");
const bare = campLayout({ ...options, sandbags: false, bunker: false, tents: 0, crateStacks: 0, fence: false, trees: 0, rocks: 0, jeep: false, markerFlags: false });
assert.deepEqual(bare.map(item => item.kind), ["pole"], "only the flag pole stays");
assert.equal(count("tent", campLayout({ ...options, tents: 9 })), 6, "at most the places there are");

// Same seed, same layout; another seed moves trees and rocks
assert.deepEqual(campLayout(options), layout);
assert.notDeepEqual(campLayout({ ...options, seed: 302 }), layout);
// Indexes run per kind
assert.deepEqual(layout.filter(item => item.kind === "tent").map(item => item.index), [0, 1]);

console.log("koth camp ok");
