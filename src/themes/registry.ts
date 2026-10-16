// Liste der eingebauten Themes (Daten-Seite ohne React: Schema und Clips je Theme, Vertrag ThemeModule aus
// src/core/theme.ts), für Server und Dashboard. Ein neues Theme wird hier und mit seiner Ansicht in scenes.tsx
// eingetragen (registry.check.ts prüft, dass jeder Theme-Ordner in beiden steht); das erste ist der Standard.
import type { ThemeModule, ThemeSchema } from "../core/theme.ts";
import { matrixClips } from "./matrix/render.ts";
import { matrixSettings } from "./matrix/settings.ts";
import { standardClips } from "./standard/render.ts";
import { standardSettings } from "./standard/settings.ts";
import { suedfruchtClips } from "./suedfrucht/render.ts";
import { suedfruchtSettings } from "./suedfrucht/settings.ts";

export const THEME_MODULES: readonly ThemeModule[] = [
  { schema: standardSettings, clips: standardClips },
  { schema: matrixSettings, clips: matrixClips },
  { schema: suedfruchtSettings, clips: suedfruchtClips },
];

export const THEMES: readonly ThemeSchema[] = THEME_MODULES.map(module => module.schema);

export const DEFAULT_THEME = THEMES[0].id;

export const findTheme = (id: string) => THEMES.find(theme => theme.id === id) ?? null;

export const findModule = (id: string) => THEME_MODULES.find(module => module.schema.id === id) ?? null;
