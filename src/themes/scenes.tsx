// Szenen-Komponenten je Theme (React-Teil der Theme-Liste, die Schemas stehen in registry.ts).
// Eine Seite lädt nur die Szene des Themes, das der Streamer gewählt hat; fehlende Szenen eines Themes
// kommen vom Standard-Theme (src/core/themeRuntime.ts).
import type { ComponentType } from "react";
import type { SceneName } from "../core/theme.ts";
import { matrixScenes } from "./matrix/index.tsx";
import { standardScenes } from "./standard/index.tsx";
import { suedfruchtScenes } from "./suedfrucht/index.tsx";

export const THEME_SCENES: Record<string, Partial<Record<SceneName, ComponentType>>> = {
  matrix: matrixScenes,
  standard: standardScenes,
  suedfrucht: suedfruchtScenes,
};
