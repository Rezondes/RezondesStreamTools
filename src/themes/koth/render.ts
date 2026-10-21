// Renderable clips of the KOTH theme: stinger (group Stinger) and profile and offline banners (group Banner), drawn with
// the resolved settings. The stinger flag changes from the color of the first faction to the second. Check: render.check.ts.
import { minimeTeamColorKey } from "../../core/minimeFields.ts";
import type { RenderClip } from "../../core/renderClip.ts";
import { readStingerOptions, withStingerOptions } from "../../core/stingerOptions.ts";
import { fillTemplate } from "../../core/template.ts";
import type { SettingValues } from "../../core/theme.ts";
import { drawKothOfflineBanner, drawKothProfileBanner, type KothBannerOptions } from "./banners.ts";
import { TEAM_SET, type KothValues } from "./settings.ts";
import { drawKothStinger, HEIGHT, WIDTH, type KothStingerOptions } from "./stinger.ts";

// Banners are stills (the dashboard renders their first frame); the loop only scales the time inside the drawing
const BANNER_LOOP = 6;
const BANNER_FPS = 1;

// values: resolved against the KOTH schema; login for {login} in the texts
export function kothClips(values: SettingValues, login: string): RenderClip[] {
  const koth = values as unknown as KothValues;
  const names = { channel: koth.channelName, login };
  const [first, second] = TEAM_SET.variants.map(team => values[minimeTeamColorKey(team.id)] as string);
  const stinger: KothStingerOptions = {
    duration: koth.stingerDuration, cut: koth.stingerCut, flag: koth.stingerFlag,
    text: fillTemplate(koth.stingerText, names), font: koth.titleFont,
    smoke: koth.smokeColor, flags: [first, second], pole: koth.steel, textColor: koth.textColor,
  };
  const banner: KothBannerOptions = {
    loop: BANNER_LOOP, font: koth.font, titleFont: koth.titleFont,
    skyTop: koth.skyDayTop, skyBottom: koth.skyDayBottom, eveningTop: koth.skyEveningTop, eveningBottom: koth.skyEveningBottom,
    sun: koth.sun, mountain: koth.mountainColor, hill: koth.hillColor, hillDark: koth.hillDark, flag: koth.flagColor,
    steel: koth.steel, paper: koth.paper, ink: koth.ink, textColor: koth.textColor,
    title: fillTemplate(koth.bannerTitle, names), profileText: koth.bannerProfileText,
    offlineTitle: koth.bannerOfflineTitle, offlineText: koth.bannerOfflineText, offlineLines: koth.bannerOfflineLines,
  };
  const font = `400 24px "${koth.titleFont}"`;
  const options = readStingerOptions(values);
  return [
    withStingerOptions({ name: "stinger", feature: "stinger", group: "Stinger", font, width: WIDTH, height: HEIGHT, fps: options.fps, duration: stinger.duration, cut: stinger.cut, draw: (context, time) => drawKothStinger(context, time, stinger) }, options),
    { name: "profile", feature: "banners", group: "Banner", font, width: 1200, height: 480, fps: BANNER_FPS, duration: banner.loop, cut: null, draw: (context, time) => drawKothProfileBanner(context, time, banner) },
    { name: "offline", feature: "banners", group: "Banner", font, width: 1920, height: 1080, fps: BANNER_FPS, duration: banner.loop, cut: null, draw: (context, time) => drawKothOfflineBanner(context, time, banner) },
  ];
}
