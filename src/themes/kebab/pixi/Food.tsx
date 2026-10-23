// Shavings and steam of the spit (food.ts) in a PixiJS stage: every frame the shavings that left the knife fall onto
// the plate and stay, the steam rises over the spit. Positions from the clock alone (?t= stills match), drawn into one
// Graphics in stage pixels (toStage). Colors from the settings, the number of shavings follows the performance level.
import { type Application, Graphics } from "pixi.js";
import { useEffect } from "react";
import { hexNumber } from "../../../core/color.ts";
import { particleCount } from "../../../core/three/quality.ts";
import { CUT, PLATE, SPIT_TOP, toStage } from "../chef.ts";
import { shavingsAt, steamAt } from "../food.ts";
import type { KebabValues } from "../settings.ts";

// fixed: line widths of steam and shavings in grid units, how far a shaving curls, like the prototype
const WIDTH = { steam: 2.4, shaving: 2.6 };
const CURL = 0.7;

type Props = { app: Application; clock: () => number; values: KebabValues; shavingsFrom: number; steamFrom: number };

function drawSteam(graphics: Graphics, time: number, values: KebabValues, color: number) {
  for (const wisp of steamAt(time, { from: SPIT_TOP, height: values.steamHeight })) {
    const [first, ...rest] = wisp.points.map(point => toStage(point));
    graphics.moveTo(first.x, first.y);
    for (const point of rest) graphics.lineTo(point.x, point.y);
    graphics.stroke({ width: WIDTH.steam * first.scale, color, alpha: wisp.alpha, cap: "round", join: "round" });
  }
}

function drawShavings(graphics: Graphics, time: number, start: number, values: KebabValues, color: number) {
  const options = { start, gapMs: values.shavingsEvery, fallMs: values.shavingsFall, max: values.shavingsMax > 0 ? particleCount(values.shavingsMax, values.quality) : 0, seed: values.inkSeed, from: CUT, plate: PLATE };
  for (const shaving of shavingsAt(time, options)) {
    const center = toStage(shaving);
    const reach = (shaving.size * center.scale) / 2;
    const cos = Math.cos(shaving.angle);
    const sin = Math.sin(shaving.angle);
    graphics.moveTo(center.x - cos * reach, center.y - sin * reach)
      .quadraticCurveTo(center.x - sin * reach * CURL, center.y + cos * reach * CURL, center.x + cos * reach, center.y + sin * reach)
      .stroke({ width: WIDTH.shaving * center.scale * values.inkWidth, color, cap: "round" });
  }
}

export default function Food({ app, clock, values, shavingsFrom, steamFrom }: Props) {
  useEffect(() => {
    const graphics = new Graphics();
    const color = hexNumber(values.red);
    app.stage.addChild(graphics);
    const draw = () => {
      const time = clock();
      graphics.clear();
      if (values.steamOn && time >= steamFrom) drawSteam(graphics, time - steamFrom, values, color);
      if (values.shavingsOn) drawShavings(graphics, time, shavingsFrom, values, color);
    };
    draw();
    app.ticker.add(draw);
    return () => {
      app.ticker.remove(draw);
      app.stage.removeChild(graphics);
      graphics.destroy();
    };
  }, [app, clock, values, shavingsFrom, steamFrom]);
  return null;
}
