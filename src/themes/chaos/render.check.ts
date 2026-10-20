// Check for render.ts: the Chaos theme brings stinger, profile and offline banner with the sizes, groups and timing of
// its settings, and fills {channel} in the texts. Runs with npm test.
import assert from "node:assert/strict";
import { resolveSettings } from "../../core/settings.ts";
import { chaosClips } from "./render.ts";
import { chaosSettings } from "./settings.ts";

const values = resolveSettings(chaosSettings, { channelName: "REZONDES" });
const clips = chaosClips(values, "rezondes");
assert.deepEqual(clips.map(clip => [clip.name, clip.group, clip.width, clip.height]), [
  ["stinger", "Stinger", 1920, 1080],
  ["profile", "Banner", 1200, 480],
  ["offline", "Banner", 1920, 1080],
]);
assert.equal(clips[0].cut, values.stingerCut);
assert.equal(clips[1].duration, values.bannerLoop);
assert.ok(clips.every(clip => typeof clip.draw === "function" && clip.font.includes("Permanent Marker")));

console.log("chaos render ok");
