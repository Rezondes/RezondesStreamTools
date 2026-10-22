// Shared check that the settings.check.ts of every theme calls: the defaults pass their own schema,
// and no key is dead (every one occurs in the theme code: values.key, { key }, "key" or var(--key)).
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ALERT_SOUND_KEYS, alertTextKeys } from "../core/alerts/alerts.ts";
import { BADGE_KEYS } from "../core/chat/chat.ts";
import { FX_KEYS } from "../core/fx/fx.ts";
import { INFO_FIELDS } from "../core/infoFields.ts";
import {
  COMBAT_SOUNDS, MINIME_FIELDS, MINIME_HOP_FIELDS, minimeAimKey, minimeFireKey, minimeNamesKey, minimeStackFields, minimeTeamColorKey, minimeTeamLabelKey,
  minimeTeamNamesKey,
} from "../core/minimeFields.ts";
import { validateSettings } from "../core/settings.ts";
import { stingerFields } from "../core/stingerOptions.ts";
import { SCENES, type ThemeSchema } from "../core/theme.ts";
import { groupsForView } from "../dashboard/settingsForm.ts";

// The core reads shared fields of a feature (e.g. readMinimeOptions, describeCommands, useFxScene, badgeLabel,
// readStingerOptions), they count as used; plus the generated variant, faction, hop and fight fields of the minimes
// (minimeVariantFields, minimeTeamFields, MINIME_HOP_FIELDS, minimeCombatFields, minimeStackFields)
// Alert texts following the pattern from alertTextKeys (header <kind>Tag or <kind>Label) and the sounds per kind
const ALERT_KEYS = ["Tag", "Label"].flatMap(suffix => {
  const keys = alertTextKeys(suffix);
  return [...Object.values(keys.tag), ...Object.values(keys.line), keys.hypeEndLine];
});
const CORE_KEYS = new Set<string>([
  ...MINIME_FIELDS.map(field => field.key), ...INFO_FIELDS.map(field => field.key), ...FX_KEYS, ...BADGE_KEYS, ...ALERT_KEYS, ...Object.values(ALERT_SOUND_KEYS), "minimeVariantCommand",
  "minimeTeamCommand", "infoTeamText", "infoTeams", ...MINIME_HOP_FIELDS.map(field => field.key), ...Object.values(COMBAT_SOUNDS),
  "minimeCombat", "minimeCombatMinS", "minimeCombatMaxS", "minimeCombatMax", "minimeHitChance", "minimeDownMs", "minimeReviveMs", "minimeMedicSpeed", "minimeMedicGap", "minimeUpMs",
  "minimeCombatSounds", ...minimeStackFields({ command: "", label: "", variants: [] }).map(field => field.key),
  ...stingerFields("").map(field => field.key),
]);
const CORE_PREFIXES = [minimeNamesKey(""), minimeTeamNamesKey(""), minimeTeamLabelKey(""), minimeTeamColorKey(""), minimeAimKey(""), minimeFireKey("")];

// Simple view of the dashboard: every area with fields other than numbers shows a few basic ones (general 3 to 12, a
// scene 1 to 10; an area of numbers only shows the hint to the advanced view), and no number is basic except these,
// which almost every streamer sets
const BASIC_NUMBERS = new Set(["minimeMax"]);
// The performance level is basic in every theme that has it and does not count against the limit of an area
const ALWAYS_BASIC = new Set(["quality"]);
export function auditBasic(schema: ThemeSchema): string[] {
  const numbers = schema.fields.filter(field => field.basic && field.type === "number" && !BASIC_NUMBERS.has(field.key)).map(field => `${field.key}: basic number`);
  const areas = (["general", ...SCENES] as const).flatMap(view => {
    const fields = groupsForView(schema, view).flatMap(group => group.fields);
    const count = fields.filter(field => field.basic && !ALWAYS_BASIC.has(field.key)).length;
    const [min, max] = view === "general" ? [3, 12] : [1, 10];
    const needed = fields.some(field => field.type !== "number") ? min : 0;
    return count < needed || count > max ? [`${view}: ${count} basic fields`] : [];
  });
  return [...numbers, ...areas];
}

// folder: folder of the theme; settings.ts and checks do not count as use
export function auditTheme(schema: ThemeSchema, folder: string) {
  const defaults = Object.fromEntries(schema.fields.map(field => [field.key, field.default]));
  const files = readdirSync(folder, { recursive: true, encoding: "utf8" })
    .filter(file => /\.(ts|tsx|css)$/.test(file) && !/settings\.ts$|\.check\.ts$/.test(file));
  const source = files.map(file => readFileSync(join(folder, file), "utf8")).join("\n");
  const used = (key: string) => CORE_KEYS.has(key) || CORE_PREFIXES.some(prefix => key.startsWith(prefix)) || new RegExp(`\\.${key}\\b|[{,]\\s*${key}\\s*[,}]|"${key}"|var\\(--${key}\\)`).test(source);
  return { errors: validateSettings(schema, defaults).errors, unused: schema.fields.map(field => field.key).filter(key => !used(key)), basic: auditBasic(schema) };
}
