// Texts of the Twitch banners of the Urlaub theme (PLAN-URLAUB.md package 8), drawn over the realistic beach of
// bannerWorld.ts: the profile banner (1200x480) by day with channel name and text, the offline banner (1920x1080) in
// the sunset with a wooden sign for title, text and lines. Before the 3D part has loaded, the texts stand alone.
// Check: banners.check.ts.

export type UrlaubBannerOptions = {
  font: string;
  titleFont: string;
  wood: string;
  woodDark: string;
  textColor: string;
  textOnWood: string;
  title: string;
  profileText: string;
  offlineTitle: string;
  offlineText: string;
  offlineLines: readonly string[];
};

export const PROFILE_SIZE = { width: 1200, height: 480 };
export const OFFLINE_SIZE = { width: 1920, height: 1080 };
// fixed: a soft dark shadow under the texts on the bright sky
const SHADOW = { color: "rgba(0, 0, 0, 0.45)", blur: 18, drop: 4 };

function centered(context: CanvasRenderingContext2D, text: string, y: number, width: number) {
  context.fillText(text, Math.round((width - context.measureText(text).width) / 2), y);
}

export function drawUrlaubProfileBanner(context: CanvasRenderingContext2D, options: UrlaubBannerOptions) {
  context.save();
  Object.assign(context, { shadowColor: SHADOW.color, shadowBlur: SHADOW.blur, shadowOffsetY: SHADOW.drop });
  context.fillStyle = options.textColor;
  context.textBaseline = "middle";
  context.font = `400 96px "${options.titleFont}", cursive`;
  centered(context, options.title, 150, PROFILE_SIZE.width);
  context.font = `600 34px "${options.font}", sans-serif`;
  centered(context, options.profileText, 250, PROFILE_SIZE.width);
  context.restore();
}

export function drawUrlaubOfflineBanner(context: CanvasRenderingContext2D, options: UrlaubBannerOptions) {
  // Wooden sign in the middle
  context.fillStyle = options.woodDark;
  context.fillRect(470, 230, 980, 520);
  context.fillStyle = options.wood;
  context.fillRect(486, 246, 948, 488);
  context.fillStyle = options.textOnWood;
  context.textBaseline = "middle";
  context.font = `400 110px "${options.titleFont}", cursive`;
  centered(context, options.offlineTitle, 360, OFFLINE_SIZE.width);
  context.font = `600 40px "${options.font}", sans-serif`;
  centered(context, options.offlineText, 480, OFFLINE_SIZE.width);
  context.font = `400 34px "${options.font}", sans-serif`;
  options.offlineLines.slice(0, 3).forEach((line, index) => centered(context, line, 560 + index * 52, OFFLINE_SIZE.width));
}
