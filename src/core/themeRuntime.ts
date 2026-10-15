// Theme zur Laufzeit anwenden: welche Szenen-Komponente gilt (fehlende erbt das Standard-Theme) und welche
// Einstellungen als CSS-Variablen am Wurzelelement der Szene landen. Reine Funktionen, getestet in themeRuntime.check.ts.
import { SCENES, type SceneName, type SettingValues, type ThemeSchema } from "./theme.ts";

const isScene = (name: string): name is SceneName => (SCENES as readonly string[]).includes(name);

// Szene des Themes, sonst die des Standard-Themes; null für unbekannte Szenen oder wenn keiner sie hat
export function resolveScene<Component>(
  scenes: Record<string, Partial<Record<SceneName, Component>>>,
  themeId: string,
  scene: string,
  fallbackTheme: string,
): Component | null {
  if (!isScene(scene)) return null;
  return scenes[themeId]?.[scene] ?? scenes[fallbackTheme]?.[scene] ?? null;
}

// Farben und Zahlen als --<key>; Zahlen mit Einheit laut Schema. Texte und Schalter liest die Szene direkt.
export function cssVariables(schema: ThemeSchema, values: SettingValues): Record<string, string> {
  const variables: Record<string, string> = {};
  for (const field of schema.fields) {
    const value = values[field.key];
    if (field.type === "color" && typeof value === "string") variables[`--${field.key}`] = value;
    if (field.type === "number" && typeof value === "number") variables[`--${field.key}`] = `${value}${field.unit ?? ""}`;
  }
  return variables;
}
