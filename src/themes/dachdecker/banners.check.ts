// Check for banners.ts of the Dachdecker theme: drops and the dimension marker loop seamlessly, both banners draw their
// texts and leave empty ones out. Runs with npm test.
import assert from "node:assert/strict";
import { drawOffline, drawProfile, dropFall, markerAt } from "./banners.ts";

// Seamless loop: at 0 and at the loop length every drop and the marker are in the same place, in between they moved
for (let index = 0; index < 50; index++) {
  assert.ok(Math.abs(dropFall(index, 0, 4, 7) - dropFall(index, 4, 4, 7)) < 1e-9, `drop ${index}`);
  assert.ok(dropFall(index, 1.3, 4, 7) >= 0 && dropFall(index, 1.3, 4, 7) < 1);
}
assert.notEqual(dropFall(3, 1, 4, 7), dropFall(3, 0, 4, 7));
assert.ok(Math.abs(markerAt(0, 4) - markerAt(4, 4)) < 1e-9);
assert.ok(markerAt(2, 4) > markerAt(1, 4));

// Drawing: every non-empty text once; a context that records fillText and accepts everything else
const record = () => {
  const texts: string[] = [];
  const gradient = { addColorStop: () => {} };
  const context = new Proxy({}, {
    get: (_, key: string) => (key === "fillText" ? (text: string) => texts.push(text) : key === "createLinearGradient" ? () => gradient : () => {}),
    set: () => true,
  }) as unknown as CanvasRenderingContext2D;
  return { texts, context };
};
const colors = { blueprint: "#192a56", page: "#121e40", accent: "#e67e22", copper: "#d4a373", line: "#ffffff", rainColor: "#7fe3ff" };
const options = { width: 1200, height: 480, loop: 4, font: "Roboto Mono", titleSize: 72, fontSize: 26, grid: 40, glow: 0.8, rain: true, drops: 100, seed: 7, colors };
const profile = record();
drawProfile(profile.context, 1, options, { title: "NEO", overline: "BAUPLAN", subtitle: "" });
assert.deepEqual(profile.texts, ["BAUPLAN", "NEO"]);
const offline = record();
drawOffline(offline.context, 1, { ...options, width: 1920, height: 1080 }, { title: "OFFLINE", overline: "NEO", subtitle: "BIS BALD" });
assert.deepEqual(offline.texts, ["NEO", "OFFLINE", "BIS BALD"]);

console.log("dachdecker banners ok");
