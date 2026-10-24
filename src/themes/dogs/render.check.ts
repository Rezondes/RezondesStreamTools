// Check for render.ts of the Dogs theme: no clips yet (PLAN-DOGS.md package 5), the panel template carries the title in
// a text layer in the font of the settings and keeps its layers inside the panel. Run: node src/themes/dogs/render.check.ts
import assert from "node:assert/strict";
import { layerBox, PANEL_WIDTH } from "../../core/panels.ts";
import { resolveSettings } from "../../core/settings.ts";
import { dogsClips, dogsPanel } from "./render.ts";
import { dogsSettings } from "./settings.ts";

assert.deepEqual(dogsClips(), []);

// Panel: the title in the font, every layer inside the panel
const panel = dogsPanel(resolveSettings(dogsSettings, { font: "VT323" }), "Über mich");
const title = panel.layers.find(layer => layer.id === "title");
assert.ok(title && title.kind === "text" && title.text === "Über mich" && title.font === "VT323");
for (const layer of panel.layers) {
  const box = layerBox(layer);
  assert.ok(box.x >= 0 && box.y >= 0 && box.x + box.w <= PANEL_WIDTH && box.y + box.h <= panel.height, layer.id);
}

console.log("dogs render ok");
