// Logik des Einstellungs-Formulars: Felder nach Gruppen in Schema-Reihenfolge, Zurücksetzen auf den Standard,
// geänderte Felder gegenüber dem gespeicherten Stand und Fehler je Feld. Reine Funktionen, getestet in settingsForm.check.ts.
import type { SettingError, SettingErrorCode } from "../core/settings.ts";
import type { SceneName, SettingField, SettingValue, SettingValues, ThemeSchema } from "../core/theme.ts";

const same = (left: SettingValue | undefined, right: SettingValue | undefined) => JSON.stringify(left) === JSON.stringify(right);

// Gruppen in der Reihenfolge ihres ersten Feldes
export function groupFields(schema: ThemeSchema): { group: string; fields: SettingField[] }[] {
  const groups = new Map<string, SettingField[]>();
  for (const field of schema.fields) groups.set(field.group, [...(groups.get(field.group) ?? []), field]);
  return [...groups].map(([group, fields]) => ({ group, fields }));
}

// Ansicht des Formulars: die allgemeinen Gruppen (wirken überall, auch in Stinger und Banner) oder eine Szene
export type FormView = SceneName | "general";

// Gruppen einer Ansicht: "general" = Gruppen ohne Eintrag in groupScenes, eine Szene = nur die Gruppen, die dort wirken,
// und darin nur Felder ohne eigene Szene oder mit genau dieser (z.B. die Terminal-Zeilen von BRB nur bei BRB)
export const groupsForView = (schema: ThemeSchema, view: FormView) =>
  groupFields(schema)
    .filter(({ group }) => {
      const scenes = schema.groupScenes?.[group];
      return view === "general" ? scenes === undefined : scenes?.includes(view) ?? false;
    })
    .map(({ group, fields }) => ({ group, fields: fields.filter(field => field.scene === undefined || field.scene === view) }))
    .filter(({ fields }) => fields.length > 0);

// Gruppen, die in keiner Szene wirken (Stinger, Banner): stehen im Bereich Rendern
export const groupsWithoutScene = (schema: ThemeSchema) =>
  Object.entries(schema.groupScenes ?? {}).filter(([, scenes]) => scenes.length === 0).map(([group]) => group);

export const resetAll = (schema: ThemeSchema): SettingValues => Object.fromEntries(schema.fields.map(field => [field.key, field.default]));

export function resetField(schema: ThemeSchema, values: SettingValues, key: string): SettingValues {
  const field = schema.fields.find(candidate => candidate.key === key);
  return field ? { ...values, [key]: field.default } : values;
}

export const isDefault = (field: SettingField, value: SettingValue | undefined) => same(field.default, value);

export const changedKeys = (saved: SettingValues, draft: SettingValues) => Object.keys(draft).filter(key => !same(saved[key], draft[key]));

export const errorsByKey = (errors: readonly SettingError[]): Record<string, SettingErrorCode> => Object.fromEntries(errors.map(({ key, code }) => [key, code]));
