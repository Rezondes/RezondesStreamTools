// Check für registry.ts: jedes eingebaute Theme hat ein gültiges Schema. Läuft mit npm test.
import assert from "node:assert/strict";
import { hasMinimes } from "../core/minimeFields.ts";
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
  // Die Szenen-Zuordnung nennt nur Gruppen, die es gibt
  const groups = new Set(theme.fields.map(field => field.group));
  for (const group of Object.keys(theme.groupScenes ?? {})) assert.ok(groups.has(group), `${theme.id}: groupScenes nennt unbekannte Gruppe ${group}`);
}

// Minimes hat vorerst nur das Matrix-Theme
assert.equal(hasMinimes(findTheme("matrix")!), true);
assert.equal(hasMinimes(findTheme("starter")!), false);

console.log("registry ok");
