// Check for stinger.ts of the Bärenbande theme: at the transition point the fur covers the whole picture and the text
// shows, at the start and end nothing is visible, early on only the walking bear, the same time gives the same draw
// commands. A mock canvas records everything. Runs with npm test.
import assert from "node:assert/strict";
import { resolveSettings } from "../../core/settings.ts";
import { paletteOf } from "./render.ts";
import { bearsSettings, type BearsValues } from "./settings.ts";
import { drawBearsStinger, HEIGHT, WIDTH, type BearsStingerOptions } from "./stinger.ts";

// One gradient for all recordings, so equal pictures give equal calls
const gradient = { addColorStop: () => {} };

function recorder() {
  const calls: unknown[][] = [];
  const target: Record<string, unknown> = { measureText: () => ({ width: 300 }), createLinearGradient: () => gradient, createRadialGradient: () => gradient };
  const context = new Proxy(target, {
    get: (object, key: string) => object[key] ?? ((...args: unknown[]) => { calls.push([key, ...args]); }),
    set: (_, key: string, value) => { calls.push([`set ${key}`, value]); return true; },
  });
  return { context: context as unknown as CanvasRenderingContext2D, calls };
}

const values = resolveSettings(bearsSettings, {}) as unknown as BearsValues;
const options: BearsStingerOptions = { duration: 1.6, cut: 0.8, bear: "grizzly", text: "Bande", font: "Sniglet", waddle: 6, cover: values.grizzlyFur, palette: paletteOf(values) };
const rects = (calls: unknown[][]) => calls.filter(call => call[0] === "fillRect").map(call => call.slice(1) as number[]);

// At the transition point: one area over the whole picture plus the text, for one bear and for the tower
for (const bear of ["grizzly", "turm"]) {
  const atCut = recorder();
  drawBearsStinger(atCut.context, options.cut, { ...options, bear });
  assert.ok(rects(atCut.calls).some(([x, y, width, height]) => x <= 0 && y <= 0 && width >= WIDTH && height >= HEIGHT), bear);
  assert.ok(atCut.calls.some(call => call[0] === "fillText" && call[1] === "Bande"), bear);
}

// Walking in: the bear is drawn, no full area and no text yet
const early = recorder();
drawBearsStinger(early.context, 0.1, options);
assert.deepEqual(rects(early.calls), []);
assert.ok(early.calls.some(call => call[0] === "fill"));
assert.ok(!early.calls.some(call => call[0] === "fillText"));

// Nothing at the start and at the end
for (const time of [0, options.duration]) {
  const empty = recorder();
  drawBearsStinger(empty.context, time, options);
  assert.ok(!empty.calls.some(call => call[0] === "fill" || call[0] === "fillRect" || call[0] === "fillText"), `t = ${time}`);
}

// Same time, same draw commands (no randomness)
const first = recorder();
const second = recorder();
drawBearsStinger(first.context, 0.37, options);
drawBearsStinger(second.context, 0.37, options);
assert.deepEqual(first.calls, second.calls);

console.log("bears stinger ok");
