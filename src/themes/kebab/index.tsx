// Scenes of the Kebab theme for the theme list (src/themes/scenes.tsx) with its CSS: a kebab shop as red line art on
// paper (DESIGN-KEBAB.md). Every scene is loaded via React.lazy as its own chunk, so Rough.js, GSAP and PixiJS only
// load where a scene needs them.
import { lazy } from "react";
import type { ThemeView } from "../../core/theme.ts";
import { kebabSettings } from "./settings.ts";
import "./theme.css";

export const kebabView: ThemeView = {
  id: kebabSettings.id,
  scenes: {
    starting: lazy(() => import("./scenes/Starting.tsx")),
    brb: lazy(() => import("./scenes/Brb.tsx")),
    ending: lazy(() => import("./scenes/Ending.tsx")),
    stats: lazy(() => import("./scenes/Stats.tsx")),
  },
};
