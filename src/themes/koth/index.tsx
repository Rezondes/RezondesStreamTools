// Scenes of the KOTH theme for the theme list (src/themes/scenes.tsx) with its CSS. The theme brings all scenes itself,
// including the minimes (soldiers in factions). Every scene is loaded via React.lazy as its own chunk.
import { lazy } from "react";
import { screenScenes } from "../../core/screens/screenScenes.tsx";
import type { ThemeView } from "../../core/theme.ts";
import { kothSettings } from "./settings.ts";
import "./theme.css";

const Screen = lazy(() => import("./scenes/Screen.tsx"));

export const kothView: ThemeView = {
  id: kothSettings.id,
  scenes: {
    ...screenScenes(Screen),
    alerts: lazy(() => import("./scenes/Alerts.tsx")),
    chat: lazy(() => import("./scenes/Chat.tsx")),
    cam: lazy(() => import("./scenes/Cam.tsx")),
    music: lazy(() => import("./scenes/Music.tsx")),
    stats: lazy(() => import("./scenes/Stats.tsx")),
    fx: lazy(() => import("./scenes/Fx.tsx")),
    minimes: lazy(() => import("./scenes/Minimes.tsx")),
    info: lazy(() => import("./scenes/Info.tsx")),
  },
};
