// Check for banners.ts of the Plantage theme: both banners draw title and texts and look exactly the same after one
// loop (seamless GIF), the trees sway in between. A mock canvas records the calls. Runs with npm test.
import assert from "node:assert/strict";
import { drawPlantageOfflineBanner, drawPlantageProfileBanner, type PlantageBannerOptions } from "./banners.ts";

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

const options: PlantageBannerOptions = {
  loop: 6, font: "Baloo 2", titleFont: "Fredoka", skyTop: "#3aa0e0", skyBottom: "#c8ecff", eveningTop: "#ff6f61", eveningBottom: "#ffc371",
  sun: "#ffd23f", hill: "#8fbf5a", soil: "#8b5e3c", soilDark: "#5e3b22", leaf: "#2f8f3a", trunk: "#6d4c2f", mango: "#ffb02e",
  wood: "#c8935a", woodDark: "#7a4a24", textColor: "#ffffff", textOnWood: "#3a2410",
  title: "Plantage", profileText: "Mangos and streams", offlineTitle: "Out in the field", offlineText: "Follow the channel", offlineLines: ["Live soon", "See you soon"],
};
const texts = (calls: unknown[][]) => calls.filter(call => call[0] === "fillText").map(call => call[1]);
const turns = (calls: unknown[][]) => calls.filter(call => call[0] === "rotate").map(call => call[1]);

for (const [draw, expected] of [
  [drawPlantageProfileBanner, ["Plantage", "Mangos and streams"]],
  [drawPlantageOfflineBanner, ["Out in the field", "Follow the channel", "Live soon", "See you soon"]],
] as const) {
  // Title and texts are in the picture
  const frame = recorder();
  draw(frame.context, 0, options);
  assert.deepEqual(texts(frame.calls), expected, draw.name);
  // Seamless: frame 0 and the frame at the loop end are equal
  const end = recorder();
  draw(end.context, options.loop, options);
  assert.deepEqual(end.calls, frame.calls, draw.name);
  // In between the trees lean differently
  const middle = recorder();
  draw(middle.context, options.loop / 4, options);
  assert.notDeepEqual(turns(middle.calls), turns(frame.calls), draw.name);
}

console.log("plantage banners ok");
