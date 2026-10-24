// Check of backdrop.ts: the meadow fills the world (sky on top, grass below the horizon, the rug in front), switches
// leave out fence and trees, the clouds drift right and wrap. Run: node src/themes/dogs/backdrop.check.ts
import assert from "node:assert/strict";
import { cloudsAt, startingBackdrop } from "./backdrop.ts";
import { BREED_IDS } from "./breeds.ts";
import { dogCache } from "./dog.ts";
import { startingPlan } from "./starting.ts";
import type { WorldColors } from "./world.ts";

const colors: WorldColors = {
  sky: "#9fd6ff", skyLow: "#e3f5ff", grass: "#86c45f", grassLight: "#a3d97a", hills: ["#93d26e", "#86c862", "#7cbf5a"],
  trunk: "#a8754a", leaf: "#6fbf5a", apple: "#f25c54", light: "#ffffff", ink: "#2e1d14", flowers: ["#ffffff", "#ffd23f", "#f7a6c1", "#c9b6ff"],
};
const coat = { base: "#cc7633", mark: "#fbf6ee", dark: "#a85a22", nose: "#1d1715", pattern: "solid" as const };
const shared = { ink: "#2e1d14", eye: "#1d1412", tongue: "#e98a95", collar: "#c24535", tag: "#ffd23f", light: "#ffffff" };
const dogs = BREED_IDS.map(breed => dogCache({ breed, colors: coat, shared, spots: { share: 0, seed: 1 } }));
const plan = startingPlan({ chosen: 0, dropEvery: 0.2, markerStart: 2.6, markerHop: 0.45, walkSpeed: 48, barkEvery: 7 }, { width: 384, height: 216, dogs });
const options = { colors, cushions: ["#bfe8d4", "#d8ccff"], rug: "#c24535", flowers: 20, fence: true, trees: true };

const image = startingBackdrop(plan, options);
assert.deepEqual([image.width, image.height], [384, 216]);
assert.ok(image.colors.every(Boolean), "every pixel painted");
assert.equal(image.colors[0], colors.sky);
assert.equal(image.colors[215 * 384], colors.grass);
assert.equal(image.colors[(plan.front + 1) * 384 + 192], "#c24535", "the rug in front");
assert.ok(image.colors.includes("#d8ccff"), "the cushion colors repeat");
const bare = startingBackdrop(plan, { ...options, fence: false, trees: false });
assert.ok(!bare.colors.includes(colors.trunk), "no trees");
assert.notDeepEqual(bare.colors, image.colors);

// Clouds: as many as asked, moving right with time, wrapping around
const clouds = cloudsAt(0, 6, 4, 384);
assert.equal(clouds.length, 6);
assert.equal(cloudsAt(10, 6, 4, 384)[0].x, clouds[0].x + 40);
assert.ok(cloudsAt(1000, 6, 4, 384).every(cloud => cloud.x >= -50 && cloud.x < 384 + 30));
assert.deepEqual(clouds.map(cloud => cloud.small), [true, false, true, false, true, false]);

console.log("dogs backdrop ok");
