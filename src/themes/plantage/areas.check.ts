// Check of areas.ts: the OBS sources of the plantage theme for the defaults and after changes
import assert from "node:assert/strict";
import { resolveSettings } from "../../core/settings.ts";
import { plantageAreas } from "./areas.ts";
import { plantageSettings } from "./settings.ts";

const areas = (changes: Record<string, unknown>) => plantageAreas(resolveSettings(plantageSettings, changes));

assert.deepEqual(areas({}).alerts, { width: 1224, height: 1080, offset: { x: 200, y: 0 } }, "the card and the canvas of the mango");
assert.deepEqual(areas({ alertScale: 0.5 }).alerts, { width: 612, height: 595, offset: { x: 580, y: 0 } }, "half the size");

assert.deepEqual(areas({}).music, { width: 900, height: 212 }, "the radio as high as its text");
assert.equal(areas({ musicAlbum: true }).music?.height, 244, "the album line adds to the text");
assert.equal(areas({ musicStyle: "schlicht", coverSize: 300 }).music?.height, 388, "a big cover on the plain card");

console.log("plantage areas ok");
