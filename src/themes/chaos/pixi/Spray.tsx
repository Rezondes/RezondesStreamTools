// Spray mist of a Chaos screen in PixiJS: a cloud of fine dots at the tip of every brush stroke while it is painted, and
// along the edge of the title while it is sprayed on (brush.ts); additive, every frame from the clock.
import { type Application, type Container, Graphics } from "pixi.js";
import { useEffect } from "react";
import { hash } from "../../../core/hash.ts";
import { brushPoint, brushSchedule, reachOf, sprayEdgeAt } from "../brush.ts";
import type { ChaosValues } from "../settings.ts";
import type { GestureKind } from "../strokes.ts";

type Props = { app: Application; world: Container; clock: () => number; values: ChaosValues; gesture: GestureKind; mainColor: string; seed: number; titleAt: number; titleY: number };

// fixed: dots of the mist, how long it lingers after the stroke, the size of the title cloud and its dots
const DOTS = 140;
const LINGER = 1.15;
const STROKE_DOT = { size: 1.6, alpha: 0.55, reach: 0.9 };
const TITLE_DOT = { size: 2.4, alpha: 0.6, reach: 120, flat: 0.8 };
export const SPRAY_Z = 30;

export default function Spray({ app, world, clock, values, gesture, mainColor, seed, titleAt, titleY }: Props) {
  useEffect(() => {
    const dots = Array.from({ length: DOTS }, (_, index) => ({ angle: hash(seed * 31 + index * 3) * Math.PI * 2, reach: hash(seed * 31 + index * 3 + 1) ** 0.6, spin: hash(seed * 31 + index * 3 + 2) }));
    const colorOf = (color: string) => (color === "cyan" || (color === "main" && mainColor === "cyan") ? values.accent2 : values.accent);
    const strokes = brushSchedule(gesture, seed).map(entry => ({ ...entry, color: colorOf(entry.color) }));
    const mist = new Graphics();
    mist.blendMode = "add";
    mist.zIndex = SPRAY_Z;
    world.addChild(mist);
    const strokeSeconds = values.strokeMs / 1000;
    const place = () => {
      const seconds = clock();
      mist.clear();
      for (const stroke of strokes) {
        const progress = (seconds - stroke.start) / strokeSeconds;
        if (progress <= 0 || progress >= LINGER) continue;
        const tip = brushPoint(stroke.brush, reachOf(progress), 0);
        for (const dot of dots) {
          const reach = dot.reach * stroke.brush.width * STROKE_DOT.reach * (1 + (progress - 0.5) * 0.4);
          mist.circle(tip.x + Math.cos(dot.angle + seconds * 9 * dot.spin) * reach, tip.y + Math.sin(dot.angle) * reach, STROKE_DOT.size).fill({ color: stroke.color, alpha: STROKE_DOT.alpha * (LINGER - progress) });
        }
      }
      const edge = sprayEdgeAt(seconds, titleAt, values.sprayTitleMs);
      if (edge !== null) for (const dot of dots) {
        const reach = dot.reach * TITLE_DOT.reach;
        mist.circle(edge + Math.cos(dot.angle + seconds * 12) * reach, titleY + Math.sin(dot.angle + seconds * 7) * reach * TITLE_DOT.flat, TITLE_DOT.size).fill({ color: values.accent, alpha: TITLE_DOT.alpha });
      }
    };
    place();
    app.ticker.add(place);
    return () => {
      app.ticker.remove(place);
      world.removeChild(mist);
      mist.destroy();
    };
  }, [app, world, clock, values, gesture, mainColor, seed, titleAt, titleY]);
  return null;
}
