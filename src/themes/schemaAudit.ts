// Gemeinsame Prüfung, die die settings.check.ts jedes Themes aufruft: die Standardwerte bestehen das eigene Schema,
// und kein Schlüssel ist tot (jeder kommt im Theme-Code vor: values.key, { key }, "key" oder var(--key)).
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { validateSettings } from "../core/settings.ts";
import type { ThemeSchema } from "../core/theme.ts";

// folder: Ordner des Themes; settings.ts und Checks zählen nicht als Nutzung
export function auditTheme(schema: ThemeSchema, folder: string) {
  const defaults = Object.fromEntries(schema.fields.map(field => [field.key, field.default]));
  const files = readdirSync(folder, { recursive: true, encoding: "utf8" })
    .filter(file => /\.(ts|tsx|css)$/.test(file) && !/settings\.ts$|\.check\.ts$/.test(file));
  const source = files.map(file => readFileSync(join(folder, file), "utf8")).join("\n");
  const used = (key: string) => new RegExp(`\\.${key}\\b|[{,]\\s*${key}\\s*[,}]|"${key}"|var\\(--${key}\\)`).test(source);
  return { errors: validateSettings(schema, defaults).errors, unused: schema.fields.map(field => field.key).filter(key => !used(key)) };
}
