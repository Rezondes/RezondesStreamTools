// Check of sounds.ts (PLAN-DOGS.md package 1): every event has its file in sounds/ and its sound field in the schema;
// barks use the voice of the breed from the settings. Run: node src/themes/dogs/sounds.check.ts
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { BARK_FILES, barkVoiceOf, DOG_SOUNDS, filesOf, soundFile } from "./sounds.ts";
import { dogsSettings } from "./settings.ts";

// Every event: a file next to the theme and a sound field
for (const [event, { file, field }] of Object.entries(DOG_SOUNDS)) {
  assert.ok(existsSync(join(import.meta.dirname, "sounds", `${file}.ogg`)), `${event}: ${file}.ogg`);
  assert.equal(dogsSettings.fields.find(candidate => candidate.key === field)?.type, "sound", `${event}: field ${field}`);
}
for (const file of Object.values(BARK_FILES)) assert.ok(existsSync(join(import.meta.dirname, "sounds", `${file}.ogg`)), file);

// Bark voices: from the settings per breed, small when missing or unknown
const values = { barkVoice_labrador: "gross", barkVoice_mops: "quietschig" };
assert.equal(barkVoiceOf("labrador", values), "gross");
assert.equal(barkVoiceOf("mops", values), "klein");
assert.equal(barkVoiceOf("corgi", values), "klein");
assert.equal(soundFile("bark", values, "labrador"), "alert-bark-big");
assert.equal(soundFile("startingCard", values), "starting-card");

// Loading ahead: each file once, a bark loads all voices
assert.deepEqual(filesOf(["startingLand", "startingLand"]), ["starting-land"]);
assert.deepEqual(filesOf(["bark"]).sort(), ["alert-bark-big", "alert-bark-medium", "alert-bark-small"]);

console.log("dogs sounds ok");
