// Check for render.ts of the Dachdecker theme: stinger, profile and offline banner with sizes, groups, timing and the
// lazy 3D loader; captions draw only non-empty lines. Runs with npm test.
import assert from "node:assert/strict";
import { resolveSettings } from "../../core/settings.ts";
import { dachdeckerClips, drawCaptions } from "./render.ts";
import { dachdeckerSettings } from "./settings.ts";

const clips = dachdeckerClips(resolveSettings(dachdeckerSettings, { stingerDuration: 2, stingerCut: 1, bannerDuration: 6 }), "neo");
assert.deepEqual(clips.map(clip => [clip.name, clip.group, clip.width, clip.height]), [
  ["stinger", "Stinger", 1920, 1080], ["profile", "Banner", 1200, 480], ["offline", "Banner", 1920, 1080],
]);
assert.equal(clips[0].duration, 2);
assert.equal(clips[0].cut, 1);
assert.equal(clips[1].duration, 6);
assert.equal(clips[2].cut, null);
assert.ok(clips.every(clip => typeof clip.prepare === "function"));
assert.match(clips[0].font, /Roboto Mono/);

// Captions: one fillText per non-empty line, centred
const texts: unknown[][] = [];
const context = new Proxy({}, {
  get: (_, key: string) => (key === "fillText" ? (...args: unknown[]) => texts.push(args) : () => {}),
  set: () => true,
}) as unknown as CanvasRenderingContext2D;
drawCaptions(context, [{ text: "NEO", size: 80, color: "#fff", y: 0.5 }, { text: "", size: 20, color: "#fff", y: 0.6 }], "Roboto Mono", 1000, 400);
assert.deepEqual(texts, [["NEO", 500, 200]]);

console.log("dachdecker render ok");
