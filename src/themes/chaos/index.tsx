// Scenes of the Chaos theme for the theme list (src/themes/scenes.tsx) with its CSS. The theme has only the scenes it
// brings itself (nothing is inherited); every scene is loaded via React.lazy as its own chunk. So far the style sample:
// Starting (PLAN-CHAOS.md package 1).
import { lazy } from "react";
import type { ThemeView } from "../../core/theme.ts";
import { chaosSettings } from "./settings.ts";
import "./theme.css";

const Screen = lazy(() => import("./scenes/Screen.tsx"));

export const chaosView: ThemeView = {
  id: chaosSettings.id,
  scenes: {
    starting: () => <Screen kind="starting" />,
  },
};
