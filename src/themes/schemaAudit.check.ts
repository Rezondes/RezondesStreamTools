// Check für schemaAudit.ts: erkennt ungültige Standardwerte und unbenutzte Schlüssel in einem Probe-Theme im
// Temp-Ordner. Läuft mit npm test.
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ThemeSchema } from "../core/theme.ts";
import { auditTheme } from "./schemaAudit.ts";

const schema: ThemeSchema = {
  id: "probe",
  name: "Probe",
  fields: [
    { key: "accent", type: "color", label: "Farbe", group: "A", default: "kein-hex" },
    { key: "title", type: "text", label: "Titel", group: "A", default: "HALLO" },
    { key: "size", type: "number", label: "Grösse", group: "A", default: 10, min: 0, max: 100 },
    { key: "unused", type: "boolean", label: "Tot", group: "A", default: true },
  ],
};

const folder = await mkdtemp(join(tmpdir(), "rz-audit-"));
try {
  await writeFile(join(folder, "Scene.tsx"), "const { title } = useProbe();\nconst big = values.size > 1;\n");
  await writeFile(join(folder, "theme.css"), ".theme-probe { color: var(--accent); }\n");
  // settings.ts selbst zählt nicht als Nutzung
  await writeFile(join(folder, "settings.ts"), "unused: values.unused");
  const audit = auditTheme(schema, folder);
  assert.deepEqual(audit.errors, [{ key: "accent", code: "invalid_color" }]);
  assert.deepEqual(audit.unused, ["unused"]);
} finally {
  await rm(folder, { recursive: true, force: true });
}

console.log("schemaAudit ok");
