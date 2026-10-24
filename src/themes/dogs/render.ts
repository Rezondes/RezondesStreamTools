// Render section of the Dogs theme: the clips (stinger, profile and offline banner as still pictures, drawn from the
// pixel kit with the resolved settings) and the panel template: a cream pixel box with an ink edge, the red pill with a
// paw and the title in the font. The drawing (stinger.ts, banners.ts) loads only in prepare, so the kit stays out of
// the entry chunk; until then the clips draw plain cream. Check: render.check.ts.
import { centeredTop, type PanelDesign, PANEL_START_HEIGHT, PANEL_WIDTH, rectLayer, textLayer } from "../../core/panels.ts";
import type { RenderClip } from "../../core/renderClip.ts";
import { STAGE } from "../../core/screens/screens.ts";
import { readStingerOptions, withStingerOptions } from "../../core/stingerOptions.ts";
import { fillTemplate } from "../../core/template.ts";
import type { SettingValues } from "../../core/theme.ts";
import type * as BannerModule from "./banners.ts";
import type { DogsValues } from "./settings.ts";
import type * as StingerModule from "./stinger.ts";

// fixed: the profile banner in canvas pixels (banners.ts PROFILE_SIZE); banners are one picture (the dashboard saves
// their first frame as a PNG), duration and frame rate only fill the clip
const PROFILE = { width: 1200, height: 480 };
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

export function dogsClips(settings: SettingValues, login: string): RenderClip[] {
  const values = settings as unknown as DogsValues;
  const fill = (text: string) => fillTemplate(text, { channel: values.channelName, dog: values.dogName, login });
  const font = `24px "${values.font}"`;
  const banners = { feature: "banners", font, fps: STILL, duration: STILL, cut: null, prepare } as const;
  const title = fill(values.bannerTitle);
  return [
    withStingerOptions({
      name: "stinger", feature: "stinger", group: "Stinger", font, ...STAGE, fps: values.stingerFps, duration: values.stingerDuration, cut: values.stingerCut, prepare,
      draw: clipDraw(loaded => loaded.stinger.makeStinger(loaded.stinger.stingerLookOf(values, fill(values.stingerText))), plain(STAGE, values.stingerCover)),
    }, readStingerOptions(settings)),
    {
      ...banners, name: "profile", group: "Banner", ...PROFILE,
      draw: clipDraw(loaded => loaded.banners.makeProfile(loaded.banners.bannerLookOf(values), { title, line: fill(values.bannerProfileText) }), plain(PROFILE, values.cream)),
    },
    {
      ...banners, name: "offline", group: "Banner", ...STAGE,
      draw: clipDraw(loaded => loaded.banners.makeOffline(loaded.banners.bannerLookOf(values), { title: fill(values.bannerOfflineTitle), line: fill(values.bannerOfflineText) }), plain(STAGE, values.night)),
    },
  ];
}

// fixed: the panel in panel pixels: edge 4 px, shadow 6 px below, the pill as a square on the left with a 3 x 3 paw
const EDGE = 4;
const SHADOW = 6;
const PILL = { x: 22, size: 44 };
const PAW = { toe: 8, pad: 14 };

export function dogsPanel(values: SettingValues, title: string): PanelDesign {
  const look = values as unknown as DogsValues;
  const size = 28;
  const width = PANEL_WIDTH - 4 * EDGE;
  const height = PANEL_START_HEIGHT - 4 * EDGE - SHADOW;
  const pillTop = 2 * EDGE + (height - PILL.size) / 2;
  const toes = [0, 1, 2].map(index => rectLayer(`toe${index}`, PILL.x + 6 + index * (PAW.toe + 4), pillTop + 8, PAW.toe, PAW.toe, look.onAccent));
  return {
    height: PANEL_START_HEIGHT, background: look.cream,
    layers: [
      rectLayer("shadow", EDGE, EDGE + SHADOW, width + 2 * EDGE, height + 2 * EDGE, look.edge),
      rectLayer("edge", EDGE, EDGE, width + 2 * EDGE, height + 2 * EDGE, look.ink),
      rectLayer("box", 2 * EDGE, 2 * EDGE, width, height, look.cream),
      rectLayer("pill", PILL.x, pillTop, PILL.size, PILL.size, look.accent, { stroke: look.ink, strokeWidth: 3 }),
      ...toes,
      rectLayer("pad", PILL.x + (PILL.size - PAW.pad) / 2 - 2, pillTop + 22, PAW.pad + 4, PAW.pad, look.onAccent),
      textLayer("title", PILL.x + PILL.size + 14, centeredTop(size) - SHADOW / 2, width - PILL.size - 30, title, look.font, size, look.textColor, { weight: 700 }),
    ],
  };
}
