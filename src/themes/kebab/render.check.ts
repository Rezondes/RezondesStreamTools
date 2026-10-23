// Check for render.ts: no clips yet, the panel is a bon in the colors of the settings. Runs with npm test.
import assert from "node:assert/strict";
import { resolveSettings } from "../../core/settings.ts";
import { kebabClips, kebabPanel } from "./render.ts";
import { kebabSettings } from "./settings.ts";

const values = resolveSettings(kebabSettings, {});
assert.deepEqual(kebabClips(), []);

const panel = kebabPanel(values, "Über mich");
assert.equal(panel.background, "#fff8ec");
const title = panel.layers.find(layer => layer.id === "title");
assert.ok(title?.kind === "text" && title.text === "Über mich" && title.font === "Titan One" && title.color === "#c8261b");
assert.ok(panel.layers.some(layer => layer.kind === "rect" && layer.stroke === "#f85449"), "a red line around the bon");

console.log("kebab render ok");
