// Renderbare Clips je Theme (Stinger und Banner) für den Render-Bereich. Ein Theme ohne eigene Clips nutzt die des
// Standard-Themes. Check: renderers.check.ts.
import type { RenderClip } from "../core/renderClip.ts";
import type { SettingValues } from "../core/theme.ts";
import { matrixClips } from "./matrix/render.ts";
import { DEFAULT_THEME } from "./registry.ts";
import { standardClips } from "./standard/render.ts";
import { suedfruchtClips } from "./suedfrucht/render.ts";

const THEME_CLIPS: Record<string, (values: SettingValues, login: string) => RenderClip[]> = {
  matrix: matrixClips,
  standard: standardClips,
  suedfrucht: suedfruchtClips,
};

// values: gegen das Schema des Themes aufgelöst
export const clipsFor = (theme: string, values: SettingValues, login: string) => (THEME_CLIPS[theme] ?? THEME_CLIPS[DEFAULT_THEME])(values, login);

export const hasClips = (theme: string) => Object.hasOwn(THEME_CLIPS, theme);
