// Check for render.ts: the Chaos theme brings stinger, profile and offline banner with the sizes, groups and timing of
// its settings, fills {channel} in the texts, takes the stinger options of the core and draws the same pictures for the
// same settings; once prepare loaded the Rough takes, the scribbles change. Runs with npm test.
import assert from "node:assert/strict";
import { readStingerOptions } from "../../core/stingerOptions.ts";
import { recorder } from "./paint.check.ts";
import { resolveSettings } from "../../core/settings.ts";
import { chaosClips } from "./render.ts";
import { chaosSettings } from "./settings.ts";

const values = resolveSettings(chaosSettings, { channelName: "REZONDES" });
const clips = chaosClips(values, "rezondes");
assert.deepEqual(clips.map(clip => [clip.name, clip.group, clip.width, clip.height]), [
  ["stinger", "Stinger", 1920, 1080],
  ["profile", "Profilbanner", 1200, 480],
  ["offline", "Offline-Banner", 1920, 1080],
]);
assert.equal(clips[0].cut, values.stingerCut);
assert.equal(clips[1].duration, 1);
assert.ok(clips.every(clip => typeof clip.draw === "function" && clip.font.includes("Permanent Marker")));

// Clips: the stinger options come from the core, every clip can prepare
assert.equal(clips[0].fps, readStingerOptions(values).fps);
assert.ok(clips.every(clip => typeof clip.prepare === "function"));

// The same settings give the same pictures, the Rough takes change them once loaded
const picture = (clip: (typeof clips)[number], time: number) => {
  const calls = recorder();
  clip.draw(calls.context, time);
  return calls.calls.filter(call => call.name === "stroke").map(call => call.args[0]);
};
const twin = chaosClips(values, "rezondes");
assert.deepEqual(clips.map(clip => picture(clip, clip.cut ?? 0)), twin.map(clip => picture(clip, clip.cut ?? 0)));
const plain = picture(clips[1], 0);
await clips[1].prepare!();
assert.notDeepEqual(picture(chaosClips(values, "rezondes")[1], 0), plain);

console.log("chaos render ok");
