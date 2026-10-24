// OBS sources of the Kebab theme (ThemeModule.areas): the alert (bon with its printer, or the bag with the steam above
// it) with room for the crumbs and the fall, the chat as wide as its setting, the music bon as high as its cover or its
// text, the closing bon of the stream numbers as high as its rows. The camera fills its source. Check: areas.check.ts.
import { alertArea, musicArea } from "../../core/sceneArea.ts";
import { parseStatLines } from "../../core/stats/stats.ts";
import { SCENE_SIZES, type SceneArea, type SceneName, type SettingValues } from "../../core/theme.ts";
import type { KebabValues } from "./settings.ts";

// fixed: the closing bon as measured in the browser (px): printer, head with title, one row, the stamp room and the
// zigzag below, and the width with room for the shadow
const CLOSING = { head: 240, row: 38, foot: 150, width: 460 };
// fixed: where the alert sits on the stage (same as --kb-alert-top), the bon with its printer and the bag with the steam
// above it at the default width (px), the room for crumbs at the sides and the fall below; alertWidth sets the width of
// the bon, the bag grows with it
const ALERT_TOP = 48;
export const ALERT_SIZES = { bon: { width: 460, height: 600 }, bag: { width: 440, height: 640 } };
const ROOM = { left: 160, right: 160, top: 0, bottom: 60 };
// fixed: the music bon: padding around the cover, text height per px of font size plus the label, progress and zigzag
const MUSIC = { cover: 70, perFont: 3.6, text: 80 };

export function kebabAreas(values: SettingValues): Partial<Record<SceneName, SceneArea>> {
  const kebab = values as unknown as KebabValues;
  const rows = parseStatLines(kebab.closingLines.join("\n")).length;
  // A narrower bon wraps its text and grows taller, the bag keeps its shape
  const share = kebab.alertWidth / ALERT_SIZES.bon.width;
  const alert = kebab.alertStyle === "tuete"
    ? { width: ALERT_SIZES.bag.width * share, height: ALERT_SIZES.bag.height * share }
    : { width: kebab.alertWidth, height: ALERT_SIZES.bon.height * Math.max(1, 1 / share) };
  return {
    alerts: alertArea({ top: ALERT_TOP, width: Math.round(alert.width), height: Math.round(alert.height), room: ROOM }),
    chat: { width: kebab.chatWidth, height: SCENE_SIZES.chat.height },
    music: musicArea(kebab.musicCover ? kebab.coverSize + MUSIC.cover : 0, kebab.fontSize * MUSIC.perFont + MUSIC.text),
    stats: { width: CLOSING.width, height: CLOSING.head + rows * CLOSING.row + CLOSING.foot },
  };
}
