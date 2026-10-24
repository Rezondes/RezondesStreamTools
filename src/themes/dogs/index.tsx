// Scenes of the Dogs theme for the theme list (src/themes/scenes.tsx) with its CSS: pixel art dogs on a sunny meadow
// (DESIGN-DOGS.md). Every scene is loaded via React.lazy as its own chunk, so PixiJS and GSAP only load where a scene
// needs them. Packages 1 to 6 of PLAN-DOGS.md bring every scene.
import { lazy } from "react";
import type { ThemeView } from "../../core/theme.ts";
import { dogsSettings } from "./settings.ts";
import "./theme.css";
import "./overlays.css";

export const dogsView: ThemeView = {
  id: dogsSettings.id,
  scenes: {
    starting: lazy(() => import("./scenes/Starting.tsx")),
    brb: lazy(() => import("./scenes/Brb.tsx")),
    ending: lazy(() => import("./scenes/Ending.tsx")),
    alerts: lazy(() => import("./scenes/Alerts.tsx")),
    stats: lazy(() => import("./scenes/Stats.tsx")),
    chat: lazy(() => import("./scenes/Chat.tsx")),
    cam: lazy(() => import("./scenes/Cam.tsx")),
    music: lazy(() => import("./scenes/Music.tsx")),
    fx: lazy(() => import("./scenes/Fx.tsx")),
    info: lazy(() => import("./scenes/Info.tsx")),
    minimes: lazy(() => import("./scenes/Minimes.tsx")),
  },
};
