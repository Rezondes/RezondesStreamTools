// Check for settings.ts (schema of the Kebab theme): valid defaults, no dead key, the shop name of the first login.
// Runs with npm test.
import assert from "node:assert/strict";
import { auditTheme } from "../schemaAudit.ts";
import { kebabSettings, shopOf } from "./settings.ts";

const audit = auditTheme(kebabSettings, import.meta.dirname);
assert.deepEqual(audit.errors, []);
assert.deepEqual(audit.unused, [], `unused keys: ${audit.unused.join(", ")}`);
assert.deepEqual(audit.basic, [], `simple view: ${audit.basic.join("; ")}`);
assert.equal(kebabSettings.id, "kebab");

// The shop of the streamer: an apostrophe after s, x or z, else an s
assert.equal(shopOf("rezondes"), "Rezondes' Döner");
assert.equal(shopOf("neo"), "Neos Döner");
assert.equal(shopOf("max"), "Max' Döner");
assert.deepEqual(kebabSettings.personalize?.("neo_42"), { channelName: "Neo_42s Döner" });

console.log("kebab settings ok");
