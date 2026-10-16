// Twitch-Banner des Südfrucht-Themes: Profilbanner (1200x480) als Strandpanorama am Tag mit Kanal-Name und Text,
// Offline-Banner (1920x1080) im Abendrot mit Holzschild für Titel, Text und Zeilen. Wellen, Glitzern und Palmen
// bewegen sich einmal pro Schleife im Kreis, darum läuft das GIF nahtlos. Reine Funktionen der Zeit.
// Check: banners.check.ts.
import { hash } from "../../core/hash.ts";

export type SuedfruchtBannerOptions = {
  loop: number; // Sekunden
  font: string;
  titleFont: string;
  skyTop: string;
  skyBottom: string;
  eveningTop: string;
  eveningBottom: string;
  sun: string;
  sea: string;
  seaDeep: string;
  foam: string;
  sand: string;
  palmLeaf: string;
  palmTrunk: string;
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
// fixed: Glitzerpunkte auf dem Wasser
const SPARKLES = 24;
// Auf zwei Stellen gerundet, damit Bild 0 und das Bild am Schleifenende exakt gleich gezeichnet werden
const round = (value: number) => Math.round(value * 100) / 100 + 0; // + 0 macht aus -0 eine 0

type Size = { width: number; height: number; horizon: number };

// Himmel, Sonne, Meer mit drei Wellen, Glitzern und Sandstreifen
function beach(context: CanvasRenderingContext2D, time: number, options: SuedfruchtBannerOptions, size: Size, sky: [string, string]) {
  const { width, height, horizon } = size;
  const phase = (time / options.loop) * TURN;
  const gradient = context.createLinearGradient(0, 0, 0, horizon);
  gradient.addColorStop(0, sky[0]);
  gradient.addColorStop(1, sky[1]);
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, horizon);
  context.fillStyle = options.sun;
  context.beginPath();
  context.arc(round(width * 0.78), round(horizon * 0.42), round(height * 0.1), 0, TURN);
  context.fill();
  context.fillStyle = options.seaDeep;
  context.fillRect(0, horizon, width, height - horizon);
  [options.seaDeep, options.sea, options.sea].forEach((color, layer) => {
    const top = horizon + (layer + 1) * (height - horizon) * 0.18;
    context.fillStyle = color;
    context.globalAlpha = layer === 0 ? 0.6 : 1;
    context.beginPath();
    context.moveTo(0, height);
    for (let x = 0; x <= width; x += width / 48) {
      context.lineTo(round(x), round(top + height * 0.012 * Math.sin((x / width) * TURN * 4 + phase * (layer % 2 ? 1 : -1))));
    }
    context.lineTo(width, height);
    context.fill();
  });
  context.globalAlpha = 1;
  context.fillStyle = options.foam;
  for (let index = 0; index < SPARKLES; index++) {
    context.globalAlpha = round(0.5 + 0.5 * Math.sin(phase + hash(index) * TURN));
    context.fillRect(round(hash(index + 100) * width), round(horizon + hash(index + 200) * (height - horizon) * 0.6), 3, 3);
  }
  context.globalAlpha = 1;
  context.fillStyle = options.sand;
  context.beginPath();
  context.ellipse(width / 2, height * 1.08, width * 0.7, height * 0.2, 0, 0, TURN);
  context.fill();
}

// Palme am Rand: Stamm und Blätter, die mit der Schleife wiegen
function palm(context: CanvasRenderingContext2D, time: number, options: SuedfruchtBannerOptions, x: number, scale: number, mirror: boolean) {
  context.save();
  context.translate(x, 0);
  context.scale(mirror ? -scale : scale, scale);
  context.rotate(round(0.03 * Math.sin((time / options.loop) * TURN)));
  context.fillStyle = options.palmTrunk;
  context.fillRect(-12, 120, 24, 600);
  context.fillStyle = options.palmLeaf;
  for (const [tipX, tipY] of [[-160, 200], [-120, 60], [40, 20], [170, 80], [190, 210]]) {
    context.beginPath();
    context.moveTo(0, 130);
    context.quadraticCurveTo(tipX / 2, tipY - 60, tipX, tipY);
    context.quadraticCurveTo(tipX / 2, tipY, 0, 140);
    context.fill();
  }
  context.restore();
}

function centered(context: CanvasRenderingContext2D, text: string, y: number, width: number) {
  context.fillText(text, round((width - context.measureText(text).width) / 2), y);
}

export function drawSuedfruchtProfileBanner(context: CanvasRenderingContext2D, time: number, options: SuedfruchtBannerOptions) {
  const size = { width: 1200, height: 480, horizon: 250 };
  beach(context, time, options, size, [options.skyTop, options.skyBottom]);
  palm(context, time, options, 70, 0.55, false);
  palm(context, time, options, 1130, 0.5, true);
  context.fillStyle = options.textColor;
  context.textBaseline = "middle";
  context.font = `400 96px "${options.titleFont}", cursive`;
  centered(context, options.title, 170, size.width);
  context.font = `600 34px "${options.font}", sans-serif`;
  centered(context, options.profileText, 270, size.width);
}

export function drawSuedfruchtOfflineBanner(context: CanvasRenderingContext2D, time: number, options: SuedfruchtBannerOptions) {
  const size = { width: 1920, height: 1080, horizon: 600 };
  beach(context, time, options, size, [options.eveningTop, options.eveningBottom]);
  palm(context, time, options, 160, 1, false);
  palm(context, time, options, 1760, 0.9, true);
  // Holzschild in der Mitte
  context.fillStyle = options.woodDark;
  context.fillRect(470, 230, 980, 520);
  context.fillStyle = options.wood;
  context.fillRect(486, 246, 948, 488);
  context.fillStyle = options.textOnWood;
  context.textBaseline = "middle";
  context.font = `400 110px "${options.titleFont}", cursive`;
  centered(context, options.offlineTitle, 360, size.width);
  context.font = `600 40px "${options.font}", sans-serif`;
  centered(context, options.offlineText, 480, size.width);
  context.font = `400 34px "${options.font}", sans-serif`;
  options.offlineLines.slice(0, 3).forEach((line, index) => centered(context, line, 560 + index * 52, size.width));
}
