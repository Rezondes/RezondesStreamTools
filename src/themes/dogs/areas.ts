// OBS sources of the Dogs theme (ThemeModule.areas): the alert spans the whole width (the dog and the raid pack run
// through the picture) from above the card down to the bottom; music and stats follow in PLAN-DOGS.md package 4.
// Check: areas.check.ts.
import { alertArea } from "../../core/sceneArea.ts";
import { STAGE } from "../../core/screens/screens.ts";
import type { SceneArea, SceneName, SettingValues } from "../../core/theme.ts";
import type { DogsValues } from "./settings.ts";

// fixed: room above the card for its pixel edge and the bubble of the dog
const ABOVE_CARD = 40;

export function dogsAreas(values: SettingValues): Partial<Record<SceneName, SceneArea>> {
  const { cardTop } = values as unknown as DogsValues;
  const top = Math.max(0, cardTop - ABOVE_CARD);
  return { alerts: alertArea({ top, width: STAGE.width, height: STAGE.height - top, room: 0 }) };
}
