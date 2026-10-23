// OBS sources of the bears theme (ThemeModule.areas): the alert card with the bear beside it, the chat phone with the
// bear at its side, the music player as high as its cover, its text or its bear. The camera fills its source and keeps
// the default size.
import { alertArea, musicArea } from "../../core/sceneArea.ts";
import { SCENE_SIZES, type SceneArea, type SceneName, type SettingValues } from "../../core/theme.ts";
import type { BearsValues } from "./settings.ts";

// fixed: the tallest card text before scaling (px), room for the bear peeking above it and the motions around it;
// room beside the chat phone for its padding and the bear
const ALERT = { height: 400, top: 60, side: 24 };
const CHAT_ROOM = 60;
// fixed: the music player as measured in the browser with its padding (px): around the cover, around the text beside
// the title, the line height of the title, the album line, around the bear (not in the style "schlicht")
const MUSIC = { cover: 92, text: 191, titleLine: 1.2, album: 31, bear: 28 };

// fixed: where the alert sits on the stage (px); the OBS source shows only its part, the streamer places it in OBS
// (same value as --alert-top in the CSS of the theme)
const ALERT_TOP = 80;

export function bearsAreas(values: SettingValues): Partial<Record<SceneName, SceneArea>> {
  const bears = values as unknown as BearsValues;
  const { alertWidth: width, alertScale: scale } = bears;
  const height = Math.max(ALERT.height, bears.alertBearSize);
  const room = { left: ALERT.side, right: ALERT.side, top: ALERT.top, bottom: ALERT.side };
  return {
    alerts: alertArea({ top: ALERT_TOP, width, height, scale, room, centerOrigin: true }),
    chat: { width: Math.max(SCENE_SIZES.chat.width, bears.chatPhoneWidth + CHAT_ROOM), height: SCENE_SIZES.chat.height },
    music: musicArea(
      bears.coverSize + MUSIC.cover,
      bears.musicTitleSize * MUSIC.titleLine + MUSIC.text + (bears.musicAlbum ? MUSIC.album : 0),
      bears.musicStyle === "schlicht" ? 0 : bears.musicBearSize + MUSIC.bear,
    ),
  };
}
