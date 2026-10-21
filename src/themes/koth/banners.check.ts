// Check for banners.ts of the KOTH theme: both banners draw their title and texts, the offline banner at most three
// lines, the same options give the same calls. A mock canvas records the calls. Runs with npm test.
import assert from "node:assert/strict";
import { drawKothOfflineBanner, drawKothProfileBanner, type KothBannerOptions } from "./banners.ts";

function recorder() {
  const calls: unknown[][] = [];
  const target: Record<string, unknown> = { measureText: () => ({ width: 300 }) };
  const context = new Proxy(target, {
    get: (object, key: string) => object[key] ?? ((...args: unknown[]) => { calls.push([key, ...args]); }),
    set: (_, key: string, value) => { calls.push([`set ${key}`, value]); return true; },
  });
  return { context: context as unknown as CanvasRenderingContext2D, calls };
}

const options: KothBannerOptions = {
  font: "Inter", titleFont: "Black Ops One", paper: "#e9e4d0", ink: "#23251c", textColor: "#f2f0e6",
  title: "KOTH", profileText: "Hold the hill", offlineTitle: "Radio silence", offlineText: "Follow the channel", offlineLines: ["Back soon", "The hill waits", "Over", "Out"],
};
const texts = (calls: unknown[][]) => calls.filter(call => call[0] === "fillText").map(call => call[1]);

for (const [draw, expected] of [
  [drawKothProfileBanner, ["KOTH", "Hold the hill"]],
  [drawKothOfflineBanner, ["Radio silence", "Follow the channel", "Back soon", "The hill waits", "Over"]],
] as const) {
  const frame = recorder();
  draw(frame.context, options);
  assert.deepEqual(texts(frame.calls), expected, draw.name);
  const again = recorder();
  draw(again.context, options);
  assert.deepEqual(again.calls, frame.calls, draw.name);
}

console.log("koth banners ok");
