// The three full-screen scenes of a theme (Starting, BRB, Ending) from its one screen component, for the
// scenes part of its ThemeView (src/core/theme.ts). The same for every theme.
import type { ComponentType } from "react";
import type { ScreenKind } from "./screens.ts";

export const screenScenes = (Screen: ComponentType<{ kind: ScreenKind }>) => ({
  starting: () => <Screen kind="starting" />,
  brb: () => <Screen kind="brb" />,
  ending: () => <Screen kind="ending" />,
});
