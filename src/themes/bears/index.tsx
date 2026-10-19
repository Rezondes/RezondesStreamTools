// Scenes of the Bärenbande theme for the theme list (src/themes/scenes.tsx) with its CSS. The theme has only the scenes
// it brings itself (nothing is inherited); every scene is loaded via React.lazy as its own chunk.
import { lazy } from "react";
import { screenScenes } from "../../core/screens/screenScenes.tsx";
import type { ThemeView } from "../../core/theme.ts";
import { bearsSettings } from "./settings.ts";
import "./theme.css";

const Screen = lazy(() => import("./scenes/Screen.tsx"));

export const bearsView: ThemeView = {
  id: bearsSettings.id,
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
