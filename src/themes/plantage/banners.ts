// Twitch banners of the Plantage theme: profile banner (1200x480) as a mango field by day with channel name and text,
// offline banner (1920x1080) in the evening with a crate sign for title, text and lines. Drawn like the illustrated
// backdrop: sun with a glow, hills that fade into the sky, soil in light and shade with furrows toward the horizon,
// trees with three-tone crowns, glowing mangos and a shadow on the soil. The trees sway once per loop, so the GIF loops
// seamlessly. Pure functions of time. Check: banners.check.ts.

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
  hillFar: string;
  soil: string;
  soilDark: string;
  leaf: string;
  leafDark: string;
  trunk: string;
  mango: string;
  blush: string;
  paper: string;
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
const FURROWS = 9;
// fixed: crown puffs as [x, y, radius] in crown units (shade layer, mid layer, light layer toward the sun)
const CROWN = [
  [[-0.32, 0.08, 0.36], [0.3, 0.1, 0.36], [0, 0.16, 0.4]],
  [[-0.22, -0.08, 0.34], [0.22, -0.04, 0.34], [0, -0.2, 0.32]],
  [[-0.16, -0.24, 0.2], [0.06, -0.3, 0.16]],
] as const;
// fixed: mangos in the crown in crown units
const FRUITS = [[-0.28, 0.2], [0.24, 0.26], [0.02, 0.32]] as const;
// Rounded to two places, so frame 0 and the frame at the loop end are drawn exactly the same
const round = (value: number) => Math.round(value * 100) / 100 + 0; // + 0 turns -0 into 0

type Size = { width: number; height: number; horizon: number };

function disc(context: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  context.beginPath();
  context.arc(round(x), round(y), round(radius), 0, TURN);
  context.fill();
}

// Sky gradient, the sun with a soft glow, two hill lines that fade into the sky
function sky(context: CanvasRenderingContext2D, options: PlantageBannerOptions, size: Size, colors: [string, string]) {
  const { width, height, horizon } = size;
  const gradient = context.createLinearGradient(0, 0, 0, horizon);
  gradient.addColorStop(0, colors[0]);
  gradient.addColorStop(1, colors[1]);
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, horizon);
  // The sun: a disc in a glow that fades out into the sky
  const [sunX, sunY, sunRadius] = [round(width * 0.8), round(horizon * 0.42), round(height * 0.08)];
  const glow = context.createRadialGradient(sunX, sunY, sunRadius, sunX, sunY, sunRadius * 3);
  glow.addColorStop(0, options.sun);
  glow.addColorStop(1, "transparent");
  context.fillStyle = glow;
  context.globalAlpha = 0.5;
  disc(context, sunX, sunY, sunRadius * 3);
  context.globalAlpha = 1;
  context.fillStyle = options.sun;
  disc(context, sunX, sunY, sunRadius);
  for (const [color, top, haze] of [[options.hillFar, 0.86, 0.4], [options.hill, 0.94, 0.15]] as const) {
    context.globalAlpha = 1;
    context.fillStyle = color;
    context.beginPath();
    context.moveTo(0, horizon);
    for (let step = 0; step <= 16; step++) {
      const x = (step / 16) * width;
      context.lineTo(round(x), round(horizon * top + Math.sin((x / width) * TURN * 1.5 + top * 9) * height * 0.03));
    }
    context.lineTo(width, horizon);
    context.fill();
    // Atmospheric depth: the farther the hill, the more sky lies over it
    context.globalAlpha = haze;
    context.fillStyle = colors[1];
    context.fill();
  }
  context.globalAlpha = 1;
}

// Soil from light at the horizon to dark in front, furrows running toward a vanishing point at the horizon
function soil(context: CanvasRenderingContext2D, options: PlantageBannerOptions, size: Size) {
  const { width, height, horizon } = size;
  const gradient = context.createLinearGradient(0, horizon, 0, height);
  gradient.addColorStop(0, options.soil);
  gradient.addColorStop(1, options.soilDark);
  context.fillStyle = gradient;
  context.fillRect(0, horizon, width, height - horizon);
  context.strokeStyle = options.soilDark;
  context.lineWidth = round(height * 0.008);
  context.globalAlpha = 0.45;
  for (let index = 0; index <= FURROWS; index++) {
    const end = (index / FURROWS) * width * 1.6 - width * 0.3;
    context.beginPath();
    context.moveTo(round(width / 2 + (end - width / 2) * 0.12), horizon);
    context.lineTo(round(end), height);
    context.stroke();
  }
  context.globalAlpha = 1;
}

