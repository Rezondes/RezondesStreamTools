// Liste der eingebauten Themes (nur Einstellungs-Schemas, ohne React), für Server und Dashboard.
// Ein neues Theme wird hier eingetragen; das erste ist der Standard.
import type { ThemeSchema } from "../core/theme.ts";
import { matrixSettings } from "./matrix/settings.ts";
import { starterSettings } from "./starter/settings.ts";

export const THEMES: readonly ThemeSchema[] = [matrixSettings, starterSettings];

export const DEFAULT_THEME = THEMES[0].id;

export const findTheme = (id: string) => THEMES.find(theme => theme.id === id) ?? null;
