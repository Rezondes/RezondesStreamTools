// OBS sources of the urlaub theme (ThemeModule.areas): the tallest alert card (postcard with address and stamp) and
// the wave that washes it in and out. Chat, camera and music fill their source and keep the default size.
import { alertArea } from "../../core/sceneArea.ts";
import type { SceneArea, SceneName, SettingValues } from "../../core/theme.ts";
import type { UrlaubValues } from "./settings.ts";

// fixed: the tallest card before scaling (px), room for its tilt at the sides and above it
const ALERT = { height: 500, side: 48, top: 40 };

// fixed: where the alert sits on the stage (px); the OBS source shows only its part, the streamer places it in OBS
// (same value as --alert-top in the CSS of the theme)
const ALERT_TOP = 80;
export function urlaubAreas(values: SettingValues): Partial<Record<SceneName, SceneArea>> {
  const urlaub = values as unknown as UrlaubValues;
  const { alertWidth: width, alertScale: scale } = urlaub;
  const room = { left: ALERT.side, right: ALERT.side, top: ALERT.top, bottom: urlaub.alertSwellHeight * scale };
  return { alerts: alertArea({ top: ALERT_TOP, width, height: ALERT.height, scale, room, centerOrigin: true }) };
}
