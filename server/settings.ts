// Einstellungen eines Streamers: Datei settings.json im Profil-Ordner = { theme, values: { <theme-id>: { ... } } }.
// Werte bleiben je Theme getrennt, damit ein Theme-Wechsel nichts verliert. Geprüft wird gegen das Schema des Themes
// (src/core/settings.ts). Check: settings.check.ts.
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { hasMinimes, readMinimeOptions } from "../src/core/minimeFields.ts";
import type { MinimeRules } from "../src/core/minimes.ts";
import { resolveSettings, validateSettings, type SettingError } from "../src/core/settings.ts";
import type { SettingValues } from "../src/core/theme.ts";
import { DEFAULT_THEME, findTheme } from "../src/themes/registry.ts";
import { writeAtomic } from "./atomicFile.ts";

export type SettingsFile = { theme: string; values: Record<string, Record<string, unknown>> };

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

// Gelesene Datei auf gültige Form bringen: unbekanntes Theme wird der Standard, Werte nur als Objekte je Theme
export function parseSettingsFile(raw: unknown): SettingsFile {
  const source = isObject(raw) ? raw : {};
  const theme = typeof source.theme === "string" && findTheme(source.theme) ? source.theme : DEFAULT_THEME;
  const values: SettingsFile["values"] = {};
  if (isObject(source.values)) for (const [id, stored] of Object.entries(source.values)) if (isObject(stored)) values[id] = stored;
  return { theme, values };
}

// Was Overlays sehen: das gewählte Theme mit aufgelösten Werten (keine fremden Schlüssel, nichts Geheimes)
export function publicSettings(file: SettingsFile): { theme: string; values: SettingValues } {
  const schema = findTheme(file.theme) ?? findTheme(DEFAULT_THEME)!;
  return { theme: schema.id, values: resolveSettings(schema, file.values[schema.id]) };
}

// Regeln der Minimes aus den Werten des gewählten Themes; null, wenn dieses Theme keine Minimes hat
export function minimeRules(file: SettingsFile): MinimeRules | null {
  const settings = publicSettings(file);
  const schema = findTheme(settings.theme);
  return schema && hasMinimes(schema) ? readMinimeOptions(settings.values).rules : null;
}

// Werte eines Themes setzen und es (choose) als Overlay-Theme wählen. Nur fehlerfreie Eingaben ergeben eine neue Datei.
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
    // Kaputtes JSON: wie ohne Datei, der nächste Speichervorgang schreibt sie neu
    return parseSettingsFile({});
  }
}

export const saveSettings = (profileFolder: string, file: SettingsFile) => writeAtomic(join(profileFolder, "settings.json"), JSON.stringify(file, null, 2));
