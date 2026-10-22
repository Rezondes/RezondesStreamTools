// The realistic Urlaub beach in 3D (PLAN-URLAUB.md packages 5 and 6): the physical sky with the sun of the scene (rising
// in the Starting, at noon in the BRB and on the commands page, setting in the Ending), the sea mirroring it, the sand
// with its wet edge, the surf running up, palms, rocks, a sailboat and gulls, seen from low on the beach; in the BRB an
// umbrella and a deck chair, in the Ending torches. One clock drives everything (the GSAP timeline of the scene, a still
// with ?t= included). Filmic exposure from the settings.
import { memo, useMemo } from "react";
import { Vector3 } from "three";
import Stage3D from "../../../core/three/Stage3D.tsx";
import { particleCount } from "../../../core/three/quality.ts";
import type { UrlaubValues } from "../settings.ts";
import { sceneSunHeight, type SunScene } from "../sun.ts";
import Beach from "./Beach.tsx";
import BeachCamera from "./BeachCamera.tsx";
import Boat from "./Boat.tsx";
import Gulls from "./Gulls.tsx";
import Ocean from "./Ocean.tsx";
import Palms from "./Palms.tsx";
import Sky, { type BeachClock } from "./Sky.tsx";
import Surf from "./Surf.tsx";
import Torches from "./Torches.tsx";
import Umbrella from "./Umbrella.tsx";

// fixed: the field of view and how far the camera sees (the sky dome is huge)
export const FOV = 42;
export const FAR = 20000;
const SECOND_MS = 1000; // fixed: seconds in ms
const LOW = "niedrig"; // fixed: the low performance level of quality.ts

export default memo(function BeachWorld({ values, clock, scene }: { values: UrlaubValues; clock: BeachClock; scene: SunScene }) {
  const direction = useMemo(() => new Vector3(), []);
  const heightAt = useMemo(() => {
    const sun = {
      sunriseOn: values.sunriseOn, sunriseSeconds: values.sunriseMs / SECOND_MS, height: values.sunHeight, noon: values.brbSunHeight, sunsetSeconds: values.sunsetMs / SECOND_MS,
    };
    return (seconds: number) => sceneSunHeight(scene, seconds, sun);
  }, [scene, values.sunriseOn, values.sunriseMs, values.sunHeight, values.brbSunHeight, values.sunsetMs]);
  // The noon of the BRB gets its own share of the exposure
  const exposure = scene === "brb" ? values.exposure * values.brbExposure : values.exposure;
  return (
    <Stage3D background={values.skyMorningBottom} level={values.quality} fov={FOV} far={FAR} shadows exposure={exposure} className="ul-world">
      <Sky clock={clock} heightAt={heightAt} azimuth={values.sunAzimuth} turbidity={values.turbidity} exposure={exposure} shadows direction={direction} />
      <Ocean clock={clock} color={values.waterColor} distortion={values.waveDistortion} seed={values.worldSeed} low={values.quality === LOW} direction={direction} />
      <Beach sand={values.sand} rocks={values.rocks} seed={values.worldSeed} />
      {values.surfOn && <Surf clock={clock} bands={values.surfBands} seconds={values.surfSeconds} foam={values.foam} seed={values.worldSeed} />}
      <Palms clock={clock} left={values.palmsLeft} right={values.palmsRight} sway={values.palmSway} leaf={values.palmLeaf} trunk={values.palmTrunk} seed={values.worldSeed} />
      {values.boat && <Boat clock={clock} />}
      {scene === "brb" && values.umbrellaOn && <Umbrella clock={clock} color={values.umbrellaColor} wood={values.woodDark} light={values.foam} />}
      {scene === "ending" && values.torchesOn && <Torches clock={clock} count={values.torches} flame={values.sun} pole={values.palmTrunk} />}
      {values.gulls && <Gulls clock={clock} count={particleCount(values.gullCount, values.quality)} color={values.textOnWood} />}
      <BeachCamera clock={clock} height={values.cameraHeight} drift={values.cameraDrift} />
    </Stage3D>
  );
});
