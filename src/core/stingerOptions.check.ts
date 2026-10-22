// Check for stingerOptions.ts: time with hold and curve, the wrapped clip (frame rate, size, scaled drawing at the mapped
// time, own hold) and the four fields. Runs with npm test.
import assert from "node:assert/strict";
import type { RenderClip } from "./renderClip.ts";
import { resolveSettings } from "./settings.ts";
import { readStingerOptions, stingerFields, warpTime, withStingerFields, withStingerOptions } from "./stingerOptions.ts";

const near = (actual: number, expected: number, label: string) => assert.ok(Math.abs(actual - expected) < 1e-6, `${label}: ${actual} vs ${expected}`);

// Time with pause: hold 0 and linear give the time back; with hold 0.2 the drawing stands at the cut around it
const plain = { duration: 2, cut: 1, hold: 0, ease: "linear" as const };
for (const time of [0, 0.3, 1, 1.7, 2]) near(warpTime(time, plain), time, `identity at ${time}`);
const held = { ...plain, hold: 0.2 };
near(warpTime(0, held), 0, "start");
near(warpTime(0.4, held), 0.5, "first half runs faster");
for (const time of [0.8, 0.9, 1, 1.1, 1.2]) near(warpTime(time, held), 1, `stands at the cut at ${time}`);
near(warpTime(1.6, held), 1.5, "second half");
near(warpTime(2, held), 2, "end");
const samples = Array.from({ length: 41 }, (_, index) => warpTime(index / 20, held));
assert.ok(samples.every((value, index) => index === 0 || value >= samples[index - 1] - 1e-9), "never falls");
// A curve shapes each half but keeps the ends
const eased = { ...plain, ease: "weich" as const };
near(warpTime(1, eased), 1, "curve reaches the cut");
assert.ok(warpTime(0.25, eased) < 0.25, "soft start");
// Without length a half jumps to its end
near(warpTime(0, { duration: 1, cut: 0, hold: 0, ease: "linear" }), 0, "no first half");
near(warpTime(1, { duration: 1, cut: 1, hold: 0, ease: "linear" }), 1, "no second half");

// Wrapped clip: a recording context counts scale calls and the times at draw
const times: number[] = [];
const clip: RenderClip = {
  name: "stinger", feature: "stinger", width: 1920, height: 1080, fps: 60, duration: 2, cut: 1, group: "Stinger", font: "24px Inter",
  draw: (_context, time) => times.push(time),
  prepare: async () => {},
};
const calls: string[] = [];
const context = { save: () => calls.push("save"), restore: () => calls.push("restore"), scale: (x: number, y: number) => calls.push(`scale ${x.toFixed(3)} ${y.toFixed(3)}`) } as unknown as CanvasRenderingContext2D;
const small = withStingerOptions(clip, { fps: 24, hold: 0.2, ease: "linear", size: "720p" });
assert.deepEqual([small.width, small.height, small.fps, small.cut, small.duration, small.group, small.prepare], [1280, 720, 24, 1, 2, "Stinger", clip.prepare]);
small.draw(context, 0.9);
assert.deepEqual(calls, ["save", "scale 0.667 0.667", "restore"]);
near(times[0], 1, "drawing time with hold");
// Full size draws without scaling; own hold leaves the time as it is
const own = withStingerOptions(clip, { fps: 30, hold: 0.2, ease: "linear", size: "1080p", ownHold: true });
calls.length = 0;
own.draw(context, 0.9);
assert.deepEqual(calls, []);
near(times[1], 0.9, "own hold");
assert.deepEqual([own.width, own.height], [1920, 1080]);
// A clip without cut uses the middle
const noCut = withStingerOptions({ ...clip, cut: null }, { fps: 30, hold: 0.5, ease: "linear", size: "1080p" });
noCut.draw(context, 0.6);
near(times[2], 1, "middle as cut");

// Fields: four in the group, defaults per theme, valid against the schema
const fields = stingerFields("Stinger", { stingerFps: 30, stingerHold: 20 });
assert.deepEqual(fields.map(field => [field.key, field.group, field.default]), [
  ["stingerFps", "Stinger", 30], ["stingerHold", "Stinger", 20], ["stingerEase", "Stinger", "linear"], ["stingerSize", "Stinger", "1080p"],
]);
assert.equal(stingerFields("Stinger")[0].default, 60);
assert.equal(stingerFields("Stinger")[1].default, 0);
const values = resolveSettings({ id: "probe", name: "Probe", fields: stingerFields("Stinger") }, { stingerFps: 24, stingerHold: 25, stingerEase: "nagel", stingerSize: "720p" });
assert.deepEqual(readStingerOptions(values), { fps: 24, hold: 0.25, ease: "nagel", size: "720p" });

// The core fields stand at the top of the stinger group of a theme, or at the end when it has none
const themeFields = [{ key: "a", group: "Allgemein" }, { key: "text", group: "Stinger" }, { key: "b", group: "Banner" }];
assert.deepEqual(withStingerFields(themeFields, "Stinger").map(field => field.key), ["a", "stingerFps", "stingerHold", "stingerEase", "stingerSize", "text", "b"]);
assert.deepEqual(withStingerFields(themeFields.slice(0, 1), "Stinger").map(field => field.key).at(-1), "stingerSize");

console.log("stingerOptions ok");
