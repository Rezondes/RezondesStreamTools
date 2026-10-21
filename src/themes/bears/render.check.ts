// Check for render.ts of the Bärenbande theme: stinger, profile and offline banner with their groups, sizes, loop and
// transition point from the settings, the channel name in the texts. Runs with npm test.
import assert from "node:assert/strict";
import { resolveSettings } from "../../core/settings.ts";
import { bearsClips } from "./render.ts";
import { bearsSettings } from "./settings.ts";

const clips = bearsClips(resolveSettings(bearsSettings, { stingerDuration: 2, stingerCut: 0.9 }), "neo");
assert.deepEqual(clips.map(clip => [clip.name, clip.group, clip.width, clip.height]), [
  ["stinger", "Stinger", 1920, 1080],
  ["profile", "Banner", 1200, 480],
  ["offline", "Banner", 1920, 1080],
]);
assert.deepEqual(clips.map(clip => [clip.duration, clip.cut]), [[2, 0.9], [6, null], [6, null]]);
assert.deepEqual(clips.map(clip => clip.feature), ["stinger", "banners", "banners"]);

console.log("bears render ok");
