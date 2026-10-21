// The plantage of the screens as a backdrop (commands page, dashboard skin): the PixiJS sky, hills and trees of a scene
// with their sway and the drifting leaves, without the picker and the cards; the sunrise and sunset are over.
import { type Application, Container } from "pixi.js";
import { useCallback, useRef, useState } from "react";
import PixiStage from "../../../core/pixi/PixiStage.tsx";
import type { PlantageValues } from "../settings.ts";
import { type LightKind, skyOf } from "../world.ts";
import Drift from "./Drift.tsx";
import WorldLayer from "./WorldLayer.tsx";

const SECOND_MS = 1000; // fixed: seconds in ms
const LATE = 60; // fixed: the backdrop starts this late in the scene (s), after sunrise and sunset

type Scene = { app: Application; world: Container };

export default function WorldBackdrop({ values, kind }: { values: PlantageValues; kind: LightKind }) {
  const [scene, setScene] = useState<Scene | null>(null);
  const startedAt = useRef(performance.now());
  const clock = useCallback(() => LATE + (performance.now() - startedAt.current) / SECOND_MS, []);
  const onReady = useCallback((app: Application) => {
    const world = new Container();
    app.stage.addChild(world);
    setScene({ app, world });
    return () => setScene(null);
  }, []);
  return (
    <>
      <PixiStage background={skyOf(values, kind)} onReady={onReady} />
      {scene && (
        <>
          <WorldLayer app={scene.app} world={scene.world} clock={clock} values={values} kind={kind} />
          <Drift app={scene.app} clock={clock} values={values} kind={kind} />
        </>
      )}
    </>
  );
}
