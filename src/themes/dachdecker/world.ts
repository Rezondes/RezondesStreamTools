// The 3D world of the Dachdecker theme from its settings: dimensions of the roof frame, camera orbit, fog and bloom of
// the stage (DESIGN-DACHDECKER.md "3D-Welt"). Check: world.check.ts.
import type { StageBloom, StageFog } from "../../core/three/Stage3D.tsx";
import type { FrameDims } from "./frame.ts";
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

type FrameValues = Pick<DachdeckerValues, "span" | "rise" | "trusses" | "trussGap" | "overhang">;
export const frameDims = (values: FrameValues): FrameDims => ({
  span: values.span, rise: values.rise, trusses: values.trusses, gap: values.trussGap, overhang: values.overhang / PERCENT,
});

// Tiles of a scene: rows from the eaves on one face (Starting) or both faces (BRB, Ending)
export const ONE_FACE = 1;
export const BOTH_FACES = 2;
type TileValues = FrameValues & Pick<DachdeckerValues, "seed" | "tileCopperShare">;
export const tilesOf = (values: TileValues, rows: number, faces: typeof ONE_FACE | typeof BOTH_FACES) =>
  tileLayout(frameDims(values), rows, values.seed, values.tileCopperShare / PERCENT, faces);

type OrbitValues = Pick<DachdeckerValues, "cameraRadius" | "cameraHeight" | "cameraSpeed" | "cameraIntro">;
export const orbitOf = (values: OrbitValues): Orbit => ({
  radius: values.cameraRadius, height: values.cameraHeight, speed: values.cameraSpeed, intro: values.cameraIntro,
});

type LookValues = Pick<DachdeckerValues, "blueprint" | "fog" | "cameraRadius" | "bloom" | "bloomStrength">;
export function stageLook(values: LookValues): { fov: number; fog: StageFog | null; bloom: StageBloom | null } {
  return {
    fov: FOV,
    fog: values.fog ? { color: values.blueprint, near: values.cameraRadius * FOG_NEAR, far: values.cameraRadius * FOG_FAR } : null,
    bloom: values.bloom ? { strength: values.bloomStrength * BLOOM_SCALE, radius: BLOOM_RADIUS, threshold: BLOOM_THRESHOLD } : null,
  };
}
