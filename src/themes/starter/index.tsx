// Szenen des Starter-Themes für die Theme-Liste (src/themes/scenes.tsx) samt seinem CSS. Bewusst nur Alerts und
// Chat: alle anderen Szenen kommen vom Standard-Theme "matrix" (mit dessen Einstellungen).
import { lazy, type ComponentType } from "react";
import type { SceneName } from "../../core/theme.ts";
import "./theme.css";

export const starterScenes: Partial<Record<SceneName, ComponentType>> = {
  alerts: lazy(() => import("./scenes/Alerts.tsx")),
  chat: lazy(() => import("./scenes/Chat.tsx")),
};
