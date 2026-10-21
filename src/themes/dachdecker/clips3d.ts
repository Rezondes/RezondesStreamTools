// The 3D draw function of the Dachdecker stinger, loaded lazily by render.ts (prepare) so three.js stays out of the entry
// chunk: glClip renders the scene of stinger.ts frame by frame into the 2D clip.
import { glClip } from "../../core/three/glClip.ts";
import { STINGER_SIZE } from "./render.ts";
import { type StingerOptions, stingerSetup } from "./stinger.ts";

export const stingerDraw = (options: StingerOptions) => glClip({ ...STINGER_SIZE, duration: options.duration }, () => stingerSetup(options));
