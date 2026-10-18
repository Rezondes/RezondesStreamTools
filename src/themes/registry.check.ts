// Check for registry.ts: every built-in theme has a valid schema. Runs with npm test.
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { hasMinimes } from "../core/minimeFields.ts";
import { validateSettings } from "../core/settings.ts";
import { DEFAULT_THEME, findModule, findTheme, THEME_MODULES, THEMES } from "./registry.ts";

// Ids unique, standard theme present, an unknown id gives null
assert.equal(new Set(THEMES.map(theme => theme.id)).size, THEMES.length);
assert.equal(findTheme(DEFAULT_THEME)?.id, "standard");
assert.equal(findTheme("does-not-exist"), null);
assert.equal(findTheme("standard")?.name, "Standard");

for (const theme of THEMES) {
  // Keys unique per theme, every field with label and group
  const keys = theme.fields.map(field => field.key);
  assert.equal(new Set(keys).size, keys.length, `${theme.id}: duplicate keys`);
  assert.ok(theme.fields.every(field => field.label && field.group), `${theme.id}: field without label or group`);
  // The defaults themselves pass the check
  const defaults = Object.fromEntries(theme.fields.map(field => [field.key, field.default]));
  assert.deepEqual(validateSettings(theme, defaults).errors, [], `${theme.id}: invalid default`);
  // The scene mapping only names groups that exist
  const groups = new Set(theme.fields.map(field => field.group));
  for (const group of Object.keys(theme.groupScenes ?? {})) assert.ok(groups.has(group), `${theme.id}: groupScenes nennt unbekannte Gruppe ${group}`);
  // Personalization on first login passes the schema, also with the longest Twitch login
  if (theme.personalize) assert.deepEqual(validateSettings(theme, theme.personalize("a".repeat(15) + "_123456789")).errors, [], `${theme.id}: invalid personalization`);
}

// Both themes enter the channel name on first login, matrix also the ASCII logo
assert.deepEqual(Object.keys(findTheme("matrix")!.personalize!("neo")), ["channelName", "logo"]);
assert.deepEqual(findTheme("standard")!.personalize!("neo"), { channelName: "NEO" });

// Matrix (colors) and Urlaub (fruits as variants) have minimes, Standard does not
assert.equal(hasMinimes(findTheme("matrix")!), true);
assert.equal(hasMinimes(findTheme("standard")!), false);
assert.equal(hasMinimes(findTheme("urlaub")!), true);
assert.equal(findTheme("urlaub")!.minimeVariants?.variants.length, 16);
assert.deepEqual(findTheme("urlaub")!.personalize!("neo_42"), { channelName: "Neo_42" });

// Every theme folder fulfills the contract twice: as ThemeModule in registry.ts (folder name = id) and with its
// view <id>View in scenes.tsx; modules provide their schema and their clips
const folders = readdirSync(import.meta.dirname, { withFileTypes: true }).filter(entry => entry.isDirectory()).map(entry => entry.name).sort();
assert.deepEqual(THEME_MODULES.map(module => module.schema.id).sort(), folders);
const views = readFileSync(join(import.meta.dirname, "scenes.tsx"), "utf8");
for (const id of folders) {
  assert.ok(views.includes(`import { ${id}View } from "./${id}/index.tsx";`) && views.includes(`${id}View`), `${id}: Ansicht fehlt in scenes.tsx`);
  assert.equal(findModule(id)?.schema, findTheme(id));
}
assert.equal(findModule("does-not-exist"), null);

console.log("registry ok");
