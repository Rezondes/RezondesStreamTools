// OBS sources of the urlaub theme (ThemeModule.areas): the tallest alert card (postcard with address and stamp) and
// the wave that washes it in and out; the music player as high as its cover or its text. Chat and camera fill their
// source and keep the default size.
import { alertArea, musicArea } from "../../core/sceneArea.ts";
import type { SceneArea, SceneName, SettingValues } from "../../core/theme.ts";
import type { UrlaubValues } from "./settings.ts";

// fixed: the tallest card before scaling (px), room for its tilt at the sides and above it
const ALERT = { height: 500, side: 48, top: 40 };

// fixed: the music player as measured in the browser with its padding per style (px): around the cover, around the
// text beside the title, the line height of the title, the album line
const MUSIC = { cover: { radio: 90, muschel: 80, schlicht: 80 }, text: { radio: 159, muschel: 149, schlicht: 149 }, titleLine: 1.3, album: 33 } as const;

// fixed: where the alert sits on the stage (px); the OBS source shows only its part, the streamer places it in OBS
// (same value as --alert-top in the CSS of the theme)
const ALERT_TOP = 80;

export function urlaubAreas(values: SettingValues): Partial<Record<SceneName, SceneArea>> {
  const urlaub = values as unknown as UrlaubValues;
  const { alertWidth: width, alertScale: scale } = urlaub;
  const room = { left: ALERT.side, right: ALERT.side, top: ALERT.top, bottom: urlaub.alertSwellHeight * scale };
  return { alerts: alertArea({ top: ALERT_TOP, width, height: ALERT.height, scale, room, centerOrigin: true }), music: musicOf(urlaub) };
}

// The music player: as high as its cover or its text, whichever is taller
function musicOf({ musicStyle, coverSize, musicTitleSize, musicAlbum }: UrlaubValues) {
  const style = musicStyle as keyof typeof MUSIC.cover;
  return musicArea(coverSize + MUSIC.cover[style], musicTitleSize * MUSIC.titleLine + MUSIC.text[style] + (musicAlbum ? MUSIC.album : 0));
}
