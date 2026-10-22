// Check for render.ts of the Bärenbande theme: stinger, profile and offline banner with their groups, sizes, loop and
// transition point from the settings, the channel name in the texts; the stinger options of the core, the same pictures
// for the same settings, the watercolor world once prepare has loaded it. Runs with npm test.
import assert from "node:assert/strict";
import { resolveSettings } from "../../core/settings.ts";
import { readStingerOptions } from "../../core/stingerOptions.ts";
import { bearsClips } from "./render.ts";
import { bearsSettings } from "./settings.ts";

const clips = bearsClips(resolveSettings(bearsSettings, { stingerDuration: 2, stingerCut: 0.9 }), "neo");
assert.deepEqual(clips.map(clip => [clip.name, clip.group, clip.width, clip.height]), [
  ["stinger", "Stinger", 1920, 1080],
  ["profile", "Profilbanner", 1200, 480],
  ["offline", "Offline-Banner", 1920, 1080],
]);
assert.deepEqual(clips.map(clip => [clip.duration, clip.cut]), [[2, 0.9], [6, null], [6, null]]);
assert.deepEqual(clips.map(clip => clip.feature), ["stinger", "banners", "banners"]);

// Clips: the stinger options come from the core, the banners can prepare their world
const values = resolveSettings(bearsSettings, { stingerDuration: 2, stingerCut: 0.9 });
assert.equal(clips[0].fps, readStingerOptions(values).fps);
assert.deepEqual(clips.map(clip => typeof clip.prepare), ["undefined", "function", "function"]);

// The same settings give the same pictures; the watercolor world paints more than the flat one
function recorder() {
  const calls: unknown[][] = [];
  const gradient = { addColorStop: () => {} };
  const target: Record<string, unknown> = { measureText: () => ({ width: 300 }), createLinearGradient: () => gradient, createRadialGradient: () => gradient };
  const context = new Proxy(target, {
    get: (object, key: string) => object[key] ?? ((...args: unknown[]) => { calls.push([key, ...args]); }),
    set: () => true,
  });
  return { context: context as unknown as CanvasRenderingContext2D, calls };
}
const picture = (clip: (typeof clips)[number], time: number) => {
  const frame = recorder();
  clip.draw(frame.context, time);
  return frame.calls;
};
const twin = bearsClips(values, "neo");
for (const [index, time] of [[0, 0.9], [2, 0]] as const) assert.deepEqual(picture(clips[index], time), picture(twin[index], time));
const flat = picture(clips[2], 0).length;
await clips[2].prepare!();
assert.ok(picture(bearsClips(values, "neo")[2], 0).length > flat);

console.log("bears render ok");
