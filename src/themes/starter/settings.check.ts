// Check für settings.ts (Schema des Starter-Themes): gültige Standardwerte und kein toter Schlüssel. Läuft mit npm test.
import assert from "node:assert/strict";
import { auditTheme } from "../schemaAudit.ts";
import { starterSettings } from "./settings.ts";

const audit = auditTheme(starterSettings, import.meta.dirname);
assert.deepEqual(audit.errors, []);
assert.deepEqual(audit.unused, [], `unbenutzte Schlüssel: ${audit.unused.join(", ")}`);
assert.equal(starterSettings.id, "starter");

console.log("starter settings ok");
