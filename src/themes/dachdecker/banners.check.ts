// Check for banners.ts of the Dachdecker theme: the drops spread over the height, both banners draw their texts in the
// order of the alert sign and leave empty ones out. Runs with npm test.
import assert from "node:assert/strict";
import { drawOffline, drawProfile, dropFall } from "./banners.ts";

// Drops: inside the height, the same for the same seed, spread over it
const drops = Array.from({ length: 50 }, (_, index) => dropFall(index, 7));
assert.ok(drops.every(drop => drop >= 0 && drop < 1));
assert.deepEqual(drops, Array.from({ length: 50 }, (_, index) => dropFall(index, 7)));
assert.ok(Math.min(...drops) < 0.2 && Math.max(...drops) > 0.8);

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
const options = { width: 1200, height: 480, font: "Roboto Mono", fontSize: 26, alertWidth: 720, grid: 50, glow: 0.8, rain: true, drops: 100, seed: 7, colors,
  look: { signWidth: 0.78, gridMajor: 0.1, gridFine: 0.04, gridPage: 0.04, sheetOpacity: 0.9, rainLength: 0.035, rainSlant: 0.006, rainOpacity: 0.55 } };
const profile = record();
drawProfile(profile.context, options, { dim: "BAUPLAN", tag: "", title: "NEO", line: "Live!" });
assert.deepEqual(profile.texts, ["BAUPLAN", "NEO", "Live!"]);
const offline = record();
drawOffline(offline.context, { ...options, width: 1920, height: 1080 }, { dim: "NEO", tag: "FEIERABEND", title: "OFFLINE", line: "" });
assert.deepEqual(offline.texts, ["NEO", "FEIERABEND", "OFFLINE"]);

console.log("dachdecker banners ok");
