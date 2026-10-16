// Renderbare Clips je Theme (Stinger und Banner) für den Render-Bereich, aus den Theme-Modulen in registry.ts.
// Ein unbekanntes Theme bekommt die des Standard-Themes. Check: renderers.check.ts.
import type { SettingValues } from "../core/theme.ts";
import { DEFAULT_THEME, findModule } from "./registry.ts";

// values: gegen das Schema des Themes aufgelöst
export const clipsFor = (theme: string, values: SettingValues, login: string) => (findModule(theme) ?? findModule(DEFAULT_THEME)!).clips(values, login);

export const hasClips = (theme: string) => findModule(theme) !== null;
