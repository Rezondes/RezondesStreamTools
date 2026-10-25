// The painted wall of the Chaos theme (PLAN-CHAOS.md packages 6 and 7): PixiJS (wall, strokes with glow, spray, dust)
// under the boiling scribbles, each with its own seed; the screens use it, and as a backdrop the commands page and the
// dashboard skin.
import { type Application, Container } from "pixi.js";
import { useCallback, useRef, useState } from "react";
import { seedOf } from "../../core/hash.ts";
import { seekFromQuery } from "../../core/motion/seek.ts";
import PixiStage from "../../core/pixi/PixiStage.tsx";
import BoilingScribbles from "./BoilingScribbles.tsx";
import Brushes from "./pixi/Brushes.tsx";
import Dust from "./pixi/Dust.tsx";
import Spray from "./pixi/Spray.tsx";
import Wall from "./pixi/Wall.tsx";
import type { GestureKind } from "./strokes.ts";
import { useChaos } from "./useChaos.ts";

const SECOND_MS = 1000; // fixed: seconds in ms
const SEEK = seekFromQuery(location.search);

type Painted = { app: Application; world: Container };

export default function PaintedWall({ seed, gesture, mainColor, boilFps }: { seed: string; gesture: GestureKind; mainColor: string; boilFps: number }) {
  const values = useChaos();
  const [painted, setPainted] = useState<Painted | null>(null);
  const startedAt = useRef(performance.now());
  const clock = useCallback(() => SEEK ?? (performance.now() - startedAt.current) / SECOND_MS, []);
  const onReady = useCallback((app: Application) => {
    const world = new Container();
    app.stage.addChild(world);
    setPainted({ app, world });
    return () => setPainted(null);
  }, []);
  const base = seedOf(seed);
  // The build of the prototype (refs/starting.html): when and at which height the title is sprayed, when the movement starts
  const idleFrom = values.paintIdleFrom;
  return (
    <div className="ch-backdrop" aria-hidden="true">
      <PixiStage background={values.ground} onReady={onReady} />
      {painted && (
        <>
          <Wall world={painted.world} values={values} seed={base} />
          <Brushes app={painted.app} world={painted.world} clock={clock} values={values} gesture={gesture} mainColor={mainColor} seed={base} idleFrom={idleFrom} />
          <Spray app={painted.app} world={painted.world} clock={clock} values={values} gesture={gesture} mainColor={mainColor} seed={base} titleAt={values.paintTitleAt} titleY={values.paintTitleY} />
          <Dust app={painted.app} world={painted.world} clock={clock} values={values} seed={base} idleFrom={idleFrom} />
        </>
      )}
      <BoilingScribbles seed={seed} clock={clock} idleFrom={idleFrom} fps={boilFps} />
      <div className="ch-world-haze" />
    </div>
  );
}

