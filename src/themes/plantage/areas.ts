// OBS sources of the plantage theme (ThemeModule.areas): the alert card behind the medallion and the canvas the mango
// falls and splashes on (BURST_CANVAS around the middle of the medallion). Chat, camera and music fill their source
// and keep the default size.
import { alertArea } from "../../core/sceneArea.ts";
import type { SceneArea, SceneName, SettingValues } from "../../core/theme.ts";
import { alertLayout, BURST_CANVAS, MEDAL } from "./mangoDrop.ts";
import type { PlantageValues } from "./settings.ts";

// fixed: the tallest card before scaling (px), room for its shadow on the right
const ALERT = { height: 480, right: 24 };

// fixed: where the alert sits on the stage (px); the OBS source shows only its part, the streamer places it in OBS
// (same value as --alert-top in the CSS of the theme)
const ALERT_TOP = 80;
export function plantageAreas(values: SettingValues): Partial<Record<SceneName, SceneArea>> {
  const plantage = values as unknown as PlantageValues;
  const { alertScale: scale } = plantage;
  const { cardLeft } = alertLayout({ medal: MEDAL.size, ring: MEDAL.ring, overlap: MEDAL.overlap, gap: plantage.alertGap });
  const middle = MEDAL.size / 2;
  // The burst canvas reaches beyond the card on the left, above and below it
  const room = {
    left: (BURST_CANVAS.x - middle) * scale,
    right: ALERT.right * scale,
    top: (BURST_CANVAS.y - middle) * scale,
    bottom: Math.max(0, middle + BURST_CANVAS.height - BURST_CANVAS.y - ALERT.height) * scale,
  };
  return { alerts: alertArea({ top: ALERT_TOP, width: cardLeft + plantage.alertWidth, height: ALERT.height, scale, room, centerOrigin: true }) };
}
