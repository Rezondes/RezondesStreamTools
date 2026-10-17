// Settings of a streamer: file settings.json in the profile folder = { theme, values: { <theme-id>: { ... } } }.
// Values stay separate per theme so a theme switch loses nothing. They are checked against the theme's schema
// (src/core/settings.ts). Check: settings.check.ts.
import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { hasMinimes, readMinimeOptions } from "../src/core/minimeFields.ts";
import type { MinimeRules } from "../src/core/minimes.ts";
import { resolveSettings, validateSettings, type SettingError } from "../src/core/settings.ts";
import type { SettingValues, ThemeSchema } from "../src/core/theme.ts";
import { DEFAULT_THEME, findTheme, THEMES } from "../src/themes/registry.ts";
import { writeAtomic } from "./atomicFile.ts";

export type SettingsFile = { theme: string; values: Record<string, Record<string, unknown>> };

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

// Old theme ids from saved files and their current name (the theme "starter" is called "standard" since RST)
const RENAMED: Record<string, string> = { starter: "standard" };
const currentId = (id: string) => RENAMED[id] ?? id;

// Brings a read file into valid shape: old ids are renamed, an unknown theme becomes the default, values only
// as objects per theme
export function parseSettingsFile(raw: unknown): SettingsFile {
  const source = isObject(raw) ? raw : {};
  const named = typeof source.theme === "string" ? currentId(source.theme) : "";
  const theme = findTheme(named) ? named : DEFAULT_THEME;
  const values: SettingsFile["values"] = {};
  if (isObject(source.values)) for (const [id, stored] of Object.entries(source.values)) if (isObject(stored)) values[currentId(id)] = stored;
  return { theme, values };
}

// What overlays see: the chosen theme with resolved values (no foreign keys, nothing secret)
export function publicSettings(file: SettingsFile): { theme: string; values: SettingValues } {
  const schema = findTheme(file.theme) ?? findTheme(DEFAULT_THEME)!;
  return { theme: schema.id, values: resolveSettings(schema, file.values[schema.id]) };
}

// Minime rules of a theme from its values (with its variants, if it has any); null without minimes
export function rulesFor(schema: ThemeSchema, values: unknown): MinimeRules | null {
  return hasMinimes(schema) ? readMinimeOptions(values, schema.minimeVariants).rules : null;
}

// Minime rules from the values of the chosen theme; null if this theme has no minimes
export function minimeRules(file: SettingsFile): MinimeRules | null {
  const settings = publicSettings(file);
  const schema = findTheme(settings.theme);
  return schema ? rulesFor(schema, settings.values) : null;
}

// Sets the values of a theme and selects it (choose) as overlay theme. Only error-free input results in a new file.
export function updateSettings(file: SettingsFile, theme: string, input: unknown, choose = true): { file: SettingsFile | null; errors: SettingError[] } {
  const schema = findTheme(theme);
  if (!schema) return { file: null, errors: [{ key: "theme", code: "unknown_option" }] };
  const checked = validateSettings(schema, input);
  if (checked.errors.length) return { file: null, errors: checked.errors };
  return { file: { theme: choose ? theme : file.theme, values: { ...file.values, [theme]: checked.values } }, errors: [] };
}

export async function loadSettings(profileFolder: string): Promise<SettingsFile> {
  const text = await readFile(join(profileFolder, "settings.json"), "utf8").catch(() => "");
  try {
    return parseSettingsFile(text ? JSON.parse(text) : {});
  } catch {
    // Broken JSON: like no file, the next save rewrites it
    return parseSettingsFile({});
  }
}

// Settings on first login: default theme chosen, every theme with the values from its personalization
export function firstSettings(login: string): SettingsFile {
  const values = Object.fromEntries(THEMES.flatMap(theme => (theme.personalize ? [[theme.id, theme.personalize(login)]] : [])));
  return { theme: DEFAULT_THEME, values };
}

// Creates settings.json on first login; true = newly created, an existing file stays unchanged
export async function ensureSettings(profileFolder: string, login: string): Promise<boolean> {
  const exists = await stat(join(profileFolder, "settings.json")).then(() => true, () => false);
  if (!exists) await saveSettings(profileFolder, firstSettings(login));
  return !exists;
}

export const saveSettings = (profileFolder: string, file: SettingsFile) => writeAtomic(join(profileFolder, "settings.json"), JSON.stringify(file, null, 2));
