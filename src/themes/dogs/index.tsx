// Scenes of the Dogs theme for the theme list (src/themes/scenes.tsx) with its CSS: pixel art dogs on a sunny meadow
// (DESIGN-DOGS.md). Every scene is loaded via React.lazy as its own chunk, so PixiJS and GSAP only load where a scene
// needs them. Packages 1 to 3 of PLAN-DOGS.md bring Starting, BRB, Ending and Alerts.
import { lazy } from "react";
import type { ThemeView } from "../../core/theme.ts";
import { dogsSettings } from "./settings.ts";
import "./theme.css";

export const dogsView: ThemeView = {
  id: dogsSettings.id,
  scenes: {
    starting: lazy(() => import("./scenes/Starting.tsx")),
    brb: lazy(() => import("./scenes/Brb.tsx")),
    ending: lazy(() => import("./scenes/Ending.tsx")),
    alerts: lazy(() => import("./scenes/Alerts.tsx")),
  },
};
