// OBS sources of the matrix theme (ThemeModule.areas): the alert box with its rain curtain below it, centered on the
// stage; the logout lines of the stats on their panel; the music box as high as its art or its text. Chat and camera
// fill their source and keep the default size.
import { alertArea, musicArea } from "../../core/sceneArea.ts";
import { parseStatLines } from "../../core/stats/stats.ts";
import type { SceneArea, SceneName, SettingValues } from "../../core/theme.ts";
import type { MatrixValues } from "./settings.ts";

// fixed: box and rain curtain together at most this high before scaling (px), room for the glitch around it; the
// alerts lie on the stage without a side distance
const ALERT = { height: 630, room: 24, side: 0 };
// fixed: the stats panel: its width with padding, one line and the room above and below the lines (px)
const STATS = { width: 720, line: 32, room: 100 };
// fixed: the music box as measured in the browser with its padding (px): around the art, around the text beside the
// title; one line of the ASCII record
const MUSIC = { art: 58, text: 195, vinylLine: 8.4 };

// fixed: where the alert sits on the stage (px); the OBS source shows only its part, the streamer places it in OBS
// (same value as --alert-top in the CSS of the theme)
const ALERT_TOP = 64;

export function matrixAreas(values: SettingValues): Partial<Record<SceneName, SceneArea>> {
  const matrix = values as unknown as MatrixValues;
  const { alertWidth: width, alertScale: scale } = matrix;
  const lines = parseStatLines(matrix.logoutLines.join("\n")).length;
  return {
    alerts: alertArea({ top: ALERT_TOP, width, height: ALERT.height, scale, room: ALERT.room, side: ALERT.side }),
    stats: { width: STATS.width, height: STATS.room + lines * STATS.line },
    music: musicArea(musicArt(matrix) + MUSIC.art, matrix.musicTitleSize + MUSIC.text),
  };
}

// Height of the art beside the music text: the cover (without one the record stands in) or the ASCII record
function musicArt({ musicArt: art, coverSize, vinylSize }: MatrixValues) {
  const record = vinylSize * MUSIC.vinylLine;
  return art === "none" ? 0 : art === "cover" ? Math.max(coverSize, record) : record;
}
