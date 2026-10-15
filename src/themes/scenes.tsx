// Szenen-Komponenten je Theme (React-Teil der Theme-Liste). Jedes Theme wird per React.lazy geladen und landet
// im Build in einem eigenen Chunk; eine Seite lädt nur das Theme, das der Streamer gewählt hat.
// Fehlende Szenen eines Themes kommen vom Standard-Theme (src/core/themeRuntime.ts).
import { lazy, type ComponentType } from "react";
import type { SceneName } from "../core/theme.ts";

const Screen = lazy(() => import("../scenes/Screen.tsx"));

export const THEME_SCENES: Record<string, Partial<Record<SceneName, ComponentType>>> = {
  matrix: {
    starting: () => <Screen kind="starting" />,
    brb: () => <Screen kind="brb" />,
    ending: () => <Screen kind="ending" />,
    alerts: lazy(() => import("../scenes/Alerts.tsx")),
    chat: lazy(() => import("../scenes/Chat.tsx")),
    cam: lazy(() => import("../scenes/Cam.tsx")),
    music: lazy(() => import("../scenes/Music.tsx")),
    fx: lazy(() => import("../scenes/Fx.tsx")),
  },
};
