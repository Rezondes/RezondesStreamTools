// Check for banners.ts: both banners draw their texts and are stills (the same picture every time).
// A recording mock canvas stands in for the browser. Runs with npm test.
import assert from "node:assert/strict";
import { effectiveSettings } from "../../core/settings.ts";
import { makeChaosOfflineBanner, makeChaosProfileBanner, type ChaosBannerOptions } from "./banners.ts";
import { COLORS, fakePath, recorder } from "./paint.check.ts";
import { chaosBannerLayout } from "./render.ts";
import { type ChaosValues, chaosSettings } from "./settings.ts";
import { scribbleTakes } from "./roughScribbles.ts";

const defaults = effectiveSettings(chaosSettings, {}) as unknown as ChaosValues;
const options: ChaosBannerOptions = {
  layout: chaosBannerLayout(defaults),
  font: "Space Grotesk", titleFont: "Permanent Marker", colors: COLORS, glow: 0.6, drips: true, shimmer: 1, scribbleCount: 120, scribbleWidth: 1, rough: { share: 0.35, fill: true },
  title: "CHAOS", profileText: "Kritzeleien", offlineTitle: "Offline", offlineText: "Bis bald",
};

for (const make of [makeChaosProfileBanner, makeChaosOfflineBanner]) {
  const draw = make(options, fakePath, scribbleTakes);
  const first = recorder();
  draw(first.context);
  const again = recorder();
  draw(again.context);
  assert.deepEqual(again.calls, first.calls, `${make.name}: a still`);
  const texts = first.calls.filter(call => call.name === "fillText").map(call => call.args[0]);
  assert.ok(texts.length >= 2, make.name);
}

// The profile banner shows the channel and its text, the offline banner its title and text
const profile = recorder();
makeChaosProfileBanner(options, fakePath)(profile.context);
assert.deepEqual(profile.calls.filter(call => call.name === "fillText").map(call => call.args[0]), ["CHAOS", "Kritzeleien"]);
const offline = recorder();
makeChaosOfflineBanner(options, fakePath)(offline.context);
assert.deepEqual(offline.calls.filter(call => call.name === "fillText").map(call => call.args[0]), ["CHAOS", "Offline", "Bis bald"]);

console.log("chaos banners ok");
