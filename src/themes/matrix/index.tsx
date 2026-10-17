// Scenes of the matrix theme for the theme list (src/themes/scenes.tsx) with its CSS.
// Every scene is loaded via React.lazy and ends up in its own chunk in the build.
import { lazy } from "react";
import { screenScenes } from "../../core/screens/screenScenes.tsx";
import type { ThemeView } from "../../core/theme.ts";
import { matrixSettings } from "./settings.ts";
import "./theme.css";

const Screen = lazy(() => import("./scenes/Screen.tsx"));

export const matrixView: ThemeView = {
  id: matrixSettings.id,
  scenes: {
    ...screenScenes(Screen),
    alerts: lazy(() => import("./scenes/Alerts.tsx")),
    chat: lazy(() => import("./scenes/Chat.tsx")),
    cam: lazy(() => import("./scenes/Cam.tsx")),
    music: lazy(() => import("./scenes/Music.tsx")),
    fx: lazy(() => import("./scenes/Fx.tsx")),
    minimes: lazy(() => import("./scenes/Minimes.tsx")),
    info: lazy(() => import("./scenes/Info.tsx")),
  },
};
