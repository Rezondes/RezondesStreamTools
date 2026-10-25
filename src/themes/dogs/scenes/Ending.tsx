// Ending of the Dogs theme (DESIGN-DOGS.md "Ending", prototype refs/px-ending.html): the room at night, the streamer's
// dog walks in, lies down in its basket and sleeps while the lamp dims (EndingWorld on a PixiJS stage), above it the
// title, the subtitle and the pill (EndingSigns); the stream numbers are the scene stats. ?t=<seconds> shows a still.
import type { Application } from "pixi.js";
import { useCallback, useEffect, useMemo, useState } from "react";
import PixiStage from "../../../core/pixi/PixiStage.tsx";
import { STAGE } from "../../../core/screens/screens.ts";
import { BREED_IDS, isBreed } from "../breeds.ts";
import { dogCache } from "../dog.ts";
import { dogLookOf, roomColorsOf } from "../looks.ts";
import EndingWorld from "../pixi/EndingWorld.tsx";
import { ROOM } from "../room.ts";
import EndingSigns from "../screen/EndingSigns.tsx";
import { preloadDogSounds } from "../tones.ts";
import { useDogs } from "../useDogs.ts";
import { sceneClock } from "../useFrame.ts";

// fixed: the lamp setting is in percent
const PERCENT = 100;

export default function Ending() {
  const values = useDogs();
  const [clock] = useState(sceneClock);
  const [app, setApp] = useState<Application | null>(null);
  const breed = isBreed(values.dog) ? values.dog : BREED_IDS[0];
  const dog = useMemo(() => dogCache(dogLookOf(values, breed, values.coat)), [values, breed]);
  const colors = useMemo(() => roomColorsOf(values), [values]);
  const size = useMemo(() => ({ width: Math.ceil(STAGE.width / values.pixelScale), height: Math.ceil(STAGE.height / values.pixelScale) }), [values.pixelScale]);
  const timing = useMemo(() => ({
    width: size.width, dogWidth: dog.width, basketX: ROOM.basketX, lampDim: values.lampDim / PERCENT, lampDimFrom: values.lampDimFrom,
    lampDimTo: values.lampDimTo, zzzEvery: values.zzzEvery, snoreEvery: values.snoreEvery,
  }), [size.width, dog.width, values.lampDim, values.lampDimFrom, values.lampDimTo, values.zzzEvery, values.snoreEvery]);
  const onReady = useCallback((ready: Application) => {
    setApp(ready);
    return () => setApp(null);
  }, []);
  useEffect(() => preloadDogSounds(["endingLie", "endingLamp", "endingSnore"]), []);
  return (
    <div className="dg-screen">
      <PixiStage background={null} onReady={onReady} className="dg-world" />
      {app && <EndingWorld app={app} clock={clock} values={values} colors={colors} dog={dog} timing={timing} size={size} />}
      <EndingSigns values={values} />
    </div>
  );
}
