// List of the built-in themes (data side without React: schema, clips and panel template per theme, contract ThemeModule from
// src/core/theme.ts), for server and dashboard. A new theme is registered here and with its view in scenes.tsx
// (registry.check.ts checks that every theme folder is in both); the first one is the default.
import type { ThemeModule, ThemeSchema } from "../core/theme.ts";
import { bearsClips, bearsPanel } from "./bears/render.ts";
import { bearsSettings } from "./bears/settings.ts";
import { chaosClips, chaosPanel } from "./chaos/render.ts";
import { chaosSettings } from "./chaos/settings.ts";
import { dachdeckerClips, dachdeckerPanel } from "./dachdecker/render.ts";
import { dachdeckerSettings } from "./dachdecker/settings.ts";
import { kothClips, kothPanel } from "./koth/render.ts";
import { kothSettings } from "./koth/settings.ts";
import { matrixClips, matrixPanel } from "./matrix/render.ts";
import { matrixSettings } from "./matrix/settings.ts";
import { plantageClips, plantagePanel } from "./plantage/render.ts";
import { plantageSettings } from "./plantage/settings.ts";
import { standardClips, standardPanel } from "./standard/render.ts";
import { standardSettings } from "./standard/settings.ts";
import { urlaubClips, urlaubPanel } from "./urlaub/render.ts";
import { urlaubSettings } from "./urlaub/settings.ts";

export const THEME_MODULES: readonly ThemeModule[] = [
  { schema: standardSettings, clips: standardClips, panel: standardPanel },
  { schema: matrixSettings, clips: matrixClips, panel: matrixPanel },
  { schema: urlaubSettings, clips: urlaubClips, panel: urlaubPanel },
  { schema: plantageSettings, clips: plantageClips, panel: plantagePanel },
  { schema: kothSettings, clips: kothClips, panel: kothPanel },
  { schema: bearsSettings, clips: bearsClips, panel: bearsPanel },
  { schema: chaosSettings, clips: chaosClips, panel: chaosPanel },
  { schema: dachdeckerSettings, clips: dachdeckerClips, panel: dachdeckerPanel },
];

export const THEMES: readonly ThemeSchema[] = THEME_MODULES.map(module => module.schema);

export const DEFAULT_THEME = THEMES[0].id;

export const findTheme = (id: string) => THEMES.find(theme => theme.id === id) ?? null;

export const findModule = (id: string) => THEME_MODULES.find(module => module.schema.id === id) ?? null;
