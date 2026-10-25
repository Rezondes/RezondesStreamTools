// Check for stinger.ts of the Urlaub theme: at the transition point the wave covers the whole picture, at the start and end
// nothing is drawn, the same time gives the same draw commands. A mock canvas records everything.
// Runs with npm test.
import assert from "node:assert/strict";
import { effectiveSettings } from "../../core/settings.ts";
import { urlaubStingerLook } from "./render.ts";
import { type UrlaubValues, urlaubSettings } from "./settings.ts";
import { drawUrlaubStinger, surfaceAt, WIDTH, type UrlaubStingerOptions } from "./stinger.ts";

// The look of the default settings
const defaults = effectiveSettings(urlaubSettings, {}) as unknown as UrlaubValues;

function recorder() {
  const calls: unknown[][] = [];
  const target: Record<string, unknown> = { measureText: () => ({ width: 10 }) };
  const context = new Proxy(target, {
    get: (object, key: string) => object[key] ?? ((...args: unknown[]) => { calls.push([key, ...args]); }),
    set: (_, key: string, value) => { calls.push([`set ${key}`, value]); return true; },
  });
  return { context: context as unknown as CanvasRenderingContext2D, calls };
}

const options: UrlaubStingerOptions = {
  duration: 1.4, cut: 0.7, waves: 3, foam: true, palm: true, spray: 40, text: "Strand", font: "Pacifico",
  sea: "#1fb5c9", seaDeep: "#0b6f8e", foamColor: "#f4fffd", textColor: "#ffffff", palmColor: "#3b2412",
  look: urlaubStingerLook(defaults),
};

// gedeckt am Übergang: at the transition point the water stands above the picture in every column, plus the text
for (let x = 0; x <= WIDTH; x += 10) assert.ok(surfaceAt(x, options.cut, options) <= 0, `x = ${x}`);
const atCut = recorder();
drawUrlaubStinger(atCut.context, options.cut, options);
assert.ok(atCut.calls.some(call => call[0] === "fillText" && call[1] === "Strand"));
// Coming in, the water stands at the left and not yet at the right
assert.ok(surfaceAt(100, 0.35, options) < surfaceAt(1800, 0.35, options));

// Nothing drawn at the start and at the end but the clearing
for (const time of [0, options.duration]) {
  const empty = recorder();
  drawUrlaubStinger(empty.context, time, options);
  assert.deepEqual(empty.calls.map(call => call[0]), ["clearRect"], `t = ${time}`);
}

// Same time, same draw commands (no randomness)
const first = recorder();
const second = recorder();
drawUrlaubStinger(first.context, 0.37, options);
drawUrlaubStinger(second.context, 0.37, options);
assert.deepEqual(first.calls, second.calls);

console.log("urlaub stinger ok");
