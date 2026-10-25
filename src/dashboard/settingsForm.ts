// Logic of the settings form: the schema from the server, fields by group in schema order, reset to the default,
// changed fields compared to the saved state and errors per field. Pure functions, tested in settingsForm.check.ts.
import type { ThemeSchema as ServerSchema } from "../generated/ThemeSchema.ts";
import { effectiveValues, type SettingError, type SettingErrorCode } from "../core/settings.ts";
import { STAT_KEYS } from "../core/stats/stats.ts";
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

// Mode of the form: the basic fields only, or all of them
export type FormMode = "einfach" | "erweitert";

export const groupsForMode = (schema: ThemeSchema, view: FormView, mode: FormMode) =>
  mode === "erweitert"
    ? groupsForView(schema, view)
    : groupsForView(schema, view)
      .map(({ group, fields }) => ({ group, fields: fields.filter(field => field.basic) }))
      .filter(({ fields }) => fields.length > 0);

// Kinds that split a large group, in this order
export type FieldKind = "texts" | "colors" | "choices" | "switches" | "numbers" | "media";
const KIND_OF: Record<SettingField["type"], FieldKind> = {
  text: "texts", textarea: "texts", lines: "texts", color: "colors", font: "choices", select: "choices",
  boolean: "switches", number: "numbers", media: "media", sound: "media",
};
const KINDS: readonly FieldKind[] = ["texts", "colors", "choices", "switches", "numbers", "media"];

export const fieldsByKind = (fields: readonly SettingField[]) =>
  KINDS.map(kind => ({ kind, fields: fields.filter(field => KIND_OF[field.type] === kind) })).filter(({ fields }) => fields.length > 0);

// The view a field stands in: its own scene, general, the first scene of its group, or render (groups of no scene)
export function viewOfField(schema: ThemeSchema, key: string): FormView | "render" {
  const field = schema.fields.find(candidate => candidate.key === key);
  if (field?.scene) return field.scene;
  const scenes = field && schema.groupScenes?.[field.group];
  if (scenes === undefined) return "general";
  return scenes[0] ?? "render";
}

// Of the given keys (changed or wrong fields) the ones not visible in this view and mode
export function hiddenKeys(schema: ThemeSchema, view: FormView, mode: FormMode, keys: readonly string[]): string[] {
  const visible = new Set(groupsForMode(schema, view, mode).flatMap(({ fields }) => fields.map(field => field.key)));
  return keys.filter(key => !visible.has(key));
}

export const resetAll = (schema: ThemeSchema): SettingValues => Object.fromEntries(schema.fields.map(field => [field.key, field.default]));

export function resetField(schema: ThemeSchema, values: SettingValues, key: string): SettingValues {
  const field = schema.fields.find(candidate => candidate.key === key);
  return field ? { ...values, [key]: field.default } : values;
}

// An empty field that inherits: the label of its parent and the value it takes from there; null for an own value
export function inheritedOf(schema: ThemeSchema, field: SettingField, values: SettingValues): { label: string; value: string } | null {
  if (field.inherit === undefined || values[field.key] !== "") return null;
  const parent = schema.fields.find(candidate => candidate.key === field.inherit);
  const value = effectiveValues(schema, values)[field.key];
  return parent && typeof value === "string" ? { label: parent.label, value } : null;
}

// A select with optionsBy offers only the options for the value of its other field (its default while unset); an
// unknown value offers all
export function shownField(schema: ThemeSchema, field: SettingField, values: SettingValues): SettingField {
  if (field.type !== "select" || !field.optionsBy) return field;
  const other = field.optionsBy.field;
  const value = values[other] ?? schema.fields.find(candidate => candidate.key === other)?.default;
  const options = typeof value === "string" ? field.optionsBy.options[value] : undefined;
  return options ? { ...field, options } : field;
}

// fixed: the label part of a lines setting with stream numbers in every theme
const STAT_LINES_LABEL = "(Schlüssel|Text)";

// The keys of the stream numbers under a lines setting "... (Schlüssel|Text)", null for every other field
export const statKeysHint = (field: SettingField): readonly string[] | null =>
  (field.type === "lines" && field.label.includes(STAT_LINES_LABEL) ? STAT_KEYS : null);

export const isDefault = (field: SettingField, value: SettingValue | undefined) => same(field.default, value);

export const changedKeys = (saved: SettingValues, draft: SettingValues) => Object.keys(draft).filter(key => !same(saved[key], draft[key]));

export const errorsByKey = (errors: readonly SettingError[]): Record<string, SettingErrorCode> => Object.fromEntries(errors.map(({ key, code }) => [key, code]));
