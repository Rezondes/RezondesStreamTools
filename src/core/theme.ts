// Theme-Schnittstelle: welche Szenen es gibt und wie ein Theme seine Einstellungen beschreibt.
// Das Schema ist reines TypeScript ohne React, damit Server und Dashboard es gleich prüfen.

export const SCENES = ["starting", "brb", "ending", "alerts", "chat", "cam", "music", "fx", "minimes"] as const;
export type SceneName = (typeof SCENES)[number];

// Empfohlene Grösse der Browserquelle in OBS; Themes gestalten ihre Szenen für diese Grössen
export const SCENE_SIZES: Record<SceneName, { width: number; height: number }> = {
  starting: { width: 1920, height: 1080 },
  brb: { width: 1920, height: 1080 },
  ending: { width: 1920, height: 1080 },
  alerts: { width: 1920, height: 1080 },
  chat: { width: 500, height: 900 },
  cam: { width: 640, height: 360 },
  music: { width: 900, height: 240 },
  fx: { width: 1920, height: 1080 },
  minimes: { width: 1920, height: 360 },
};

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
  // ascii: das Dashboard bietet dazu den ASCII-Logo-Generator an
  | (FieldBase & { type: "text" | "textarea"; default: string; maxLength?: number; ascii?: boolean })
  | (FieldBase & { type: "lines"; default: readonly string[]; maxLines?: number })
  | (FieldBase & { type: "number"; default: number; min: number; max: number; step?: number; unit?: "px" | "ms" | "s" | "%" })
  | (FieldBase & { type: "boolean"; default: boolean })
  | (FieldBase & { type: "select" | "font"; default: string; options: readonly string[] })
  | (FieldBase & { type: "media"; default: string; accept: "image" | "video" | "audio" })
  | (FieldBase & { type: "sound"; default: SoundValue });

// groupScenes: in welchen Szenen eine Gruppe wirkt (das Dashboard zeigt nur die Gruppen der Szene in der Vorschau);
// fehlt eine Gruppe, wirkt sie überall (Allgemein), [] = in keiner Szene (Stinger, Banner: Bereich Rendern)
// Typen der Minimes eines Themes (z.B. Früchte) statt Farben: Befehl zum Wählen (Standardwort), Bezeichnung im
// Dashboard und je Typ id (Kleinbuchstaben und Ziffern), Name und Standard-Namen im Chat
export type MinimeVariantInfo = { id: string; label: string; names: readonly string[] };
export type MinimeVariantSet = { command: string; label: string; variants: readonly MinimeVariantInfo[] };

// minimeVariants: Typen der Minimes; fehlt es, wählen Chatter Farben (siehe src/core/minimeFields.ts)
// personalize: Werte, die das Theme beim ersten Login mit dem Twitch-Login des Streamers füllt (Kanal-Name, Logo, ...),
// statt allgemeiner Beispiele; fehlt es, gelten die Standardwerte
export type ThemeSchema = {
  id: string;
  name: string;
  fields: readonly SettingField[];
  groupScenes?: Readonly<Record<string, readonly SceneName[]>>;
  personalize?: (login: string) => SettingValues;
  minimeVariants?: MinimeVariantSet;
};
