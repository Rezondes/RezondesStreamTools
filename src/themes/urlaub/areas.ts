// OBS sources of the urlaub theme (ThemeModule.areas): the tallest alert card (postcard with address and stamp) and
// the wave that washes it in and out. Chat, camera and music fill their source and keep the default size.
import { alertArea } from "../../core/sceneArea.ts";
import type { SceneArea, SceneName, SettingValues } from "../../core/theme.ts";
import type { UrlaubValues } from "./settings.ts";

// fixed: the tallest card before scaling (px), room for its tilt at the sides and above it
const ALERT = { height: 500, side: 48, top: 40 };

export function urlaubAreas(values: SettingValues): Partial<Record<SceneName, SceneArea>> {
  const urlaub = values as unknown as UrlaubValues;
  const { alertAlign: align, alertTop: top, alertWidth: width, alertScale: scale } = urlaub;
  const room = { left: ALERT.side, right: ALERT.side, top: ALERT.top, bottom: urlaub.alertSwellHeight * scale };
  return { alerts: alertArea({ align, top, width, height: ALERT.height, scale, room, centerOrigin: true }) };
}
