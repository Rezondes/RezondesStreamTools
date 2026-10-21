// Check for banners.ts of the Plantage theme: both banners draw the world of the scenes, title and texts and look exactly the same after one
// loop (seamless GIF), the trees sway in between. A mock canvas records the calls. Runs with npm test.
import assert from "node:assert/strict";
import { drawPlantageOfflineBanner, drawPlantageProfileBanner, type PlantageBannerOptions } from "./banners.ts";

// One gradient for all recordings, so equal pictures give equal calls
const gradient = { addColorStop: () => {} };

function recorder(measureText: (text: string) => { width: number } = () => ({ width: 300 })) {
  const calls: unknown[][] = [];
  const target: Record<string, unknown> = { measureText, createLinearGradient: () => gradient, createRadialGradient: () => gradient };
  const context = new Proxy(target, {
    get: (object, key: string) => object[key] ?? ((...args: unknown[]) => { calls.push([key, ...args]); }),
    set: (_, key: string, value) => { calls.push([`set ${key}`, value]); return true; },
  });
  return { context: context as unknown as CanvasRenderingContext2D, calls };
}

const colors = {
  skyTop: "#3aa0e0", skyBottom: "#c8ecff", sun: "#ffd23f", hill: "#8fbf5a", hillFar: "#bcd88a", soil: "#8b5e3c", soilDark: "#5e3b22", grass: "#4caf50", cloud: "#fff6df",
  wood: "#c8935a", woodDark: "#7a4a24", sky: "#c8ecff", trunk: "#6d4c2f", trunkDark: "#7a4a24", leafDark: "#1d5e27", leaf: "#2f8f3a", leafLight: "#4caf50",
  mango: "#ffb02e", mangoBlush: "#ff5e3a", gloss: "#fff6df", shadow: "#3a2410",
};
const paint = { colors, seed: 42, treeRowsFar: 11, treeRowsMid: 8, farBlur: 1.5, hazeFar: 0.55, sway: 1, loop: 6, label: "PLANTAGE", labelFont: "Fredoka" };
const options: PlantageBannerOptions = {
  loop: 6, font: "Baloo 2", titleFont: "Fredoka", textColor: "#ffffff", textOnWood: "#3a2410", paper: "#fff6df", shadow: "#5e3b22",
  day: paint, evening: { ...paint, colors: { ...colors, skyTop: "#ff6f61", skyBottom: "#ffc371" } },
  title: "Plantage", profileText: "Mangos and streams", offlineTitle: "Out in the field", offlineText: "Follow the channel", offlineLines: ["Live soon", "See you soon"],
};
const texts = (calls: unknown[][]) => calls.filter(call => call[0] === "fillText").map(call => call[1]);
const turns = (calls: unknown[][]) => calls.filter(call => call[0] === "rotate").map(call => call[1]);

for (const [draw, expected] of [
  [drawPlantageProfileBanner, ["PLANTAGE", "Plantage", "Mangos and streams"]],
  [drawPlantageOfflineBanner, ["PLANTAGE", "Out in the field", "Follow the channel", "Live soon", "See you soon"]],
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

// A title longer than the card gets a smaller font (the mock measures 40 px per character)
const long = recorder((text: string) => ({ width: text.length * 40 }));
drawPlantageOfflineBanner(long.context, 0, { ...options, offlineTitle: "x".repeat(40) });
const sizes = long.calls.filter(call => call[0] === "set font").map(call => Number(/^700 (\d+)px/.exec(String(call[1]))?.[1] ?? 0));
assert.ok(sizes.some(size => size > 40 && size < 110), "title shrinks to fit");

console.log("plantage banners ok");
