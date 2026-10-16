// Die drei Vollbild-Szenen eines Themes (Starting, BRB, Ending) aus seiner einen Screen-Komponente, für den
// scenes-Teil seiner ThemeView (src/core/theme.ts). Gleich für jedes Theme.
import type { ComponentType } from "react";
import type { ScreenKind } from "./screens.ts";

export const screenScenes = (Screen: ComponentType<{ kind: ScreenKind }>) => ({
  starting: () => <Screen kind="starting" />,
  brb: () => <Screen kind="brb" />,
  ending: () => <Screen kind="ending" />,
});
