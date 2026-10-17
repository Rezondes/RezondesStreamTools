// Renderable clips per theme (stinger and banners) for the render section, from the theme modules in registry.ts.
// An unknown theme gets those of the standard theme. Check: renderers.check.ts.
import type { SettingValues } from "../core/theme.ts";
import { DEFAULT_THEME, findModule } from "./registry.ts";

// values: resolved against the theme's schema
export const clipsFor = (theme: string, values: SettingValues, login: string) => (findModule(theme) ?? findModule(DEFAULT_THEME)!).clips(values, login);
