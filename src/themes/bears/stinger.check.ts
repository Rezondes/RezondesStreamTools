// Check for stinger.ts of the Bärenbande theme: at the transition point the curtain covers the whole picture and the
// text shows, at the start and end nothing is visible, the edge of the curtain is in the paw of the bear, rising opens
// upward, the bear peeks and blinks at the cut, the same time gives the same draw commands. A mock canvas records everything. Runs with npm test.
import assert from "node:assert/strict";
import { resolveSettings } from "../../core/settings.ts";
import { paletteOf } from "./render.ts";
import { bearsSettings, type BearsValues } from "./settings.ts";
import { pawX } from "./paint.ts";
import { drawBearsStinger, figureHeight, HEIGHT, stingerState, WIDTH, type BearsStingerOptions } from "./stinger.ts";

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
const options: BearsStingerOptions = {
  duration: 1.6, cut: 0.8, bear: "grizzly", text: "Bande", font: "Sniglet", waddle: 6, palette: paletteOf(values), from: "links", open: "ziehen",
  curtain: { color: values.stingerCurtain, shade: values.stingerCurtainShade, pattern: true, folds: 7 },
};
const rects = (calls: unknown[][]) => calls.filter(call => call[0] === "fillRect").map(call => call.slice(1) as number[]);
const covers = ([x, y, width, height]: number[]) => x <= 0 && y <= 0 && x + width >= WIDTH && y + height >= HEIGHT;

// At the transition point the curtain covers the whole picture and the text shows: every bear, the tower, both ways to
// open, both sides
for (const bear of ["grizzly", "panda", "turm"]) {
  for (const open of ["ziehen", "heben"]) {
    for (const from of ["links", "rechts"]) {
      const atCut = recorder();
      drawBearsStinger(atCut.context, options.cut, { ...options, bear, open, from });
      assert.ok(rects(atCut.calls).some(covers), `${bear} ${open} ${from}: not covered`);
      assert.ok(atCut.calls.some(call => call[0] === "fillText" && call[1] === "Bande"), bear);
    }
  }
}

// Early on the curtain covers only the part behind the bear, and there is no text yet
const early = recorder();
drawBearsStinger(early.context, 0.1, options);
assert.ok(!rects(early.calls).some(covers));
assert.ok(early.calls.some(call => call[0] === "fill"));
assert.ok(!early.calls.some(call => call[0] === "fillText"));

// Nothing before the start and after the end
for (const time of [0, -1, options.duration, options.duration + 1]) {
  const empty = recorder();
  drawBearsStinger(empty.context, time, options);
  assert.ok(!empty.calls.some(call => call[0] === "fill" || call[0] === "fillRect" || call[0] === "fillText"), `t = ${time}`);
  assert.equal(stingerState(time, options), null);
}

// While the bear pulls, the edge of the curtain is in its paw; it closes from the left and opens again (ziehen)
for (let time = 0.05; time < options.duration; time += 0.05) {
  for (const bear of ["grizzly", "turm"]) {
    const state = stingerState(time, { ...options, bear });
    assert.ok(state);
    assert.equal(state.edge, pawX(bear, state.bear.pose, state.bear.x, figureHeight(bear), state.bear.facing, state.bear.turn), `${bear} t = ${time}`);
  }
}
const edges = [0.2, 0.4, 0.6].map(time => stingerState(time, options)?.edge ?? 0);
assert.ok(edges[0] < edges[1] && edges[1] < edges[2]);
assert.ok((stingerState(1.5, options)?.edge ?? WIDTH) < WIDTH / 2);
// Rising: after the cut the hem goes up and the curtain spans the width
const rising = stingerState(1.4, { ...options, open: "heben" });
assert.ok(rising && rising.bottom < HEIGHT / 2 && rising.edge >= WIDTH);
// At the cut the bear peeks in with its head turned to the camera and blinks
const peek = stingerState(options.cut, options);
assert.ok(peek && peek.bear.turn > 0.4 && peek.bear.pose === "blink" && peek.bear.x > WIDTH);

// Same time, same draw commands (no randomness)
const first = recorder();
const second = recorder();
drawBearsStinger(first.context, 0.37, options);
drawBearsStinger(second.context, 0.37, options);
assert.deepEqual(first.calls, second.calls);

console.log("bears stinger ok");
