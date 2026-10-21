// The spray burst of the Chaos alert in PixiJS (refs/alert.html): when the note slaps onto the wall, fine paint dots in
// the scribble colors burst away from its edges (burstAt of the core per edge), slow down and fade; additive, on a
// transparent stage, every frame from the time since the alert came.
import { type Application, Graphics } from "pixi.js";
import { useCallback } from "react";
import { burstAt } from "../../../core/motion/burst.ts";
import { seekFromQuery } from "../../../core/motion/seek.ts";
import PixiStage from "../../../core/pixi/PixiStage.tsx";
import { STAGE } from "../../../core/screens/screens.ts";
import { particleCount } from "../../../core/three/quality.ts";
import type { ChaosValues } from "../settings.ts";

type Props = { values: ChaosValues; start: number; seed: number; note: { top: number; width: number; height: number } };

// fixed: the burst of the prototype: when the note hits, dot speed, drag, sink and life, dot sizes
const HIT = 0.2;
const BURST = { direction: 0, spread: Math.PI * 2, speed: [60, 260] as const, gravity: 80, drag: 1, life: 1.2 };
const DOT = { min: 1, by: 2.2, alpha: 0.8 };
const EDGES = 4;
const SEEK = seekFromQuery(location.search);

export default function SprayBurst({ values, start, seed, note }: Props) {
  const onReady = useCallback((app: Application) => {
    const mist = new Graphics();
    mist.blendMode = "add";
    app.stage.addChild(mist);
    const colors = [values.accent, values.accent2, values.lilac];
    const total = particleCount(values.alertSprayDots, values.quality);
    const left = (STAGE.width - note.width) / 2;
    const place = () => {
      const since = (SEEK ?? (performance.now() - start) / 1000) - HIT;
      mist.clear();
      if (since <= 0 || since > BURST.life) return;
      for (let edge = 0; edge < EDGES; edge++) {
        const count = Math.ceil(total / EDGES);
        burstAt(seed + edge, count, since, { ...BURST, origin: { x: 0, y: 0 } }).forEach((dot, index) => {
          const along = ((index * 37) % count) / count;
          const [x, y] = edge < 2 ? [left + along * note.width, note.top + (edge === 0 ? 0 : note.height)] : [edge === 2 ? left : left + note.width, note.top + along * note.height];
          mist.circle(x + dot.x, y + dot.y, DOT.min + ((index * 13) % 10) / 10 * DOT.by).fill({ color: colors[index % colors.length], alpha: DOT.alpha * dot.opacity });
        });
      }
    };
    place();
    app.ticker.add(place);
    return () => app.ticker.remove(place);
  }, [values, start, seed, note]);
  return <PixiStage background={null} onReady={onReady} className="ch-spray-burst" />;
}
