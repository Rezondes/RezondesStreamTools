// Szenen des Standard-Themes für die Theme-Liste (src/themes/scenes.tsx) samt seinem CSS. Das Theme bringt alle
// Szenen selbst mit und nutzt nichts vom Matrix-Theme. Jede Szene wird per React.lazy als eigener Chunk geladen.
import { lazy } from "react";
import { screenScenes } from "../../core/screens/screenScenes.tsx";
import type { ThemeView } from "../../core/theme.ts";
import { standardSettings } from "./settings.ts";
import "./theme.css";

const Screen = lazy(() => import("./scenes/Screen.tsx"));

export const standardView: ThemeView = {
  id: standardSettings.id,
  scenes: {
    ...screenScenes(Screen),
    alerts: lazy(() => import("./scenes/Alerts.tsx")),
    chat: lazy(() => import("./scenes/Chat.tsx")),
    cam: lazy(() => import("./scenes/Cam.tsx")),
    music: lazy(() => import("./scenes/Music.tsx")),
    fx: lazy(() => import("./scenes/Fx.tsx")),
    info: lazy(() => import("./scenes/Info.tsx")),
  },
};
