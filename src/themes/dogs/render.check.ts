// Check for render.ts of the Dogs theme (PLAN-DOGS.md package 5, AC4): the clips stinger, profile and offline with their
// groups and sizes, plain cream before prepare and the same picture twice after it; the panel template carries the
// title in a text layer in the font of the settings and keeps its layers inside the panel.
// Run: node src/themes/dogs/render.check.ts
import assert from "node:assert/strict";
import { layerBox, PANEL_WIDTH } from "../../core/panels.ts";
import { resolveSettings } from "../../core/settings.ts";
import { PROFILE_SIZE } from "./banners.ts";
import { recorder } from "./canvasImage.check.ts";
import { dogsClips, dogsPanel } from "./render.ts";
import { dogsSettings } from "./settings.ts";

// Clips
const clips = dogsClips(resolveSettings(dogsSettings, {}), "rezondes");
assert.deepEqual(clips.map(clip => [clip.name, clip.group, clip.width, clip.height]), [["stinger", "Stinger", 1920, 1080], ["profile", "Profilbanner", PROFILE_SIZE.width, PROFILE_SIZE.height], ["offline", "Offline-Banner", 1920, 1080]]);
const stinger = clips[0];
assert.equal(stinger.cut, 1.2);
const before = recorder();
stinger.draw(before.context, 0.5);
assert.deepEqual(before.calls, ["fillStyle=#fff6e6", "fillRect(0.000,0.000,1920.000,1080.000)"]);
await stinger.prepare?.();
for (const clip of clips) {
  const [first, second] = [recorder(), recorder()];
  clip.draw(first.context, 0.5);
  clip.draw(second.context, 0.5);
  assert.deepEqual(first.calls, second.calls, clip.name);
  assert.ok(first.calls.length > 10, clip.name);
}

// Panel: the title in the font, every layer inside the panel
const panel = dogsPanel(resolveSettings(dogsSettings, { font: "VT323" }), "Über mich");
const title = panel.layers.find(layer => layer.id === "title");
assert.ok(title && title.kind === "text" && title.text === "Über mich" && title.font === "VT323");
for (const layer of panel.layers) {
  const box = layerBox(layer);
  assert.ok(box.x >= 0 && box.y >= 0 && box.x + box.w <= PANEL_WIDTH && box.y + box.h <= panel.height, layer.id);
}

console.log("dogs render ok");
