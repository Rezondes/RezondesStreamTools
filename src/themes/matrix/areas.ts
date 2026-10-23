// OBS sources of the matrix theme (ThemeModule.areas): the alert box with its rain curtain below it, scaled from the
// corner of its alignment; the logout lines of the stats on their panel. Chat, camera and music fill their source and
// keep the default size.
import { alertArea } from "../../core/sceneArea.ts";
import { parseStatLines } from "../../core/stats/stats.ts";
import type { SceneArea, SceneName, SettingValues } from "../../core/theme.ts";
import type { MatrixValues } from "./settings.ts";

// fixed: box and rain curtain together at most this high before scaling (px), room for the glitch around it; the
// alerts lie on the stage without a side distance
const ALERT = { height: 630, room: 24, side: 0 };
// fixed: the stats panel: its width with padding, one line and the room above and below the lines (px)
const STATS = { width: 720, line: 32, room: 100 };

export function matrixAreas(values: SettingValues): Partial<Record<SceneName, SceneArea>> {
  const matrix = values as unknown as MatrixValues;
  const { alertAlign: align, alertTop: top, alertWidth: width, alertScale: scale } = matrix;
  const lines = parseStatLines(matrix.logoutLines.join("\n")).length;
  return {
    alerts: alertArea({ align, top, width, height: ALERT.height, scale, room: ALERT.room, side: ALERT.side }),
    stats: { width: STATS.width, height: STATS.room + lines * STATS.line },
  };
}
