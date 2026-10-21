// Scenes of the Dachdecker theme for the theme list (src/themes/scenes.tsx) with its CSS: Starting, BRB and Ending in
// 3D; the overlays and minimes follow in packages 3 and 5 (docs/PLAN-DACHDECKER.md). Every scene is loaded via React.lazy as its own
// chunk, so the 3D modules only load where a scene needs them.
import { lazy } from "react";
import type { ThemeView } from "../../core/theme.ts";
import { dachdeckerSettings } from "./settings.ts";
import "./theme.css";

export const dachdeckerView: ThemeView = {
  id: dachdeckerSettings.id,
  scenes: {
    starting: lazy(() => import("./scenes/Starting.tsx")),
    brb: lazy(() => import("./scenes/Brb.tsx")),
    ending: lazy(() => import("./scenes/Ending.tsx")),
  },
};
