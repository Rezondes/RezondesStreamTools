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

// ohne Schwaden: the alerts have no swathes any more, their keys are gone
const keys = chaosSettings.fields.map(field => field.key);
assert.ok(!keys.includes("alertSide") && !keys.includes("swathDensity"));

console.log("chaos settings ok");
