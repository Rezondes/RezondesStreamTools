// Check for lights.ts of the standard theme: the light fields and the dust land in a 2D canvas of any size, from seed
// and time alone. A mock canvas records the calls. Runs with npm test.
import assert from "node:assert/strict";
import { type LightsOptions, paintLights } from "./lights.ts";

function recorder() {
  const calls: unknown[][] = [];
  const gradient = { addColorStop: (...args: unknown[]) => calls.push(["stop", ...args]) };
  const target: Record<string, unknown> = { createRadialGradient: (...args: unknown[]) => { calls.push(["radial", ...args]); return gradient; } };
  const context = new Proxy(target, {
    get: (object, key: string) => object[key] ?? ((...args: unknown[]) => { calls.push([key, ...args]); }),
    set: (object, key: string, value) => { calls.push(["set", key, value]); object[key] = value; return true; },
  });
  return { context: context as unknown as CanvasRenderingContext2D, calls };
}

const options: LightsOptions = { seed: 7, count: 4, loop: 24, accent: "#7c5cff", accent2: "#22d3ee", strength: 0.7, dust: 20 };
const paint = (time: number, lights = options, width = 1920, height = 1080) => {
  const target = recorder();
  paintLights(target.context, lights, time, width, height);
  return target.calls;
};

// one soft gradient per field and one dot per mote, added on top of each other and restored afterwards
const calls = paint(3);
assert.equal(calls.filter(call => call[0] === "radial").length, 4);
assert.equal(calls.filter(call => call[0] === "arc").length, 20);
assert.ok(calls.some(call => call[0] === "set" && call[1] === "globalCompositeOperation" && call[2] === "lighter"));
assert.equal(calls.filter(call => call[0] === "save").length, calls.filter(call => call[0] === "restore").length);

// same seed and time, same picture; another seed or time, another one
const json = JSON.stringify(calls);
assert.equal(JSON.stringify(paint(3)), json);
assert.notEqual(JSON.stringify(paint(3, { ...options, seed: 8 })), json);
assert.notEqual(JSON.stringify(paint(4)), json);

// a smaller canvas scales the fields: the first field shrinks with the height
const radius = (list: unknown[][]) => list.find(call => call[0] === "radial")![6] as number;
assert.ok(Math.abs(radius(paint(3, options, 1200, 480)) - (radius(calls) * 480) / 1080) < 1e-6);

// without fields and dust nothing is drawn
assert.equal(paint(3, { ...options, count: 0, dust: 0 }).filter(call => call[0] === "radial" || call[0] === "arc").length, 0);

console.log("standard lights ok");
