// The 3D draw functions of the Urlaub banners, loaded lazily by render.ts (prepare) so three.js stays out of the entry
// chunk: the realistic beach of bannerWorld.ts with the texts of banners.ts drawn over it.
import { glClip } from "../../core/three/glClip.ts";
import { type BannerWorldOptions, bannerSetup } from "./bannerWorld.ts";
import { drawUrlaubOfflineBanner, drawUrlaubProfileBanner, OFFLINE_SIZE, PROFILE_SIZE, type UrlaubBannerOptions } from "./banners.ts";
import { exposureFactor } from "./sun.ts";

// fixed: a banner is one picture
const STILL = { duration: 1, fps: 1 };

type Draw = (context: CanvasRenderingContext2D, time: number) => void;

function banner(size: { width: number; height: number }, world: BannerWorldOptions, exposure: number, texts: (context: CanvasRenderingContext2D) => void): Draw {
  const picture = glClip({ ...size, ...STILL, exposure: exposure * exposureFactor(world.sunHeight) }, renderer => bannerSetup(size, world, renderer));
  return (context, time) => {
    picture(context, time);
    texts(context);
  };
}

export const profileDraw = (world: BannerWorldOptions, exposure: number, texts: UrlaubBannerOptions) =>
  banner(PROFILE_SIZE, world, exposure, context => drawUrlaubProfileBanner(context, texts));
export const offlineDraw = (world: BannerWorldOptions, exposure: number, texts: UrlaubBannerOptions) =>
  banner(OFFLINE_SIZE, world, exposure, context => drawUrlaubOfflineBanner(context, texts));
