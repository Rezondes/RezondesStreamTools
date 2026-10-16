// Szenen des Standard-Themes für die Theme-Liste (src/themes/scenes.tsx) samt seinem CSS. Das Theme bringt alle
// Szenen selbst mit und nutzt nichts vom Matrix-Theme. Jede Szene wird per React.lazy als eigener Chunk geladen.
import { lazy, type ComponentType } from "react";
import type { SceneName } from "../../core/theme.ts";
import "./theme.css";

const Screen = lazy(() => import("./scenes/Screen.tsx"));

export const standardScenes: Partial<Record<SceneName, ComponentType>> = {
  starting: () => <Screen kind="starting" />,
  brb: () => <Screen kind="brb" />,
  ending: () => <Screen kind="ending" />,
  alerts: lazy(() => import("./scenes/Alerts.tsx")),
  chat: lazy(() => import("./scenes/Chat.tsx")),
  cam: lazy(() => import("./scenes/Cam.tsx")),
  music: lazy(() => import("./scenes/Music.tsx")),
  fx: lazy(() => import("./scenes/Fx.tsx")),
  info: lazy(() => import("./scenes/Info.tsx")),
};
