// The 3D draw functions of the Dachdecker clips, loaded lazily by render.ts (prepare) so three.js stays out of the entry
// chunk: glClip renders the stinger and banner scenes of stinger.ts and banners.ts frame by frame into the 2D clip.
import { glClip } from "../../core/three/glClip.ts";
import { type BannerOptions, offlineSetup, profileSetup } from "./banners.ts";
import { OFFLINE_SIZE, PROFILE_SIZE, STINGER_SIZE } from "./render.ts";
import { type StingerOptions, stingerSetup } from "./stinger.ts";

export const stingerDraw = (options: StingerOptions) => glClip({ ...STINGER_SIZE, duration: options.duration }, () => stingerSetup(options));
export const profileDraw = (options: BannerOptions) => glClip({ ...PROFILE_SIZE, duration: options.loop }, () => profileSetup(options));
export const offlineDraw = (options: BannerOptions) => glClip({ ...OFFLINE_SIZE, duration: options.loop }, () => offlineSetup(options));
