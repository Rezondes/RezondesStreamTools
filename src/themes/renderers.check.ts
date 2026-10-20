// Check for renderers.ts: every theme provides an ordered subset of stinger, profile and offline banner (the built-in
// ones all three), the groups exist in the schema, only the stinger has a transition point. Runs with npm test.
import assert from "node:assert/strict";
import { resolveSettings } from "../core/settings.ts";
import { THEMES } from "./registry.ts";
import { CLIP_NAMES, clipsFor } from "./renderers.ts";

// Mock canvas that accepts everything; counts the draw calls
function canvas() {
  let calls = 0;
  const gradient = { addColorStop: () => {} };
  const target: Record<string, unknown> = { measureText: () => ({ width: 10 }), createLinearGradient: () => gradient, createRadialGradient: () => gradient };
  const context = new Proxy(target, {
    get: (object, key: string) => object[key] ?? (() => { calls++; }),
    set: (object, key: string, value) => { object[key] = value; return true; },
  });
  return { context: context as unknown as CanvasRenderingContext2D, count: () => calls };
}

// Built-in themes that bring all three clips today; every other theme brings an ordered subset
const COMPLETE = ["standard", "matrix", "urlaub", "plantage", "koth", "bears", "chaos"];

for (const schema of THEMES) {
  const clips = clipsFor(schema.id, resolveSettings(schema, {}), "rezondes");
  const names = clips.map(clip => clip.name);
  assert.deepEqual(names, CLIP_NAMES.filter(name => names.includes(name)), `${schema.id}: order or duplicates`);
  assert.equal(new Set(names).size, names.length, `${schema.id}: duplicate clip`);
  if (COMPLETE.includes(schema.id)) assert.deepEqual(names, CLIP_NAMES, schema.id);
  const groups = new Set(schema.fields.map(field => field.group));
  for (const clip of clips) {
    assert.ok(groups.has(clip.group), `${schema.id}/${clip.name}: group ${clip.group} missing in the schema`);
    assert.equal(clip.cut !== null, clip.name === "stinger");
    assert.ok(clip.duration > 0 && clip.fps > 0 && clip.width > 0 && clip.height > 0);
    // Draws something in the middle of the clip
    const mock = canvas();
    clip.draw(mock.context, clip.cut ?? clip.duration / 2);
    assert.ok(mock.count() > 0, `${schema.id}/${clip.name}: zeichnet nichts`);
  }
}

// Unknown theme: no clips (nothing is inherited)
assert.equal(clipsFor("does-not-exist", resolveSettings(THEMES[0], {}), "rezondes").length, 0);

console.log("renderers ok");
