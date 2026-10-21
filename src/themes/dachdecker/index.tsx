// Scenes of the Dachdecker theme for the theme list (src/themes/scenes.tsx) with its CSS: Starting, BRB and Ending in
// 3D, the overlays on the 2D plan layer, the minimes as 3D figures. Every scene is loaded via React.lazy as its own
// chunk, so the 3D modules only load where a scene needs them.
import { lazy } from "react";
import type { ThemeView } from "../../core/theme.ts";
import { dachdeckerSettings } from "./settings.ts";
import "./theme.css";
import "./overlays.css";

export const dachdeckerView: ThemeView = {
  id: dachdeckerSettings.id,
  scenes: {
    starting: lazy(() => import("./scenes/Starting.tsx")),
    brb: lazy(() => import("./scenes/Brb.tsx")),
    ending: lazy(() => import("./scenes/Ending.tsx")),
    alerts: lazy(() => import("./scenes/Alerts.tsx")),
    chat: lazy(() => import("./scenes/Chat.tsx")),
    cam: lazy(() => import("./scenes/Cam.tsx")),
    music: lazy(() => import("./scenes/Music.tsx")),
    fx: lazy(() => import("./scenes/Fx.tsx")),
    info: lazy(() => import("./scenes/Info.tsx")),
    minimes: lazy(() => import("./scenes/Minimes.tsx")),
  },
};
