// Check for settings.ts (server): read the settings file, switch theme, check and save values. Runs with npm test.
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { asciiText } from "../src/core/asciiText.ts";
import { MINIME_BASE_FIELDS } from "../src/core/minimeFields.ts";
import { ensureSettings, firstSettings, loadSettings, minimeRules, rulesFor, parseSettingsFile, publicSettings, saveSettings, updateSettings } from "./settings.ts";

// Broken or foreign file: default theme, no values; an unknown theme falls back to the default
assert.deepEqual(parseSettingsFile("kaputt"), { theme: "standard", values: {} });
assert.equal(parseSettingsFile({ theme: "does-not-exist", values: {} }).theme, "standard");
// The former theme "starter" is now called "standard": chosen theme and values move along
assert.deepEqual(parseSettingsFile({ theme: "starter", values: { starter: { accent: "#ff0000" } } }), { theme: "standard", values: { standard: { accent: "#ff0000" } } });

// Minime rules: from the values of the chosen theme; a theme without minimes gives null
assert.equal(minimeRules(parseSettingsFile({ theme: "matrix", values: { matrix: { minimeMax: 5 } } }))?.max, 5);
assert.equal(minimeRules(parseSettingsFile({ theme: "matrix", values: {} }))?.max, 30);
assert.equal(minimeRules(parseSettingsFile({ theme: "standard", values: { matrix: { minimeMax: 5 } } })), null);
assert.equal(minimeRules(parseSettingsFile({ theme: "matrix", values: {} }))?.variants, null);
// Südfrucht: 16 fruits as variants, a switched-off one is missing, command !frucht
assert.equal(minimeRules(parseSettingsFile({ theme: "suedfrucht", values: {} }))?.variants?.length, 16);
assert.equal(minimeRules(parseSettingsFile({ theme: "suedfrucht", values: { suedfrucht: { minimeNames_durian: "" } } }))?.variants?.length, 15);
assert.equal(minimeRules(parseSettingsFile({ theme: "suedfrucht", values: {} }))?.commands.look, "!frucht");
// A theme with variants: the switched-on variants with their names go into the rules
{
  const probe = { id: "probe", name: "Probe", fields: MINIME_BASE_FIELDS, minimeVariants: { command: "!frucht", label: "Frucht", variants: [{ id: "mango", label: "Mango", names: ["mango"] }, { id: "kiwi", label: "Kiwi", names: ["kiwi"] }] } };
  const rules = rulesFor(probe, { minimeNames_kiwi: "" });
  assert.deepEqual({ look: rules?.commands.look, variants: rules?.variants }, { look: "!frucht", variants: [{ id: "mango", names: ["mango"] }] });
  assert.equal(rulesFor({ id: "none", name: "None", fields: [] }, {}), null);
}

// Public view: resolved values of the chosen theme, nothing else
const file = parseSettingsFile({ theme: "matrix", values: { matrix: { accent: "#ff0000", fremd: 1 } } });
const view = publicSettings(file);
assert.equal(view.theme, "matrix");
assert.equal(view.values.accent, "#ff0000");
assert.equal(view.values.channelName, "STREAM");
assert.equal("fremd" in view.values, false);

// Save: valid gives the new file, invalid errors and no file, an unknown theme its own code
const saved = updateSettings(file, "matrix", { accent: "#00ff00" });
assert.equal(saved.file?.values.matrix.accent, "#00ff00");
assert.deepEqual(updateSettings(file, "matrix", { accent: "green" }), { file: null, errors: [{ key: "accent", code: "invalid_color" }] });
assert.deepEqual(updateSettings(file, "does-not-exist", {}), { file: null, errors: [{ key: "theme", code: "unknown_option" }] });

// A theme switch loses no values of another theme
const other = { ...file, values: { ...file.values, standard: { title: "x" } } };
const switched = updateSettings(other, "matrix", {}).file!;
assert.deepEqual(switched.values.standard, { title: "x" });

// Save the values of another theme without switching the chosen overlay theme (render page)
const kept = updateSettings(file, "standard", { accent: "#ff0000" }, false).file!;
assert.equal(kept.theme, file.theme);
assert.equal(kept.values.standard.accent, "#ff0000");

// First login: the default theme is chosen, every theme with personalization has the streamer's values
const first = firstSettings("neo_42");
assert.equal(first.theme, "standard");
assert.equal(publicSettings(first).values.channelName, "NEO_42");
assert.equal(first.values.matrix.logo, asciiText("neo_42"));
assert.deepEqual(first.values.standard, { channelName: "NEO_42" });

// Save and load via the file (temporary folder, deleted afterwards)
const folder = await mkdtemp(join(tmpdir(), "settings-"));
try {
  assert.deepEqual(await loadSettings(folder), { theme: "standard", values: {} });
  // The first login creates the file, every further one leaves it alone
  assert.equal(await ensureSettings(folder, "neo_42"), true);
  assert.deepEqual(await loadSettings(folder), first);
  assert.equal(await ensureSettings(folder, "smith"), false);
  assert.deepEqual(await loadSettings(folder), first);
  await saveSettings(folder, saved.file);
  assert.deepEqual(await loadSettings(folder), saved.file);
} finally {
  await rm(folder, { recursive: true, force: true });
}

console.log("server settings ok");
