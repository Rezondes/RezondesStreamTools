// Webcam frame of the Dogs theme (DESIGN-DOGS.md "Kamera"), transparent inside: a pixel box frame with a doghouse roof
// on top, at the lower corner the streamer's dog sits and wags, the name sign as a red pill. Create the source as large
// as the camera.
import { useMemo, useState } from "react";
import { fillTemplate } from "../../../core/template.ts";
import { BREED_IDS, isBreed } from "../breeds.ts";
import { dogCache } from "../dog.ts";
import { dogLookOf } from "../looks.ts";
import Pill from "../ui/Pill.tsx";
import Pixels from "../ui/Pixels.tsx";
import { dogsNames, useDogs } from "../useDogs.ts";
import { sceneClock } from "../useFrame.ts";
import { usePose } from "../usePose.ts";

export default function Cam() {
  const values = useDogs();
  const label = fillTemplate(values.camLabel, dogsNames(values));
  return (
    <div className="dg-cam">
      <i className="dg-cam-frame" />
      {values.camRoof && <i className="dg-cam-roof" />}
      {values.camDog && <CamDog />}
      {label && <Pill className="dg-cam-label" text={label} />}
    </div>
  );
}

function CamDog() {
  const values = useDogs();
  const [clock] = useState(sceneClock);
  const breed = isBreed(values.dog) ? values.dog : BREED_IDS[0];
  const cache = useMemo(() => dogCache(dogLookOf(values, breed, values.coat)), [values, breed]);
  const input = { mode: "stand", fps: values.walkFps, wagSpeed: values.wagSpeed, blinkEvery: values.blinkEvery, pant: values.pant } as const;
  const image = usePose(cache, input, clock, values.quality === "niedrig");
  return <Pixels image={image} className="dg-cam-dog" pixelScale={values.pixelScale} />;
}
