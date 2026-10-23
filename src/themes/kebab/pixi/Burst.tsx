// A PixiJS stage of its own size around one point of an alert: onion rings and meat curls (crumbs.ts) fly off when the
// stamp hits or the bag lands, and steam may rise from another point (food.ts); positions from the clock of the alert
// alone. Colors from the settings.
import { type Application, Graphics } from "pixi.js";
import { useCallback, useEffect, useState } from "react";
import { hexNumber } from "../../../core/color.ts";
import PixiStage from "../../../core/pixi/PixiStage.tsx";
import { crumbsAt } from "../crumbs.ts";
import { type Point, steamAt } from "../food.ts";

// fixed: stroke widths in px and how far a curl bends, like the prototype
const WIDTH = { crumb: 3, steam: 3 };
const CURL = 0.7;

export type BurstProps = {
  clock: () => number; size: { width: number; height: number }; color: string; seed: number; count: number;
  hitAt: number | null; origin: Point; steam: { from: Point; height: number; color: string } | null;
};

function drawSteam(graphics: Graphics, time: number, steam: NonNullable<BurstProps["steam"]>) {
  for (const wisp of steamAt(time, { from: steam.from, height: steam.height })) {
    const [first, ...rest] = wisp.points;
    graphics.moveTo(first.x, first.y);
    for (const point of rest) graphics.lineTo(point.x, point.y);
    graphics.stroke({ width: WIDTH.steam, color: hexNumber(steam.color), alpha: wisp.alpha, cap: "round" });
  }
}

function drawCrumbs(graphics: Graphics, time: number, props: BurstProps) {
  if (props.hitAt === null) return;
  const color = hexNumber(props.color);
  for (const crumb of crumbsAt(props.seed, props.count, time - props.hitAt, props.origin)) {
    if (crumb.ring) {
      graphics.circle(crumb.x, crumb.y, crumb.size).stroke({ width: WIDTH.crumb, color, alpha: crumb.opacity });
      continue;
    }
    const cos = Math.cos(crumb.angle) * crumb.size;
    const sin = Math.sin(crumb.angle) * crumb.size;
    graphics.moveTo(crumb.x - cos, crumb.y - sin).quadraticCurveTo(crumb.x - sin * CURL, crumb.y + cos * CURL, crumb.x + cos, crumb.y + sin)
      .stroke({ width: WIDTH.crumb, color, alpha: crumb.opacity, cap: "round" });
  }
}

function Drawing({ app, props }: { app: Application; props: BurstProps }) {
  useEffect(() => {
    const graphics = new Graphics();
    app.stage.addChild(graphics);
    const tick = () => {
      const time = props.clock();
      graphics.clear();
      if (props.steam) drawSteam(graphics, time, props.steam);
      drawCrumbs(graphics, time, props);
    };
    tick();
    app.ticker.add(tick);
    return () => {
      app.ticker.remove(tick);
      app.stage.removeChild(graphics);
      graphics.destroy();
    };
  }, [app, props]);
  return null;
}

export default function Burst(props: BurstProps) {
  const [app, setApp] = useState<Application | null>(null);
  const onReady = useCallback((ready: Application) => {
    setApp(ready);
    return () => setApp(null);
  }, []);
  return (
    <>
      <PixiStage background={null} size={props.size} onReady={onReady} className="kb-burst" />
      {app && <Drawing app={app} props={props} />}
    </>
  );
}
