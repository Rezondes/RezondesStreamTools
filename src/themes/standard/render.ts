// Renderable clips of the standard theme: stinger (group Stinger) and profile banner (group Profilbanner) and offline banner (group Offline-Banner),
// drawn with the resolved settings. Check: render.check.ts.
import { centeredTop, PANEL_START_HEIGHT, type PanelDesign, PANEL_WIDTH, rectLayer, textLayer } from "../../core/panels.ts";
import type { RenderClip } from "../../core/renderClip.ts";
import { readStingerOptions, withStingerOptions } from "../../core/stingerOptions.ts";
import { fillTemplate } from "../../core/template.ts";
import type { SettingValues } from "../../core/theme.ts";
import { auroraOptions } from "./aurora.ts";
import { type BannerLook, drawStandardOfflineBanner, drawStandardProfileBanner, type StandardBannerOptions } from "./banners.ts";
import type { LightsOptions } from "./lights.ts";
import type { StandardValues } from "./settings.ts";
import { drawStandardStinger, HEIGHT, WIDTH, type StandardStingerOptions } from "./stinger.ts";

// Banners are one picture (the dashboard saves their first frame as a PNG); duration and frame rate only fill the clip
const STILL = 1;

// The look of the profile banner from its settings
const profileLook = (look: StandardValues): BannerLook => ({
  font: look.bannerProfileFont, background: look.bannerProfileBackground, titleColor: look.bannerProfileTitleColor, textColor: look.bannerProfileTextColor,
  barColor: look.bannerProfileBarColor, barColor2: look.bannerProfileBarColor2, left: look.bannerProfileLeft,
  title: { y: look.bannerProfileTitleY, size: look.bannerProfileTitleSize, weight: look.bannerProfileTitleWeight },
  bar: { y: look.bannerProfileBarY, width: look.bannerProfileBarWidth, height: look.bannerProfileBarHeight },
  text: { y: look.bannerProfileTextY, size: look.bannerProfileTextSize, weight: look.bannerProfileTextWeight },
});

// The look of the offline banner from its settings
const offlineLook = (look: StandardValues): StandardBannerOptions["offline"] => ({
  font: look.bannerOfflineFont, background: look.bannerOfflineBackground, titleColor: look.bannerOfflineTitleColor, textColor: look.bannerOfflineTextColor,
  barColor: look.bannerOfflineBarColor, barColor2: look.bannerOfflineBarColor2, left: look.bannerOfflineLeft, nameColor: look.bannerOfflineNameColor,
  name: { y: look.bannerOfflineNameY, size: look.bannerOfflineNameSize, weight: look.bannerOfflineNameWeight },
  title: { y: look.bannerOfflineTitleY, size: look.bannerOfflineTitleSize, weight: look.bannerOfflineTitleWeight },
  bar: { y: look.bannerOfflineBarY, width: look.bannerOfflineBarWidth, height: look.bannerOfflineBarHeight },
  text: { y: look.bannerOfflineTextY, size: look.bannerOfflineTextSize, weight: look.bannerOfflineTextWeight },
});

// values: resolved against the standard schema, inherited values filled in (effectiveSettings); login for {login}
export function standardClips(values: SettingValues, login: string): RenderClip[] {
  const standard = values as unknown as StandardValues;
  const names = { channel: standard.channelName, login };
  // The light fields and the dust of the screens; without blobs or dustOn none of them
  const lights: LightsOptions = {
    ...auroraOptions(standard), count: standard.blobs ? standard.auroraFields : 0, dust: standard.dustOn ? standard.dustCount : 0, dustScale: standard.dustBannerScale,
  };
  const stinger: StandardStingerOptions = {
    accent: standard.stingerAccent, accent2: standard.stingerAccent2, textColor: standard.stingerTextColor, background: standard.stingerBackground, font: standard.stingerFont,
    duration: standard.stingerDuration, cut: standard.stingerCut, panels: standard.stingerPanels, text: fillTemplate(standard.stingerText, names), lights,
    front: standard.stingerFront, textSize: standard.stingerTextSize, textWeight: standard.stingerTextWeight, textRise: standard.stingerTextRise,
    textWindow: standard.stingerTextWindow, inShare: standard.stingerInShare, outShare: standard.stingerOutShare, stagger: standard.stingerStagger,
  };
  const banner: StandardBannerOptions = {
    title: fillTemplate(standard.bannerTitle, names), profileText: standard.bannerProfileText, offlineTitle: standard.bannerOfflineTitle, offlineText: standard.bannerOfflineText,
    lights, profile: profileLook(standard), offline: offlineLook(standard),
  };
  const font = `800 24px "${standard.stingerFont}"`;
  const options = readStingerOptions(values);
  return [
    withStingerOptions({ name: "stinger", feature: "stinger", group: "Stinger", font, width: WIDTH, height: HEIGHT, fps: options.fps, duration: stinger.duration, cut: stinger.cut, draw: (context, time) => drawStandardStinger(context, time, stinger) }, options),
    { name: "profile", feature: "banners", group: "Profilbanner", font, width: 1200, height: 480, fps: STILL, duration: STILL, cut: null, draw: context => drawStandardProfileBanner(context, banner) },
    { name: "offline", feature: "banners", group: "Offline-Banner", font, width: 1920, height: 1080, fps: STILL, duration: STILL, cut: null, draw: context => drawStandardOfflineBanner(context, { ...banner, title: fillTemplate(standard.bannerOfflineName, names) }) },
  ];
}

// Panel template of the standard theme (panel designer): a dark rounded card on the background, a gradient bar at the
// left and the title in the theme font
export function standardPanel(values: SettingValues, title: string): PanelDesign {
  const look = values as unknown as StandardValues;
  const size = 30;
  return {
    height: PANEL_START_HEIGHT, background: look.background,
    layers: [
      rectLayer("card", 8, 8, PANEL_WIDTH - 16, PANEL_START_HEIGHT - 16, look.card, { radius: 16, stroke: look.accent, strokeWidth: 2 }),
      rectLayer("bar", 18, 22, 6, PANEL_START_HEIGHT - 44, look.accent, { fill2: look.accent2, radius: 3 }),
      textLayer("title", 36, centeredTop(size), PANEL_WIDTH - 60, title, look.font, size, look.textColor, { weight: 800 }),
    ],
  };
}
