// Check of dog.ts (PLAN-DOGS.md package 1, AC6): the pose cache paints every pose at most once; walking lifts a leg,
// lying lowers the body and shows the resting paws. Run: node src/themes/dogs/dog.check.ts
import assert from "node:assert/strict";
import { dogCache } from "./dog.ts";
import { poseAt, poseKey, type PoseInput } from "./poses.ts";

const colors = { base: "#cc7633", mark: "#fbf6ee", dark: "#a85a22", nose: "#1d1715", pattern: "white" as const };
const shared = { ink: "#2e1d14", eye: "#1d1412", tongue: "#e98a95", collar: "#c24535", tag: "#ffd23f", light: "#ffffff" };
const input: PoseInput = { time: 0, mode: "walk", fps: 9, wagSpeed: 10, blinkEvery: 3.3, pant: true };

// Cache: many frames of a walk paint only the distinct poses, a repeated pose comes from the cache
const cache = dogCache({ breed: "corgi", colors, shared, spots: { share: 0, seed: 1 } });
const keys = new Set<string>();
for (let step = 0; step < 300; step++) {
  const state = poseAt({ ...input, time: step / 60 });
  keys.add(poseKey(state));
  cache.pose(state);
}
assert.equal(cache.painted(), keys.size);
const state = poseAt({ ...input, time: 0.3 });
assert.equal(cache.pose(state), cache.pose(state));
assert.deepEqual([cache.width, cache.height], [52, 38]);
assert.deepEqual(cache.head, [38, 5]);

// Lying: the body sinks, nothing stands above where the ears were
const top = (pose: { colors: (string | null)[]; width: number }) => Math.floor(pose.colors.findIndex(color => color !== null) / pose.width);
const standing = cache.pose(poseAt({ ...input, mode: "stand" }));
const lying = cache.pose(poseAt({ ...input, mode: "lie" }));
assert.ok(top(lying) > top(standing), "lying is lower");
// Walking: some frame lifts a paw off the foot row
const footRow = (pose: { colors: (string | null)[]; width: number }) => pose.colors.slice(32 * pose.width, 33 * pose.width).filter(Boolean).length;
const walking = Array.from({ length: 6 }, (_, frame) => footRow(cache.pose(poseAt({ ...input, time: frame / 9 + 0.01 }))));
assert.ok(walking.some(count => count < footRow(standing)), "a lifted paw");

console.log("dogs dog ok");
