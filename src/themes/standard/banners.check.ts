// Check for banners.ts of the standard theme: both banners draw the light fields, title and text and are stills (the same
// picture every time). A mock canvas records the calls. Runs with npm test.
import assert from "node:assert/strict";
import { drawStandardOfflineBanner, drawStandardProfileBanner, type StandardBannerOptions } from "./banners.ts";

function recorder() {
  const calls: unknown[][] = [];
  const gradient = { addColorStop: () => {} };
  const target: Record<string, unknown> = {
    measureText: () => ({ width: 300 }),
    createLinearGradient: () => gradient,
    createRadialGradient: (...args: unknown[]) => { calls.push(["radial", ...args]); return gradient; },
  };
  const context = new Proxy(target, {
    get: (object, key: string) => object[key] ?? ((...args: unknown[]) => { calls.push([key, ...args]); }),
    set: (object, key: string, value) => { object[key] = value; return true; },
  });
  return { context: context as unknown as CanvasRenderingContext2D, calls };
}

const options: StandardBannerOptions = {
  font: "Inter", background: "#0b0b12", accent: "#7c5cff", accent2: "#22d3ee", textColor: "#ffffff", mutedColor: "#a1a1b5",
  title: "REZONDES", profileText: "Coding", offlineTitle: "Offline right now", offlineText: "Follow the channel",
  lights: { seed: 7, count: 4, loop: 24, accent: "#7c5cff", accent2: "#22d3ee", strength: 0.7, dust: 20 },
};

for (const draw of [drawStandardProfileBanner, drawStandardOfflineBanner]) {
  const start = recorder();
  const end = recorder();
  draw(start.context, options);
  draw(end.context, options);
  const round = (calls: unknown[][]) => JSON.stringify(calls, (_, value: unknown) => (typeof value === "number" ? Math.round(value * 1000) / 1000 : value));
  assert.equal(round(end.calls), round(start.calls), `${draw.name}: not a still`);
  const texts = start.calls.filter(call => call[0] === "fillText").map(call => call[1]);
  assert.ok(texts.includes("REZONDES"), draw.name);
  assert.equal(start.calls.filter(call => call[0] === "radial").length, options.lights.count, `${draw.name}: the light fields`);
}

console.log("standard banners ok");
