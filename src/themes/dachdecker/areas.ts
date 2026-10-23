// OBS sources of the dachdecker theme (ThemeModule.areas): the alert sign, the chat as wide as its setting and the
// music plan with its dimension lines, the acceptance protocol of the stats with its stamp. Camera fills its source
// and keeps the default size.
import { alertArea } from "../../core/sceneArea.ts";
import { SCENE_SIZES, type SceneArea, type SceneName, type SettingValues } from "../../core/theme.ts";
import type { DachdeckerValues } from "./settings.ts";

// fixed: the tallest sign in px with room for its opening; the music plan with its dimension lines (px)
const ALERT = { height: 310, room: 16 };
const MUSIC = { width: 590, height: 410 };
// fixed: the stats: sheet with the room for its slide, the stamp below it at the end (px)
const STATS = { width: 640, height: 600 };

// fixed: where the alert sits on the stage (px); the OBS source shows only its part, the streamer places it in OBS
// (same value as --alert-top in the CSS of the theme)
const ALERT_TOP = 620;

export function dachdeckerAreas(values: SettingValues): Partial<Record<SceneName, SceneArea>> {
  const dachdecker = values as unknown as DachdeckerValues;
  return {
    alerts: alertArea({ top: ALERT_TOP, width: dachdecker.alertWidth, height: ALERT.height, room: ALERT.room }),
    chat: { width: dachdecker.chatWidth, height: SCENE_SIZES.chat.height },
    music: MUSIC,
    stats: STATS,
  };
}
