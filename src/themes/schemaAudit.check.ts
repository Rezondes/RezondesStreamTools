// Check for schemaAudit.ts: detects invalid defaults and unused keys in a probe theme in a
// temp folder. Runs with npm test.
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { minimeVariantFields } from "../core/minimeFields.ts";
import type { ThemeSchema } from "../core/theme.ts";
import { auditTheme } from "./schemaAudit.ts";

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

const folder = await mkdtemp(join(tmpdir(), "rz-audit-"));
try {
  await writeFile(join(folder, "Scene.tsx"), "const { title } = useProbe();\nconst big = values.size > 1;\n");
  await writeFile(join(folder, "theme.css"), ".theme-probe { color: var(--accent); }\n");
  // settings.ts itself does not count as use
  await writeFile(join(folder, "settings.ts"), "unused: values.unused");
  const audit = auditTheme(schema, folder);
  assert.deepEqual(audit.errors, [{ key: "accent", code: "invalid_color" }]);
  assert.deepEqual(audit.unused, ["unused"]);
  // The core reads the generated variant fields of the minimes: they count as used
  const typed = { ...schema, fields: minimeVariantFields({ command: "!frucht", label: "Frucht", variants: [{ id: "mango", label: "Mango", names: ["mango"] }] }) };
  assert.deepEqual(auditTheme(typed, folder).unused, []);
} finally {
  await rm(folder, { recursive: true, force: true });
}

console.log("schemaAudit ok");
