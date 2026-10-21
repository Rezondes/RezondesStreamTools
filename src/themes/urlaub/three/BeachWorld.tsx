// The realistic Urlaub beach in 3D (PLAN-URLAUB.md package 5): the physical sky with the rising sun, the sea mirroring
// it, the sand with its wet edge, the surf running up, palms, rocks, a sailboat and gulls, seen from low on the beach.
// One clock drives everything (the scene's GSAP timeline, a still with ?t= included). Filmic exposure from the settings.
import { memo, useMemo } from "react";
import { Vector3 } from "three";
import Stage3D from "../../../core/three/Stage3D.tsx";
import { particleCount } from "../../../core/three/quality.ts";
import type { UrlaubValues } from "../settings.ts";
import Beach from "./Beach.tsx";
import BeachCamera from "./BeachCamera.tsx";
import Boat from "./Boat.tsx";
import Gulls from "./Gulls.tsx";
import Ocean from "./Ocean.tsx";
import Palms from "./Palms.tsx";
import Sky, { type BeachClock } from "./Sky.tsx";
import Surf from "./Surf.tsx";

// fixed: the field of view and how far the camera sees (the sky dome is huge)
const FOV = 42;
const FAR = 20000;
const SECOND_MS = 1000; // fixed: seconds in ms
const LOW = "niedrig"; // fixed: the low performance level of quality.ts

export default memo(function BeachWorld({ values, clock }: { values: UrlaubValues; clock: BeachClock }) {
  const direction = useMemo(() => new Vector3(), []);
  const sun = useMemo(() => ({ sunriseOn: values.sunriseOn, sunriseSeconds: values.sunriseMs / SECOND_MS, height: values.sunHeight }), [values.sunriseOn, values.sunriseMs, values.sunHeight]);
  return (
    <Stage3D background={values.skyMorningBottom} level={values.quality} fov={FOV} far={FAR} shadows exposure={values.exposure} className="ul-world">
      <Sky clock={clock} sun={sun} azimuth={values.sunAzimuth} turbidity={values.turbidity} shadows direction={direction} />
      <Ocean clock={clock} color={values.waterColor} distortion={values.waveDistortion} seed={values.worldSeed} low={values.quality === LOW} direction={direction} />
      <Beach sand={values.sand} rocks={values.rocks} seed={values.worldSeed} />
      {values.surfOn && <Surf clock={clock} bands={values.surfBands} seconds={values.surfSeconds} foam={values.foam} seed={values.worldSeed} />}
      <Palms clock={clock} left={values.palmsLeft} right={values.palmsRight} sway={values.palmSway} leaf={values.palmLeaf} trunk={values.palmTrunk} seed={values.worldSeed} />
      {values.boat && <Boat clock={clock} />}
      {values.gulls && <Gulls clock={clock} count={particleCount(values.gullCount, values.quality)} color={values.textOnWood} />}
      <BeachCamera clock={clock} height={values.cameraHeight} drift={values.cameraDrift} />
    </Stage3D>
  );
});
