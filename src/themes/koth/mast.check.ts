// Check for mast.ts: the segments come in build order from the bottom to the top and reach the full height, the guy
// wires end at anchors on the ground. Runs with npm test.
import assert from "node:assert/strict";
import { mastSegments, mastWires } from "./mast.ts";
import { hillHeight } from "./terrain.ts";

const BASE = 7.2;
const HEIGHT = 9.5;
const segments = mastSegments(BASE, HEIGHT);
// Build order: the lower end never goes down from one segment to the next
const lows = segments.map(segment => Math.min(segment.from[1], segment.to[1]));
assert.ok(lows.every((low, index) => index === 0 || low >= lows[index - 1] - 1e-9), "bottom to top");
assert.equal(lows[0], BASE, "starts at the base");
const highest = Math.max(...segments.map(segment => Math.max(segment.from[1], segment.to[1])));
assert.ok(Math.abs(highest - (BASE + HEIGHT)) < 1e-9, "reaches the full height");
// Three legs and three braces per level; a taller mast has more segments
assert.equal(segments.length % 6, 0);
assert.ok(mastSegments(BASE, 14).length > segments.length);

// Guy wires: two per anchor, every one ends on the ground
const ground = (x: number, depth: number) => hillHeight(x, depth, BASE);
const wires = mastWires(BASE, HEIGHT, ground);
assert.equal(wires.length, 6);
for (const wire of wires) {
  assert.ok(Math.abs(wire.to[1] - ground(wire.to[0], wire.to[2])) < 1e-9, "anchor on the ground");
  assert.ok(wire.from[1] > BASE && wire.from[1] < BASE + HEIGHT, "starts on the mast");
}

console.log("koth mast ok");
