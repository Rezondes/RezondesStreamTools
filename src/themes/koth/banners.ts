// Texts of the KOTH banners (PLAN-KOTH.md package 5): over the 3D hill (bannerWorld.ts) the profile banner (1200x480)
// shows the channel name and a line, the offline banner (1920x1080) a briefing sheet with title, text and lines. Stills,
// pure functions. Check: banners.check.ts.

export type KothBannerOptions = {
  font: string;
  titleFont: string;
  paper: string;
  ink: string;
  textColor: string;
  title: string;
  profileText: string;
  offlineTitle: string;
  offlineText: string;
  offlineLines: readonly string[];
};

export const PROFILE_SIZE = { width: 1200, height: 480 };
export const OFFLINE_SIZE = { width: 1920, height: 1080 };

// fixed: shadow behind the profile texts, so they read on the bright sky
const TEXT_SHADOW = { color: "rgba(0, 0, 0, 0.55)", blur: 14 };

function centered(context: CanvasRenderingContext2D, text: string, y: number) {
  context.fillText(text, Math.round(-context.measureText(text).width / 2), y);
}

export function drawKothProfileBanner(context: CanvasRenderingContext2D, options: KothBannerOptions) {
  context.save();
  context.shadowColor = TEXT_SHADOW.color;
  context.shadowBlur = TEXT_SHADOW.blur;
  context.fillStyle = options.textColor;
  context.textBaseline = "middle";
  context.font = `400 90px "${options.titleFont}", sans-serif`;
  context.fillText(options.title, 60, 110);
  context.font = `600 32px "${options.font}", sans-serif`;
  context.fillText(options.profileText, 64, 180);
  context.restore();
}

export function drawKothOfflineBanner(context: CanvasRenderingContext2D, options: KothBannerOptions) {
  // Briefing sheet in the upper half, slightly tilted
  context.save();
  context.translate(960, 380);
  context.rotate(-0.02);
  context.fillStyle = options.paper;
  context.fillRect(-470, -240, 940, 480);
  context.fillStyle = options.ink;
  context.textBaseline = "middle";
  context.font = `400 104px "${options.titleFont}", sans-serif`;
  centered(context, options.offlineTitle, -110);
  context.font = `600 40px "${options.font}", sans-serif`;
  centered(context, options.offlineText, 10);
  context.font = `400 34px "${options.font}", sans-serif`;
  options.offlineLines.slice(0, 3).forEach((line, index) => centered(context, line, 90 + index * 52));
  context.restore();
}
