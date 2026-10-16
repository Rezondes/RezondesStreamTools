// Szenen des Südfrucht-Themes für die Theme-Liste (src/themes/scenes.tsx) samt seinem CSS. Das Theme bringt alle
// Szenen selbst mit, auch die Minimes (Früchte). Jede Szene wird per React.lazy als eigener Chunk geladen.
import { lazy } from "react";
import type { ThemeView } from "../../core/theme.ts";
import { suedfruchtSettings } from "./settings.ts";
import "./theme.css";

const Screen = lazy(() => import("./scenes/Screen.tsx"));

export const suedfruchtView: ThemeView = {
  id: suedfruchtSettings.id,
  scenes: {
    starting: () => <Screen kind="starting" />,
    brb: () => <Screen kind="brb" />,
    ending: () => <Screen kind="ending" />,
    alerts: lazy(() => import("./scenes/Alerts.tsx")),
    chat: lazy(() => import("./scenes/Chat.tsx")),
    cam: lazy(() => import("./scenes/Cam.tsx")),
    music: lazy(() => import("./scenes/Music.tsx")),
    fx: lazy(() => import("./scenes/Fx.tsx")),
    minimes: lazy(() => import("./scenes/Minimes.tsx")),
    info: lazy(() => import("./scenes/Info.tsx")),
  },
};
