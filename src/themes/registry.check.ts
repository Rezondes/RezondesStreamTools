// Check für registry.ts: jedes eingebaute Theme hat ein gültiges Schema. Läuft mit npm test.
import assert from "node:assert/strict";
import { validateSettings } from "../core/settings.ts";
import { DEFAULT_THEME, findTheme, THEMES } from "./registry.ts";

// Ids eindeutig, Standard-Theme vorhanden, unbekannte Id ergibt null
assert.equal(new Set(THEMES.map(theme => theme.id)).size, THEMES.length);
assert.equal(findTheme(DEFAULT_THEME)?.id, "matrix");
assert.equal(findTheme("gibt-es-nicht"), null);
assert.equal(findTheme("starter")?.name, "Starter");

for (const theme of THEMES) {
  // Schlüssel je Theme eindeutig, jedes Feld mit Label und Gruppe
  const keys = theme.fields.map(field => field.key);
  assert.equal(new Set(keys).size, keys.length, `${theme.id}: doppelte Schlüssel`);
  assert.ok(theme.fields.every(field => field.label && field.group), `${theme.id}: Feld ohne Label oder Gruppe`);
  // Die Standardwerte selbst bestehen die Prüfung
  const defaults = Object.fromEntries(theme.fields.map(field => [field.key, field.default]));
  assert.deepEqual(validateSettings(theme, defaults).errors, [], `${theme.id}: ungültiger Standardwert`);
}

console.log("registry ok");
