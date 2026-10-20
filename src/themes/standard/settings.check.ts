// Check for settings.ts (schema of the standard theme): valid defaults and no dead key. Runs with npm test.
import assert from "node:assert/strict";
import { auditTheme } from "../schemaAudit.ts";
import { standardSettings } from "./settings.ts";

const audit = auditTheme(standardSettings, import.meta.dirname);
assert.deepEqual(audit.errors, []);
assert.deepEqual(audit.unused, [], `unused keys: ${audit.unused.join(", ")}`);
assert.deepEqual(audit.basic, [], `simple view: ${audit.basic.join("; ")}`);
assert.equal(standardSettings.id, "standard");

console.log("standard settings ok");
