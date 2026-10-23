// OBS sources of the chaos theme (ThemeModule.areas): the note that slaps onto the wall larger than it stays, with the
// spray mist around it, and the music card that hangs over the edge of its source. Chat and camera fill their source
// and keep the default size.
import { alertArea } from "../../core/sceneArea.ts";
import type { SceneArea, SceneName, SettingValues } from "../../core/theme.ts";
import type { ChaosValues } from "./settings.ts";

// fixed: the tallest note in px and how far the spray mist flies beyond the note
const NOTE = { height: 450, spray: 200 };
// fixed: where the note sits on the stage (px); the OBS source shows only its part, the streamer places it in OBS (same
// value as --alert-top in theme.css)
export const ALERT_TOP = 120;
// fixed: the music card with its tape and tilt, measured on the stage (px)
const MUSIC = { width: 680, height: 340 };

export function chaosAreas(values: SettingValues): Partial<Record<SceneName, SceneArea>> {
  const chaos = values as unknown as ChaosValues;
  const { alertWidth: width, alertSlapScale: slap } = chaos;
  const top = ALERT_TOP;
  // The slap grows from the middle of the note
  const grow = (size: number) => (size * (slap - 1)) / 2;
  const [side, above] = [grow(width) + NOTE.spray, grow(NOTE.height) + NOTE.spray];
  const room = { left: side, right: side, top: above, bottom: above };
  return { alerts: alertArea({ top, width, height: NOTE.height, room }), music: MUSIC };
}
