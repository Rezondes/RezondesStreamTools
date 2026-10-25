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

// fixed: the dots fly all around from each of the four edges; when the note hits, their speed, drag, sink, life and
// size are settings
const SPREAD = { direction: 0, spread: Math.PI * 2 };
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
    const burst = { ...SPREAD, speed: [values.burstSpeedMin, values.burstSpeedMax] as const, gravity: values.burstGravity, drag: values.burstDrag, life: values.burstLife };
    const place = () => {
      const since = (SEEK ?? (performance.now() - start) / 1000) - values.burstHit;
      mist.clear();
      if (since <= 0 || since > burst.life) return;
      for (let edge = 0; edge < EDGES; edge++) {
        const count = Math.ceil(total / EDGES);
        burstAt(seed + edge, count, since, { ...burst, origin: { x: 0, y: 0 } }).forEach((dot, index) => {
          const along = ((index * 37) % count) / count;
          const [x, y] = edge < 2 ? [left + along * note.width, note.top + (edge === 0 ? 0 : note.height)] : [edge === 2 ? left : left + note.width, note.top + along * note.height];
          mist.circle(x + dot.x, y + dot.y, values.burstDot + ((index * 13) % 10) / 10 * values.burstDotRange).fill({ color: colors[index % colors.length], alpha: values.burstDotAlpha * dot.opacity });
        });
      }
    };
    place();
    app.ticker.add(place);
    return () => app.ticker.remove(place);
  }, [values, start, seed, note]);
  return <PixiStage background={null} onReady={onReady} className="ch-spray-burst" />;
}
