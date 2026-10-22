// List of the built-in themes (data side without React: schema, clips, panel template and OBS source sizes per theme, contract ThemeModule from
// src/core/theme.ts), for server and dashboard. A new theme is registered here and with its view in scenes.tsx
// (registry.check.ts checks that every theme folder is in both); the first one is the default.
import type { ThemeModule, ThemeSchema } from "../core/theme.ts";
import { bearsAreas } from "./bears/areas.ts";
import { bearsClips, bearsPanel } from "./bears/render.ts";
import { bearsSettings } from "./bears/settings.ts";
import { chaosAreas } from "./chaos/areas.ts";
import { chaosClips, chaosPanel } from "./chaos/render.ts";
import { chaosSettings } from "./chaos/settings.ts";
import { dachdeckerAreas } from "./dachdecker/areas.ts";
import { dachdeckerClips, dachdeckerPanel } from "./dachdecker/render.ts";
import { dachdeckerSettings } from "./dachdecker/settings.ts";
import { kothAreas } from "./koth/areas.ts";
import { kothClips, kothPanel } from "./koth/render.ts";
import { kothSettings } from "./koth/settings.ts";
import { matrixAreas } from "./matrix/areas.ts";
import { matrixClips, matrixPanel } from "./matrix/render.ts";
import { matrixSettings } from "./matrix/settings.ts";
import { plantageAreas } from "./plantage/areas.ts";
import { plantageClips, plantagePanel } from "./plantage/render.ts";
import { plantageSettings } from "./plantage/settings.ts";
import { standardAreas } from "./standard/areas.ts";
import { standardClips, standardPanel } from "./standard/render.ts";
import { standardSettings } from "./standard/settings.ts";
import { urlaubAreas } from "./urlaub/areas.ts";
import { urlaubClips, urlaubPanel } from "./urlaub/render.ts";
import { urlaubSettings } from "./urlaub/settings.ts";

export const THEME_MODULES: readonly ThemeModule[] = [
  { schema: standardSettings, clips: standardClips, panel: standardPanel, areas: standardAreas },
  { schema: matrixSettings, clips: matrixClips, panel: matrixPanel, areas: matrixAreas },
  { schema: urlaubSettings, clips: urlaubClips, panel: urlaubPanel, areas: urlaubAreas },
  { schema: plantageSettings, clips: plantageClips, panel: plantagePanel, areas: plantageAreas },
  { schema: kothSettings, clips: kothClips, panel: kothPanel, areas: kothAreas },
  { schema: bearsSettings, clips: bearsClips, panel: bearsPanel, areas: bearsAreas },
  { schema: chaosSettings, clips: chaosClips, panel: chaosPanel, areas: chaosAreas },
  { schema: dachdeckerSettings, clips: dachdeckerClips, panel: dachdeckerPanel, areas: dachdeckerAreas },
];

export const THEMES: readonly ThemeSchema[] = THEME_MODULES.map(module => module.schema);

export const DEFAULT_THEME = THEMES[0].id;

export const findTheme = (id: string) => THEMES.find(theme => theme.id === id) ?? null;

export const findModule = (id: string) => THEME_MODULES.find(module => module.schema.id === id) ?? null;
