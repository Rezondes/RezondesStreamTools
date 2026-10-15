// Twitch-Banner als GIF: Profilbanner (1200x480) und Offline-Banner des Video-Players (1920x1080).
// Wie der Stinger eine reine Funktion der Zeit; alle Bewegungen wiederholen sich exakt nach loop Sekunden,
// darum läuft das GIF ohne Sprung in Endlosschleife. Texte, Farben, Schrift, Schleifenlänge und Regen-Dichte
// kommen über bannerOptions aus den Einstellungen.
import { fillTemplate } from "../../core/template.ts";
import type { MatrixValues } from "./settings.ts";
import { glyphAt, hash } from "./stinger.ts";

export type BannerOptions = {
  loop: number; // Sekunden
  profileFps: number;
  offlineFps: number;
  density: number; // Anteil der Spalten mit Regen, 0..1
  scanlines: number; // Deckkraft der Scanlines, 0 = aus
  font: string;
  logo: string;
  glyphs: string;
  cursor: string;
  background: string;
  accent: string;
  dim: string;
  line: string;
  highlight: string;
  flash: string;
  profileText: string;
  profileSub: string;
  offlineHeader: string;
  offlineStatus: string;
  offlineTitle: string;
  offlineText: string;
  offlineLines: readonly string[];
  prompt: string;
};

// login: Twitch-Login für {login} in Prompt und Kopfzeile
export function bannerOptions(values: MatrixValues, login: string): BannerOptions {
  const names = { channel: values.channelName, login };
  return {
    loop: values.bannerLoop,
    profileFps: values.bannerProfileFps,
    offlineFps: values.bannerOfflineFps,
    density: values.bannerRainDensity / 100,
    scanlines: values.scanlines ? values.scanlineStrength : 0,
    font: values.font,
    logo: values.logo,
    glyphs: values.glyphs,
    cursor: values.cursor,
    background: values.background,
    accent: values.accent,
    dim: values.dim,
    line: values.line,
    highlight: values.highlight,
    flash: values.flash,
    profileText: values.bannerProfileText,
    profileSub: values.bannerProfileSub,
    offlineHeader: fillTemplate(values.sceneHeader, { ...names, scene: "offline" }),
    offlineStatus: values.bannerOfflineStatus,
    offlineTitle: values.bannerOfflineTitle,
    offlineText: values.bannerOfflineText,
    offlineLines: values.bannerOfflineLines,
    prompt: fillTemplate(values.prompt, names),
  };
}

// Kurze Zeitfenster innerhalb der Schleife (Anteile von loop), in denen etwas glitcht
const within = (time: number, loop: number, windows: [number, number][]) => windows.some(([from, to]) => time > from * loop && time < to * loop);

// Matrix-Regen, der nach loop Sekunden wieder genau gleich aussieht:
// jede Spalte läuft in dieser Zeit eine ganze Zahl von Durchgängen
function rain(context: CanvasRenderingContext2D, time: number, width: number, height: number, size: number, alpha: number, options: BannerOptions) {
  const columns = Math.ceil(width / size);
  const rows = Math.ceil(height / size);
  const tick = Math.floor(time * 8); // 8 Zeichenwechsel pro Sekunde
  context.font = `${size}px "${options.font}", monospace`;
  context.textBaseline = "top";
  for (let column = 0; column < columns; column++) {
    if (hash(column * 13 + 5) >= options.density) continue;
    const length = 8 + ((hash(column * 3 + 1) * 18) | 0);
    const span = rows + length;
    const cycles = 1 + ((hash(column * 7 + 2) * 2) | 0);
    const head = Math.floor((hash(column * 11 + 3) * span + (time / options.loop) * cycles * span) % span);
    for (let tail = 0; tail < length; tail++) {
      const row = head - tail;
      if (row < 0 || row >= rows) continue;
      context.globalAlpha = alpha * (1 - tail / length);
      context.fillStyle = tail === 0 ? options.flash : tail < 4 ? options.accent : options.dim;
      context.fillText(glyphAt(column * 7919 + row * 104729 + tick, options.glyphs), column * size, row * size);
    }
  }
  context.globalAlpha = 1;
}

function scanlines(context: CanvasRenderingContext2D, width: number, height: number, options: BannerOptions) {
  if (!options.scanlines) return;
  context.globalAlpha = options.scanlines;
  context.fillStyle = options.background;
  for (let y = 0; y < height; y += 3) context.fillRect(0, y, width, 1);
  context.globalAlpha = 1;
}

function text(context: CanvasRenderingContext2D, options: BannerOptions, content: string, x: number, y: number, size: number, color: string, glow = 0) {
  context.font = `${size}px "${options.font}", monospace`;
  context.textBaseline = "top";
  context.fillStyle = color;
  context.shadowColor = options.accent;
  context.shadowBlur = glow;
  context.fillText(content, x, y);
  context.shadowBlur = 0;
}

