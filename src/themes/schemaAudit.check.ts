// Check for schemaAudit.ts: detects invalid defaults and unused keys in a probe theme in a
// temp folder. Runs with npm test.
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { minimeVariantFields } from "../core/minimeFields.ts";
import type { ThemeSchema } from "../core/theme.ts";
import { auditBasic, auditInherit, auditTheme, TUNING_GROUP } from "./schemaAudit.ts";

const schema: ThemeSchema = {
  id: "probe",
  name: "Probe",
  fields: [
    { key: "accent", type: "color", label: "Color", group: "A", default: "not-hex" },
    { key: "title", type: "text", label: "Titel", group: "A", default: "HALLO" },
    { key: "size", type: "number", label: "Size", group: "A", default: 10, min: 0, max: 100 },
    { key: "unused", type: "boolean", label: "Tot", group: "A", default: true },
  ],
};

// Inheritance: unknown parent, other type, a circle; a valid chain passes
const color = (key: string, inherit?: string) => ({ key, type: "color" as const, label: key, group: "A", default: inherit ? "" : "#000000", ...(inherit ? { inherit } : {}) });
const family = (fields: ThemeSchema["fields"]): ThemeSchema => ({ id: "probe", name: "Probe", fields });
assert.deepEqual(auditInherit(family([color("accent"), color("title", "accent"), color("name", "title")])), []);
assert.deepEqual(auditInherit(family([color("title", "nothing")])), ["title: unknown parent nothing"]);
assert.deepEqual(auditInherit(family([{ key: "font", type: "font", label: "F", group: "A", default: "A", options: ["A"] }, color("title", "font")])), ["title: parent font is font"]);
assert.deepEqual(auditInherit(family([color("a", "b"), color("b", "a")])), ["a: inherits in a circle", "b: inherits in a circle"]);

const folder = await mkdtemp(join(tmpdir(), "rz-audit-"));
try {
  await writeFile(join(folder, "Scene.tsx"), "const { title } = useProbe();\nconst big = values.size > 1;\n");
  await writeFile(join(folder, "theme.css"), ".theme-probe { color: var(--accent); }\n");
  // settings.ts itself does not count as use
  await writeFile(join(folder, "settings.ts"), "unused: values.unused");
  const audit = auditTheme(schema, folder);
  assert.deepEqual(audit.errors, [{ key: "accent", code: "invalid_color" }]);
  assert.deepEqual(audit.unused, ["unused"]);
  // A field others inherit from counts as used, even when no code reads it directly
  const shade = { key: "shade", type: "color" as const, label: "Shade", group: "A", default: "#000000" };
  const family = { ...schema, fields: [...schema.fields, shade, { ...shade, key: "nameColor", default: "", inherit: "shade" }] };
  assert.ok(!auditTheme(family, folder).unused.includes("shade"));
  // The core reads the generated variant fields of the minimes: they count as used
  const typed = { ...schema, fields: minimeVariantFields({ command: "!frucht", label: "Frucht", variants: [{ id: "mango", label: "Mango", names: ["mango"] }] }) };
  assert.deepEqual(auditTheme(typed, folder).unused, []);
} finally {
  await rm(folder, { recursive: true, force: true });
}

// Simple view: too few basic fields in general, too many in a scene, a basic number outside the exceptions
const many = Array.from({ length: 11 }, (_, index) => ({ key: `t${index}`, type: "text" as const, label: "T", group: "S", default: "", basic: true }));
const simple: ThemeSchema = {
  id: "probe",
  name: "Probe",
  fields: [
    { key: "accent", type: "color", label: "Color", group: "A", default: "#000000", basic: true },
    { key: "size", type: "number", label: "Size", group: "A", default: 10, min: 0, max: 100, basic: true },
    { key: "minimeMax", type: "number", label: "Max", group: "A", default: 10, min: 0, max: 100, basic: true },
    ...many,
  ],
  groupScenes: { S: ["chat"] },
};
assert.deepEqual(auditBasic(simple), ["size: basic number", "chat: 11 basic fields"]);
assert.deepEqual(auditBasic({ ...simple, fields: simple.fields.slice(0, 2) }), ["size: basic number", "general: 2 basic fields"]);
// The performance level does not count against the limit: ten others plus quality are fine
const quality = { key: "quality", type: "select" as const, label: "Q", group: "S", default: "mittel", options: ["hoch", "mittel", "niedrig"], basic: true };
assert.ok(!auditBasic({ ...simple, fields: [simple.fields[0], ...many.slice(1), quality] }).some(finding => finding.startsWith("chat")));
// Fine-tuning groups do not count: a scene whose only text field sits there needs no basic field
const tuned: ThemeSchema = { ...simple, fields: [...simple.fields.slice(0, 1), ...many.slice(0, 3), { key: "nameColor", type: "color", label: "N", group: `${TUNING_GROUP}Chat`, default: "", inherit: "accent" }], groupScenes: { S: ["chat"], [`${TUNING_GROUP}Chat`]: ["fx"] } };
assert.ok(!auditBasic(tuned).some(finding => finding.startsWith("fx")));

console.log("schemaAudit ok");
