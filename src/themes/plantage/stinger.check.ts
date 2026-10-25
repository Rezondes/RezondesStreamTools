// Check for stinger.ts of the Plantage theme: at the transition point the mango covers the whole picture, at the start and
// end nothing is visible, the same time gives the same draw commands. A mock canvas records everything.
// Runs with npm test.
import assert from "node:assert/strict";
import { drawPlantageStinger, HEIGHT, WIDTH, type PlantageStingerOptions } from "./stinger.ts";
import { effectiveSettings } from "../../core/settings.ts";
import { plantageStingerLook } from "./render.ts";
import { type PlantageValues, plantageSettings } from "./settings.ts";

// The look of the default settings
const defaults = effectiveSettings(plantageSettings, {}) as unknown as PlantageValues;

// One gradient for all recordings, so equal pictures give equal calls
const gradient = { addColorStop: () => {} };

function recorder() {
  const calls: unknown[][] = [];
  const target: Record<string, unknown> = { measureText: () => ({ width: 10 }), createLinearGradient: () => gradient, createRadialGradient: () => gradient };
  const context = new Proxy(target, {
    get: (object, key: string) => object[key] ?? ((...args: unknown[]) => { calls.push([key, ...args]); }),
    set: (_, key: string, value) => { calls.push([`set ${key}`, value]); return true; },
  });
  const rects = () => calls.filter(call => call[0] === "fillRect").map(call => call.slice(1) as number[]);
  return { context: context as unknown as CanvasRenderingContext2D, calls, rects };
}

const options: PlantageStingerOptions = {
  duration: 1.4, cut: 0.7, leaves: true, leafCount: 24, seed: 42, text: "Plantage", font: "Fredoka",
  mango: "#ffb02e", blush: "#ff5e3a", leaf: "#2f8f3a", leafDark: "#1d5e27", paper: "#fff6df", shadow: "#5e3b22", textColor: "#ffffff",
  look: plantageStingerLook(defaults),
};

// At the transition point: one area over the whole picture, plus the text and the leaves
const atCut = recorder();
drawPlantageStinger(atCut.context, options.cut, options);
assert.ok(atCut.rects().some(([x, y, width, height]) => x <= 0 && x + width >= WIDTH && y <= 0 && height >= HEIGHT));
assert.ok(atCut.calls.some(call => call[0] === "fillText" && call[1] === "Plantage"));
assert.ok(atCut.calls.filter(call => call[0] === "ellipse").length > 24, "the leaves whirl at the transition point");

// Without leaves fewer shapes at the transition point
const bare = recorder();
drawPlantageStinger(bare.context, options.cut, { ...options, leaves: false });
assert.ok(bare.calls.filter(call => call[0] === "ellipse").length < atCut.calls.filter(call => call[0] === "ellipse").length);

// Falling in: only a small mango, no full area and no text yet
const early = recorder();
drawPlantageStinger(early.context, 0.05, options);
assert.deepEqual(early.rects(), []);
assert.ok(early.calls.some(call => call[0] === "ellipse"));

// Nothing at the start and at the end
for (const time of [0, options.duration]) {
  const empty = recorder();
  drawPlantageStinger(empty.context, time, options);
  assert.ok(!empty.calls.some(call => call[0] === "ellipse" || call[0] === "fillRect" || call[0] === "fillText"), `t = ${time}`);
}

// Same time, same draw commands (no randomness)
const first = recorder();
const second = recorder();
drawPlantageStinger(first.context, 0.37, options);
drawPlantageStinger(second.context, 0.37, options);
assert.deepEqual(first.calls, second.calls);

console.log("plantage stinger ok");
