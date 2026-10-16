// Check für settings.ts (Server): Einstellungsdatei lesen, Theme wechseln, Werte prüfen und speichern. Läuft mit npm test.
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { asciiText } from "../src/core/asciiText.ts";
import { MINIME_BASE_FIELDS } from "../src/core/minimeFields.ts";
import { ensureSettings, firstSettings, loadSettings, minimeRules, rulesFor, parseSettingsFile, publicSettings, saveSettings, updateSettings } from "./settings.ts";

// Kaputte oder fremde Datei: Standard-Theme, keine Werte; unbekanntes Theme fällt auf den Standard zurück
assert.deepEqual(parseSettingsFile("kaputt"), { theme: "standard", values: {} });
assert.equal(parseSettingsFile({ theme: "gibt-es-nicht", values: {} }).theme, "standard");
// Das frühere Theme "starter" heisst jetzt "standard": gewähltes Theme und Werte ziehen mit um
assert.deepEqual(parseSettingsFile({ theme: "starter", values: { starter: { accent: "#ff0000" } } }), { theme: "standard", values: { standard: { accent: "#ff0000" } } });

// Minime-Regeln: aus den Werten des gewählten Themes; ein Theme ohne Minimes ergibt null
assert.equal(minimeRules(parseSettingsFile({ theme: "matrix", values: { matrix: { minimeMax: 5 } } }))?.max, 5);
assert.equal(minimeRules(parseSettingsFile({ theme: "matrix", values: {} }))?.max, 30);
assert.equal(minimeRules(parseSettingsFile({ theme: "standard", values: { matrix: { minimeMax: 5 } } })), null);
assert.equal(minimeRules(parseSettingsFile({ theme: "matrix", values: {} }))?.variants, null);
// Südfrucht: 16 Früchte als Typen, eine ausgeschaltete fehlt, Befehl !frucht
assert.equal(minimeRules(parseSettingsFile({ theme: "suedfrucht", values: {} }))?.variants?.length, 16);
assert.equal(minimeRules(parseSettingsFile({ theme: "suedfrucht", values: { suedfrucht: { minimeNames_durian: "" } } }))?.variants?.length, 15);
assert.equal(minimeRules(parseSettingsFile({ theme: "suedfrucht", values: {} }))?.commands.look, "!frucht");
// Ein Theme mit Typen: die eingeschalteten Typen mit ihren Namen kommen in die Regeln
{
  const probe = { id: "probe", name: "Probe", fields: MINIME_BASE_FIELDS, minimeVariants: { command: "!frucht", label: "Frucht", variants: [{ id: "mango", label: "Mango", names: ["mango"] }, { id: "kiwi", label: "Kiwi", names: ["kiwi"] }] } };
  const rules = rulesFor(probe, { minimeNames_kiwi: "" });
  assert.deepEqual({ look: rules?.commands.look, variants: rules?.variants }, { look: "!frucht", variants: [{ id: "mango", names: ["mango"] }] });
  assert.equal(rulesFor({ id: "ohne", name: "Ohne", fields: [] }, {}), null);
}

// Öffentliche Sicht: aufgelöste Werte des gewählten Themes, sonst nichts
const file = parseSettingsFile({ theme: "matrix", values: { matrix: { accent: "#ff0000", fremd: 1 } } });
const view = publicSettings(file);
assert.equal(view.theme, "matrix");
assert.equal(view.values.accent, "#ff0000");
assert.equal(view.values.channelName, "STREAM");
assert.equal("fremd" in view.values, false);

// Speichern: gültig ergibt die neue Datei, ungültig Fehler und keine Datei, unbekanntes Theme ein eigener Code
const saved = updateSettings(file, "matrix", { accent: "#00ff00" });
assert.equal(saved.file?.values.matrix.accent, "#00ff00");
assert.deepEqual(updateSettings(file, "matrix", { accent: "grün" }), { file: null, errors: [{ key: "accent", code: "invalid_color" }] });
assert.deepEqual(updateSettings(file, "gibt-es-nicht", {}), { file: null, errors: [{ key: "theme", code: "unknown_option" }] });

// Theme-Wechsel verliert keine Werte eines anderen Themes
const other = { ...file, values: { ...file.values, standard: { title: "x" } } };
const switched = updateSettings(other, "matrix", {}).file!;
assert.deepEqual(switched.values.standard, { title: "x" });

// Werte eines anderen Themes speichern, ohne das gewählte Overlay-Theme zu wechseln (Render-Seite)
const kept = updateSettings(file, "standard", { accent: "#ff0000" }, false).file!;
assert.equal(kept.theme, file.theme);
assert.equal(kept.values.standard.accent, "#ff0000");

// Erster Login: das Standard-Theme ist gewählt, jedes Theme mit Personalisierung hat die Werte des Streamers
const first = firstSettings("neo_42");
assert.equal(first.theme, "standard");
assert.equal(publicSettings(first).values.channelName, "NEO_42");
assert.equal(first.values.matrix.logo, asciiText("neo_42"));
assert.deepEqual(first.values.standard, { channelName: "NEO_42" });

// Speichern und Laden über die Datei (temporärer Ordner, danach gelöscht)
const folder = await mkdtemp(join(tmpdir(), "settings-"));
try {
  assert.deepEqual(await loadSettings(folder), { theme: "standard", values: {} });
  // Erster Login legt die Datei an, jeder weitere lässt sie stehen
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
