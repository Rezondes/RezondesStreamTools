// Check for render.ts of the KOTH theme: three clips with groups, length, transition point and loop from the settings.
// Runs with npm test.
import assert from "node:assert/strict";
import { resolveSettings } from "../../core/settings.ts";
import { kothClips } from "./render.ts";
import { kothSettings } from "./settings.ts";

const clips = kothClips(resolveSettings(kothSettings, { stingerDuration: 1.5, stingerCut: 0.8 }), "neo");
assert.deepEqual(clips.map(clip => [clip.name, clip.group, clip.width, clip.height]), [["stinger", "Stinger", 1920, 1080], ["profile", "Banner", 1200, 480], ["offline", "Banner", 1920, 1080]]);
assert.equal(clips[0].duration, 1.5);
assert.equal(clips[0].cut, 0.8);
assert.equal(clips[1].fps, 1);
assert.equal(clips[2].duration, 6);
assert.match(clips[0].font, /Black Ops One/);

console.log("koth render ok");
