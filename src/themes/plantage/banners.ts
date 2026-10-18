// Twitch banners of the Plantage theme: profile banner (1200x480) as a mango field by day with channel name and text,
// offline banner (1920x1080) in the evening with a crate sign for title, text and lines. The trees sway once per loop,
// so the GIF loops seamlessly. Pure functions of time. Check: banners.check.ts.

export type PlantageBannerOptions = {
  loop: number; // seconds
  font: string;
  titleFont: string;
  skyTop: string;
  skyBottom: string;
  eveningTop: string;
  eveningBottom: string;
  sun: string;
  hill: string;
  soil: string;
  soilDark: string;
  leaf: string;
  trunk: string;
  mango: string;
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

const TURN = Math.PI * 2;
// fixed: trees per row, furrows in the soil
const TREES = 7;
const FURROWS = 5;
// Rounded to two places, so frame 0 and the frame at the loop end are drawn exactly the same
const round = (value: number) => Math.round(value * 100) / 100 + 0; // + 0 turns -0 into 0

type Size = { width: number; height: number; horizon: number };

// Sky, sun, a hill, furrowed soil and a row of mango trees with mangos that sway with the loop
function field(context: CanvasRenderingContext2D, time: number, options: PlantageBannerOptions, size: Size, sky: [string, string]) {
  const { width, height, horizon } = size;
  const phase = (time / options.loop) * TURN;
  const gradient = context.createLinearGradient(0, 0, 0, horizon);
  gradient.addColorStop(0, sky[0]);
  gradient.addColorStop(1, sky[1]);
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, horizon);
  context.fillStyle = options.sun;
  context.beginPath();
  context.arc(round(width * 0.8), round(horizon * 0.4), round(height * 0.09), 0, TURN);
  context.fill();
  context.fillStyle = options.hill;
  context.beginPath();
  context.ellipse(width * 0.3, horizon, width * 0.5, height * 0.12, 0, 0, TURN);
  context.fill();
  context.fillStyle = options.soil;
  context.fillRect(0, horizon, width, height - horizon);
  context.fillStyle = options.soilDark;
  for (let index = 0; index < FURROWS; index++) {
    context.fillRect(0, round(horizon + ((index + 0.5) / FURROWS) * (height - horizon)), width, round(height * 0.012));
  }
  for (let index = 0; index < TREES; index++) {
    const x = ((index + 0.5) / TREES) * width;
    tree(context, round(x), horizon, height * 0.22, round(0.04 * Math.sin(phase + index)), options);
  }
}

// A mango tree standing on base: trunk, round crown and three mangos, tilted by sway
function tree(context: CanvasRenderingContext2D, x: number, base: number, size: number, sway: number, options: PlantageBannerOptions) {
  context.save();
  context.translate(x, base);
  context.rotate(sway);
  context.fillStyle = options.trunk;
  context.fillRect(round(-size * 0.07), round(-size * 0.8), round(size * 0.14), round(size * 0.8));
  context.fillStyle = options.leaf;
  context.beginPath();
  context.ellipse(0, round(-size), round(size * 0.55), round(size * 0.42), 0, 0, TURN);
  context.fill();
  context.fillStyle = options.mango;
  for (const [dx, dy] of [[-0.25, -0.8], [0.2, -0.9], [0, -0.7]]) {
    context.beginPath();
    context.ellipse(round(dx * size), round(dy * size), round(size * 0.07), round(size * 0.09), 0, 0, TURN);
    context.fill();
  }
  context.restore();
}

function centered(context: CanvasRenderingContext2D, text: string, y: number, width: number) {
  context.fillText(text, round((width - context.measureText(text).width) / 2), y);
}

export function drawPlantageProfileBanner(context: CanvasRenderingContext2D, time: number, options: PlantageBannerOptions) {
  const size = { width: 1200, height: 480, horizon: 330 };
  field(context, time, options, size, [options.skyTop, options.skyBottom]);
  context.fillStyle = options.textColor;
  context.textBaseline = "middle";
  context.font = `700 96px "${options.titleFont}", sans-serif`;
  centered(context, options.title, 130, size.width);
  context.font = `600 34px "${options.font}", sans-serif`;
  centered(context, options.profileText, 220, size.width);
}

export function drawPlantageOfflineBanner(context: CanvasRenderingContext2D, time: number, options: PlantageBannerOptions) {
  const size = { width: 1920, height: 1080, horizon: 720 };
  field(context, time, options, size, [options.eveningTop, options.eveningBottom]);
  // Crate sign in the middle: dark frame, planks with joints
  context.fillStyle = options.woodDark;
  context.fillRect(470, 200, 980, 520);
  context.fillStyle = options.wood;
  for (let plank = 0; plank < 4; plank++) context.fillRect(490, 220 + plank * 122, 940, 114);
  context.fillStyle = options.textOnWood;
  context.textBaseline = "middle";
  context.font = `700 110px "${options.titleFont}", sans-serif`;
  centered(context, options.offlineTitle, 330, size.width);
  context.font = `600 40px "${options.font}", sans-serif`;
  centered(context, options.offlineText, 450, size.width);
  context.font = `400 34px "${options.font}", sans-serif`;
  options.offlineLines.slice(0, 3).forEach((line, index) => centered(context, line, 530 + index * 52, size.width));
}
