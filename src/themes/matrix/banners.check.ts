// Check for banners.ts: both banners draw without errors and are stills (the same picture every time), density 0 draws
// no rain.
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


const values = resolveSettings(matrixSettings, {}) as unknown as MatrixValues;
const options = bannerOptions(values, "rezondes");

for (const draw of [drawProfileBanner, drawOfflineBanner]) {
  const start = recorder();
  const again = recorder();
  draw(start.context, options);
  draw(again.context, options);
  assert.ok(start.calls.length > 100, draw.name);
  assert.deepEqual(again.calls, start.calls, `${draw.name}: a still`);
}

// Without rain and without scanlines clearly fewer characters and no scanline stripes
const quiet: BannerOptions = { ...options, density: 0, scanlines: 0 };
const full = recorder();
const empty = recorder();
drawProfileBanner(full.context, options);
drawProfileBanner(empty.context, quiet);
const texts = (calls: Call[]) => calls.filter(call => call.method === "fillText").length;
assert.ok(texts(empty.calls) < texts(full.calls));
assert.ok(empty.calls.filter(call => call.method === "fillRect").length < full.calls.filter(call => call.method === "fillRect").length);

// Placeholders in header and prompt are filled
assert.equal(options.offlineHeader, "STREAM://stream/offline");
assert.equal(options.prompt, "root@rezondes:~$");

console.log("banners ok");
