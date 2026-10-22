// Check of areas.ts: the OBS sources of the standard theme for the defaults and after changes
import assert from "node:assert/strict";
import { resolveSettings } from "../../core/settings.ts";
import { standardAreas } from "./areas.ts";
import { standardSettings } from "./settings.ts";

const areas = (changes: Record<string, unknown>) => standardAreas(resolveSettings(standardSettings, changes));

assert.deepEqual(areas({}).alerts, { width: 1360, height: 788, offset: { x: 280, y: 0 } }, "the card with the room of its sparks");
assert.deepEqual(areas({ alertSparksOn: false }).alerts, { width: 800, height: 508, offset: { x: 560, y: 0 } }, "without sparks only the glow and the exit");

console.log("standard areas ok");
