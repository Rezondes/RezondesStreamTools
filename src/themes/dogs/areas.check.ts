// Check of areas.ts: the alert of the Dogs theme spans the stage width from above the card down to the ground of the
// dogs, a higher card makes the source taller. Run: node src/themes/dogs/areas.check.ts
import assert from "node:assert/strict";
import { resolveSettings } from "../../core/settings.ts";
import { dogsAreas } from "./areas.ts";
import { dogsSettings } from "./settings.ts";

const areas = (changes: Record<string, unknown>) => dogsAreas(resolveSettings(dogsSettings, changes));
// The source ends one pixel row below the ground of the dogs (row 200), so placed at the bottom of the picture the dogs
// walk on its lower edge; it spans the whole width, so they come in and leave outside of it
assert.deepEqual(areas({}).alerts, { width: 1920, height: 610, offset: { x: 0, y: 400 } });
assert.deepEqual(areas({ cardTop: 20 }).alerts, { width: 1920, height: 1010, offset: { x: 0, y: 0 } });
assert.deepEqual(areas({ pixelScale: 4 }).alerts, { width: 1920, height: 408, offset: { x: 0, y: 400 } });

console.log("dogs areas ok");
