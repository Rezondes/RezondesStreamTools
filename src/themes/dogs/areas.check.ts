// Check of areas.ts: the alert of the Dogs theme spans the stage width from above the card to the bottom, a higher
// card makes the source taller. Run: node src/themes/dogs/areas.check.ts
import assert from "node:assert/strict";
import { resolveSettings } from "../../core/settings.ts";
import { dogsAreas } from "./areas.ts";
import { dogsSettings } from "./settings.ts";

const areas = (changes: Record<string, unknown>) => dogsAreas(resolveSettings(dogsSettings, changes));
assert.deepEqual(areas({}).alerts, { width: 1920, height: 680, offset: { x: 0, y: 400 } });
assert.deepEqual(areas({ cardTop: 20 }).alerts, { width: 1920, height: 1080, offset: { x: 0, y: 0 } });

console.log("dogs areas ok");
