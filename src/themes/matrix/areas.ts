// OBS sources of the matrix theme (ThemeModule.areas): the alert box with its rain curtain below it, scaled from the
// corner of its alignment. Chat, camera and music fill their source and keep the default size.
import { alertArea } from "../../core/sceneArea.ts";
import type { SceneArea, SceneName, SettingValues } from "../../core/theme.ts";
import type { MatrixValues } from "./settings.ts";

// fixed: box and rain curtain together at most this high before scaling (px), room for the glitch around it; the
// alerts lie on the stage without a side distance
const ALERT = { height: 630, room: 24, side: 0 };

export function matrixAreas(values: SettingValues): Partial<Record<SceneName, SceneArea>> {
  const matrix = values as unknown as MatrixValues;
  const { alertAlign: align, alertTop: top, alertWidth: width, alertScale: scale } = matrix;
  return { alerts: alertArea({ align, top, width, height: ALERT.height, scale, room: ALERT.room, side: ALERT.side }) };
}
