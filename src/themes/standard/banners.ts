// Twitch banners of the standard theme: profile banner (1200x480) and offline banner (1920x1080) on a dark ground with the
// light fields and the light dust of the screens as a still (PLAN-STANDARD.md package 4), plus title and text. Both are
// still pictures (the dashboard saves a PNG). Every color, font, position and size comes from the settings of the
// banner (its colors and font follow the theme until set). Check: banners.check.ts.
import { type LightsOptions, paintLights } from "./lights.ts";

// One line of text: baseline, size in px and weight
type Line = { y: number; size: number; weight: number };
// The look of a banner: font and colors, the left edge of the texts, title, accent bar (top, widest, height) and text
export type BannerLook = {
  font: string; background: string; titleColor: string; textColor: string; barColor: string; barColor2: string;
  left: number; title: Line; bar: { y: number; width: number; height: number }; text: Line;
};

export type StandardBannerOptions = {
  title: string;
  profileText: string;
  offlineTitle: string;
  offlineText: string;
  lights: LightsOptions;
  profile: BannerLook;
  // the offline banner adds the channel line above its title
  offline: BannerLook & { nameColor: string; name: Line };
};

// The light fields of the screens as a still in the middle of their orbit, with the light dust (lights.ts)
function base(context: CanvasRenderingContext2D, options: StandardBannerOptions, look: BannerLook, width: number, height: number) {
  context.fillStyle = look.background;
  context.fillRect(0, 0, width, height);
  paintLights(context, options.lights, options.lights.loop / 2, width, height);
}

function write(context: CanvasRenderingContext2D, text: string, x: number, line: Line, color: string, font: string) {
  context.font = `${line.weight} ${line.size}px "${font}", sans-serif`;
  context.textBaseline = "alphabetic";
  context.fillStyle = color;
  context.fillText(text, x, line.y);
  return context.measureText(text).width;
}

// Accent bar with gradient below the title, at most as wide as the title
function bar(context: CanvasRenderingContext2D, look: BannerLook, titleWidth: number) {
  const width = Math.min(titleWidth, look.bar.width);
  const gradient = context.createLinearGradient(look.left, look.bar.y, look.left + width, look.bar.y);
  gradient.addColorStop(0, look.barColor);
  gradient.addColorStop(1, look.barColor2);
  context.fillStyle = gradient;
  context.fillRect(look.left, look.bar.y, width, look.bar.height);
}

// Profile banner 1200x480; at the bottom left Twitch puts the profile picture over it, so everything is top right of center
export function drawStandardProfileBanner(context: CanvasRenderingContext2D, options: StandardBannerOptions) {
  const look = options.profile;
  base(context, options, look, 1200, 480);
  bar(context, look, write(context, options.title, look.left, look.title, look.titleColor, look.font));
  write(context, options.profileText, look.left, look.text, look.textColor, look.font);
}

// Offline banner 1920x1080
export function drawStandardOfflineBanner(context: CanvasRenderingContext2D, options: StandardBannerOptions) {
  const look = options.offline;
  base(context, options, look, 1920, 1080);
  write(context, options.title, look.left, look.name, look.nameColor, look.font);
  bar(context, look, write(context, options.offlineTitle, look.left, look.title, look.titleColor, look.font));
  write(context, options.offlineText, look.left, look.text, look.textColor, look.font);
}
