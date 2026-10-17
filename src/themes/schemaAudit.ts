// Shared check that the settings.check.ts of every theme calls: the defaults pass their own schema,
// and no key is dead (every one occurs in the theme code: values.key, { key }, "key" or var(--key)).
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ALERT_SOUND_KEYS, alertTextKeys } from "../core/alerts/alerts.ts";
import { BADGE_KEYS } from "../core/chat/chat.ts";
import { FX_KEYS } from "../core/fx/fx.ts";
import { INFO_FIELDS } from "../core/infoFields.ts";
import { MINIME_FIELDS, minimeNamesKey } from "../core/minimeFields.ts";
import { validateSettings } from "../core/settings.ts";
import type { ThemeSchema } from "../core/theme.ts";

// The core reads shared fields of a feature (e.g. readMinimeOptions, describeCommands, useFxScene, badgeLabel), they
// count as used; plus the generated
// variant fields of the minimes (minimeVariantFields)
// Alert texts following the pattern from alertTextKeys (header <kind>Tag or <kind>Label) and the sounds per kind
const ALERT_KEYS = ["Tag", "Label"].flatMap(suffix => {
  const keys = alertTextKeys(suffix);
  return [...Object.values(keys.tag), ...Object.values(keys.line), keys.hypeEndLine];
});
const CORE_KEYS = new Set<string>([
  ...MINIME_FIELDS.map(field => field.key), ...INFO_FIELDS.map(field => field.key), ...FX_KEYS, ...BADGE_KEYS, ...ALERT_KEYS, ...Object.values(ALERT_SOUND_KEYS), "minimeVariantCommand",
]);
const CORE_PREFIX = minimeNamesKey("");

// folder: folder of the theme; settings.ts and checks do not count as use
export function auditTheme(schema: ThemeSchema, folder: string) {
  const defaults = Object.fromEntries(schema.fields.map(field => [field.key, field.default]));
  const files = readdirSync(folder, { recursive: true, encoding: "utf8" })
    .filter(file => /\.(ts|tsx|css)$/.test(file) && !/settings\.ts$|\.check\.ts$/.test(file));
  const source = files.map(file => readFileSync(join(folder, file), "utf8")).join("\n");
  const used = (key: string) => CORE_KEYS.has(key) || key.startsWith(CORE_PREFIX) || new RegExp(`\\.${key}\\b|[{,]\\s*${key}\\s*[,}]|"${key}"|var\\(--${key}\\)`).test(source);
  return { errors: validateSettings(schema, defaults).errors, unused: schema.fields.map(field => field.key).filter(key => !used(key)) };
}
