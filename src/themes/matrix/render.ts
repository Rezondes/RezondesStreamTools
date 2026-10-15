// Renderbare Clips des Matrix-Themes: Stinger (Gruppe Stinger) sowie Profil- und Offline-Banner (Gruppe Banner),
// gezeichnet mit den aufgelösten Einstellungen. Check: render.check.ts.
import type { RenderClip } from "../../core/renderClip.ts";
import type { SettingValues } from "../../core/theme.ts";
import { bannerOptions, drawOfflineBanner, drawProfileBanner } from "./banners.ts";
import type { MatrixValues } from "./settings.ts";
import { drawStinger, FPS, HEIGHT, stingerOptions, WIDTH } from "./stinger.ts";

// values: gegen das Matrix-Schema aufgelöst; login für {login} in den Bannern
export function matrixClips(values: SettingValues, login: string): RenderClip[] {
  const matrix = values as unknown as MatrixValues;
  const stinger = stingerOptions(matrix);
  const banner = bannerOptions(matrix, login);
  const font = `24px "${matrix.font}"`;
  return [
    { name: "stinger", feature: "stinger", group: "Stinger", font, width: WIDTH, height: HEIGHT, fps: FPS, duration: stinger.duration, cut: stinger.cut, draw: (context, time) => drawStinger(context, time, stinger) },
    { name: "profile", feature: "banners", group: "Banner", font, width: 1200, height: 480, fps: banner.profileFps, duration: banner.loop, cut: null, draw: (context, time) => drawProfileBanner(context, time, banner) },
    { name: "offline", feature: "banners", group: "Banner", font, width: 1920, height: 1080, fps: banner.offlineFps, duration: banner.loop, cut: null, draw: (context, time) => drawOfflineBanner(context, time, banner) },
  ];
}
