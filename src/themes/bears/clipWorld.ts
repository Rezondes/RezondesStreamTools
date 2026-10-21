// The watercolor world for the clips of the Bärenbande theme (PLAN-BEARS.md package 14): the same sky, clouds and land
// as the scenes (watercolor.ts), the clouds at their drift; loaded lazily by render.ts (prepare), so Rough.js stays out
// of the entry chunk. Check: banners.check.ts.
import type { WorldPainter } from "./banners.ts";
import { cloudSpot, CLOUDS } from "./paint.ts";
import { browserPath, type MakePath, paintCloud, paintLand, paintSky, type WashLook, type WorldShow } from "./watercolor.ts";

export function watercolorWorld(look: WashLook, show: WorldShow, makePath: MakePath = browserPath): WorldPainter {
  return (context, colors, drift, time) => {
    paintSky(context, colors, time, makePath);
    for (let index = 0; index < CLOUDS; index++) {
      const spot = cloudSpot(index, drift);
      context.save();
      context.translate(spot.x, spot.y);
      context.scale(spot.size, spot.size);
      paintCloud(context, colors, look, index, makePath);
      context.restore();
    }
    paintLand(context, colors, look, show, makePath);
  };
}
