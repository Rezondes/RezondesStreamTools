// Check für themeRuntime.ts: welche Szene ein Theme liefert und welche Werte als CSS-Variablen ankommen. Läuft mit npm test.
import assert from "node:assert/strict";
import { cssVariables, resolveScene } from "./themeRuntime.ts";
import type { ThemeSchema } from "./theme.ts";

// Szene aus dem Theme, fehlende vom Standard-Theme, unbekannte Szene oder unbekanntes Theme ohne Standard: null
const scenes = { matrix: { alerts: "matrix-alerts", chat: "matrix-chat" }, standard: { alerts: "standard-alerts" } };
assert.equal(resolveScene(scenes, "standard", "alerts", "matrix"), "standard-alerts");
assert.equal(resolveScene(scenes, "standard", "chat", "matrix"), "matrix-chat");
assert.equal(resolveScene(scenes, "gibt-es-nicht", "alerts", "matrix"), "matrix-alerts");
assert.equal(resolveScene(scenes, "standard", "index", "matrix"), null);
assert.equal(resolveScene(scenes, "standard", "music", "matrix"), null);
// Theme-eigene Szenen (minimes) werden nie vom Standard-Theme geerbt
const withMinimes = { ...scenes, matrix: { ...scenes.matrix, minimes: "matrix-minimes" } };
assert.equal(resolveScene(withMinimes, "matrix", "minimes", "matrix"), "matrix-minimes");
assert.equal(resolveScene(withMinimes, "standard", "minimes", "matrix"), null);
assert.equal(resolveScene(withMinimes, "gibt-es-nicht", "minimes", "matrix"), null);

// CSS-Variablen: Farben, Zahlen mit Einheit laut Schema, Schalter als 1/0, Schriften in Anführungszeichen; Texte nicht
const schema: ThemeSchema = {
  id: "probe",
  name: "Probe",
  fields: [
    { key: "accent", type: "color", label: "Farbe", group: "A", default: "#39ff14" },
    { key: "size", type: "number", label: "Grösse", group: "A", default: 10, min: 0, max: 100, unit: "px" },
    { key: "fade", type: "number", label: "Ausblenden", group: "A", default: 30, min: 0, max: 600, unit: "s" },
    { key: "scale", type: "number", label: "Skalierung", group: "A", default: 0.7, min: 0, max: 2 },
    { key: "title", type: "text", label: "Titel", group: "A", default: "HALLO" },
    { key: "glow", type: "boolean", label: "Glühen", group: "A", default: true },
    { key: "font", type: "font", label: "Schrift", group: "A", default: "VT323", options: ["VT323", "Share Tech Mono"] },
  ],
};
assert.deepEqual(cssVariables(schema, { accent: "#ff0000", size: 12, fade: 5, scale: 0.5, title: "X", glow: false, font: "Share Tech Mono" }), {
  "--accent": "#ff0000", "--size": "12px", "--fade": "5s", "--scale": "0.5", "--glow": "0", "--font": "\"Share Tech Mono\"",
});

console.log("themeRuntime ok");
