// Check for render.ts of the KOTH theme: three clips with groups, sizes, length and transition point from the settings,
// all three load the 3D part lazily; until then the stinger draws its smoke cover (nothing at the start, all at the cut)
// and the banners their texts. Runs with npm test.
import assert from "node:assert/strict";
import { resolveSettings } from "../../core/settings.ts";
import { kothClips } from "./render.ts";
import { kothSettings } from "./settings.ts";

const clips = kothClips(resolveSettings(kothSettings, { stingerDuration: 1.5, stingerCut: 0.8, stingerFps: 30 }), "neo");
assert.deepEqual(clips.map(clip => [clip.name, clip.group, clip.width, clip.height]), [["stinger", "Stinger", 1920, 1080], ["profile", "Banner", 1200, 480], ["offline", "Banner", 1920, 1080]]);
assert.equal(clips[0].duration, 1.5);
assert.equal(clips[0].cut, 0.8);
assert.equal(clips[0].fps, 30);
assert.deepEqual(clips.slice(1).map(clip => [clip.fps, clip.cut]), [[1, null], [1, null]]);
assert.match(clips[0].font, /Black Ops One/);
assert.deepEqual(clips.map(clip => typeof clip.prepare), ["function", "function", "function"]);

// Stand-ins before the 3D part has loaded
const calls: unknown[][] = [];
const target: Record<string, unknown> = { measureText: () => ({ width: 100 }) };
const context = new Proxy(target, {
  get: (object, key: string) => object[key] ?? ((...args: unknown[]) => { calls.push([key, ...args]); }),
  set: (_, key: string, value) => { calls.push([`set ${key}`, value]); return true; },
}) as unknown as CanvasRenderingContext2D;
const alphas = () => calls.filter(call => call[0] === "set globalAlpha").map(call => call[1]);
clips[0].draw(context, 0);
clips[0].draw(context, 0.8);
assert.deepEqual(alphas(), [0, 1, 1, 1], "no smoke at the start, full smoke at the cut");
calls.length = 0;
clips[1].draw(context, 0);
assert.ok(calls.some(call => call[0] === "fillText" && call[1] === "KOTH"), "profile title");

console.log("koth render ok");
