// Looks of the KOTH 3D world per screen (PLAN-KOTH.md packages 2 and 3): the evening of the Starting, the night of the
// BRB with moon light and the dusk of the Ending: sky colors, the main light, the disc in the sky and the camera. Pure;
// check: looks.check.ts.
import type { ScreenKind } from "../../core/screens/screens.ts";
import type { Point3 } from "../../core/three/beam.ts";
import type { CameraOptions } from "./build.ts";
import type { KothValues } from "./settings.ts";

export type WorldLook = {
  sky: { top: string; horizon: string };
  light: { color: string; strength: number; position: Point3 };
  ambient: number;
  disc: { color: string; position: Point3; size: number } | null;
  camera: CameraOptions;
};

// fixed: strength and place of the lights and the discs per screen (Starting from the prototype refs/starting.html)
const LIGHTS = {
  starting: { strength: 2.6, ambient: 1.1, position: [-30, 22, 18] as Point3, disc: [-150, 9, -190] as Point3, size: 9 },
  brb: { strength: 0.6, ambient: 0.3, position: [25, 30, -15] as Point3, disc: [110, 70, -190] as Point3, size: 6 },
  ending: { strength: 1.8, ambient: 0.8, position: [-30, 9, 18] as Point3, disc: [-150, 3, -190] as Point3, size: 10 },
};

export function worldLook(values: KothValues, kind: ScreenKind): WorldLook {
  const lights = LIGHTS[kind];
  const camera = { intro: values.cameraIntro, radius: values.cameraRadius, height: values.cameraHeight, speed: values.cameraSpeed, top: values.hillHeight };
  const night = kind === "brb";
  const sky = {
    starting: { top: values.skyTop, horizon: values.skyHorizon },
    brb: { top: values.brbSkyTop, horizon: values.brbSkyHorizon },
    ending: { top: values.endingSkyTop, horizon: values.endingSkyHorizon },
  }[kind];
  const glow = night ? values.moon : values.sunColor;
  return {
    sky,
    light: { color: glow, strength: lights.strength, position: lights.position },
    ambient: lights.ambient,
    disc: night && !values.moonOn ? null : { color: glow, position: lights.disc, size: lights.size },
    // BRB: no ride, the camera circles lower; Ending: the ride from the flag like the Starting
    camera: night ? { ...camera, intro: false, height: values.brbCameraHeight } : camera,
  };
}
