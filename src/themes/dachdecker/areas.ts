// OBS sources of the dachdecker theme (ThemeModule.areas): the alert sign, the chat as wide as its setting and the
// music plan with its dimension lines. Camera fills its source and keeps the default size.
import { alertArea } from "../../core/sceneArea.ts";
import { SCENE_SIZES, type SceneArea, type SceneName, type SettingValues } from "../../core/theme.ts";
import type { DachdeckerValues } from "./settings.ts";

// fixed: the tallest sign in px with room for its opening; the music plan with its dimension lines (px)
const ALERT = { height: 310, room: 16 };
const MUSIC = { width: 590, height: 410 };

export function dachdeckerAreas(values: SettingValues): Partial<Record<SceneName, SceneArea>> {
  const dachdecker = values as unknown as DachdeckerValues;
  return {
    alerts: alertArea({ top: dachdecker.alertTop, width: dachdecker.alertWidth, height: ALERT.height, room: ALERT.room }),
    chat: { width: dachdecker.chatWidth, height: SCENE_SIZES.chat.height },
    music: MUSIC,
  };
}
