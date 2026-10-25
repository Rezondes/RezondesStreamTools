// Check for lights.ts of the standard theme: the light fields and the dust land in a 2D canvas of any size, from seed
// and time alone. A mock canvas records the calls. Runs with npm test.
import assert from "node:assert/strict";
import { effectiveSettings } from "../../core/settings.ts";
import { auroraOptions } from "./aurora.ts";
import { type LightsOptions, paintLights } from "./lights.ts";
import { type StandardValues, standardSettings } from "./settings.ts";

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

const options: LightsOptions = { ...auroraOptions(effectiveSettings(standardSettings, {}) as StandardValues), dust: 20, dustScale: 0.25 };
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

// the dots of the dust take their size share from the settings
const dot = (list: unknown[][]) => list.find(call => call[0] === "arc")![3] as number;
assert.ok(Math.abs(dot(paint(3, { ...options, dustScale: 0.5 })) - dot(calls) * 2) < 1e-6);

// without fields and dust nothing is drawn
assert.equal(paint(3, { ...options, count: 0, dust: 0 }).filter(call => call[0] === "radial" || call[0] === "arc").length, 0);

console.log("standard lights ok");
