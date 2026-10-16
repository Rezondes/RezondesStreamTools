// Check für renderers.ts sowie matrix/render.ts und standard/render.ts: jedes Theme liefert Stinger, Profil- und
// Offline-Banner, die Gruppen gibt es im Schema, nur der Stinger hat einen Übergangspunkt. Läuft mit npm test.
import assert from "node:assert/strict";
import { resolveSettings } from "../core/settings.ts";
import { THEMES } from "./registry.ts";
import { clipsFor, hasClips } from "./renderers.ts";

// Mock-Canvas, das alles annimmt; zählt die Zeichenaufrufe
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

for (const schema of THEMES) {
  assert.ok(hasClips(schema.id), `${schema.id}: keine Clips`);
  const clips = clipsFor(schema.id, resolveSettings(schema, {}), "rezondes");
  assert.deepEqual(clips.map(clip => clip.name), ["stinger", "profile", "offline"], schema.id);
  const groups = new Set(schema.fields.map(field => field.group));
  for (const clip of clips) {
    assert.ok(groups.has(clip.group), `${schema.id}/${clip.name}: Gruppe ${clip.group} fehlt im Schema`);
    assert.equal(clip.cut !== null, clip.name === "stinger");
    assert.ok(clip.duration > 0 && clip.fps > 0 && clip.width > 0 && clip.height > 0);
    // Zeichnet in der Mitte des Clips etwas
    const mock = canvas();
    clip.draw(mock.context, clip.cut ?? clip.duration / 2);
    assert.ok(mock.count() > 0, `${schema.id}/${clip.name}: zeichnet nichts`);
  }
}

// Unbekanntes Theme: Clips des Standard-Themes
assert.equal(clipsFor("gibt-es-nicht", resolveSettings(THEMES[0], {}), "rezondes").length, 3);
assert.equal(hasClips("gibt-es-nicht"), false);

console.log("renderers ok");
