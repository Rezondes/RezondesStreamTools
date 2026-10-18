// Twitch banners of the KOTH theme: profile banner (1200x480) with the hill, radio mast and waving flag by day and the
// channel name, offline banner (1920x1080) at evening with a briefing sheet for title, text and lines. The flag waves once
// per loop, so the GIF loops seamlessly. Pure functions of time. Check: banners.check.ts.

export type KothBannerOptions = {
  loop: number; // seconds
  font: string;
  titleFont: string;
  skyTop: string;
  skyBottom: string;
  eveningTop: string;
  eveningBottom: string;
  sun: string;
  mountain: string;
  hill: string;
  hillDark: string;
  flag: string;
  steel: string;
  paper: string;
  ink: string;
  textColor: string;
  title: string;
  profileText: string;
  offlineTitle: string;
  offlineText: string;
  offlineLines: readonly string[];
};

const TURN = Math.PI * 2;
// fixed: peaks of the mountain ridge (x and height in parts), points of the waving flag
const PEAKS = [[0, 0.3], [0.12, 0.5], [0.25, 0.32], [0.4, 0.58], [0.55, 0.36], [0.7, 0.6], [0.85, 0.4], [1, 0.5]];
const FLAG_STEPS = 8;
// Rounded to two places, so frame 0 and the frame at the loop end are drawn exactly the same
const round = (value: number) => Math.round(value * 100) / 100 + 0; // + 0 turns -0 into 0

type Size = { width: number; height: number; horizon: number };

// Sky, sun, mountains, the hill with its shadow side, the radio mast and the flag that waves with the loop
function battlefield(context: CanvasRenderingContext2D, time: number, options: KothBannerOptions, size: Size, sky: [string, string]) {
  const { width, height, horizon } = size;
  const phase = (time / options.loop) * TURN;
  const gradient = context.createLinearGradient(0, 0, 0, horizon);
  gradient.addColorStop(0, sky[0]);
  gradient.addColorStop(1, sky[1]);
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
  context.fillStyle = options.sun;
  context.beginPath();
  context.arc(round(width * 0.82), round(horizon * 0.35), round(height * 0.07), 0, TURN);
  context.fill();
  context.fillStyle = options.mountain;
  context.beginPath();
  context.moveTo(0, horizon);
  for (const [x, peak] of PEAKS) context.lineTo(round(x * width), round(horizon - peak * height * 0.3));
  context.lineTo(width, horizon);
  context.fill();
  // The hill: light left half, shadow right half
  const top = horizon - height * 0.22;
  context.fillStyle = options.hill;
  context.beginPath();
  context.ellipse(width / 2, height, width * 0.6, height - top, 0, Math.PI, TURN);
  context.fill();
  context.fillStyle = options.hillDark;
  context.beginPath();
  context.ellipse(width / 2, height, width * 0.6, height - top, 0, Math.PI * 1.5, TURN);
  context.lineTo(width / 2, height);
  context.fill();
  // Radio mast and flag on the top
  const mast = height * 0.3;
  context.fillStyle = options.steel;
  context.fillRect(round(width / 2 - 4), round(top - mast), 8, round(mast));
  context.fillStyle = options.flag;
  context.beginPath();
  context.moveTo(round(width / 2 + 4), round(top - mast));
  for (let step = 0; step <= FLAG_STEPS; step++) {
    const along = (step / FLAG_STEPS) * mast * 0.6;
    context.lineTo(round(width / 2 + 4 + along), round(top - mast + mast * 0.03 * Math.sin(phase + step)));
  }
  context.lineTo(round(width / 2 + 4 + mast * 0.6), round(top - mast * 0.7));
  context.lineTo(round(width / 2 + 4), round(top - mast * 0.7));
  context.fill();
}

function centered(context: CanvasRenderingContext2D, text: string, y: number, width: number) {
  context.fillText(text, round((width - context.measureText(text).width) / 2), y);
}

export function drawKothProfileBanner(context: CanvasRenderingContext2D, time: number, options: KothBannerOptions) {
  const size = { width: 1200, height: 480, horizon: 330 };
  battlefield(context, time, options, size, [options.skyTop, options.skyBottom]);
  context.fillStyle = options.textColor;
  context.textBaseline = "middle";
  context.font = `400 90px "${options.titleFont}", sans-serif`;
  context.fillText(options.title, 60, 110);
  context.font = `600 32px "${options.font}", sans-serif`;
  context.fillText(options.profileText, 64, 180);
}

export function drawKothOfflineBanner(context: CanvasRenderingContext2D, time: number, options: KothBannerOptions) {
  const size = { width: 1920, height: 1080, horizon: 760 };
  battlefield(context, time, options, size, [options.eveningTop, options.eveningBottom]);
  // Briefing sheet in the middle, slightly tilted
  context.save();
  context.translate(960, 420);
  context.rotate(-0.02);
  context.fillStyle = options.paper;
  context.fillRect(-470, -240, 940, 480);
  context.fillStyle = options.ink;
  context.textBaseline = "middle";
  context.font = `400 104px "${options.titleFont}", sans-serif`;
  centered(context, options.offlineTitle, -110, 0);
  context.font = `600 40px "${options.font}", sans-serif`;
  centered(context, options.offlineText, 10, 0);
  context.font = `400 34px "${options.font}", sans-serif`;
  options.offlineLines.slice(0, 3).forEach((line, index) => centered(context, line, 90 + index * 52, 0));
  context.restore();
}
