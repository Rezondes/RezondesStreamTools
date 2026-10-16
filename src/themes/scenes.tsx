// Ansichten der Themes (Vertrag ThemeView aus src/core/theme.ts): die Szenen je Theme, die React-Seite zu
// registry.ts. Eine Seite lädt nur die Szene des Themes, das der Streamer gewählt hat; fehlende Szenen eines Themes
// kommen vom Standard-Theme (src/core/themeRuntime.ts).
import type { ThemeView } from "../core/theme.ts";
import { matrixView } from "./matrix/index.tsx";
import { standardView } from "./standard/index.tsx";
import { suedfruchtView } from "./suedfrucht/index.tsx";

const THEME_VIEWS: readonly ThemeView[] = [standardView, matrixView, suedfruchtView];

export const THEME_SCENES: Record<string, ThemeView["scenes"]> = Object.fromEntries(THEME_VIEWS.map(view => [view.id, view.scenes]));
