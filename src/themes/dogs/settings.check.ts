// Check for settings.ts (schema of the Dogs theme, PLAN-DOGS.md package 1, AC2 and AC8): valid defaults, no dead key
// (the coat colors are read by key in coats.ts), every variant has its four coat fields, the channel name of the first
// login. Run: node src/themes/dogs/settings.check.ts
import assert from "node:assert/strict";
import { resolveSettings } from "../../core/settings.ts";
import { auditTheme } from "../schemaAudit.ts";
import { BREED_IDS } from "./breeds.ts";
import { COAT_PARTS, COATS, coatKey, coatPalette } from "./coats.ts";
import { dogsSettings } from "./settings.ts";

// Schema: no errors, every key used; coat colors, bark voices and raid breeds are built keys (coatPalette, barkVoiceOf, raidBreeds, chatBreeds read them)
const coatKeys = COATS.flatMap(variant => COAT_PARTS.map(part => coatKey(variant, part)));
const builtKeys = [...coatKeys, ...BREED_IDS.flatMap(breed => [`barkVoice_${breed}`, `raidBreed_${breed}`, `chatBreed_${breed}`])];
const audit = auditTheme(dogsSettings, import.meta.dirname);
assert.deepEqual(audit.errors, []);
assert.deepEqual(audit.unused.filter(key => !builtKeys.includes(key)), [], `unused keys: ${audit.unused.join(", ")}`);
assert.deepEqual(audit.basic, [], `simple view: ${audit.basic.join("; ")}`);
assert.equal(dogsSettings.id, "dogs");

// Every one of the 18 variants has its four coat fields with a color default, and the palette reads them
const keys = new Set(dogsSettings.fields.map(field => field.key));
assert.equal(coatKeys.length, 72);
for (const key of coatKeys) assert.equal(dogsSettings.fields.find(field => field.key === key)?.type, "color", key);
const values = resolveSettings(dogsSettings, {});
assert.equal(coatPalette(values, "corgi", "rotweiss").base, "#cc7633");
assert.equal(coatPalette(resolveSettings(dogsSettings, { mopsSchwarzNose: "#123456" }), "mops", "schwarz").nose, "#123456");

// Every breed has its bark voice and is a choice of the streamer's dog; every coat id is a choice of coat
for (const breed of BREED_IDS) assert.ok(keys.has(`barkVoice_${breed}`), breed);
const options = (key: string) => {
  const field = dogsSettings.fields.find(candidate => candidate.key === key);
  return field && "options" in field ? field.options : [];
};
assert.deepEqual(options("dog"), BREED_IDS);
assert.ok(COATS.every(variant => options("coat").includes(variant.id)));

// First login: the channel name in capitals
assert.deepEqual(dogsSettings.personalize?.("neo"), { channelName: "NEO" });

console.log("dogs settings ok");
