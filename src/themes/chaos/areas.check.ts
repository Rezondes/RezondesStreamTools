// Check of areas.ts: the OBS sources of the chaos theme for the defaults and after changes
import assert from "node:assert/strict";
import { resolveSettings } from "../../core/settings.ts";
import { chaosAreas } from "./areas.ts";
import { chaosSettings } from "./settings.ts";

const areas = (changes: Record<string, unknown>) => chaosAreas(resolveSettings(chaosSettings, changes));

assert.deepEqual(areas({}).alerts, { width: 1508, height: 849, offset: { x: 206, y: 0 } }, "the slapping note with its spray");
assert.deepEqual(areas({}).music, { width: 680, height: 340 }, "the music card");

console.log("chaos areas ok");
