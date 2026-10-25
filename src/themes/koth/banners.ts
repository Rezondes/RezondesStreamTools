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
  layout: BannerLayout;
};
// Sizes and places of the settings (px): the profile texts from the top left, the offline sheet around its middle with
// its texts from there, the shadow behind the profile texts so they read on the bright sky
export type BannerLayout = {
  profile: { titleSize: number; titleX: number; titleY: number; textSize: number; textX: number; textY: number; shadowAlpha: number; shadowBlur: number };
  offline: {
    x: number; y: number; turn: number; width: number; height: number; titleSize: number; titleY: number; textSize: number; textY: number;
    linesSize: number; linesY: number; linesStep: number; linesMax: number;
  };
};

export const PROFILE_SIZE = { width: 1200, height: 480 };
export const OFFLINE_SIZE = { width: 1920, height: 1080 };


function centered(context: CanvasRenderingContext2D, text: string, y: number) {
  context.fillText(text, Math.round(-context.measureText(text).width / 2), y);
}

export function drawKothProfileBanner(context: CanvasRenderingContext2D, options: KothBannerOptions) {
  const look = options.layout.profile;
  context.save();
  context.shadowColor = `rgba(0, 0, 0, ${look.shadowAlpha})`; // fixed: a black shadow, its opacity is a setting
  context.shadowBlur = look.shadowBlur;
  context.fillStyle = options.textColor;
  context.textBaseline = "middle";
  context.font = `400 ${look.titleSize}px "${options.titleFont}", sans-serif`;
  context.fillText(options.title, look.titleX, look.titleY);
  context.font = `600 ${look.textSize}px "${options.font}", sans-serif`;
  context.fillText(options.profileText, look.textX, look.textY);
  context.restore();
}

export function drawKothOfflineBanner(context: CanvasRenderingContext2D, options: KothBannerOptions) {
  // Briefing sheet in the upper half, slightly tilted
  const look = options.layout.offline;
  context.save();
  context.translate(look.x, look.y);
  context.rotate((look.turn * Math.PI) / 180);
  context.fillStyle = options.paper;
  context.fillRect(-look.width / 2, -look.height / 2, look.width, look.height);
  context.fillStyle = options.ink;
  context.textBaseline = "middle";
  context.font = `400 ${look.titleSize}px "${options.titleFont}", sans-serif`;
  centered(context, options.offlineTitle, look.titleY);
  context.font = `600 ${look.textSize}px "${options.font}", sans-serif`;
  centered(context, options.offlineText, look.textY);
  context.font = `400 ${look.linesSize}px "${options.font}", sans-serif`;
  options.offlineLines.slice(0, look.linesMax).forEach((line, index) => centered(context, line, look.linesY + index * look.linesStep));
  context.restore();
}
