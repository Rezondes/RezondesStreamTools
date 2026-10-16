// Check für registry.ts: jedes eingebaute Theme hat ein gültiges Schema. Läuft mit npm test.
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { hasMinimes } from "../core/minimeFields.ts";
import { validateSettings } from "../core/settings.ts";
import { DEFAULT_THEME, findModule, findTheme, THEME_MODULES, THEMES } from "./registry.ts";

// Ids eindeutig, Standard-Theme vorhanden, unbekannte Id ergibt null
assert.equal(new Set(THEMES.map(theme => theme.id)).size, THEMES.length);
assert.equal(findTheme(DEFAULT_THEME)?.id, "standard");
assert.equal(findTheme("gibt-es-nicht"), null);
assert.equal(findTheme("standard")?.name, "Standard");

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
  // Personalisierung beim ersten Login besteht das Schema, auch mit dem längsten Twitch-Login
  if (theme.personalize) assert.deepEqual(validateSettings(theme, theme.personalize("a".repeat(15) + "_123456789")).errors, [], `${theme.id}: ungültige Personalisierung`);
}

// Beide Themes tragen beim ersten Login den Kanal-Namen ein, Matrix dazu das ASCII-Logo
assert.deepEqual(Object.keys(findTheme("matrix")!.personalize!("neo")), ["channelName", "logo"]);
assert.deepEqual(findTheme("standard")!.personalize!("neo"), { channelName: "NEO" });

// Minimes haben Matrix (Farben) und Südfrucht (Früchte als Typen), Standard nicht
assert.equal(hasMinimes(findTheme("matrix")!), true);
assert.equal(hasMinimes(findTheme("standard")!), false);
assert.equal(hasMinimes(findTheme("suedfrucht")!), true);
assert.equal(findTheme("suedfrucht")!.minimeVariants?.variants.length, 16);
assert.deepEqual(findTheme("suedfrucht")!.personalize!("neo_42"), { channelName: "Neo_42" });

// Jeder Theme-Ordner erfüllt den Vertrag zweimal: als ThemeModule in registry.ts (Ordnername = id) und mit seiner
// Ansicht <id>View in scenes.tsx; Module liefern ihr Schema und ihre Clips
const folders = readdirSync(import.meta.dirname, { withFileTypes: true }).filter(entry => entry.isDirectory()).map(entry => entry.name).sort();
assert.deepEqual(THEME_MODULES.map(module => module.schema.id).sort(), folders);
const views = readFileSync(join(import.meta.dirname, "scenes.tsx"), "utf8");
for (const id of folders) {
  assert.ok(views.includes(`import { ${id}View } from "./${id}/index.tsx";`) && views.includes(`${id}View`), `${id}: Ansicht fehlt in scenes.tsx`);
  assert.equal(findModule(id)?.schema, findTheme(id));
}
assert.equal(findModule("gibt-es-nicht"), null);

console.log("registry ok");
