// Scenes of the Dogs theme for the theme list (src/themes/scenes.tsx) with its CSS: pixel art dogs on a sunny meadow
// (DESIGN-DOGS.md). Every scene is loaded via React.lazy as its own chunk, so PixiJS and GSAP only load where a scene
// needs them. Package 1 of PLAN-DOGS.md brings the Starting scene.
import { lazy } from "react";
import type { ThemeView } from "../../core/theme.ts";
import { dogsSettings } from "./settings.ts";
import "./theme.css";

export const dogsView: ThemeView = {
  id: dogsSettings.id,
  scenes: {
    starting: lazy(() => import("./scenes/Starting.tsx")),
  },
};
