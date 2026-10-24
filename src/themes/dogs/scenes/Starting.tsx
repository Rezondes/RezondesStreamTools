// Starting scene of the Dogs theme (DESIGN-DOGS.md "Starting", prototype refs/px-starting.html): the meadow with the
// row of six dogs on a PixiJS stage (StartingWorld), above it the sign layer (StartingSigns). ?t=<seconds> shows a
// still, ?sheet the overview of all breeds and coats (BreedSheet).
import type { Application } from "pixi.js";
import { useCallback, useEffect, useMemo, useState } from "react";
import { params } from "../../../core/params.ts";
import PixiStage from "../../../core/pixi/PixiStage.tsx";
import { STAGE } from "../../../core/screens/screens.ts";
import { BREED_IDS, isBreed } from "../breeds.ts";
import { coatsOf } from "../coats.ts";
import { dogCache } from "../dog.ts";
import { dogLookOf } from "../looks.ts";
import BreedSheet from "../pixi/BreedSheet.tsx";
import StartingWorld from "../pixi/StartingWorld.tsx";
import StartingSigns from "../screen/StartingSigns.tsx";
import { startingPlan } from "../starting.ts";
import { preloadDogSounds } from "../tones.ts";
import { useDogs } from "../useDogs.ts";
import { sceneClock } from "../useFrame.ts";

const SHEET = params.has("sheet");

export default function Starting() {
  return SHEET ? <BreedSheet /> : <StartingScene />;
}

function StartingScene() {
  const values = useDogs();
  const [clock] = useState(sceneClock);
  const [app, setApp] = useState<Application | null>(null);
  const scale = values.pixelScale;
  const breed = isBreed(values.dog) ? values.dog : BREED_IDS[0];
  const dogs = useMemo(() => BREED_IDS.map(id => dogCache(dogLookOf(values, id, id === breed ? values.coat : coatsOf(id)[0].id))), [values, breed]);
  const plan = useMemo(() => startingPlan(
    { chosen: BREED_IDS.indexOf(breed), dropEvery: values.dropEvery, markerStart: values.markerStart, markerHop: values.markerHop, walkSpeed: values.walkSpeed, barkEvery: values.barkEvery },
    { width: Math.ceil(STAGE.width / scale), height: Math.ceil(STAGE.height / scale), dogs },
  ), [values, breed, scale, dogs]);
  const onReady = useCallback((ready: Application) => {
    setApp(ready);
    return () => setApp(null);
  }, []);
  useEffect(() => preloadDogSounds(["startingLand", "startingHop", "startingChosen", "startingCard", "bark"]), []);
  return (
    <div className="dg-screen">
      <PixiStage background={null} onReady={onReady} className="dg-world" />
      {app && <StartingWorld app={app} clock={clock} values={values} plan={plan} dogs={dogs} />}
      <StartingSigns values={values} plan={plan} clock={clock} breed={breed} />
    </div>
  );
}
