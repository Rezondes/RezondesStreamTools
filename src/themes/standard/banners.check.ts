// Check for banners.ts of the standard theme: both banners draw the light fields, title and text and are stills (the same
// picture every time). A mock canvas records the calls. Runs with npm test.
import assert from "node:assert/strict";
import { effectiveSettings } from "../../core/settings.ts";
import { auroraOptions } from "./aurora.ts";
import { type BannerLook, drawStandardOfflineBanner, drawStandardProfileBanner, type StandardBannerOptions } from "./banners.ts";
import { type StandardValues, standardSettings } from "./settings.ts";

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

const look: BannerLook = {
  font: "Inter", background: "#0b0b12", titleColor: "#ffffff", textColor: "#a1a1b5", barColor: "#7c5cff", barColor2: "#22d3ee", left: 360,
  title: { y: 220, size: 96, weight: 800 }, bar: { y: 248, width: 420, height: 8 }, text: { y: 312, size: 34, weight: 500 },
};
const options: StandardBannerOptions = {
  title: "REZONDES", profileText: "Coding", offlineTitle: "Offline right now", offlineText: "Follow the channel",
  lights: { ...auroraOptions(effectiveSettings(standardSettings, {}) as StandardValues), dust: 20, dustScale: 0.25 },
  profile: look, offline: { ...look, nameColor: "#a1a1b5", name: { y: 300, size: 44, weight: 700 } },
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

// Every banner draws in its own look: the offline title at its size and color, the profile text in its weight
const offline = recorder();
drawStandardOfflineBanner(offline.context, { ...options, offline: { ...options.offline, title: { y: 470, size: 150, weight: 800 }, font: "Manrope" } });
assert.ok(offline.calls.some(call => call[0] === "fillText" && call[1] === "Offline right now" && call[3] === 470));

console.log("standard banners ok");
