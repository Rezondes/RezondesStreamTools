// OBS sources of the standard theme (ThemeModule.areas): the alert card with the room its sparks fly in, or its glow
// and exit when the sparks are off; the stats cards side by side; the music card as high as its cover or its text.
// Chat and camera fill their source and keep the default size.
import { alertArea, musicArea } from "../../core/sceneArea.ts";
import { parseStatLines } from "../../core/stats/stats.ts";
import type { SceneArea, SceneName, SettingValues } from "../../core/theme.ts";
import { SPARK_ROOM } from "./edgeTrace.ts";
import type { StandardValues } from "./settings.ts";

// fixed: the tallest card at the default width in px (a name of 25 characters in two lines, three quote lines), and
// that width; a narrower card wraps more and grows
const CARD = { height: 380, width: 640 };
// fixed: how far the card glides up when it leaves (exit "Gleiten", px)
const EXIT_RISE = 80;
// fixed: one stats card with its gap, the room around the row and its height (px)
const STATS = { card: 205, room: 48, height: 200 };
// fixed: the music card as measured in the browser with its padding (px): around the cover, around the text per px of
// font size plus the rest
const MUSIC = { cover: 56, perFont: 4.95, text: 67 };

// fixed: where the alert sits on the stage (px); the OBS source shows only its part, the streamer places it in OBS
// (same value as --alert-top in the CSS of the theme)
const ALERT_TOP = 48;

export function standardAreas(values: SettingValues): Partial<Record<SceneName, SceneArea>> {
  const standard = values as unknown as StandardValues;
  const room = standard.alertSparksOn ? SPARK_ROOM : Math.max(EXIT_RISE, standard.alertGlow * 2);
  const height = CARD.height * Math.max(1, CARD.width / standard.alertWidth);
  const cards = parseStatLines(standard.endingStats.join("\n")).length;
  return {
    alerts: alertArea({ top: ALERT_TOP, width: standard.alertWidth, height, room }),
    stats: { width: Math.max(STATS.card, cards * STATS.card) + STATS.room, height: STATS.height },
    music: musicArea(standard.musicCover ? standard.coverSize + MUSIC.cover : 0, standard.fontSize * MUSIC.perFont + MUSIC.text),
  };
}
