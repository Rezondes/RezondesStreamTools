// Check of areas.ts: the OBS sources of the koth theme for the defaults and after changes
import assert from "node:assert/strict";
import { resolveSettings } from "../../core/settings.ts";
import { kothAreas } from "./areas.ts";
import { kothSettings } from "./settings.ts";

const areas = (changes: Record<string, unknown>) => kothAreas(resolveSettings(kothSettings, changes));

assert.deepEqual(areas({}).alerts, { width: 1270, height: 578, offset: { x: 297, y: 56 } }, "dog tag and radio");
assert.deepEqual(areas({ alertStyle: "funk" }).alerts, { width: 998, height: 348, offset: { x: 461, y: 56 } }, "a card style");
assert.deepEqual(areas({}).stats, { width: 600, height: 450 }, "the report with its stamp");

assert.deepEqual(areas({}).music, { width: 900, height: 223 }, "the radio as high as its text");
assert.equal(areas({ musicAlbum: true }).music?.height, 256, "the album line adds to the text");
assert.equal(areas({ coverSize: 300, musicStyle: "kiste" }).music?.height, 408, "a big cover in the crate");

console.log("koth areas ok");
