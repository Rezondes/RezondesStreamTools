// Check for render.ts of the standard theme: three clips with groups, length and transition point from the settings,
// the banners as stills. Runs with npm test.
import assert from "node:assert/strict";
import { effectiveSettings } from "../../core/settings.ts";
import { standardClips } from "./render.ts";
import { standardSettings } from "./settings.ts";

const clips = standardClips(effectiveSettings(standardSettings, { stingerDuration: 1.5, stingerCut: 0.7 }), "rezondes");
assert.deepEqual(clips.map(clip => [clip.name, clip.group]), [["stinger", "Stinger"], ["profile", "Profilbanner"], ["offline", "Offline-Banner"]]);
assert.equal(clips[0].duration, 1.5);
assert.equal(clips[0].cut, 0.7);
assert.equal(clips[2].duration, 1);

// Clips: the same settings give the same frames; the light fields follow the settings (here switched off)
function frame(values: Record<string, unknown>, time: number) {
  const calls: unknown[] = [];
  const target: Record<string, unknown> = {};
  const context = new Proxy(target, {
    get: (object, key: string) => object[key] ?? ((...args: unknown[]) => { calls.push([key, ...args]); return { addColorStop: () => {} }; }),
    set: (object, key: string, value) => { if (typeof value !== "object") calls.push(["set", key, value]); object[key] = value; return true; },
  });
  standardClips(effectiveSettings(standardSettings, values), "rezondes")[0].draw(context as unknown as CanvasRenderingContext2D, time);
  return JSON.stringify(calls);
}
assert.equal(frame({}, 0.6), frame({}, 0.6));
const radials = (json: string) => json.split("createRadialGradient").length - 1;
assert.equal(radials(frame({}, 0.6)), 4, "four light fields in the stinger by default");
assert.equal(radials(frame({ blobs: false }, 0.6)), 0, "without blobs no light fields");
// The stinger follows the theme colors until it has its own
assert.ok(frame({}, 0.6).includes("#0b0b12"), "the theme background");
assert.ok(frame({ stingerBackground: "#123456" }, 0.6).includes("#123456"), "its own background");

console.log("standard render ok");
