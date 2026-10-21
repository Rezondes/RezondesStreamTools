// Scenes of the Dachdecker theme for the theme list (src/themes/scenes.tsx) with its CSS. Package 1 brings Starting;
// the other scenes follow in packages 2 to 5 (docs/PLAN-DACHDECKER.md). Every scene is loaded via React.lazy as its own
// chunk, so the 3D modules only load where a scene needs them.
import { lazy } from "react";
import type { ThemeView } from "../../core/theme.ts";
import { dachdeckerSettings } from "./settings.ts";
import "./theme.css";

export const dachdeckerView: ThemeView = {
  id: dachdeckerSettings.id,
  scenes: {
    starting: lazy(() => import("./scenes/Starting.tsx")),
  },
};
