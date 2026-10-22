// OBS sources of the chaos theme (ThemeModule.areas): the note that slaps onto the wall larger than it stays, with the
// spray mist around it, and the music card that hangs over the edge of its source. Chat and camera fill their source
// and keep the default size.
import { alertArea } from "../../core/sceneArea.ts";
import type { SceneArea, SceneName, SettingValues } from "../../core/theme.ts";
import type { ChaosValues } from "./settings.ts";

// fixed: the tallest note in px and how far the spray mist flies beyond the note
const NOTE = { height: 450, spray: 200 };
// fixed: the music card with its tape and tilt, measured on the stage (px)
const MUSIC = { width: 680, height: 340 };

export function chaosAreas(values: SettingValues): Partial<Record<SceneName, SceneArea>> {
  const chaos = values as unknown as ChaosValues;
  const { alertTop: top, alertWidth: width, alertSlapScale: slap } = chaos;
  // The slap grows from the middle of the note
  const grow = (size: number) => (size * (slap - 1)) / 2;
  const [side, above] = [grow(width) + NOTE.spray, grow(NOTE.height) + NOTE.spray];
  const room = { left: side, right: side, top: above, bottom: above };
  return { alerts: alertArea({ top, width, height: NOTE.height, room }), music: MUSIC };
}
