// Building blocks for theme schemas (src/themes/<id>/settings.ts): one function per field type that keeps the key as
// a literal type. ValuesOf turns it into the type of the resolved values that the scenes of a theme read.
// Check: fields.check.ts.
import type { SceneName, SettingField, SoundValue } from "./theme.ts";

type Unit = "px" | "ms" | "s" | "%";
const SILENT: SoundValue = { file: "", volume: 1 };

export const color = <K extends string>(key: K, label: string, group: string, value: string) =>
  ({ key, type: "color" as const, label, group, default: value });

export const text = <K extends string>(key: K, label: string, group: string, value: string, maxLength = 200) =>
  ({ key, type: "text" as const, label, group, default: value, maxLength });

export const textarea = <K extends string>(key: K, label: string, group: string, value: string, maxLength = 4000) =>
  ({ key, type: "textarea" as const, label, group, default: value, maxLength });

// Multi-line text for ASCII art; the dashboard offers a generator from a name
export const asciiArt = <K extends string>(key: K, label: string, group: string, value: string, maxLength = 4000) =>
  ({ ...textarea(key, label, group, value, maxLength), ascii: true });

export const lines = <K extends string>(key: K, label: string, group: string, value: readonly string[], maxLines = 100) =>
  ({ key, type: "lines" as const, label, group, default: value, maxLines });

export const flag = <K extends string>(key: K, label: string, group: string, value: boolean) =>
  ({ key, type: "boolean" as const, label, group, default: value });

// Sound: without a file the theme plays its built-in sound (or none)
export const sound = <K extends string>(key: K, label: string, group: string) =>
  ({ key, type: "sound" as const, label, group, default: SILENT });

export const choice = <K extends string>(key: K, label: string, group: string, value: string, options: readonly string[]) =>
  ({ key, type: "select" as const, label, group, default: value, options });

export const font = <K extends string>(key: K, label: string, group: string, value: string, options: readonly string[]) =>
  ({ key, type: "font" as const, label, group, default: value, options });

export const number = <K extends string>(key: K, label: string, group: string, value: number, min: number, max: number, unit?: Unit, step?: number) =>
  ({ key, type: "number" as const, label, group, default: value, min, max, ...(unit ? { unit } : {}), ...(step ? { step } : {}) });

// Field that only affects one scene: the dashboard shows it only there (e.g. title or terminal lines of BRB)
export const inScene = <F extends SettingField>(scene: SceneName, field: F): F & { scene: SceneName } => ({ ...field, scene });

// Type of the resolved values for a field list: { [key]: number, switch, lines, sound or text }
type ValueOf<F> = F extends { type: "number" } ? number
  : F extends { type: "boolean" } ? boolean
  : F extends { type: "lines" } ? readonly string[]
  : F extends { type: "sound" } ? SoundValue
  : string;
export type ValuesOf<Fields extends readonly { key: string; type: string }[]> = { readonly [F in Fields[number] as F["key"]]: ValueOf<F> };
