// Twitch banners of the standard theme: profile banner (1200x480) and offline banner (1920x1080) on a dark ground with the
// light fields and the light dust of the screens as a still (PLAN-STANDARD.md package 4), plus title and text. The
// time stays in the signature for the clips; the still loops seamlessly. Check: banners.check.ts.
import { type LightsOptions, paintLights } from "./lights.ts";

export type StandardBannerOptions = {
  loop: number; // seconds
  font: string;
  background: string;
  accent: string;
  accent2: string;
  textColor: string;
  mutedColor: string;
  title: string;
  profileText: string;
  offlineTitle: string;
  offlineText: string;
  lights: LightsOptions;
};

// The light fields of the screens as a still in the middle of their orbit, with the light dust (lights.ts)
function base(context: CanvasRenderingContext2D, options: StandardBannerOptions, width: number, height: number) {
  context.fillStyle = options.background;
  context.fillRect(0, 0, width, height);
  paintLights(context, options.lights, options.lights.loop / 2, width, height);
}

function write(context: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, weight: number, color: string, options: StandardBannerOptions) {
  context.font = `${weight} ${size}px "${options.font}", sans-serif`;
  context.textBaseline = "alphabetic";
  context.fillStyle = color;
  context.fillText(text, x, y);
  return context.measureText(text).width;
}

// Accent bar with gradient below the title
function bar(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, options: StandardBannerOptions) {
  const gradient = context.createLinearGradient(x, y, x + width, y);
  gradient.addColorStop(0, options.accent);
  gradient.addColorStop(1, options.accent2);
  context.fillStyle = gradient;
  context.fillRect(x, y, width, height);
}

// Profile banner 1200x480; at the bottom left Twitch puts the profile picture over it, so everything is top right of center
export function drawStandardProfileBanner(context: CanvasRenderingContext2D, _time: number, options: StandardBannerOptions) {
  const width = 1200, height = 480;
  base(context, options, width, height);
  const left = 360;
  const titleWidth = write(context, options.title, left, 220, 96, 800, options.textColor, options);
  bar(context, left, 248, Math.min(titleWidth, 420), 8, options);
  write(context, options.profileText, left, 312, 34, 500, options.mutedColor, options);
}

// Offline banner 1920x1080
export function drawStandardOfflineBanner(context: CanvasRenderingContext2D, _time: number, options: StandardBannerOptions) {
  const width = 1920, height = 1080;
  base(context, options, width, height);
  const left = 180;
  write(context, options.title, left, 300, 44, 700, options.mutedColor, options);
  const titleWidth = write(context, options.offlineTitle, left, 470, 150, 800, options.textColor, options);
  bar(context, left, 520, Math.min(titleWidth, 720), 12, options);
  write(context, options.offlineText, left, 620, 48, 500, options.mutedColor, options);
}
