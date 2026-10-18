// Check for render.ts of the Urlaub theme: three clips with groups, length, transition point and loop from the
// settings. Runs with npm test.
import assert from "node:assert/strict";
import { resolveSettings } from "../../core/settings.ts";
import { urlaubClips } from "./render.ts";
import { urlaubSettings } from "./settings.ts";

const clips = urlaubClips(resolveSettings(urlaubSettings, { stingerDuration: 1.5, stingerCut: 0.8, bannerLoop: 8, bannerProfileFps: 15 }), "neo");
assert.deepEqual(clips.map(clip => [clip.name, clip.group, clip.width, clip.height]), [["stinger", "Stinger", 1920, 1080], ["profile", "Banner", 1200, 480], ["offline", "Banner", 1920, 1080]]);
assert.equal(clips[0].duration, 1.5);
assert.equal(clips[0].cut, 0.8);
assert.equal(clips[1].fps, 15);
assert.equal(clips[2].duration, 8);
assert.match(clips[0].font, /Pacifico/);

console.log("urlaub render ok");
