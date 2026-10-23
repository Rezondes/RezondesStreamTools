// Check of areas.ts: the OBS sources of the koth theme for the defaults and after changes
import assert from "node:assert/strict";
import { resolveSettings } from "../../core/settings.ts";
import { kothAreas } from "./areas.ts";
import { kothSettings } from "./settings.ts";

const areas = (changes: Record<string, unknown>) => kothAreas(resolveSettings(kothSettings, changes));

assert.deepEqual(areas({}).alerts, { width: 1080, height: 578, offset: { x: 392, y: 56 } }, "dog tag and radio");
assert.deepEqual(areas({ alertStyle: "funk" }).alerts, { width: 808, height: 348, offset: { x: 556, y: 56 } }, "a card style");
assert.deepEqual(areas({}).stats, { width: 600, height: 450 }, "the report with its stamp");

console.log("koth areas ok");
