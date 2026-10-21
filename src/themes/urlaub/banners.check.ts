// Check for banners.ts of the Urlaub theme: both banners draw title and texts, the same options give the same calls.
// A mock canvas records the calls. Runs with npm test.
import assert from "node:assert/strict";
import { drawUrlaubOfflineBanner, drawUrlaubProfileBanner, type UrlaubBannerOptions } from "./banners.ts";

function recorder() {
  const calls: unknown[][] = [];
  const target: Record<string, unknown> = { measureText: () => ({ width: 300 }) };
  const context = new Proxy(target, {
    get: (object, key: string) => object[key] ?? ((...args: unknown[]) => { calls.push([key, ...args]); }),
    set: (_, key: string, value) => { calls.push([`set ${key}`, value]); return true; },
  });
  return { context: context as unknown as CanvasRenderingContext2D, calls };
}

const options: UrlaubBannerOptions = {
  font: "Fredoka", titleFont: "Pacifico", wood: "#d39a5c", woodDark: "#8a5527", textColor: "#ffffff", textOnWood: "#3b2412",
  title: "Beach", profileText: "Sun and streams", offlineTitle: "At the beach right now", offlineText: "Follow the channel", offlineLines: ["Live soon", "See you soon"],
};
const texts = (calls: unknown[][]) => calls.filter(call => call[0] === "fillText").map(call => call[1]);

for (const [draw, expected] of [
  [drawUrlaubProfileBanner, ["Beach", "Sun and streams"]],
  [drawUrlaubOfflineBanner, ["At the beach right now", "Follow the channel", "Live soon", "See you soon"]],
] as const) {
  const frame = recorder();
  draw(frame.context, options);
  assert.deepEqual(texts(frame.calls), expected, draw.name);
  const again = recorder();
  draw(again.context, options);
  assert.deepEqual(again.calls, frame.calls, draw.name);
}

console.log("urlaub banners ok");
