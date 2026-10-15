// Einstellungen eines Themes: gespeicherte Werte auflösen (Standard für alles Fehlende oder Ungültige) und
// Eingaben aus dem Dashboard prüfen. Reine Funktionen für Server und Dashboard, getestet in settings.check.ts.
import type { SettingErrorCode } from "./errorCodes.ts";
import { isMediaName } from "./streamerPath.ts";
import type { SettingField, SettingValue, SettingValues, ThemeSchema } from "./theme.ts";

export type { SettingErrorCode };
export type SettingError = { key: string; code: SettingErrorCode };

const TEXT_LIMIT = 2000;
const LINE_LIMIT = 200;
const COLOR = /^#[0-9a-f]{6}([0-9a-f]{2})?$/i;
// Erlaubte Dateiendungen je Medienart (auch für die Auswahl im Dashboard)
export const MEDIA_KIND = { image: /\.(gif|png|jpe?g|webp|svg)$/i, video: /\.(mp4|webm)$/i, audio: /\.(mp3|wav|ogg)$/i } as const;

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const isText = (value: unknown, limit: number): SettingErrorCode | null => (typeof value !== "string" ? "invalid_type" : value.length > limit ? "too_long" : null);

// Fehlercode für einen Wert, null wenn er gültig ist
function checkValue(field: SettingField, value: unknown): SettingErrorCode | null {
  switch (field.type) {
    case "color": return typeof value !== "string" ? "invalid_type" : COLOR.test(value) ? null : "invalid_color";
    case "text":
    case "textarea": return isText(value, field.maxLength ?? TEXT_LIMIT);
    case "lines":
      if (!Array.isArray(value) || value.some(line => typeof line !== "string")) return "invalid_type";
      if (value.length > (field.maxLines ?? LINE_LIMIT)) return "too_many_lines";
      return value.some(line => (line as string).length > TEXT_LIMIT) ? "too_long" : null;
    case "number":
      if (typeof value !== "number" || !Number.isFinite(value)) return "invalid_type";
      return value < field.min || value > field.max ? "out_of_range" : null;
    case "boolean": return typeof value === "boolean" ? null : "invalid_type";
    case "select":
    case "font": return typeof value !== "string" ? "invalid_type" : field.options.includes(value) ? null : "unknown_option";
    case "media": return checkMedia(value, field.accept);
    case "sound": {
      if (!isObject(value) || typeof value.volume !== "number") return "invalid_type";
      return checkMedia(value.file, "audio") ?? (value.volume < 0 || value.volume > 1 ? "out_of_range" : null);
    }
  }
}

// Leer = kein Medium; sonst ein erlaubter Dateiname der passenden Art
function checkMedia(value: unknown, accept: keyof typeof MEDIA_KIND): SettingErrorCode | null {
  if (typeof value !== "string") return "invalid_type";
  if (value === "") return null;
  return isMediaName(value) && MEDIA_KIND[accept].test(value) ? null : "invalid_media";
}

// Für jedes Feld ein Wert: gespeichert und gültig, sonst Standard. Fremde Schlüssel fallen weg.
export function resolveSettings(schema: ThemeSchema, stored: unknown): SettingValues {
  const source = isObject(stored) ? stored : {};
  const values: SettingValues = {};
  for (const field of schema.fields) {
    const value = source[field.key];
    values[field.key] = value !== undefined && checkValue(field, value) === null ? (value as SettingValue) : field.default;
  }
  return values;
}

// Eingabe prüfen: Fehler je ungültigem Feld (nur für vorhandene Schlüssel), values = aufgelöst ohne die ungültigen
export function validateSettings(schema: ThemeSchema, input: unknown): { values: SettingValues; errors: SettingError[] } {
  if (!isObject(input)) return { values: resolveSettings(schema, {}), errors: [{ key: "", code: "invalid_type" }] };
  const errors: SettingError[] = [];
  for (const field of schema.fields) {
    if (input[field.key] === undefined) continue;
    const code = checkValue(field, input[field.key]);
    if (code) errors.push({ key: field.key, code });
  }
  return { values: resolveSettings(schema, input), errors };
}
