// The 3D world of the Dachdecker theme from its settings: dimensions of the roof frame, camera orbit, fog and bloom of
// the stage (DESIGN-DACHDECKER.md "3D-Welt"). Check: world.check.ts.
import { Color } from "three";
import type { StageBloom, StageFog } from "../../core/three/Stage3D.tsx";
import { frameDepth, frameDims, type FrameValues } from "./frame.ts";
import type { Orbit } from "./schedule.ts";
import type { DachdeckerValues } from "./settings.ts";
import { tileLayout } from "./tiles.ts";

// Field of view of the camera in degrees
export const FOV = 38;
// Fog from a little before the frame to twice the camera distance, so a farther camera keeps the frame clear
const FOG_NEAR = 0.94;
const FOG_FAR = 2.24;
// Bloom only on bright parts (the terracotta front truss), soft spread
const BLOOM_RADIUS = 0.45;
const BLOOM_THRESHOLD = 0.4;
// The bloom of the stage is weaker than the one of the prototype at the same strength
const BLOOM_SCALE = 2.5;
const PERCENT = 100;

// frameDims lives in frame.ts (the dashboard sketch needs it without three.js)
export { frameDims };

// Tiles of a scene: rows from the eaves on one face (Starting) or both faces (BRB, Ending)
export const ONE_FACE = 1;
export const BOTH_FACES = 2;
type TileValues = FrameValues & Pick<DachdeckerValues, "seed" | "tileCopperShare">;
export const tilesOf = (values: TileValues, rows: number, faces: typeof ONE_FACE | typeof BOTH_FACES) =>
  tileLayout(frameDims(values), rows, values.seed, values.tileCopperShare / PERCENT, faces);

type OrbitValues = FrameValues & Pick<DachdeckerValues, "cameraRadius" | "cameraHeight" | "cameraSpeed" | "cameraIntro">;
export const orbitOf = (values: OrbitValues): Orbit => ({
  radius: values.cameraRadius, height: values.cameraHeight, speed: values.cameraSpeed, intro: values.cameraIntro, center: -frameDepth(frameDims(values)) / 2,
});

type LookValues = Pick<DachdeckerValues, "blueprint" | "fog" | "cameraRadius" | "bloom" | "bloomStrength">;
export type StageLook = { fov: number; fog: StageFog | null; bloom: StageBloom | null; sky: string };
export function stageLook(values: LookValues): StageLook {
  return {
    fov: FOV,
    fog: values.fog ? { color: values.blueprint, near: values.cameraRadius * FOG_NEAR, far: values.cameraRadius * FOG_FAR } : null,
    bloom: values.bloom ? { strength: values.bloomStrength * BLOOM_SCALE, radius: BLOOM_RADIUS, threshold: BLOOM_THRESHOLD } : null,
    sky: values.blueprint,
  };
}

// A color between two colors of the settings (share 0 = from, 1 = to)
export const mixColor = (from: string, to: string, share: number) => `#${new Color(from).lerp(new Color(to), share).getHexString()}`;
// Percent of a setting as a share
export const shareOf = (percent: number) => percent / PERCENT;

// BRB: a darker sky (half way to the page color) with fog in the same color, a little deeper
const RAIN_SKY = 0.5;
const RAIN_FOG = 1.05;
type MoodValues = LookValues & Pick<DachdeckerValues, "page" | "dusk" | "rain" | "line">;
export function brbLook(values: MoodValues): StageLook {
  const look = stageLook(values);
  const sky = mixColor(values.blueprint, values.page, RAIN_SKY);
  return { ...look, sky, fog: look.fog && { ...look.fog, color: sky, far: look.fog.far * RAIN_FOG } };
}
// Splashes a little lighter than the rain
const SPLASH_LIGHT = 0.55;
export const splashColor = (values: MoodValues) => mixColor(values.rain, values.line, SPLASH_LIGHT);

// Ending: the evening sky goes from the dark top to the glow; the fog has a touch of the glow and starts farther away
const ENDING_FOV = 36;
const DUSK_FOG = 0.1;
const DUSK_NEAR = 1.3;
const DUSK_FAR = 3.2;
export function endingLook(values: MoodValues): StageLook {
  const look = stageLook(values);
  const fog = { color: mixColor(values.blueprint, values.dusk, DUSK_FOG), near: values.cameraRadius * DUSK_NEAR, far: values.cameraRadius * DUSK_FAR };
  return { ...look, fov: ENDING_FOV, sky: mixColor(values.blueprint, values.page, RAIN_SKY), fog: values.fog ? fog : null };
}
