// Bausteine für Theme-Schemas (src/themes/<id>/settings.ts): je Feldtyp eine Funktion, die den Schlüssel als
// Literal-Typ behält. ValuesOf macht daraus den Typ der aufgelösten Werte, den die Szenen eines Themes lesen.
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

// Mehrzeiliger Text für ASCII-Kunst; das Dashboard bietet einen Generator aus einem Namen an
export const asciiArt = <K extends string>(key: K, label: string, group: string, value: string, maxLength = 4000) =>
  ({ ...textarea(key, label, group, value, maxLength), ascii: true });

export const lines = <K extends string>(key: K, label: string, group: string, value: readonly string[], maxLines = 100) =>
  ({ key, type: "lines" as const, label, group, default: value, maxLines });

export const flag = <K extends string>(key: K, label: string, group: string, value: boolean) =>
  ({ key, type: "boolean" as const, label, group, default: value });

// Ton: ohne Datei spielt das Theme seinen eingebauten Ton (oder keinen)
export const sound = <K extends string>(key: K, label: string, group: string) =>
  ({ key, type: "sound" as const, label, group, default: SILENT });

export const choice = <K extends string>(key: K, label: string, group: string, value: string, options: readonly string[]) =>
  ({ key, type: "select" as const, label, group, default: value, options });

export const font = <K extends string>(key: K, label: string, group: string, value: string, options: readonly string[]) =>
  ({ key, type: "font" as const, label, group, default: value, options });

export const number = <K extends string>(key: K, label: string, group: string, value: number, min: number, max: number, unit?: Unit, step?: number) =>
  ({ key, type: "number" as const, label, group, default: value, min, max, ...(unit ? { unit } : {}), ...(step ? { step } : {}) });

// Feld, das nur in einer Szene wirkt: das Dashboard zeigt es nur dort (z.B. Titel oder Terminal-Zeilen von BRB)
export const inScene = <F extends SettingField>(scene: SceneName, field: F): F & { scene: SceneName } => ({ ...field, scene });

// Typ der aufgelösten Werte zu einer Feldliste: { [key]: Zahl, Schalter, Zeilen, Ton oder Text }
type ValueOf<F> = F extends { type: "number" } ? number
  : F extends { type: "boolean" } ? boolean
  : F extends { type: "lines" } ? readonly string[]
  : F extends { type: "sound" } ? SoundValue
  : string;
export type ValuesOf<Fields extends readonly { key: string; type: string }[]> = { readonly [F in Fields[number] as F["key"]]: ValueOf<F> };
