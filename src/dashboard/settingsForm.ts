// Logic of the settings form: the schema from the server, fields by group in schema order, reset to the default,
// changed fields compared to the saved state and errors per field. Pure functions, tested in settingsForm.check.ts.
import type { ThemeSchema as ServerSchema } from "../generated/ThemeSchema.ts";
import type { SettingError, SettingErrorCode } from "../core/settings.ts";
import type { SceneName, SettingField, SettingValue, SettingValues, ThemeSchema } from "../core/theme.ts";

// The schema of a theme: the server's (GET /api/themes) decides rules, limits and defaults; the built-in one only
// stands in while the server has not answered, the default theme for an unknown id
export const pickSchema = (server: readonly ServerSchema[] | null, local: (id: string) => ThemeSchema | null, fallback: ThemeSchema, id: string): ThemeSchema =>
  server?.find(schema => schema.id === id) ?? local(id) ?? fallback;

const same = (left: SettingValue | undefined, right: SettingValue | undefined) => JSON.stringify(left) === JSON.stringify(right);

// Groups in the order of their first field
export function groupFields(schema: ThemeSchema): { group: string; fields: SettingField[] }[] {
  const groups = new Map<string, SettingField[]>();
  for (const field of schema.fields) groups.set(field.group, [...(groups.get(field.group) ?? []), field]);
  return [...groups].map(([group, fields]) => ({ group, fields }));
}

// View of the form: the general groups (apply everywhere, also in stinger and banners) or a scene
export type FormView = SceneName | "general";

// Groups of a view: "general" = groups without an entry in groupScenes, a scene = only the groups that apply there,
// and in them only fields without their own scene or with exactly this one (e.g. the terminal lines of BRB only at BRB)
export const groupsForView = (schema: ThemeSchema, view: FormView) =>
  groupFields(schema)
    .filter(({ group }) => {
      const scenes = schema.groupScenes?.[group];
      return view === "general" ? scenes === undefined : scenes?.includes(view) ?? false;
    })
    .map(({ group, fields }) => ({ group, fields: fields.filter(field => field.scene === undefined || field.scene === view) }))
    .filter(({ fields }) => fields.length > 0);

// Groups that apply in no scene (stinger, banners): are in the render section
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
