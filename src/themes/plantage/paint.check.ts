// Check for paint.ts of the Plantage theme: the world covers any picture size, far layers blur, the same options paint
// the same picture, the trees lean with sway, the crate carries the label. A mock canvas records the calls.
// Runs with npm test.
import assert from "node:assert/strict";
import { coverOf, paintShapes, paintWorld } from "./paint.ts";

const gradient = { addColorStop: () => {} };
function recorder() {
  const calls: unknown[][] = [];
  const target: Record<string, unknown> = { createLinearGradient: () => gradient, createRadialGradient: () => gradient };
  const context = new Proxy(target, {
    get: (object, key: string) => object[key] ?? ((...args: unknown[]) => { calls.push([key, ...args]); }),
    set: (_, key: string, value) => { calls.push([`set ${key}`, value]); return true; },
  });
  return { context: context as unknown as CanvasRenderingContext2D, calls };
}

const colors = {
  skyTop: "#3aa0e0", skyBottom: "#c8ecff", sun: "#ffd23f", hill: "#8fbf5a", hillFar: "#bcd88a", soil: "#8b5e3c", soilDark: "#5e3b22", grass: "#4caf50", cloud: "#fff6df",
  wood: "#c8935a", woodDark: "#7a4a24", sky: "#c8ecff", trunk: "#6d4c2f", trunkDark: "#7a4a24", leafDark: "#1d5e27", leaf: "#2f8f3a", leafLight: "#4caf50",
  mango: "#ffb02e", mangoBlush: "#ff5e3a", gloss: "#fff6df", shadow: "#3a2410",
};
const options = { colors, seed: 42, treeRowsFar: 11, treeRowsMid: 8, farBlur: 1.5, hazeFar: 0.55, sway: 1, label: "PLANTAGE", labelFont: "Fredoka" };

// Cover: the scaled world is at least as large as the picture and centered
for (const [width, height] of [[1200, 480], [1920, 1080], [800, 800]]) {
  const cover = coverOf(width, height);
  assert.ok(1920 * cover.scale >= width - 1e-9 && 1080 * cover.scale >= height - 1e-9, `${width}x${height}`);
  assert.ok(cover.x <= 0 && cover.y <= 0);
}

// Painted: blur in the distance, the label on the crate, the mango color in the trees
const frame = recorder();
paintWorld(frame.context, 1200, 480, options);
assert.ok(frame.calls.some(call => call[0] === "set filter" && String(call[1]).startsWith("blur(")));
assert.ok(frame.calls.some(call => call[0] === "fillText" && call[1] === "PLANTAGE"));
assert.ok(frame.calls.some(call => call[0] === "set fillStyle" && call[1] === colors.mango));

// A still: the same picture again; the trees lean with sway, not without
const again = recorder();
paintWorld(again.context, 1200, 480, options);
assert.deepEqual(again.calls, frame.calls);
const turns = (calls: unknown[][]) => calls.filter(call => call[0] === "rotate").map(call => call[1]);
assert.ok(turns(frame.calls).some(turn => turn !== 0), "trees lean with sway");
const still = recorder();
paintWorld(still.context, 1200, 480, { ...options, sway: 0 });
assert.ok(turns(still.calls).every(turn => turn === 0), "no sway without sway");

// Shapes: every kind becomes a path
const shapes = recorder();
paintShapes(shapes.context, [
  { kind: "circle", x: 0, y: 0, r: 2, color: "#000000" },
  { kind: "ellipse", x: 0, y: 0, rx: 2, ry: 1, color: "#000000" },
  { kind: "rect", x: 0, y: 0, w: 2, h: 1, radius: 1, color: "#000000" },
  { kind: "rect", x: 0, y: 0, w: 2, h: 1, color: "#000000", alpha: 0.5 },
]);
assert.deepEqual(shapes.calls.filter(call => ["arc", "ellipse", "roundRect", "rect"].includes(call[0] as string)).map(call => call[0]), ["arc", "ellipse", "roundRect", "rect"]);

console.log("plantage paint ok");
