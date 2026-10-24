// Spray dust that floats up over a Chaos screen after the build (idle.ts), additive, in the two accent colors; its number
// follows the performance level. Every frame from the clock.
import { type Application, type Container, Graphics } from "pixi.js";
import { useEffect } from "react";
import { particleCount } from "../../../core/three/quality.ts";
import { dustAt, idleShare } from "../idle.ts";
import type { ChaosValues } from "../settings.ts";

type Props = { app: Application; world: Container; clock: () => number; values: ChaosValues; seed: number; idleFrom: number };

const DUST_Z = 40;

export default function Dust({ app, world, clock, values, seed, idleFrom }: Props) {
  useEffect(() => {
    const total = values.dustOn && values.dustCount > 0 ? particleCount(values.dustCount, values.quality) : 0;
    const dust = new Graphics();
    dust.blendMode = "add";
    dust.zIndex = DUST_Z;
    world.addChild(dust);
    const place = () => {
      const seconds = clock();
      dust.clear();
      // The dust fades in with the start of the movement
      const share = values.idleOn ? idleShare(seconds - idleFrom, values.idleEaseMs / 1000) : 0;
      if (share === 0) return;
      for (let index = 0; index < total; index++) {
        const grain = dustAt(seed, index, seconds);
        dust.circle(grain.x, grain.y, grain.size).fill({ color: grain.hot ? values.accent : values.accent2, alpha: grain.alpha * share });
      }
    };
    place();
    app.ticker.add(place);
    return () => {
      app.ticker.remove(place);
      world.removeChild(dust);
      dust.destroy();
    };
  }, [app, world, clock, values, seed, idleFrom]);
  return null;
}
