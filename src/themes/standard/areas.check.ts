// Check of areas.ts: the OBS sources of the standard theme for the defaults and after changes
import assert from "node:assert/strict";
import { resolveSettings } from "../../core/settings.ts";
import { standardAreas } from "./areas.ts";
import { standardSettings } from "./settings.ts";

const areas = (changes: Record<string, unknown>) => standardAreas(resolveSettings(standardSettings, changes));

assert.deepEqual(areas({}).alerts, { width: 1360, height: 788, offset: { x: 280, y: 0 } }, "the card with the room of its sparks");
assert.deepEqual(areas({ alertSparksOn: false }).alerts, { width: 800, height: 508, offset: { x: 560, y: 0 } }, "without sparks only the glow and the exit");
assert.deepEqual(areas({}).stats, { width: 1073, height: 200 }, "five stats cards side by side");
assert.deepEqual(areas({ endingStats: ["follows|Follows"] }).stats, { width: 253, height: 200 }, "one card");

assert.deepEqual(areas({}).music, { width: 900, height: 184 }, "the music card as high as its text");
assert.equal(areas({ coverSize: 300 }).music?.height, 364, "a big cover makes it taller");
assert.equal(areas({ musicCover: false, fontSize: 40 }).music?.height, 273, "without cover the text decides");

console.log("standard areas ok");
