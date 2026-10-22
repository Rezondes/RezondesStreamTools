// Check of areas.ts: the OBS sources of the bears theme for the defaults and after changes
import assert from "node:assert/strict";
import { resolveSettings } from "../../core/settings.ts";
import { bearsAreas } from "./areas.ts";
import { bearsSettings } from "./settings.ts";

const areas = (changes: Record<string, unknown>) => bearsAreas(resolveSettings(bearsSettings, changes));

assert.deepEqual(areas({}).alerts, { width: 808, height: 484, offset: { x: 556, y: 20 } }, "the card with the bear");
assert.deepEqual(areas({ alertBearSize: 600 }).alerts, { width: 808, height: 684, offset: { x: 556, y: 20 } }, "a larger bear makes it taller");
assert.deepEqual(areas({ chatPhoneWidth: 800 }).chat, { width: 860, height: 900 }, "a wide phone widens the chat");

console.log("bears areas ok");
