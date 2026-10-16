// Szenen des Matrix-Themes für die Theme-Liste (src/themes/scenes.tsx) samt seinem CSS.
// Jede Szene wird per React.lazy geladen und landet im Build in einem eigenen Chunk.
import { lazy, type ComponentType } from "react";
import type { SceneName } from "../../core/theme.ts";
import "./theme.css";

const Screen = lazy(() => import("./scenes/Screen.tsx"));

export const matrixScenes: Partial<Record<SceneName, ComponentType>> = {
  starting: () => <Screen kind="starting" />,
  brb: () => <Screen kind="brb" />,
  ending: () => <Screen kind="ending" />,
  alerts: lazy(() => import("./scenes/Alerts.tsx")),
  chat: lazy(() => import("./scenes/Chat.tsx")),
  cam: lazy(() => import("./scenes/Cam.tsx")),
  music: lazy(() => import("./scenes/Music.tsx")),
  fx: lazy(() => import("./scenes/Fx.tsx")),
  minimes: lazy(() => import("./scenes/Minimes.tsx")),
};
