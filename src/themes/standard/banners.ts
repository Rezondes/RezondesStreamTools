// Twitch banners of the standard theme: profile banner (1200x480) and offline banner (1920x1080) on a dark ground with two
// color areas that move in a circle once per loop (so the GIF loops seamlessly), plus title and text.
// Pure functions of time. Check: banners.check.ts.
export type StandardBannerOptions = {
  loop: number; // Sekunden
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
};

const TURN = Math.PI * 2;

// Color area as a soft circle; the center circles with the loop
function blob(context: CanvasRenderingContext2D, time: number, options: StandardBannerOptions, center: [number, number], orbit: number, radius: number, color: string, phase: number) {
  const angle = (time / options.loop) * TURN + phase;
  const x = center[0] + Math.cos(angle) * orbit;
  const y = center[1] + Math.sin(angle) * orbit;
  const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, options.background);
  context.globalAlpha = 0.55;
  context.fillStyle = gradient;
  context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  context.globalAlpha = 1;
}

function base(context: CanvasRenderingContext2D, time: number, options: StandardBannerOptions, width: number, height: number) {
  context.fillStyle = options.background;
  context.fillRect(0, 0, width, height);
  blob(context, time, options, [width * 0.25, height * 0.3], height * 0.15, height * 0.9, options.accent, 0);
  blob(context, time, options, [width * 0.8, height * 0.75], height * 0.12, height * 0.8, options.accent2, Math.PI);
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
export function drawStandardProfileBanner(context: CanvasRenderingContext2D, time: number, options: StandardBannerOptions) {
  const width = 1200, height = 480;
  base(context, time, options, width, height);
  const left = 360;
  const titleWidth = write(context, options.title, left, 220, 96, 800, options.textColor, options);
  bar(context, left, 248, Math.min(titleWidth, 420), 8, options);
  write(context, options.profileText, left, 312, 34, 500, options.mutedColor, options);
}

// Offline banner 1920x1080
export function drawStandardOfflineBanner(context: CanvasRenderingContext2D, time: number, options: StandardBannerOptions) {
  const width = 1920, height = 1080;
  base(context, time, options, width, height);
  const left = 180;
  write(context, options.title, left, 300, 44, 700, options.mutedColor, options);
  const titleWidth = write(context, options.offlineTitle, left, 470, 150, 800, options.textColor, options);
  bar(context, left, 520, Math.min(titleWidth, 720), 12, options);
  write(context, options.offlineText, left, 620, 48, 500, options.mutedColor, options);
}
