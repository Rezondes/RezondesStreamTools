// Theme-Schnittstelle: welche Szenen es gibt und wie ein Theme seine Einstellungen beschreibt.
// Das Schema ist reines TypeScript ohne React, damit Server und Dashboard es gleich prüfen.

export const SCENES = ["starting", "brb", "ending", "alerts", "chat", "cam", "music", "fx"] as const;
export type SceneName = (typeof SCENES)[number];

// Ton: eigene Datei aus den Medien (file) oder leer = eingebauter Ton des Themes; volume 0 bis 1
export type SoundValue = { file: string; volume: number };
export type SettingValue = string | number | boolean | readonly string[] | SoundValue;
export type SettingValues = Record<string, SettingValue>;

type FieldBase = {
  key: string;
  label: string;
  group: string; // Abschnitt im Formular
  scene?: SceneName; // für die Vorschau im Dashboard
};

export type SettingField =
  | (FieldBase & { type: "color"; default: string })
  | (FieldBase & { type: "text" | "textarea"; default: string; maxLength?: number })
  | (FieldBase & { type: "lines"; default: readonly string[]; maxLines?: number })
  | (FieldBase & { type: "number"; default: number; min: number; max: number; step?: number; unit?: "px" | "ms" | "s" | "%" })
  | (FieldBase & { type: "boolean"; default: boolean })
  | (FieldBase & { type: "select" | "font"; default: string; options: readonly string[] })
  | (FieldBase & { type: "media"; default: string; accept: "image" | "video" | "audio" })
  | (FieldBase & { type: "sound"; default: SoundValue });

export type ThemeSchema = { id: string; name: string; fields: readonly SettingField[] };
