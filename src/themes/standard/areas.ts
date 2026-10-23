// OBS sources of the standard theme (ThemeModule.areas): the alert card with the room its sparks fly in, or its glow
// and exit when the sparks are off; the stats cards side by side. Chat, camera and music fill their source and keep the
// default size.
import { alertArea } from "../../core/sceneArea.ts";
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

export function standardAreas(values: SettingValues): Partial<Record<SceneName, SceneArea>> {
  const standard = values as unknown as StandardValues;
  const room = standard.alertSparksOn ? SPARK_ROOM : Math.max(EXIT_RISE, standard.alertGlow * 2);
  const height = CARD.height * Math.max(1, CARD.width / standard.alertWidth);
  const cards = parseStatLines(standard.endingStats.join("\n")).length;
  return {
    alerts: alertArea({ top: standard.alertTop, width: standard.alertWidth, height, room }),
    stats: { width: Math.max(STATS.card, cards * STATS.card) + STATS.room, height: STATS.height },
  };
}
