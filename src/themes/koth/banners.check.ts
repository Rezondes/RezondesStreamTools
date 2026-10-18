// Check for banners.ts of the KOTH theme: both banners draw title and texts and look exactly the same after one loop
// (seamless GIF), the flag waves in between. A mock canvas records the calls. Runs with npm test.
import assert from "node:assert/strict";
import { drawKothOfflineBanner, drawKothProfileBanner, type KothBannerOptions } from "./banners.ts";

// One gradient for all recordings, so equal pictures give equal calls
const gradient = { addColorStop: () => {} };

function recorder() {
  const calls: unknown[][] = [];
  const target: Record<string, unknown> = { measureText: () => ({ width: 300 }), createLinearGradient: () => gradient };
  const context = new Proxy(target, {
    get: (object, key: string) => object[key] ?? ((...args: unknown[]) => { calls.push([key, ...args]); }),
    set: (_, key: string, value) => { calls.push([`set ${key}`, value]); return true; },
  });
  return { context: context as unknown as CanvasRenderingContext2D, calls };
}

const options: KothBannerOptions = {
  loop: 6, font: "Inter", titleFont: "Black Ops One", skyTop: "#6f9fc8", skyBottom: "#d6e6ef", eveningTop: "#8a4b3a", eveningBottom: "#e0a060",
  sun: "#ffe08a", mountain: "#6b7280", hill: "#6b7a3a", hillDark: "#4a5628", flag: "#c2b280", steel: "#3c4146", paper: "#e9e4d0", ink: "#23251c",
  textColor: "#f2f0e6", title: "KOTH", profileText: "Hold the hill", offlineTitle: "Radio silence", offlineText: "Follow the channel", offlineLines: ["Back soon", "The hill waits"],
};
const texts = (calls: unknown[][]) => calls.filter(call => call[0] === "fillText").map(call => call[1]);
const lines = (calls: unknown[][]) => calls.filter(call => call[0] === "lineTo");

for (const [draw, expected] of [
  [drawKothProfileBanner, ["KOTH", "Hold the hill"]],
  [drawKothOfflineBanner, ["Radio silence", "Follow the channel", "Back soon", "The hill waits"]],
] as const) {
  // Title and texts are in the picture
  const frame = recorder();
  draw(frame.context, 0, options);
  assert.deepEqual(texts(frame.calls), expected, draw.name);
  // Seamless: frame 0 and the frame at the loop end are equal
  const end = recorder();
  draw(end.context, options.loop, options);
  assert.deepEqual(end.calls, frame.calls, draw.name);
  // In between the flag waves differently
  const middle = recorder();
  draw(middle.context, options.loop / 4, options);
  assert.notDeepEqual(lines(middle.calls), lines(frame.calls), draw.name);
}

console.log("koth banners ok");
