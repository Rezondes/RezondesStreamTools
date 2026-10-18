// List of the built-in themes (data side without React: schema and clips per theme, contract ThemeModule from
// src/core/theme.ts), for server and dashboard. A new theme is registered here and with its view in scenes.tsx
// (registry.check.ts checks that every theme folder is in both); the first one is the default.
import type { ThemeModule, ThemeSchema } from "../core/theme.ts";
import { matrixClips } from "./matrix/render.ts";
import { matrixSettings } from "./matrix/settings.ts";
import { standardClips } from "./standard/render.ts";
import { standardSettings } from "./standard/settings.ts";
import { urlaubClips } from "./urlaub/render.ts";
import { urlaubSettings } from "./urlaub/settings.ts";

export const THEME_MODULES: readonly ThemeModule[] = [
  { schema: standardSettings, clips: standardClips },
  { schema: matrixSettings, clips: matrixClips },
  { schema: urlaubSettings, clips: urlaubClips },
];

export const THEMES: readonly ThemeSchema[] = THEME_MODULES.map(module => module.schema);

export const DEFAULT_THEME = THEMES[0].id;

export const findTheme = (id: string) => THEMES.find(theme => theme.id === id) ?? null;

export const findModule = (id: string) => THEME_MODULES.find(module => module.schema.id === id) ?? null;
