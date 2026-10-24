// Check of areas.ts: the OBS sources of the matrix theme for the defaults and after changes
import assert from "node:assert/strict";
import { resolveSettings } from "../../core/settings.ts";
import { matrixAreas } from "./areas.ts";
import { matrixSettings } from "./settings.ts";

const areas = (changes: Record<string, unknown>) => matrixAreas(resolveSettings(matrixSettings, changes));

assert.deepEqual(areas({}).alerts, { width: 678, height: 489, offset: { x: 621, y: 40 } }, "box and curtain, scaled");
assert.deepEqual(areas({ alertScale: 1 }).alerts, { width: 948, height: 678, offset: { x: 486, y: 40 } }, "unscaled and centered on the stage");
assert.deepEqual(areas({}).stats, { width: 720, height: 260 }, "the panel grows with its lines");

assert.deepEqual(areas({}).music, { width: 900, height: 243 }, "the music box as high as its text");
assert.equal(areas({ musicArt: "none" }).music?.height, 241, "without art only the text");
assert.equal(areas({ musicArt: "vinyl", vinylSize: 40 }).music?.height, 402, "a big ASCII record");

console.log("matrix areas ok");
