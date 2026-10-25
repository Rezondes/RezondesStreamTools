// Check for tuning.ts: the builder calls per field type, and the Rust files in server-rs are current (otherwise:
// node scripts/tuning.ts). Runs with npm test.
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { color, font, inherits, inScene, number } from "../src/core/fields.ts";
import { modText, rustField, rustText, TUNING_DIR, tuningModules } from "./tuning.ts";

// One call per field type; inherit and scene wrap it, floats always with a point
assert.equal(rustField(number("pillGap", "Pille: Abstand", "Feinschliff", 12, -4, 48.5, "px")), `number("pillGap", "Pille: Abstand", "Feinschliff", 12.0, -4.0, 48.5, Some(Unit::Px), None)`);
assert.equal(rustField(number("share", "Anteil", "F", 0.6, 0, 1, undefined, 0.05)), `number("share", "Anteil", "F", 0.6, 0.0, 1.0, None, Some(0.05))`);
assert.equal(rustField(inherits(color("nameColor", "Name", "F", "#ffffff"), "accent")), `inherits(color("nameColor", "Name", "F", ""), "accent")`);
assert.equal(rustField(inScene("alerts", inherits(font("nameFont", "Name", "F", "A", ["A", "B"]), "font"))), `in_scene(SceneName::Alerts, inherits(font("nameFont", "Name", "F", "", &["A", "B"]), "font"))`);
assert.throws(() => rustField({ key: "x", type: "lines", label: "X", group: "F", default: [] }), /no generated builder/);
const text = rustText("probe", { TUNING_FIELDS: [inherits(color("nameColor", "Name", "F", "#ffffff"), "accent")], TUNING_GROUPS: { F: ["alerts"] } });
assert.match(text, /use crate::settings::field::\{SettingField, color, inherits\};/);
assert.match(text, /\("F", vec!\[SceneName::Alerts\]\),/);

// The written Rust files match the current tables
const modules = await tuningModules();
for (const { id, module } of modules) {
  const file = join(TUNING_DIR, `${id}.rs`);
  assert.ok(existsSync(file), `missing ${file}: run node scripts/tuning.ts`);
  assert.equal(readFileSync(file, "utf8").replace(/\r\n/g, "\n"), rustText(id, module), `stale ${file}: run node scripts/tuning.ts`);
}
if (modules.length > 0) assert.equal(readFileSync(join(TUNING_DIR, "mod.rs"), "utf8").replace(/\r\n/g, "\n"), modText(modules.map(entry => entry.id)));

console.log("tuning ok");
