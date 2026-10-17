// Check for banners.ts: both banners draw without errors, the movement repeats exactly after loop seconds
// (same positions at 0 and loop, only the random characters change), density 0 draws no rain.
// A mock canvas records the calls. Runs with npm test.
import assert from "node:assert/strict";
import { resolveSettings } from "../../core/settings.ts";
import { bannerOptions, drawOfflineBanner, drawProfileBanner, type BannerOptions } from "./banners.ts";
import { matrixSettings, type MatrixValues } from "./settings.ts";

type Call = { method: string; args: unknown[] };

function recorder() {
  const calls: Call[] = [];
  const target: Record<string, unknown> = { measureText: () => ({ width: 10 }) };
  const context = new Proxy(target, {
    get: (object, key: string) => object[key] ?? ((...args: unknown[]) => { calls.push({ method: key, args }); }),
    set: (object, key: string, value) => { object[key] = value; return true; },
  });
  return { context: context as unknown as CanvasRenderingContext2D, calls };
}

// Positions of the characters and rectangles; the characters themselves (args[0] for fillText) change over time
const positions = (calls: Call[]) => calls.filter(call => call.method === "fillText" || call.method === "fillRect").map(call => [call.method, ...(call.method === "fillText" ? call.args.slice(1) : call.args)]);

const values = resolveSettings(matrixSettings, {}) as unknown as MatrixValues;
const options = bannerOptions(values, "rezondes");

for (const draw of [drawProfileBanner, drawOfflineBanner]) {
  const start = recorder();
  const end = recorder();
  draw(start.context, 0, options);
  draw(end.context, options.loop, options);
  assert.ok(start.calls.length > 100, draw.name);
  assert.deepEqual(positions(end.calls), positions(start.calls), `${draw.name}: loop not seamless`);
}

// Without rain and without scanlines clearly fewer characters and no scanline stripes
const quiet: BannerOptions = { ...options, density: 0, scanlines: 0 };
const full = recorder();
const empty = recorder();
drawProfileBanner(full.context, 0, options);
drawProfileBanner(empty.context, 0, quiet);
const texts = (calls: Call[]) => calls.filter(call => call.method === "fillText").length;
assert.ok(texts(empty.calls) < texts(full.calls));
assert.ok(empty.calls.filter(call => call.method === "fillRect").length < full.calls.filter(call => call.method === "fillRect").length);

// Placeholders in header and prompt are filled
assert.equal(options.offlineHeader, "STREAM://stream/offline");
assert.equal(options.prompt, "root@rezondes:~$");

console.log("banners ok");
