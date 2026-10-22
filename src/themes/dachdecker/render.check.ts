// Check for render.ts of the Dachdecker theme: stinger, profile and offline banner with sizes, groups, timing, the frame
// rate of the stinger from the settings and the lazy 3D loader. Runs with npm test.
import assert from "node:assert/strict";
import { resolveSettings } from "../../core/settings.ts";
import { dachdeckerClips } from "./render.ts";
import { dachdeckerSettings } from "./settings.ts";

const clips = dachdeckerClips(resolveSettings(dachdeckerSettings, { stingerDuration: 2, stingerCut: 1, stingerFps: 48 }), "neo");
assert.deepEqual(clips.map(clip => [clip.name, clip.group, clip.width, clip.height]), [
  ["stinger", "Stinger", 1920, 1080], ["profile", "Profilbanner", 1200, 480], ["offline", "Offline-Banner", 1920, 1080],
]);
assert.equal(clips[0].duration, 2);
assert.equal(clips[0].cut, 1);
assert.equal(clips[0].fps, 48);
assert.equal(clips[2].cut, null);
// Only the stinger is 3D and loads three.js lazily; the banners draw in 2D right away
assert.deepEqual(clips.map(clip => typeof clip.prepare), ["function", "undefined", "undefined"]);
assert.match(clips[0].font, /Roboto Mono/);

// Before the 3D part has loaded the stinger draws the covered share of the sheet: nothing at the start, all at the cut
const fills: number[][] = [];
const context = new Proxy({}, {
  get: (_, key: string) => (key === "fillRect" ? (...args: number[]) => fills.push(args) : () => {}),
  set: () => true,
}) as unknown as CanvasRenderingContext2D;
clips[0].draw(context, 0);
clips[0].draw(context, 1);
assert.deepEqual(fills.map(args => args[2]), [0, 1920]);

console.log("dachdecker render ok");
