// Check for render.ts of the Plantage theme: three clips with groups, length, transition point and loop from the
// settings; the same settings give the same pictures. Runs with npm test.
import assert from "node:assert/strict";
import { resolveSettings } from "../../core/settings.ts";
import { plantageClips } from "./render.ts";
import { plantageSettings } from "./settings.ts";

const clips = plantageClips(resolveSettings(plantageSettings, { stingerDuration: 1.5, stingerCut: 0.8 }), "neo");
assert.deepEqual(clips.map(clip => [clip.name, clip.group, clip.width, clip.height]), [["stinger", "Stinger", 1920, 1080], ["profile", "Banner", 1200, 480], ["offline", "Banner", 1920, 1080]]);
assert.equal(clips[0].duration, 1.5);
assert.equal(clips[0].cut, 0.8);
assert.equal(clips[1].fps, 1);
assert.equal(clips[2].duration, 6);
assert.match(clips[0].font, /Fredoka/);

// Clips: the same settings give the same pictures (a mock canvas records every call)
const gradient = { addColorStop: () => {} };
function recorded(draw: (context: CanvasRenderingContext2D, time: number) => void, time: number) {
  const calls: unknown[][] = [];
  const target: Record<string, unknown> = { measureText: () => ({ width: 10 }), createLinearGradient: () => gradient, createRadialGradient: () => gradient };
  const context = new Proxy(target, {
    get: (object, key: string) => object[key] ?? ((...args: unknown[]) => { calls.push([key, ...args]); }),
    set: (_, key: string, value) => { calls.push([`set ${key}`, value]); return true; },
  });
  draw(context as unknown as CanvasRenderingContext2D, time);
  return calls;
}
const again = plantageClips(resolveSettings(plantageSettings, { stingerDuration: 1.5, stingerCut: 0.8 }), "neo");
clips.forEach((clip, index) => assert.deepEqual(recorded(clip.draw, 0.8), recorded(again[index].draw, 0.8), clip.name));

console.log("plantage render ok");
