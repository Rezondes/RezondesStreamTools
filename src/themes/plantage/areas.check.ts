// Check of areas.ts: the OBS sources of the plantage theme for the defaults and after changes
import assert from "node:assert/strict";
import { resolveSettings } from "../../core/settings.ts";
import { plantageAreas } from "./areas.ts";
import { plantageSettings } from "./settings.ts";

const areas = (changes: Record<string, unknown>) => plantageAreas(resolveSettings(plantageSettings, changes));

assert.deepEqual(areas({}).alerts, { width: 1224, height: 1080, offset: { x: 200, y: 0 } }, "the card and the canvas of the mango");
assert.deepEqual(areas({ alertScale: 0.5 }).alerts, { width: 612, height: 595, offset: { x: 580, y: 0 } }, "half the size");

console.log("plantage areas ok");
