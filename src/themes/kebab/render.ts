// Renderable clips and the panel template of the Kebab theme: the stinger (group Stinger, papier or messer) and the
// profile banner (group Profilbanner) and offline banner (group Offline-Banner) as still pictures, drawn with the resolved settings. The drawing (stinger.ts, banners.ts)
// loads only in prepare, so Rough.js stays out of the entry chunk; until then the clips draw plain paper.
// Check: render.check.ts.
import { centeredTop, type PanelDesign, PANEL_START_HEIGHT, PANEL_WIDTH, rectLayer, textLayer } from "../../core/panels.ts";
import type { RenderClip } from "../../core/renderClip.ts";
import { readStingerOptions, withStingerOptions } from "../../core/stingerOptions.ts";
import { fillTemplate } from "../../core/template.ts";
import type { SettingValues } from "../../core/theme.ts";
import type * as BannerModule from "./banners.ts";
import type { BannerLayout, BannerLook } from "./banners.ts";
import { steamLookOf } from "./food.ts";
import type { KebabValues } from "./settings.ts";
import type * as StingerModule from "./stinger.ts";
import type { StingerLook, StingerStyle } from "./stinger.ts";
import { PICTURE } from "./wrap.ts";

export const PROFILE_SIZE = { width: 1200, height: 480 };
// Banners are one picture (the dashboard saves their first frame as a PNG); duration and frame rate only fill the clip
const STILL = 1;

type Draw = (context: CanvasRenderingContext2D, time: number) => void;
type Parts = { stinger: typeof StingerModule; banners: typeof BannerModule };

// The drawing modules, loaded once by prepare
let parts: Parts | null = null;
const prepare = async () => {
  parts ??= { stinger: await import("./stinger.ts"), banners: await import("./banners.ts") };
};
// The picture once prepare has loaded the drawing (built on its first frame), the stand-in before
function clipDraw(build: (loaded: Parts) => Draw, standIn: Draw): Draw {
  let picture: Draw | null = null;
  return (context, time) => {
    if (!parts) {
      standIn(context, time);
      return;
    }
    picture ??= build(parts);
    picture(context, time);
  };
}
const plain = (size: { width: number; height: number }, color: string): Draw => context => {
  context.fillStyle = color;
  context.fillRect(0, 0, size.width, size.height);
};
// Stand-in of the stinger: paper covers the picture from the left, all of it at the cut, then leaves again
function coverStandIn(look: StingerLook): Draw {
  return (context, time) => {
    const share = time <= look.cut ? time / Math.max(look.cut, 1e-3) : (look.duration - time) / Math.max(look.duration - look.cut, 1e-3);
    context.clearRect(0, 0, PICTURE.width, PICTURE.height);
    context.fillStyle = look.colors.paper;
    context.fillRect(0, 0, PICTURE.width * Math.min(1, Math.max(0, share)), PICTURE.height);
  };
}

// Places of the banners (settings)
export const kebabBannerLayout = (values: KebabValues): BannerLayout => ({
  profile: {
    logoTop: values.profileLogoTop, logoHeight: values.profileLogoHeight, title: values.profileTitleY, titleSize: values.profileTitleSize,
    line: values.profileLineY, lineSize: values.profileLineSize,
  },
  offline: {
    logoTop: values.offlineLogoTop, logoHeight: values.offlineLogoHeight, text: values.offlineTextY, textSize: values.offlineTextSize,
    slat: values.offlineSlat, slatLine: values.offlineSlatLine, slatAlpha: values.offlineSlatAlpha, rail: values.offlineRail, railAlpha: values.offlineRailAlpha,
  },
});

export function kebabClips(settings: SettingValues, login: string): RenderClip[] {
  const values = settings as unknown as KebabValues;
  const names = { channel: values.channelName, shop: values.channelName, login };
  const fill = (text: string) => fillTemplate(text, names);
  const ink = { roughness: values.inkRoughness, bowing: values.inkBowing, width: values.inkWidth, seed: values.inkSeed };
  // The stinger and each banner have their own colors and fonts
  const stinger: StingerLook = {
    style: values.stingerStyle as StingerStyle, text: fill(values.stingerText), duration: values.stingerDuration, cut: values.stingerCut,
    jag: values.stingerTearJag, slices: values.stingerSlices, shavings: values.stingerShavings, seed: values.stingerSeed, titleFont: values.stingerFont, ink,
    colors: { red: values.stingerRed, redText: values.stingerRedText, paper: values.stingerPaper, brown: values.stingerBrown },
  };
  const banner = (size: { width: number; height: number }, steam: boolean, own: Pick<BannerLook, "titleFont" | "font" | "colors">): BannerLook => ({
    ...size, steam, ink, ...own,
    arc: { text: values.arcText, size: values.arcSize, span: values.arcSpan, stroke: values.arcStroke },
    hatchRows: values.hatchRows, steamHeight: values.steamHeight, steamLook: steamLookOf(values), layout: kebabBannerLayout(values),
  });
  const profile = {
    titleFont: values.profileTitleFont, font: values.profileFont,
    colors: {
      red: values.profileRed, redText: values.profileRedText, paper: values.profilePaper, brown: values.profileBrown, muted: values.profileMuted,
      steam: values.profileSteamColor,
    },
  };
  const offline = {
    titleFont: values.offlineTitleFont, font: values.font,
    colors: {
      red: values.offlineRed, redText: values.offlineRedText, paper: values.offlinePaper, brown: values.offlineBrown, muted: values.offlineMuted,
      steam: values.offlineSteamColor,
    },
  };
  const font = `24px "${values.titleFont}"`;
  const banners = { feature: "banners", font, fps: STILL, duration: STILL, cut: null, prepare } as const;
  return [
    withStingerOptions({
      name: "stinger", feature: "stinger", group: "Stinger", font, ...PICTURE, fps: values.stingerFps, duration: stinger.duration, cut: stinger.cut, prepare,
      draw: clipDraw(loaded => loaded.stinger.makeStinger(stinger), coverStandIn(stinger)),
    }, readStingerOptions(settings)),
    {
      ...banners, name: "profile", group: "Profilbanner", ...PROFILE_SIZE,
      draw: clipDraw(loaded => loaded.banners.makeProfile(banner(PROFILE_SIZE, values.profileSteam, profile), { title: fill(values.profileTitle), line: fill(values.profileSubtitle) }), plain(PROFILE_SIZE, values.paper)),
    },
    {
      ...banners, name: "offline", group: "Offline-Banner", ...PICTURE,
      draw: clipDraw(loaded => loaded.banners.makeOffline(banner(PICTURE, values.offlineSteam, offline), fill(values.offlineText)), plain(PICTURE, values.brown)),
    },
  ];
}

// Panel template (panel designer): a bon on paper with a red line around it, a dashed rule and the title in the title font
export function kebabPanel(values: SettingValues, title: string): PanelDesign {
  const look = values as unknown as KebabValues;
  const size = 28;
  const dashes = [24, 64, 104, 144, 184, 224, 264].map(x => rectLayer(`dash${x}`, x, PANEL_START_HEIGHT - 18, 24, 2, look.muted));
  return {
    height: PANEL_START_HEIGHT, background: look.paper,
    layers: [
      rectLayer("bon", 8, 8, PANEL_WIDTH - 16, PANEL_START_HEIGHT - 16, look.bon, { radius: 4, stroke: look.red, strokeWidth: 3 }),
      ...dashes,
      textLayer("title", 20, centeredTop(size) - 6, PANEL_WIDTH - 40, title, look.titleFont, size, look.redText, { align: "center", weight: 400 }),
    ],
  };
}
