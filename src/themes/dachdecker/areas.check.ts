// Check of areas.ts: the OBS sources of the dachdecker theme for the defaults and after changes
import assert from "node:assert/strict";
import { resolveSettings } from "../../core/settings.ts";
import { dachdeckerAreas } from "./areas.ts";
import { dachdeckerSettings } from "./settings.ts";

const areas = (changes: Record<string, unknown>) => dachdeckerAreas(resolveSettings(dachdeckerSettings, changes));

assert.deepEqual(areas({}).alerts, { width: 752, height: 342, offset: { x: 584, y: 604 } }, "the sign low on the stage");
assert.deepEqual(areas({ chatWidth: 700 }).chat, { width: 700, height: 900 }, "the chat as wide as its setting");
assert.deepEqual(areas({}).music, { width: 590, height: 410 }, "the music plan");

console.log("dachdecker areas ok");
