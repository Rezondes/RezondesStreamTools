// OBS sources of the bears theme (ThemeModule.areas): the alert card with the bear beside it, and the chat phone with
// the bear at its side. Camera and music fill their source and keep the default size.
import { alertArea } from "../../core/sceneArea.ts";
import { SCENE_SIZES, type SceneArea, type SceneName, type SettingValues } from "../../core/theme.ts";
import type { BearsValues } from "./settings.ts";

// fixed: the tallest card text before scaling (px), room for the bear peeking above it and the motions around it;
// room beside the chat phone for its padding and the bear
const ALERT = { height: 400, top: 60, side: 24 };
const CHAT_ROOM = 60;

export function bearsAreas(values: SettingValues): Partial<Record<SceneName, SceneArea>> {
  const bears = values as unknown as BearsValues;
  const { alertAlign: align, alertTop: top, alertWidth: width, alertScale: scale } = bears;
  const height = Math.max(ALERT.height, bears.alertBearSize);
  const room = { left: ALERT.side, right: ALERT.side, top: ALERT.top, bottom: ALERT.side };
  return {
    alerts: alertArea({ align, top, width, height, scale, room, centerOrigin: true }),
    chat: { width: Math.max(SCENE_SIZES.chat.width, bears.chatPhoneWidth + CHAT_ROOM), height: SCENE_SIZES.chat.height },
  };
}
