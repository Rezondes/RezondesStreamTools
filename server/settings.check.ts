// Check für settings.ts (Server): Einstellungsdatei lesen, Theme wechseln, Werte prüfen und speichern. Läuft mit npm test.
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadSettings, parseSettingsFile, publicSettings, saveSettings, updateSettings } from "./settings.ts";

// Kaputte oder fremde Datei: Standard-Theme, keine Werte; unbekanntes Theme fällt auf den Standard zurück
assert.deepEqual(parseSettingsFile("kaputt"), { theme: "matrix", values: {} });
assert.equal(parseSettingsFile({ theme: "gibt-es-nicht", values: {} }).theme, "matrix");

// Öffentliche Sicht: aufgelöste Werte des gewählten Themes, sonst nichts
const file = parseSettingsFile({ theme: "matrix", values: { matrix: { accent: "#ff0000", fremd: 1 } } });
const view = publicSettings(file);
assert.equal(view.theme, "matrix");
assert.equal(view.values.accent, "#ff0000");
assert.equal(view.values.channelName, "REZONDES");
assert.equal("fremd" in view.values, false);

// Speichern: gültig ergibt die neue Datei, ungültig Fehler und keine Datei, unbekanntes Theme ein eigener Code
const saved = updateSettings(file, "matrix", { accent: "#00ff00" });
assert.equal(saved.file?.values.matrix.accent, "#00ff00");
assert.deepEqual(updateSettings(file, "matrix", { accent: "grün" }), { file: null, errors: [{ key: "accent", code: "invalid_color" }] });
assert.deepEqual(updateSettings(file, "gibt-es-nicht", {}), { file: null, errors: [{ key: "theme", code: "unknown_option" }] });

// Theme-Wechsel verliert keine Werte eines anderen Themes
const other = { ...file, values: { ...file.values, starter: { title: "x" } } };
const switched = updateSettings(other, "matrix", {}).file!;
assert.deepEqual(switched.values.starter, { title: "x" });

// Werte eines anderen Themes speichern, ohne das gewählte Overlay-Theme zu wechseln (Render-Seite)
const kept = updateSettings(file, "starter", { accent: "#ff0000" }, false).file!;
assert.equal(kept.theme, file.theme);
assert.equal(kept.values.starter.accent, "#ff0000");

// Speichern und Laden über die Datei (temporärer Ordner, danach gelöscht)
const folder = await mkdtemp(join(tmpdir(), "settings-"));
try {
  assert.deepEqual(await loadSettings(folder), { theme: "matrix", values: {} });
  await saveSettings(folder, saved.file);
  assert.deepEqual(await loadSettings(folder), saved.file);
} finally {
  await rm(folder, { recursive: true, force: true });
}

console.log("server settings ok");