// ASCII-Logo mit gelegentlichem Zeilen-Glitch (zwei kurze Zuckungen pro Schleife)
function logo(context: CanvasRenderingContext2D, time: number, centerX: number, y: number, size: number, options: BannerOptions) {
  const lines = options.logo.split("\n");
  context.font = `${size}px "${options.font}", monospace`;
  const charWidth = context.measureText("M").width;
  const left = centerX - (Math.max(...lines.map(line => line.length)) * charWidth) / 2;
  const glitching = within(time, options.loop, [[0.3, 0.33], [0.775, 0.795]]);
  lines.forEach((line, row) => {
    const frame = Math.floor(time * 30);
    const shift = glitching && hash(row + frame) < 0.5 ? (hash(row * 5 + frame) - 0.5) * size * 1.4 : 0;
    text(context, options, line, left + shift, y + row * size * 1.05, size, options.accent, size * 0.5);
  });
  return { left, bottom: y + lines.length * size * 1.05 };
}

// Rahmen mit hellen Ecken wie beim Webcam-Rahmen
function frame(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, corner: number, options: BannerOptions) {
  context.globalAlpha = 0.82;
  context.fillStyle = options.background;
  context.fillRect(x, y, width, height);
  context.globalAlpha = 1;
  context.strokeStyle = options.dim;
  context.lineWidth = 2;
  context.strokeRect(x, y, width, height);
  context.strokeStyle = options.accent;
  context.lineWidth = 5;
  context.shadowColor = options.accent;
  context.shadowBlur = 12;
  for (const [cornerX, cornerY, directionX, directionY] of [[x, y, 1, 1], [x + width, y, -1, 1], [x, y + height, 1, -1], [x + width, y + height, -1, -1]]) {
    context.beginPath();
    context.moveTo(cornerX, cornerY + directionY * corner);
    context.lineTo(cornerX, cornerY);
    context.lineTo(cornerX + directionX * corner, cornerY);
    context.stroke();
  }
  context.shadowBlur = 0;
}

const blink = (time: number) => Math.floor(time * 2) % 2 === 0;

// Profilbanner 1200x480. Unten links legt Twitch je nach Ansicht Profilbild und Name darüber,
// darum sitzt alles Wichtige mittig und oben.
export function drawProfileBanner(context: CanvasRenderingContext2D, time: number, options: BannerOptions) {
  const width = 1200, height = 480;
  context.fillStyle = options.background;
  context.fillRect(0, 0, width, height);
  rain(context, time, width, height, 16, 0.55, options);
  frame(context, 170, 70, 860, 300, 28, options);
  const placed = logo(context, time, width / 2, 110, 26, options);
  text(context, options, options.profileText + (blink(time) ? options.cursor : ""), placed.left, placed.bottom + 30, 26, options.accent, 8);
  text(context, options, options.profileSub, placed.left, placed.bottom + 72, 20, options.dim);
  scanlines(context, width, height, options);
}

// Offline-Banner 1920x1080, im Stil der Starting-/Ending-Szenen
export function drawOfflineBanner(context: CanvasRenderingContext2D, time: number, options: BannerOptions) {
  const width = 1920, height = 1080;
  context.fillStyle = options.background;
  context.fillRect(0, 0, width, height);
  rain(context, time, width, height, 22, 0.4, options);

  const boxX = 260, boxY = 150, boxWidth = 1400, boxHeight = 780;
  frame(context, boxX, boxY, boxWidth, boxHeight, 40, options);
  text(context, options, options.offlineHeader, boxX + 48, boxY + 26, 24, options.dim);
  if (blink(time)) text(context, options, options.offlineStatus, boxX + boxWidth - 200, boxY + 26, 24, options.accent, 6);
  context.fillStyle = options.line;
  context.fillRect(boxX + 48, boxY + 70, boxWidth - 96, 2);

  const placed = logo(context, time, width / 2, boxY + 120, 32, options);
  // Titel mit kurzem Farbversatz-Glitch
  context.font = `110px "${options.font}", monospace`;
  const titleX = width / 2 - context.measureText(options.offlineTitle).width / 2;
  const titleY = placed.bottom + 50;
  if (within(time, options.loop, [[0.5, 0.53], [0.9, 0.915]])) {
    text(context, options, options.offlineTitle, titleX - 6, titleY, 110, options.highlight);
    text(context, options, options.offlineTitle, titleX + 6, titleY, 110, options.line);
  }
  text(context, options, options.offlineTitle, titleX, titleY, 110, options.accent, 30);

  context.font = `30px "${options.font}", monospace`;
  text(context, options, options.offlineText, width / 2 - context.measureText(options.offlineText).width / 2, titleY + 150, 30, options.dim);

  // Terminal unten, die letzte Zeile mit Cursor
  const lines = options.offlineLines;
  context.fillStyle = options.line;
  context.fillRect(boxX + 48, boxY + boxHeight - 180, boxWidth - 96, 2);
  lines.forEach((line, index) => text(context, options, `${options.prompt} ${line}`, boxX + 48, boxY + boxHeight - 160 + index * 40, 26, index === lines.length - 1 ? options.accent : options.dim));
  context.font = `26px "${options.font}", monospace`;
  const lastWidth = context.measureText(`${options.prompt} ${lines.at(-1) ?? ""} `).width;
  if (blink(time) && lines.length) text(context, options, options.cursor, boxX + 48 + lastWidth, boxY + boxHeight - 160 + (lines.length - 1) * 40, 26, options.accent);

  scanlines(context, width, height, options);
}
