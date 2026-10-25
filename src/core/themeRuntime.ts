// Applies a theme at runtime: which scene component applies (only the theme's own, nothing is inherited from another
// theme) and which settings end up as CSS variables on the root element of the scene. Pure functions, tested in
// themeRuntime.check.ts.
import { effectiveValues } from "./settings.ts";
import { SCENES, type SceneName, type SettingValues, type ThemeSchema } from "./theme.ts";

const isScene = (name: string): name is SceneName => (SCENES as readonly string[]).includes(name);

type SceneTable<Component> = Record<string, Partial<Record<SceneName, Component>>>;

// Scene of the theme; null for unknown scenes, unknown themes and scenes the theme does not bring (an empty page)
export function resolveScene<Component>(scenes: SceneTable<Component>, themeId: string, scene: string): Component | null {
  if (!isScene(scene)) return null;
  return scenes[themeId]?.[scene] ?? null;
}

// Scenes a theme brings, in the order of SCENES (the dashboard marks the others as not available)
export function sceneNames<Component>(scenes: SceneTable<Component>, themeId: string): SceneName[] {
  return SCENES.filter(scene => scenes[themeId]?.[scene] !== undefined);
}

// Colors, numbers (with unit according to the schema), switches (1/0, for computing in calc) and fonts as --<key>.
// The scene reads texts, choices and media directly. Empty fields that inherit take the value of their parent.
export function cssVariables(schema: ThemeSchema, stored: SettingValues): Record<string, string> {
  const values = effectiveValues(schema, stored);
  const variables: Record<string, string> = {};
  for (const field of schema.fields) {
    const value = values[field.key];
    if (field.type === "color" && typeof value === "string") variables[`--${field.key}`] = value;
    if (field.type === "number" && typeof value === "number") variables[`--${field.key}`] = `${value}${field.unit ?? ""}`;
    if (field.type === "boolean" && typeof value === "boolean") variables[`--${field.key}`] = value ? "1" : "0";
    if (field.type === "font" && typeof value === "string") variables[`--${field.key}`] = JSON.stringify(value);
  }
  return variables;
}
