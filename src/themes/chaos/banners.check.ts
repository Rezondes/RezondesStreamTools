// Check for banners.ts: both banners draw their texts and loop seamlessly (the first and the last frame are the same).
// A recording mock canvas stands in for the browser. Runs with npm test.
import assert from "node:assert/strict";
import { makeChaosOfflineBanner, makeChaosProfileBanner, type ChaosBannerOptions } from "./banners.ts";
import { COLORS, fakePath, recorder } from "./paint.check.ts";

const options: ChaosBannerOptions = {
  loop: 4, font: "Space Grotesk", titleFont: "Permanent Marker", colors: COLORS, glow: 0.6, drips: true, scribbleCount: 120, scribbleWidth: 1,
  title: "CHAOS", profileText: "Kritzeleien", offlineTitle: "Offline", offlineText: "Bis bald",
};

for (const make of [makeChaosProfileBanner, makeChaosOfflineBanner]) {
  const draw = make(options, fakePath);
  const first = recorder();
  draw(first.context, 0);
  const last = recorder();
  draw(last.context, options.loop);
  assert.deepEqual(last.calls, first.calls, `${make.name}: seamless loop`);
  const texts = first.calls.filter(call => call.name === "fillText").map(call => call.args[0]);
  assert.ok(texts.length >= 2, make.name);
}

// The profile banner shows the channel and its text, the offline banner its title and text
const profile = recorder();
makeChaosProfileBanner(options, fakePath)(profile.context, 1);
assert.deepEqual(profile.calls.filter(call => call.name === "fillText").map(call => call.args[0]), ["CHAOS", "Kritzeleien"]);
const offline = recorder();
makeChaosOfflineBanner(options, fakePath)(offline.context, 1);
assert.deepEqual(offline.calls.filter(call => call.name === "fillText").map(call => call.args[0]), ["CHAOS", "Offline", "Bis bald"]);

console.log("chaos banners ok");
