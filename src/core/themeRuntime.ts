// Applies a theme at runtime: which scene component applies (the standard theme provides missing ones) and which
// settings end up as CSS variables on the root element of the scene. Pure functions, tested in themeRuntime.check.ts.
import { SCENES, type SceneName, type SettingValues, type ThemeSchema } from "./theme.ts";

const isScene = (name: string): name is SceneName => (SCENES as readonly string[]).includes(name);

// Theme-specific features: only a theme that brings these scenes itself has them, they are never inherited
const OWN_SCENES: readonly SceneName[] = ["minimes"];

// Scene of the theme, otherwise the one of the standard theme (except OWN_SCENES); null for unknown scenes or if none has it
export function resolveScene<Component>(
  scenes: Record<string, Partial<Record<SceneName, Component>>>,
  themeId: string,
  scene: string,
  fallbackTheme: string,
): Component | null {
  if (!isScene(scene)) return null;
  const own = scenes[themeId]?.[scene];
  if (OWN_SCENES.includes(scene)) return own ?? null;
  return own ?? scenes[fallbackTheme]?.[scene] ?? null;
}

// Colors, numbers (with unit according to the schema), switches (1/0, for computing in calc) and fonts as --<key>.
// The scene reads texts, choices and media directly.
export function cssVariables(schema: ThemeSchema, values: SettingValues): Record<string, string> {
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
