// The profile and offline banners of the Kebab theme on a canvas (DESIGN-KEBAB.md "Banner"), built once per render.
// Profile: the chef at the spit under the arc title on paper, the shop name and a line below; the spit turns. Offline:
// the roller shutter is down, the arc title and "Heute geschlossen" stand on it, steam rises from under it. Both are
// still pictures (the dashboard saves a PNG), the steam stands at a fixed moment of its rise.
// Check: banners.check.ts.
import { arcLetters, type ArcText, type BuiltInk, drawArc, drawInk, inkOf, type InkStyle, type PlacedLetter } from "./clipInk.ts";
import { CHEF_PARTS, type ChefPart, chefParts, MEAT, SPIT_TOP, VIEW } from "./chef.ts";
import { type SteamLook, steamAt } from "./food.ts";
import { meatHatch } from "./hatch.ts";
import { shutterSlats } from "./shutter.ts";

export type BannerColors = { red: string; redText: string; paper: string; brown: string; muted: string; steam: string };
export type BannerLook = {
  width: number; height: number; steam: boolean; ink: InkStyle; colors: BannerColors; titleFont: string; font: string;
  arc: { text: string; size: number; span: number; stroke: number }; hatchRows: number; steamHeight: number; steamLook: SteamLook;
  layout: BannerLayout;
};
// Places of the settings as shares of the height: profile: the logo, the name and the line under it; offline: the logo
// and the text below it, the slats (px apart, px line) and the rail at the bottom (px) with their opacities
export type BannerLayout = {
  profile: { logoTop: number; logoHeight: number; title: number; titleSize: number; line: number; lineSize: number };
  offline: { logoTop: number; logoHeight: number; text: number; textSize: number; slat: number; slatLine: number; slatAlpha: number; rail: number; railAlpha: number };
};

type Draw = (context: CanvasRenderingContext2D) => void;

// fixed: the logo arc in the grid like ArcTitle.tsx, the strokes of the meat like Chef.tsx, the salts of the parts
const LOGO_ARC = { center: { x: 300, y: 640 }, radius: 470 };
const PERIOD = 42;
const HATCH_WIDTH = 2;
const STEAM_WIDTH = 2.4;
// fixed: the moment of the steam the still shows (s): the three wisps stand at a sixth, half and five sixths of
// their rise, so all of them show
const STEAM_AT = 0.52;
const SALT = 100;
// fixed: the parts behind the meat and in front of it
const BEHIND: readonly ChefPart[] = ["hat", "head", "face", "eyes", "stache", "body", "spit"];
const FRONT: readonly ChefPart[] = ["arm", "knife", "counter", "plate"];


// Grid of the logo to banner pixels: the VIEW of the grid scaled to a height, centered across
function logoBox(width: number, top: number, height: number) {
  const scale = height / VIEW.height;
  return { scale, left: (width - VIEW.width * scale) / 2 - VIEW.x * scale, top: top - VIEW.y * scale };
}

const arcOf = (look: BannerLook, colors: { fill: string; stroke: string }): ArcText => ({ ...look.arc, ...LOGO_ARC, font: look.titleFont, colors });

// The steam at a fixed moment of its rise
function steam(context: CanvasRenderingContext2D, look: BannerLook, from: { x: number; y: number }, color: string) {
  context.save();
  context.strokeStyle = color;
  context.lineWidth = STEAM_WIDTH;
  context.lineCap = "round";
  context.lineJoin = "round";
  for (const wisp of steamAt(STEAM_AT, { from, height: look.steamHeight, ...look.steamLook })) {
    context.globalAlpha = wisp.alpha;
    context.beginPath();
    wisp.points.forEach((point, index) => (index === 0 ? context.moveTo(point.x, point.y) : context.lineTo(point.x, point.y)));
    context.stroke();
  }
  context.restore();
}

function centered(context: CanvasRenderingContext2D, value: string, x: number, y: number, font: string, color: string) {
  context.font = font;
  context.textAlign = "center";
  context.textBaseline = "alphabetic";
  context.fillStyle = color;
  context.fillText(value, x, y);
}

export function makeProfile(look: BannerLook, texts: { title: string; line: string }): Draw {
  const place = look.layout.profile;
  const parts = chefParts();
  const ink = Object.fromEntries(CHEF_PARTS.map((name, index) => [name, inkOf(parts[name], look.ink, index * SALT)])) as Record<ChefPart, BuiltInk>;
  const meat = new Path2D(MEAT);
  const hatch = new Path2D(meatHatch(look.ink.seed, look.hatchRows, PERIOD));
  const box = logoBox(look.width, look.height * place.logoTop, look.height * place.logoHeight);
  const arc = arcOf(look, { fill: look.colors.paper, stroke: look.colors.red });
  const colors = { ink: look.colors.red, fill: look.colors.paper };
  let letters: PlacedLetter[] | null = null;
  return context => {
    letters ??= arcLetters(context, arc);
    context.fillStyle = look.colors.paper;
    context.fillRect(0, 0, look.width, look.height);
    context.save();
    context.translate(box.left, box.top);
    context.scale(box.scale, box.scale);
    drawArc(context, arc, letters);
    for (const name of BEHIND) drawInk(context, ink[name], colors);
    context.fillStyle = look.colors.paper;
    context.fill(meat);
    context.save();
    context.clip(meat);
    context.strokeStyle = look.colors.red;
    context.lineWidth = HATCH_WIDTH * look.ink.width;
    context.lineCap = "round";
    context.stroke(hatch);
    context.restore();
    drawInk(context, { ...ink.meat, fills: [] }, colors);
    for (const name of FRONT) drawInk(context, ink[name], colors);
    if (look.steam) steam(context, look, SPIT_TOP, look.colors.red);
    context.restore();
    centered(context, texts.title, look.width / 2, look.height * place.title, `${look.height * place.titleSize}px "${look.titleFont}"`, look.colors.redText);
    centered(context, texts.line, look.width / 2, look.height * place.line, `800 ${look.height * place.lineSize}px "${look.font}"`, look.colors.muted);
  };
}

export function makeOffline(look: BannerLook, title: string): Draw {
  const place = look.layout.offline;
  const box = logoBox(look.width, look.height * place.logoTop, look.height * place.logoHeight);
  const arc = arcOf(look, { fill: look.colors.brown, stroke: look.colors.paper });
  const slats = shutterSlats(look.height - place.rail, place.slat);
  // the steam comes out under the shutter in the middle, in grid units of the logo
  const steamFrom = { x: (look.width / 2 - box.left) / box.scale, y: (look.height - box.top) / box.scale };
  let letters: PlacedLetter[] | null = null;
  return context => {
    letters ??= arcLetters(context, arc);
    context.fillStyle = look.colors.brown;
    context.fillRect(0, 0, look.width, look.height);
    context.fillStyle = look.colors.paper;
    context.globalAlpha = place.slatAlpha;
    for (const y of slats) context.fillRect(0, y, look.width, place.slatLine);
    context.globalAlpha = place.railAlpha;
    context.fillRect(0, look.height - place.rail, look.width, place.slatLine);
    context.globalAlpha = 1;
    context.save();
    context.translate(box.left, box.top);
    context.scale(box.scale, box.scale);
    drawArc(context, arc, letters);
    if (look.steam) steam(context, look, steamFrom, look.colors.steam);
    context.restore();
    centered(context, title, look.width / 2, look.height * place.text, `${look.height * place.textSize}px "${look.titleFont}"`, look.colors.paper);
  };
}
