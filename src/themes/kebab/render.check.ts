// Check for render.ts: the stinger and both banners with groups, sizes and timing from the settings, the stand-ins
// before prepare, the same picture from two renders after it (Clips); the panel is a bon in the colors of the
// settings. Runs with npm test.
import assert from "node:assert/strict";
import { resolveSettings } from "../../core/settings.ts";
import { kebabClips, kebabPanel } from "./render.ts";
import { kebabSettings } from "./settings.ts";
import { recorder } from "./stinger.check.ts";

const values = resolveSettings(kebabSettings, {});
const own = resolveSettings(kebabSettings, { stingerDuration: 2, stingerCut: 1, stingerFps: 48, stingerStyle: "messer" });
const clips = kebabClips(own, "rezondes");
assert.deepEqual(clips.map(clip => [clip.name, clip.group, clip.width, clip.height, clip.duration, clip.cut]), [
  ["stinger", "Stinger", 1920, 1080, 2, 1], ["profile", "Profilbanner", 1200, 480, 1, null], ["offline", "Offline-Banner", 1920, 1080, 1, null],
]);
assert.equal(clips[0].fps, 48);
assert.match(clips[0].font, /Titan One/);
assert.ok(clips.every(clip => typeof clip.prepare === "function"));

// Before prepare: the stinger covers the picture from the left (all of it at the cut), the banners are plain
const before = recorder();
clips[0].draw(before.context, 0.5);
clips[0].draw(before.context, 1);
clips[1].draw(before.context, 0);
assert.ok(before.calls.includes("fillRect(0.000,0.000,960.000,1080.000)"));
assert.ok(before.calls.includes("fillRect(0.000,0.000,1920.000,1080.000)"));
assert.ok(before.calls.includes("fillRect(0.000,0.000,1200.000,480.000)"));

// After prepare: two renders of the same settings draw the same pictures, the shop name stands on the profile
await clips[0].prepare?.();
const picture = (time: number) => kebabClips(own, "rezondes").map(clip => {
  const canvas = recorder();
  clip.draw(canvas.context, time);
  return canvas.calls;
});
assert.deepEqual(picture(1), picture(1));
assert.ok(picture(0)[1].some(call => call.startsWith("fillText(Döner,")));

const panel = kebabPanel(values, "Über mich");
assert.equal(panel.background, "#fff8ec");
const title = panel.layers.find(layer => layer.id === "title");
assert.ok(title?.kind === "text" && title.text === "Über mich" && title.font === "Titan One" && title.color === "#c8261b");
assert.ok(panel.layers.some(layer => layer.kind === "rect" && layer.stroke === "#f85449"), "a red line around the bon");

console.log("kebab render ok");
