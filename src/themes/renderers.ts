// Renderable clips per theme (stinger and banners) for the render section, from the theme modules in registry.ts.
// A theme has exactly the clips it brings (any of stinger, profile, offline), an unknown theme none.
// Check: renderers.check.ts.
import type { ClipName } from "../core/renderClip.ts";
import type { SettingValues } from "../core/theme.ts";
import { findModule, THEME_MODULES } from "./registry.ts";

// Every clip a theme can bring, in this order
export const CLIP_NAMES: readonly ClipName[] = ["stinger", "profile", "offline"];

// values: resolved against the theme's schema
export const clipsFor = (theme: string, values: SettingValues, login: string) => findModule(theme)?.clips(values, login) ?? [];

// A new panel in the look of the theme (the standard theme for an unknown one); values: resolved against that theme
export const panelFor = (theme: string, values: SettingValues, title: string) => (findModule(theme) ?? THEME_MODULES[0]).panel(values, title);
