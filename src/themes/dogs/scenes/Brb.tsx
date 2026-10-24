// BRB scene of the Dogs theme (DESIGN-DOGS.md "BRB", prototype refs/px-brb.html): the streamer's dog on the leash walks
// along a scrolling meadow and stops to sniff now and then (BrbWorld on a PixiJS stage), above it the card, the break
// time and the steps (BrbSigns). ?t=<seconds> shows a still.
import type { Application } from "pixi.js";
import { useCallback, useEffect, useMemo, useState } from "react";
import PixiStage from "../../../core/pixi/PixiStage.tsx";
import { STAGE } from "../../../core/screens/screens.ts";
import { BREED_IDS, isBreed } from "../breeds.ts";
import { dogCache } from "../dog.ts";
import { dogLookOf } from "../looks.ts";
import BrbWorld from "../pixi/BrbWorld.tsx";
import BrbSigns from "../screen/BrbSigns.tsx";
import { preloadDogSounds } from "../tones.ts";
import { useDogs } from "../useDogs.ts";
import { sceneClock } from "../useFrame.ts";

export default function Brb() {
  const values = useDogs();
  const [clock] = useState(sceneClock);
  const [app, setApp] = useState<Application | null>(null);
  const breed = isBreed(values.dog) ? values.dog : BREED_IDS[0];
  const dog = useMemo(() => dogCache(dogLookOf(values, breed, values.coat)), [values, breed]);
  const timing = useMemo(() => ({ period: values.walkPeriod, sniff: values.sniffSeconds, pxPerSecond: values.walkPxPerSecond }), [values.walkPeriod, values.sniffSeconds, values.walkPxPerSecond]);
  const size = useMemo(() => ({ width: Math.ceil(STAGE.width / values.pixelScale), height: Math.ceil(STAGE.height / values.pixelScale) }), [values.pixelScale]);
  const onReady = useCallback((ready: Application) => {
    setApp(ready);
    return () => setApp(null);
  }, []);
  useEffect(() => preloadDogSounds(["brbSniff", "brbSteps"]), []);
  return (
    <div className="dg-screen">
      <PixiStage background={null} onReady={onReady} className="dg-world" />
      {app && <BrbWorld app={app} clock={clock} values={values} dog={dog} breed={breed} timing={timing} size={size} />}
      <BrbSigns values={values} clock={clock} dog={dog} timing={timing} height={size.height} />
    </div>
  );
}
