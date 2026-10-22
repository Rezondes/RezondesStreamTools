// Renderable clips of the Chaos theme: stinger (group Stinger) and profile and offline banners (group Banner), drawn with
// the resolved settings; the layers of each clip are built once per render. Rough.js loads only in prepare
// (roughScribbles.ts), so it stays out of the entry chunk; until then every scribble keeps its own hand.
// Check: render.check.ts.
import { centeredTop, PANEL_START_HEIGHT, type PanelDesign, PANEL_WIDTH, rectLayer, textLayer } from "../../core/panels.ts";
import type { RenderClip } from "../../core/renderClip.ts";
import { readStingerOptions, withStingerOptions } from "../../core/stingerOptions.ts";
import { fillTemplate } from "../../core/template.ts";
import type { SettingValues } from "../../core/theme.ts";
import { makeChaosOfflineBanner, makeChaosProfileBanner, type ChaosBannerOptions } from "./banners.ts";
import type { ChaosColors } from "./paint.ts";
import type { ChaosValues } from "./settings.ts";
import { HEIGHT, makeChaosStinger, type TakesOf, WIDTH, type ChaosStingerOptions } from "./stinger.ts";

// Banners are stills (the dashboard renders their first frame); the loop only scales the time inside the drawing
const BANNER_LOOP = 4;
const BANNER_FPS = 1;

type Draw = (context: CanvasRenderingContext2D, time: number) => void;

// The Rough takes, loaded once by prepare
let takesOf: TakesOf | null = null;
const prepare = async () => { takesOf ??= (await import("./roughScribbles.ts")).scribbleTakes; };
// The picture with the Rough takes once prepare has loaded them, without them before; each built once
function clipDraw(build: (takes?: TakesOf) => Draw): Draw {
  let [plain, rough]: (Draw | null)[] = [null, null];
  return (context, time) => {
    if (takesOf) (rough ??= build(takesOf))(context, time);
    else (plain ??= build())(context, time);
  };
}

// values: resolved against the Chaos schema; login for {login} in the texts
export function chaosClips(values: SettingValues, login: string): RenderClip[] {
  const chaos = values as unknown as ChaosValues;
  const names = { channel: chaos.channelName, login };
  const colors: ChaosColors = {
    ground: chaos.ground, wall: chaos.wall, accent: chaos.accent, accentText: chaos.accentText, accent2: chaos.accent2, violet: chaos.violet,
    violetLight: chaos.violetLight, lilac: chaos.lilac, textColor: chaos.textColor, mutedColor: chaos.mutedColor,
    scribbles: [chaos.scribbleColor1, chaos.scribbleColor2, chaos.scribbleColor3, chaos.scribbleColor4],
  };
  const shared = {
    titleFont: chaos.titleFont, colors, glow: chaos.glow, drips: chaos.drips, scribbleCount: chaos.scribbleCount, scribbleWidth: chaos.scribbleWidth,
    rough: { share: chaos.roughShare / 100, fill: chaos.roughFill },
  };
  const stinger: ChaosStingerOptions = {
    ...shared, boilFps: chaos.idleOn && chaos.boilOn ? chaos.boilFps : 0, duration: chaos.stingerDuration, cut: chaos.stingerCut, text: fillTemplate(chaos.stingerText, names), textSize: chaos.stingerTextSize,
  };
  const banner: ChaosBannerOptions = {
    ...shared, loop: BANNER_LOOP, font: chaos.font, title: fillTemplate(chaos.bannerTitle, names), profileText: chaos.bannerProfileText,
    offlineTitle: chaos.bannerOfflineTitle, offlineText: chaos.bannerOfflineText, shimmer: chaos.idleOn ? chaos.bristleShimmer : 0,
  };
  const font = `24px "${chaos.titleFont}"`;
  const options = readStingerOptions(values);
  return [
    withStingerOptions({ name: "stinger", feature: "stinger", group: "Stinger", font, width: WIDTH, height: HEIGHT, fps: options.fps, duration: stinger.duration, cut: stinger.cut, prepare, draw: clipDraw(takes => makeChaosStinger(stinger, undefined, takes)) }, options),
    { name: "profile", feature: "banners", group: "Banner", font, width: 1200, height: 480, fps: BANNER_FPS, duration: banner.loop, cut: null, prepare, draw: clipDraw(takes => makeChaosProfileBanner(banner, undefined, takes)) },
    { name: "offline", feature: "banners", group: "Banner", font, width: 1920, height: 1080, fps: BANNER_FPS, duration: banner.loop, cut: null, prepare, draw: clipDraw(takes => makeChaosOfflineBanner(banner, undefined, takes)) },
  ];
}

// Panel template of the Chaos theme (panel designer): the dark wall, a crooked magenta brush stroke with a cyan line
// below and the title in marker with a neon glow
export function chaosPanel(values: SettingValues, title: string): PanelDesign {
  const look = values as unknown as ChaosValues;
  const size = 32;
  return {
    height: PANEL_START_HEIGHT, background: look.ground,
    layers: [
      rectLayer("wall", 0, 0, PANEL_WIDTH, PANEL_START_HEIGHT, look.wall, { fill2: look.ground }),
      rectLayer("stroke", 18, 28, PANEL_WIDTH - 36, 44, look.accent, { radius: 20, rotate: -3, opacity: 0.85 }),
      rectLayer("line", 46, 78, PANEL_WIDTH - 92, 5, look.accent2, { radius: 3, rotate: 2 }),
      textLayer("title", 20, centeredTop(size) - 2, PANEL_WIDTH - 40, title, look.titleFont, size, look.textColor, { weight: 400, rotate: -2, glow: 10, glowColor: look.accentText }),
    ],
  };
}
