// Check for watercolor.ts: a wash is the same for the same seed and stays near its surface, the land washes every
// surface it shows and leaves out the hidden ones, the sky and a cloud paint, the grain shifts the pixels. A mock
// canvas records everything. Runs with npm test.
import assert from "node:assert/strict";
import { resolveSettings } from "../../core/settings.ts";
import { worldOf } from "./render.ts";
import { bearsSettings, type BearsValues } from "./settings.ts";
import { paintCloud, paintGrain, paintLand, paintSky, paintWash, wash, type WashLook, type WorldShow } from "./watercolor.ts";
import { WORLD } from "./world.ts";

function recorder() {
  const calls: unknown[][] = [];
  const gradient = { addColorStop: () => {} };
  const target: Record<string, unknown> = { createLinearGradient: () => gradient, createRadialGradient: () => gradient };
  const context = new Proxy(target, {
    get: (object, key: string) => object[key] ?? ((...args: unknown[]) => { calls.push([key, ...args]); }),
    set: (_, key: string, value) => { calls.push([`set ${key}`, value]); return true; },
  });
  return { context: context as unknown as CanvasRenderingContext2D, calls };
}
const fakePath = (data: string) => data as unknown as Path2D;
const numbers = (path: string) => (path.match(/-?\d+(\.\d+)?(e-?\d+)?/g) ?? []).map(Number);

// Lasuren: the same seed gives the same washes, another seed others; every wash stays within 2 % of the stage around
// the surface
const shape = { kind: "polygon" as const, points: [[400, 300], [800, 300], [800, 600], [400, 600]] as [number, number][] };
assert.deepEqual(wash(shape, 5, 4, 2.4), wash(shape, 5, 4, 2.4));
assert.notDeepEqual(wash(shape, 5, 4, 2.4), wash(shape, 6, 4, 2.4));
const margin = WORLD.width * 0.02;
const washed = wash(shape, 5, 4, 2.4);
assert.equal(washed.layers.length, 4);
for (const layer of washed.layers) {
  assert.ok(layer.parts.length > 0 && layer.parts.every(part => part.filled));
  const values = layer.parts.flatMap(part => numbers(part.d));
  const xs = values.filter((_, index) => index % 2 === 0).map(x => x + layer.dx);
  const ys = values.filter((_, index) => index % 2 === 1).map(y => y + layer.dy);
  assert.ok(Math.min(...xs) >= 400 - margin && Math.max(...xs) <= 800 + margin, "x inside the margin");
  assert.ok(Math.min(...ys) >= 300 - margin && Math.max(...ys) <= 600 + margin, "y inside the margin");
}
assert.ok(washed.sketch.length > 0 && washed.sketch.every(part => !part.filled));

// A wash fills every part of every layer and strokes its sketch line only with a sketch mix
const painted = recorder();
paintWash(painted.context, washed, { color: "#b9cf63", alpha: 0.3, sketch: 0.35, outline: "#1c1a19" }, fakePath);
const count = (calls: unknown[][], name: string) => calls.filter(call => call[0] === name).length;
assert.equal(count(painted.calls, "fill"), washed.layers.reduce((sum, layer) => sum + layer.parts.length, 0));
assert.equal(count(painted.calls, "stroke"), washed.sketch.length);
const plain = recorder();
paintWash(plain.context, washed, { color: "#b9cf63", alpha: 0.3, sketch: 0, outline: "#1c1a19" }, fakePath);
assert.equal(count(plain.calls, "stroke"), 0);

// The land: everything shown paints more than with city, bridge, cave and flowers hidden; the same look, the same calls
const values = resolveSettings(bearsSettings, {}) as unknown as BearsValues;
const colors = worldOf(values, values.skyDayTop, values.skyDayBottom, values.sun);
const look: WashLook = { seed: 3, layers: 2, alpha: 0.3, roughness: 2.4, sketch: 0.35, grain: 0.5 };
const land = (show: WorldShow) => {
  const frame = recorder();
  paintLand(frame.context, colors, look, show, fakePath);
  return frame.calls;
};
const full = land({ city: true, bridge: true, cave: true, flowers: true });
assert.ok(count(full, "fill") > count(land({ city: false, bridge: false, cave: false, flowers: false }), "fill"));
assert.deepEqual(land({ city: true, bridge: true, cave: true, flowers: true }), full);

// Sky with sun or moon, a cloud as a wash
const day = recorder();
paintSky(day.context, colors, "mittag", fakePath);
assert.ok(count(day.calls, "fill") === 1 && count(day.calls, "fillRect") === 2);
const night = recorder();
paintSky(night.context, colors, "nacht", fakePath);
assert.notDeepEqual(night.calls, day.calls);
const cloud = recorder();
paintCloud(cloud.context, colors, look, 0, fakePath);
assert.ok(count(cloud.calls, "fill") > 0);

// Grain: every pixel moves by the same amount in its three channels, alpha stays; nothing without grain
const pixels = { data: new Uint8ClampedArray([100, 100, 100, 255, 100, 100, 100, 255]) };
const grained = { getImageData: () => pixels, putImageData: () => {} } as unknown as CanvasRenderingContext2D;
paintGrain(grained, 2, 1, 1, 3);
assert.ok(pixels.data[0] === pixels.data[1] && pixels.data[1] === pixels.data[2] && pixels.data[3] === 255);
assert.notDeepEqual([...pixels.data], [100, 100, 100, 255, 100, 100, 100, 255]);
paintGrain({} as CanvasRenderingContext2D, 2, 1, 0, 3);

console.log("watercolor ok");
