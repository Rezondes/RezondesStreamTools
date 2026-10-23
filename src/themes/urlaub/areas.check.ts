// Check of areas.ts: the OBS sources of the urlaub theme for the defaults and after changes
import assert from "node:assert/strict";
import { resolveSettings } from "../../core/settings.ts";
import { urlaubAreas } from "./areas.ts";
import { urlaubSettings } from "./settings.ts";

const areas = (changes: Record<string, unknown>) => urlaubAreas(resolveSettings(urlaubSettings, changes));

assert.deepEqual(areas({}).alerts, { width: 856, height: 840, offset: { x: 532, y: 40 } }, "the postcard with the wave below it");
assert.deepEqual(areas({ alertSwellHeight: 100 }).alerts, { width: 856, height: 640, offset: { x: 532, y: 40 } }, "a lower wave needs less room");

assert.deepEqual(areas({}).music, { width: 900, height: 218 }, "the radio as high as its text");
assert.equal(areas({ musicAlbum: true }).music?.height, 234, "the album line adds to the text");
assert.equal(areas({ musicStyle: "muschel", musicTitleSize: 60 }).music?.height, 235, "a big title in the shell");

console.log("urlaub areas ok");
