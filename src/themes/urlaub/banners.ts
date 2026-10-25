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
  layout: UrlaubBannerLayout;
};
// Places and sizes of the settings in px: the profile texts with their soft dark shadow on the bright sky, the wooden
// sign of the offline banner with its texts
export type UrlaubBannerLayout = {
  profile: { titleSize: number; titleY: number; textSize: number; textY: number; shadowAlpha: number; shadowBlur: number; shadowDrop: number };
  offline: {
    x: number; y: number; width: number; height: number; border: number; titleSize: number; titleY: number; textSize: number; textY: number;
    lineSize: number; lineY: number; lineStep: number; lines: number;
  };
};

export const PROFILE_SIZE = { width: 1200, height: 480 };
export const OFFLINE_SIZE = { width: 1920, height: 1080 };

function centered(context: CanvasRenderingContext2D, text: string, y: number, width: number) {
  context.fillText(text, Math.round((width - context.measureText(text).width) / 2), y);
}

export function drawUrlaubProfileBanner(context: CanvasRenderingContext2D, options: UrlaubBannerOptions) {
  const look = options.layout.profile;
  context.save();
  // fixed: a black shadow, its opacity is a setting
  Object.assign(context, { shadowColor: `rgba(0, 0, 0, ${look.shadowAlpha})`, shadowBlur: look.shadowBlur, shadowOffsetY: look.shadowDrop });
  context.fillStyle = options.textColor;
  context.textBaseline = "middle";
  context.font = `400 ${look.titleSize}px "${options.titleFont}", cursive`;
  centered(context, options.title, look.titleY, PROFILE_SIZE.width);
  context.font = `600 ${look.textSize}px "${options.font}", sans-serif`;
  centered(context, options.profileText, look.textY, PROFILE_SIZE.width);
  context.restore();
}

export function drawUrlaubOfflineBanner(context: CanvasRenderingContext2D, options: UrlaubBannerOptions) {
  // Wooden sign in the middle
  const look = options.layout.offline;
  context.fillStyle = options.woodDark;
  context.fillRect(look.x, look.y, look.width, look.height);
  context.fillStyle = options.wood;
  context.fillRect(look.x + look.border, look.y + look.border, look.width - 2 * look.border, look.height - 2 * look.border);
  context.fillStyle = options.textOnWood;
  context.textBaseline = "middle";
  context.font = `400 ${look.titleSize}px "${options.titleFont}", cursive`;
  centered(context, options.offlineTitle, look.titleY, OFFLINE_SIZE.width);
  context.font = `600 ${look.textSize}px "${options.font}", sans-serif`;
  centered(context, options.offlineText, look.textY, OFFLINE_SIZE.width);
  context.font = `400 ${look.lineSize}px "${options.font}", sans-serif`;
  options.offlineLines.slice(0, look.lines).forEach((line, index) => centered(context, line, look.lineY + index * look.lineStep, OFFLINE_SIZE.width));
}
