// Check für settings.ts (Schema des Standard-Themes): gültige Standardwerte und kein toter Schlüssel. Läuft mit npm test.
import assert from "node:assert/strict";
import { auditTheme } from "../schemaAudit.ts";
import { standardSettings } from "./settings.ts";

const audit = auditTheme(standardSettings, import.meta.dirname);
assert.deepEqual(audit.errors, []);
assert.deepEqual(audit.unused, [], `unbenutzte Schlüssel: ${audit.unused.join(", ")}`);
assert.equal(standardSettings.id, "standard");

console.log("standard settings ok");
