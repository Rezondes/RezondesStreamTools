// OBS sources of the Kebab theme (ThemeModule.areas): the closing bon of the stream numbers as high as its rows. The
// other scenes keep the default sizes for now (alerts follow with package 4 of PLAN-KEBAB.md). Check: areas.check.ts.
import { parseStatLines } from "../../core/stats/stats.ts";
import type { SceneArea, SceneName, SettingValues } from "../../core/theme.ts";
import type { KebabValues } from "./settings.ts";

// fixed: the closing bon as measured in the browser (px): printer, head with title, one row, the stamp room and the
// zigzag below, and the width with room for the shadow
const CLOSING = { head: 240, row: 38, foot: 150, width: 460 };

export function kebabAreas(values: SettingValues): Partial<Record<SceneName, SceneArea>> {
  const kebab = values as unknown as KebabValues;
  const rows = parseStatLines(kebab.closingLines.join("\n")).length;
  return { stats: { width: CLOSING.width, height: CLOSING.head + rows * CLOSING.row + CLOSING.foot } };
}
