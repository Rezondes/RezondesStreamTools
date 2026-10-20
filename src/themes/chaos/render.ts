// Renderable clips of the Chaos theme: stinger (group Stinger) and profile and offline banners (group Banner), drawn with
// the resolved settings; the layers of each clip are built once per render. Check: render.check.ts.
import type { RenderClip } from "../../core/renderClip.ts";
import { fillTemplate } from "../../core/template.ts";
import type { SettingValues } from "../../core/theme.ts";
import { makeChaosOfflineBanner, makeChaosProfileBanner, type ChaosBannerOptions } from "./banners.ts";
import type { ChaosColors } from "./paint.ts";
import type { ChaosValues } from "./settings.ts";
import { FPS, HEIGHT, makeChaosStinger, WIDTH, type ChaosStingerOptions } from "./stinger.ts";

// values: resolved against the Chaos schema; login for {login} in the texts
export function chaosClips(values: SettingValues, login: string): RenderClip[] {
  const chaos = values as unknown as ChaosValues;
  const names = { channel: chaos.channelName, login };
  const colors: ChaosColors = {
    ground: chaos.ground, wall: chaos.wall, accent: chaos.accent, accentText: chaos.accentText, accent2: chaos.accent2, violet: chaos.violet,
    violetLight: chaos.violetLight, lilac: chaos.lilac, textColor: chaos.textColor, mutedColor: chaos.mutedColor,
    scribbles: [chaos.scribbleColor1, chaos.scribbleColor2, chaos.scribbleColor3, chaos.scribbleColor4],
  };
  const shared = { titleFont: chaos.titleFont, colors, glow: chaos.glow, drips: chaos.drips, scribbleCount: chaos.scribbleCount, scribbleWidth: chaos.scribbleWidth };
  const stinger: ChaosStingerOptions = {
    ...shared, duration: chaos.stingerDuration, cut: chaos.stingerCut, text: fillTemplate(chaos.stingerText, names), textSize: chaos.stingerTextSize,
  };
  const banner: ChaosBannerOptions = {
    ...shared, loop: chaos.bannerLoop, font: chaos.font, title: fillTemplate(chaos.bannerTitle, names), profileText: chaos.bannerProfileText,
    offlineTitle: chaos.bannerOfflineTitle, offlineText: chaos.bannerOfflineText,
  };
  const font = `24px "${chaos.titleFont}"`;
  return [
    { name: "stinger", feature: "stinger", group: "Stinger", font, width: WIDTH, height: HEIGHT, fps: FPS, duration: stinger.duration, cut: stinger.cut, draw: makeChaosStinger(stinger) },
    { name: "profile", feature: "banners", group: "Banner", font, width: 1200, height: 480, fps: chaos.bannerProfileFps, duration: banner.loop, cut: null, draw: makeChaosProfileBanner(banner) },
    { name: "offline", feature: "banners", group: "Banner", font, width: 1920, height: 1080, fps: chaos.bannerOfflineFps, duration: banner.loop, cut: null, draw: makeChaosOfflineBanner(banner) },
  ];
}
