// Check für fields.ts: Bausteine für Theme-Schemas ergeben gültige Felder. Läuft mit npm test.
import assert from "node:assert/strict";
import { asciiArt, choice, color, flag, font, lines, number, sound, text, textarea } from "./fields.ts";
import { validateSettings } from "./settings.ts";
import type { ThemeSchema } from "./theme.ts";

const fields = [
  color("accent", "Farbe", "A", "#39ff14"),
  text("title", "Titel", "A", "HALLO", 40),
  textarea("logo", "Logo", "A", "X\nY"),
  lines("terminal", "Zeilen", "A", ["a", "b"]),
  flag("glow", "Glühen", "A", true),
  sound("beep", "Ton", "A"),
  choice("align", "Position", "A", "center", ["left", "center"]),
  font("font", "Schrift", "A", "VT323", ["VT323", "Fira Mono"]),
  number("size", "Grösse", "A", 10, 0, 100, "px", 0.5),
  number("count", "Anzahl", "A", 3, 1, 9),
  asciiArt("banner", "Banner", "A", "X"),
] as const;

// Typ, Grenzen und Standard landen im Feld; ohne Einheit und Schritt fehlen die Schlüssel
assert.deepEqual(fields[8], { key: "size", type: "number", label: "Grösse", group: "A", default: 10, min: 0, max: 100, unit: "px", step: 0.5 });
assert.deepEqual(fields[9], { key: "count", type: "number", label: "Anzahl", group: "A", default: 3, min: 1, max: 9 });
assert.deepEqual(fields[5].default, { file: "", volume: 1 });
// ASCII-Kunst ist ein mehrzeiliger Text mit Generator-Kennzeichen
assert.deepEqual(fields[10], { key: "banner", type: "textarea", label: "Banner", group: "A", default: "X", maxLength: 4000, ascii: true });

// Die Standardwerte aller Bausteine bestehen die Prüfung
const schema: ThemeSchema = { id: "probe", name: "Probe", fields };
const defaults = Object.fromEntries(fields.map(field => [field.key, field.default]));
assert.deepEqual(validateSettings(schema, defaults).errors, []);

console.log("fields ok");
