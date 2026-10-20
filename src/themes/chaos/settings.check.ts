// Check for settings.ts (schema of the Chaos theme): valid defaults, no dead key, a valid simple view. Runs with npm test.
import assert from "node:assert/strict";
import { auditTheme } from "../schemaAudit.ts";
import { chaosSettings } from "./settings.ts";

const audit = auditTheme(chaosSettings, import.meta.dirname);
assert.deepEqual(audit.errors, []);
assert.deepEqual(audit.unused, [], `unused keys: ${audit.unused.join(", ")}`);
assert.deepEqual(audit.basic, [], `simple view: ${audit.basic.join("; ")}`);
assert.equal(chaosSettings.id, "chaos");
assert.deepEqual(chaosSettings.personalize?.("neo"), { channelName: "NEO" });

console.log("chaos settings ok");
