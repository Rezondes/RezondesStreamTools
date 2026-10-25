// Check for themeRuntime.ts: which scene a theme provides and which values arrive as CSS variables. Runs with npm test.
import assert from "node:assert/strict";
import { cssVariables, resolveScene, sceneNames } from "./themeRuntime.ts";
import type { ThemeSchema } from "./theme.ts";

// No fallback to another theme: only the scenes the theme brings itself, everything else null
const scenes = { matrix: { alerts: "matrix-alerts", chat: "matrix-chat", minimes: "matrix-minimes" }, standard: { alerts: "standard-alerts" } };
assert.equal(resolveScene(scenes, "standard", "alerts"), "standard-alerts");
assert.equal(resolveScene(scenes, "standard", "chat"), null);
assert.equal(resolveScene(scenes, "standard", "minimes"), null);
assert.equal(resolveScene(scenes, "matrix", "minimes"), "matrix-minimes");
assert.equal(resolveScene(scenes, "does-not-exist", "alerts"), null);
assert.equal(resolveScene(scenes, "standard", "index"), null);

// Scene names of a theme in the order of SCENES, none for an unknown theme
assert.deepEqual(sceneNames({ probe: { chat: "c", alerts: "a", minimes: "m" } }, "probe"), ["alerts", "chat", "minimes"]);
assert.deepEqual(sceneNames(scenes, "does-not-exist"), []);

// CSS variables: colors, numbers with unit according to the schema, switches as 1/0, fonts in quotes; texts not
const schema: ThemeSchema = {
  id: "probe",
  name: "Probe",
  fields: [
    { key: "accent", type: "color", label: "Farbe", group: "A", default: "#39ff14" },
    { key: "size", type: "number", label: "Size", group: "A", default: 10, min: 0, max: 100, unit: "px" },
    { key: "fade", type: "number", label: "Ausblenden", group: "A", default: 30, min: 0, max: 600, unit: "s" },
    { key: "scale", type: "number", label: "Skalierung", group: "A", default: 0.7, min: 0, max: 2 },
    { key: "title", type: "text", label: "Titel", group: "A", default: "HALLO" },
    { key: "glow", type: "boolean", label: "Glow", group: "A", default: true },
    { key: "font", type: "font", label: "Schrift", group: "A", default: "VT323", options: ["VT323", "Share Tech Mono"] },
  ],
};
assert.deepEqual(cssVariables(schema, { accent: "#ff0000", size: 12, fade: 5, scale: 0.5, title: "X", glow: false, font: "Share Tech Mono" }), {
  "--accent": "#ff0000", "--size": "12px", "--fade": "5s", "--scale": "0.5", "--glow": "0", "--font": "\"Share Tech Mono\"",
});

// An empty field that inherits gets the value of its parent as its variable
const family: ThemeSchema = { ...schema, fields: [{ key: "accent", type: "color", label: "A", group: "G", default: "#000000" }, { key: "nameColor", type: "color", label: "N", group: "G", default: "", inherit: "accent" }] };
assert.deepEqual(cssVariables(family, { accent: "#ff0000", nameColor: "" }), { "--accent": "#ff0000", "--nameColor": "#ff0000" });
// A color that follows its surroundings has no variable while empty, its own value once set
const around: ThemeSchema = { ...family, fields: [...family.fields, { key: "rowColor", type: "color", label: "Row", group: "A", default: "", inherit: "" }] };
assert.deepEqual(cssVariables(around, { accent: "#ff0000", nameColor: "", rowColor: "" }), { "--accent": "#ff0000", "--nameColor": "#ff0000" });
assert.equal(cssVariables(around, { accent: "#ff0000", nameColor: "", rowColor: "#00ff00" })["--rowColor"], "#00ff00");

console.log("themeRuntime ok");
