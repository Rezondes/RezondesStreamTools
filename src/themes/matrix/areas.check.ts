// Check of areas.ts: the OBS sources of the matrix theme for the defaults and after changes
import assert from "node:assert/strict";
import { resolveSettings } from "../../core/settings.ts";
import { matrixAreas } from "./areas.ts";
import { matrixSettings } from "./settings.ts";

const areas = (changes: Record<string, unknown>) => matrixAreas(resolveSettings(matrixSettings, changes));

assert.deepEqual(areas({}).alerts, { width: 650, height: 489, offset: { x: 635, y: 40 } }, "box and curtain, scaled");
assert.deepEqual(areas({ alertScale: 1 }).alerts, { width: 908, height: 678, offset: { x: 506, y: 40 } }, "unscaled and centered on the stage");
assert.deepEqual(areas({}).stats, { width: 720, height: 260 }, "the panel grows with its lines");

console.log("matrix areas ok");
