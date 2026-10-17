// Check for fields.ts: building blocks for theme schemas give valid fields. Runs with npm test.
import assert from "node:assert/strict";
import { asciiArt, choice, color, flag, font, inScene, lines, number, sound, text, textarea } from "./fields.ts";
import { validateSettings } from "./settings.ts";
import type { ThemeSchema } from "./theme.ts";

const fields = [
  color("accent", "Farbe", "A", "#39ff14"),
  text("title", "Titel", "A", "HALLO", 40),
  textarea("logo", "Logo", "A", "X\nY"),
  lines("terminal", "Zeilen", "A", ["a", "b"]),
  flag("glow", "Glow", "A", true),
  sound("beep", "Ton", "A"),
  choice("align", "Position", "A", "center", ["left", "center"]),
  font("font", "Schrift", "A", "VT323", ["VT323", "Fira Mono"]),
  number("size", "Size", "A", 10, 0, 100, "px", 0.5),
  number("count", "Anzahl", "A", 3, 1, 9),
  asciiArt("banner", "Banner", "A", "X"),
] as const;

// Type, limits and default end up in the field; without unit and step the keys are missing
assert.deepEqual(fields[8], { key: "size", type: "number", label: "Size", group: "A", default: 10, min: 0, max: 100, unit: "px", step: 0.5 });
assert.deepEqual(fields[9], { key: "count", type: "number", label: "Anzahl", group: "A", default: 3, min: 1, max: 9 });
assert.deepEqual(fields[5].default, { file: "", volume: 1 });
// ASCII art is a multi-line text with a generator flag
assert.deepEqual(fields[10], { key: "banner", type: "textarea", label: "Banner", group: "A", default: "X", maxLength: 4000, ascii: true });

// The defaults of all building blocks pass the check
const schema: ThemeSchema = { id: "probe", name: "Probe", fields };
const defaults = Object.fromEntries(fields.map(field => [field.key, field.default]));
assert.deepEqual(validateSettings(schema, defaults).errors, []);

// Field for one scene only: everything else stays the same
assert.deepEqual(inScene("brb", text("brbTitle", "Titel", "A", "PAUSE")), { ...text("brbTitle", "Titel", "A", "PAUSE"), scene: "brb" });

console.log("fields ok");