// A mango tree standing on base: shadow on the soil, trunk, crown in three tones, glowing mangos; tilted by sway
function tree(context: CanvasRenderingContext2D, x: number, base: number, size: number, sway: number, options: PlantageBannerOptions) {
  context.fillStyle = options.soilDark;
  context.globalAlpha = 0.35;
  context.beginPath();
  context.ellipse(x, base, round(size * 0.5), round(size * 0.08), 0, 0, TURN);
  context.fill();
  context.globalAlpha = 1;
  context.save();
  context.translate(x, base);
  context.rotate(sway);
  context.fillStyle = options.trunk;
  context.fillRect(round(-size * 0.07), round(-size * 0.8), round(size * 0.14), round(size * 0.8));
  const crown = -size;
  CROWN.forEach((layer, index) => {
    context.fillStyle = index === 0 ? options.leafDark : options.leaf;
    for (const [dx, dy, radius] of layer) disc(context, dx * size, crown + dy * size, radius * size);
  });
  // The light layer again, lit by the sun
  context.fillStyle = options.sun;
  context.globalAlpha = 0.18;
  for (const [dx, dy, radius] of CROWN[2]) disc(context, dx * size, crown + dy * size, radius * size);
  context.globalAlpha = 1;
  for (const [dx, dy] of FRUITS) {
    const fruitX = round(dx * size);
    const fruitY = round(crown + dy * size);
    const glow = context.createRadialGradient(round(fruitX - size * 0.02), round(fruitY - size * 0.03), 0, fruitX, fruitY, round(size * 0.1));
    glow.addColorStop(0, options.mango);
    glow.addColorStop(1, options.blush);
    context.fillStyle = glow;
    context.beginPath();
    context.ellipse(fruitX, fruitY, round(size * 0.07), round(size * 0.09), 0, 0, TURN);
    context.fill();
  }
  context.restore();
}

// The whole field: sky, soil and a row of trees that sway with the loop
function field(context: CanvasRenderingContext2D, time: number, options: PlantageBannerOptions, size: Size, colors: [string, string]) {
  const phase = (time / options.loop) * TURN;
  sky(context, options, size, colors);
  soil(context, options, size);
  for (let index = 0; index < TREES; index++) {
    const x = ((index + 0.5) / TREES) * size.width;
    tree(context, round(x), size.horizon, size.height * 0.22, round(0.04 * Math.sin(phase + index)), options);
  }
}

function centered(context: CanvasRenderingContext2D, text: string, y: number, width: number) {
  context.fillText(text, round((width - context.measureText(text).width) / 2), y);
}

// Text that stands on the picture: a soft shadow lifts it off the field
function lifted(context: CanvasRenderingContext2D, color: string, shadow: string, blur: number) {
  context.fillStyle = color;
  context.shadowColor = shadow;
  context.shadowBlur = blur;
  context.shadowOffsetY = blur / 4;
}

export function drawPlantageProfileBanner(context: CanvasRenderingContext2D, time: number, options: PlantageBannerOptions) {
  const size = { width: 1200, height: 480, horizon: 330 };
  field(context, time, options, size, [options.skyTop, options.skyBottom]);
  context.save();
  lifted(context, options.textColor, options.soilDark, 24);
  context.textBaseline = "middle";
  context.font = `700 96px "${options.titleFont}", sans-serif`;
  centered(context, options.title, 130, size.width);
  context.font = `600 34px "${options.font}", sans-serif`;
  centered(context, options.profileText, 220, size.width);
  context.restore();
}

// Crate sign: lit planks with soft joints, rounded, with a soft shadow on the field
function crateSign(context: CanvasRenderingContext2D, options: PlantageBannerOptions) {
  const [left, top, width, height, planks] = [470, 200, 980, 520, 4];
  context.save();
  context.shadowColor = options.soilDark;
  context.shadowBlur = 60;
  context.shadowOffsetY = 24;
  const wood = context.createLinearGradient(0, top, 0, top + height);
  wood.addColorStop(0, options.wood);
  wood.addColorStop(1, options.woodDark);
  context.fillStyle = wood;
  context.beginPath();
  context.roundRect(left, top, width, height, 28);
  context.fill();
  context.restore();
  context.fillStyle = options.wood;
  context.globalAlpha = 0.55;
  for (let plank = 0; plank < planks; plank++) {
    context.beginPath();
    context.roundRect(left + 16, top + 16 + plank * 124, width - 32, 114, 12);
    context.fill();
  }
  context.globalAlpha = 1;
}

export function drawPlantageOfflineBanner(context: CanvasRenderingContext2D, time: number, options: PlantageBannerOptions) {
  const size = { width: 1920, height: 1080, horizon: 720 };
  field(context, time, options, size, [options.eveningTop, options.eveningBottom]);
  crateSign(context, options);
  context.save();
  lifted(context, options.textOnWood, options.paper, 12);
  context.textBaseline = "middle";
  context.font = `700 110px "${options.titleFont}", sans-serif`;
  centered(context, options.offlineTitle, 330, size.width);
  context.font = `600 40px "${options.font}", sans-serif`;
  centered(context, options.offlineText, 450, size.width);
  context.font = `400 34px "${options.font}", sans-serif`;
  options.offlineLines.slice(0, 3).forEach((line, index) => centered(context, line, 530 + index * 52, size.width));
  context.restore();
}
