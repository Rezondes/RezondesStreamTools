// Check for settings.ts: resolve and validate the settings of a theme. Runs with npm test.
import assert from "node:assert/strict";
import { resolveSettings, validateSettings } from "./settings.ts";
import type { ThemeSchema } from "./theme.ts";

const schema: ThemeSchema = {
  id: "probe",
  name: "Probe",
  fields: [
    { key: "accent", type: "color", label: "Color", group: "General", default: "#39ff14" },
    { key: "title", type: "text", label: "Title", group: "General", default: "HELLO", maxLength: 10 },
    { key: "lines", type: "lines", label: "Lines", group: "Terminal", default: ["a"], maxLines: 2 },
    { key: "size", type: "number", label: "Size", group: "General", default: 10, min: 0, max: 100, unit: "px" },
    { key: "glow", type: "boolean", label: "Glow", group: "General", default: true },
    { key: "art", type: "select", label: "Display", group: "Music", default: "cover", options: ["cover", "vinyl"] },
    { key: "font", type: "font", label: "Font", group: "General", default: "Share Tech Mono", options: ["Share Tech Mono", "VT323"] },
    { key: "logo", type: "media", label: "Logo", group: "General", default: "", accept: "image" },
    { key: "ping", type: "sound", label: "Sound", group: "Alerts", default: { file: "", volume: 1 } },
  ],
};

// Resolve: valid saved values win, invalid and missing ones become the default, foreign keys drop out
const resolved = resolveSettings(schema, { accent: "#ff0000", title: 42, stranger: "x" });
assert.equal(resolved.accent, "#ff0000");
assert.equal(resolved.title, "HELLO");
assert.equal(resolved.size, 10);
assert.equal("stranger" in resolved, false);
assert.equal(Object.keys(resolved).length, schema.fields.length);
// A broken store (not an object) gives only defaults
assert.deepEqual(resolveSettings(schema, "broken"), resolveSettings(schema, {}));

// Validate: one valid value per field type without errors
const good = validateSettings(schema, {
  accent: "#00ff00aa", title: "OK", lines: ["x", "y"], size: 99, glow: false, art: "vinyl", font: "VT323", logo: "logo.png", ping: { file: "ping.mp3", volume: 0.5 },
});
assert.deepEqual(good.errors, []);
assert.equal(good.values.art, "vinyl");
assert.deepEqual(good.values.ping, { file: "ping.mp3", volume: 0.5 });

// Validate: one invalid value per field type with an error code; the value falls back to the default
const bad = validateSettings(schema, {
  accent: "green", title: "MUCH TOO LONG TITLE", lines: ["1", "2", "3"], size: 101, glow: "yes", art: "disco", font: "Comic Sans", logo: "../x.png", ping: { file: "a.mp3", volume: 2 },
});
assert.deepEqual(bad.errors.map(error => `${error.key}:${error.code}`), [
  "accent:invalid_color", "title:too_long", "lines:too_many_lines", "size:out_of_range", "glow:invalid_type",
  "art:unknown_option", "font:unknown_option", "logo:invalid_media", "ping:out_of_range",
]);
assert.equal(bad.values.accent, "#39ff14");
// Media only of the matching kind: a video is not a logo image
assert.deepEqual(validateSettings(schema, { logo: "clip.mp4" }).errors, [{ key: "logo", code: "invalid_media" }]);
// An empty media value means "none" and is allowed; missing keys are not an error
assert.deepEqual(validateSettings(schema, { logo: "" }).errors, []);
// Not an object: one error for the whole
assert.deepEqual(validateSettings(schema, [1, 2]).errors, [{ key: "", code: "invalid_type" }]);

console.log("settings ok");
