// Scenes of the standard theme for the theme list (src/themes/scenes.tsx) with its CSS. The theme brings all
// scenes itself and uses nothing from the matrix theme. Every scene is loaded via React.lazy as its own chunk.
import { lazy } from "react";
import { screenScenes } from "../../core/screens/screenScenes.tsx";
import type { ThemeView } from "../../core/theme.ts";
import { standardSettings } from "./settings.ts";
import "./theme.css";

const Screen = lazy(() => import("./scenes/Screen.tsx"));

export const standardView: ThemeView = {
  id: standardSettings.id,
  scenes: {
    ...screenScenes(Screen),
    alerts: lazy(() => import("./scenes/Alerts.tsx")),
    chat: lazy(() => import("./scenes/Chat.tsx")),
    cam: lazy(() => import("./scenes/Cam.tsx")),
    music: lazy(() => import("./scenes/Music.tsx")),
    fx: lazy(() => import("./scenes/Fx.tsx")),
    info: lazy(() => import("./scenes/Info.tsx")),
  },
};
