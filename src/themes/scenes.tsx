// Views of the themes (contract ThemeView from src/core/theme.ts): the scenes per theme, the React side of
// registry.ts. A page only loads the scene of the theme the streamer chose; a scene the theme does not bring
// stays empty, nothing comes from another theme (src/core/themeRuntime.ts).
import type { ThemeView } from "../core/theme.ts";
import { kothView } from "./koth/index.tsx";
import { matrixView } from "./matrix/index.tsx";
import { plantageView } from "./plantage/index.tsx";
import { standardView } from "./standard/index.tsx";
import { urlaubView } from "./urlaub/index.tsx";

const THEME_VIEWS: readonly ThemeView[] = [standardView, matrixView, urlaubView, plantageView, kothView];

export const THEME_SCENES: Record<string, ThemeView["scenes"]> = Object.fromEntries(THEME_VIEWS.map(view => [view.id, view.scenes]));
