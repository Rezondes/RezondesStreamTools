// Check for banners.ts of the Südfrucht theme: both banners draw title and texts and look exactly the same after one
// loop (seamless GIF). A mock canvas records the calls. Runs with npm test.
import assert from "node:assert/strict";
import { drawSuedfruchtOfflineBanner, drawSuedfruchtProfileBanner, type SuedfruchtBannerOptions } from "./banners.ts";

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

const options: SuedfruchtBannerOptions = {
  loop: 6, font: "Fredoka", titleFont: "Pacifico", skyTop: "#2fa8ec", skyBottom: "#b8ecff", eveningTop: "#ff5f6d", eveningBottom: "#ffc371",
  sun: "#ffd23f", sea: "#1fb5c9", seaDeep: "#0b6f8e", foam: "#f4fffd", sand: "#f2d49b", palmLeaf: "#2e9e4f", palmTrunk: "#8b5a2b",
  wood: "#d39a5c", woodDark: "#8a5527", textColor: "#ffffff", textOnWood: "#3b2412",
  title: "Beach", profileText: "Sun and streams", offlineTitle: "At the beach right now", offlineText: "Follow the channel", offlineLines: ["Live soon", "See you soon"],
};
const texts = (calls: unknown[][]) => calls.filter(call => call[0] === "fillText").map(call => call[1]);

for (const [draw, expected] of [
  [drawSuedfruchtProfileBanner, ["Beach", "Sun and streams"]],
  [drawSuedfruchtOfflineBanner, ["At the beach right now", "Follow the channel", "Live soon", "See you soon"]],
] as const) {
  // Title and texts are in the picture
  const frame = recorder();
  draw(frame.context, 0, options);
  assert.deepEqual(texts(frame.calls), expected, draw.name);
  // Seamless: frame 0 and the frame at the loop end are equal
  const end = recorder();
  draw(end.context, options.loop, options);
  assert.deepEqual(end.calls, frame.calls, draw.name);
}

console.log("suedfrucht banners ok");
