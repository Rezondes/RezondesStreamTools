// Check für settings.ts: Einstellungen eines Themes auflösen und prüfen. Läuft mit npm test.
import assert from "node:assert/strict";
import { resolveSettings, validateSettings } from "./settings.ts";
import type { ThemeSchema } from "./theme.ts";

const schema: ThemeSchema = {
  id: "probe",
  name: "Probe",
  fields: [
    { key: "accent", type: "color", label: "Farbe", group: "Allgemein", default: "#39ff14" },
    { key: "title", type: "text", label: "Titel", group: "Allgemein", default: "HALLO", maxLength: 10 },
    { key: "lines", type: "lines", label: "Zeilen", group: "Terminal", default: ["a"], maxLines: 2 },
    { key: "size", type: "number", label: "Grösse", group: "Allgemein", default: 10, min: 0, max: 100, unit: "px" },
    { key: "glow", type: "boolean", label: "Glühen", group: "Allgemein", default: true },
    { key: "art", type: "select", label: "Darstellung", group: "Musik", default: "cover", options: ["cover", "vinyl"] },
    { key: "font", type: "font", label: "Schrift", group: "Allgemein", default: "Share Tech Mono", options: ["Share Tech Mono", "VT323"] },
    { key: "logo", type: "media", label: "Logo", group: "Allgemein", default: "", accept: "image" },
    { key: "ping", type: "sound", label: "Ton", group: "Alerts", default: { file: "", volume: 1 } },
  ],
};

// Auflösen: gültige gespeicherte Werte gewinnen, ungültige und fehlende werden Standard, fremde Schlüssel fallen weg
const resolved = resolveSettings(schema, { accent: "#ff0000", title: 42, stranger: "x" });
assert.equal(resolved.accent, "#ff0000");
assert.equal(resolved.title, "HALLO");
assert.equal(resolved.size, 10);
assert.equal("stranger" in resolved, false);
assert.equal(Object.keys(resolved).length, schema.fields.length);
// Kaputte Ablage (kein Objekt) ergibt nur Standardwerte
assert.deepEqual(resolveSettings(schema, "kaputt"), resolveSettings(schema, {}));

// Prüfen: je Feldtyp ein gültiger Wert ohne Fehler
const good = validateSettings(schema, {
  accent: "#00ff00aa", title: "OK", lines: ["x", "y"], size: 99, glow: false, art: "vinyl", font: "VT323", logo: "logo.png", ping: { file: "ping.mp3", volume: 0.5 },
});
assert.deepEqual(good.errors, []);
assert.equal(good.values.art, "vinyl");
assert.deepEqual(good.values.ping, { file: "ping.mp3", volume: 0.5 });

// Prüfen: je Feldtyp ein ungültiger Wert mit Fehlercode; der Wert fällt auf den Standard zurück
const bad = validateSettings(schema, {
  accent: "grün", title: "VIEL ZU LANGER TITEL", lines: ["1", "2", "3"], size: 101, glow: "ja", art: "disco", font: "Comic Sans", logo: "../x.png", ping: { file: "a.mp3", volume: 2 },
});
assert.deepEqual(bad.errors.map(error => `${error.key}:${error.code}`), [
  "accent:invalid_color", "title:too_long", "lines:too_many_lines", "size:out_of_range", "glow:invalid_type",
  "art:unknown_option", "font:unknown_option", "logo:invalid_media", "ping:out_of_range",
]);
assert.equal(bad.values.accent, "#39ff14");
// Medien nur passender Art: ein Video ist kein Logo-Bild
assert.deepEqual(validateSettings(schema, { logo: "clip.mp4" }).errors, [{ key: "logo", code: "invalid_media" }]);
// Leeres Medium heisst "keins" und ist erlaubt; fehlende Schlüssel sind kein Fehler
assert.deepEqual(validateSettings(schema, { logo: "" }).errors, []);
// Kein Objekt: ein Fehler für das Ganze
assert.deepEqual(validateSettings(schema, [1, 2]).errors, [{ key: "", code: "invalid_type" }]);

console.log("settings ok");
