// Stinger-Übergang für OBS. Reine Funktion der Zeit: gleiches t ergibt immer dasselbe Bild,
// darum lässt er sich Frame für Frame exakt rendern (siehe scenes/Stinger.tsx und vite.config.ts).
// Ablauf: Matrix-Spalten fallen herein und decken alles ab, Logo entschlüsselt sich,
// am Übergangspunkt (cut) blitzt die Einschaltlinie, dann fallen die Spalten unten heraus.
// Länge, Übergangspunkt, Texte, Farben und Schrift kommen über stingerOptions aus den Einstellungen.
import type { MatrixValues } from "./settings.ts";

export const W = 1920;
export const H = 1080;
export const FPS = 60;

export type StingerOptions = {
  duration: number; // Sekunden
  cut: number; // Sekunden, in OBS als "Übergangspunkt" eintragen
  fall: number; // Sekunden, die eine Spalte zum Herein- bzw. Herausfallen braucht
  column: number; // Spaltenbreite in px
  text: string;
  cursor: string;
  showLogo: boolean;
  logo: string;
  glyphs: string;
  font: string;
  background: string;
  accent: string;
  dim: string;
  flash: string;
};

export const stingerOptions = (values: MatrixValues): StingerOptions => ({
  duration: values.stingerDuration,
  cut: values.stingerCut,
  fall: values.stingerFall,
  column: values.stingerColumn,
  text: values.stingerText,
  cursor: values.cursor,
  showLogo: values.stingerLogo,
  logo: values.logo,
  glyphs: values.glyphs,
  font: values.font,
  background: values.background,
  accent: values.accent,
  dim: values.dim,
  flash: values.flash,
});

// Deterministischer Zufall aus einer Zahl, Ergebnis 0..1
export function hash(seed: number) {
  let mixed = Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b);
  mixed ^= mixed >>> 13;
  mixed = Math.imul(mixed, 0xc2b2ae35);
  mixed ^= mixed >>> 16;
  return (mixed >>> 0) / 4294967296;
}
const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const easeIn = (progress: number) => progress * progress;
// Zeichen aus dem Zeichensatz, für dasselbe seed immer dasselbe
export function glyphAt(seed: number, glyphs: string) {
  const list = Array.from(glyphs);
  return list[(hash(seed) * list.length) | 0] ?? "";
}

export function drawStinger(context: CanvasRenderingContext2D, t: number, options: StingerOptions) {
  const { cut, duration, fall, column } = options;
  const columns = Math.ceil(W / column);
  const rows = Math.ceil(H / column);
  context.clearRect(0, 0, W, H);
  context.textBaseline = "top";
  context.font = `${column}px "${options.font}", monospace`;
  const tick = Math.floor(t * 18); // Zeichen flackern 18-mal pro Sekunde

  for (let index = 0; index < columns; index++) {
    // Spalten starten versetzt; am cut sind alle unten angekommen, danach fallen sie heraus
    const inStart = hash(index) * Math.max(0, cut - fall - 0.02);
    const outStart = cut + 0.08 + hash(index + 5000) * Math.max(0, duration - cut - fall - 0.1);
    const bottom = easeIn(clamp01((t - inStart) / fall)) * H;
    const top = easeIn(clamp01((t - outStart) / fall)) * H;
    if (bottom <= top) continue;

    const x = index * column;
    context.fillStyle = options.background;
    context.fillRect(x, top, column, bottom - top);

    // Die führende Kante leuchtet: beim Hereinfallen unten, beim Herausfallen oben
    const edge = bottom < H ? bottom : top;
    for (let row = 0; row < rows; row++) {
      const y = row * column;
      if (y + column <= top || y >= bottom) continue;
      if (hash(index * 977 + row * 131) < 0.35) continue; // Lücken wie im echten Regen
      const distance = Math.abs(edge - y) / column; // Abstand zur Kante in Zeilen
      if (distance < 1.5) { context.fillStyle = options.flash; context.globalAlpha = 1; }
      else if (distance < 5) { context.fillStyle = options.accent; context.globalAlpha = 1; }
      else { context.fillStyle = options.dim; context.globalAlpha = 0.35 + 0.5 * hash(index * 31 + row + tick); }
      context.fillText(glyphAt(index * 7919 + row * 104729 + tick, options.glyphs), x + column / 6, y);
    }
    context.globalAlpha = 1;
  }

  if (options.showLogo) drawLogo(context, t, options);
  drawFlash(context, t, options);
}

function drawLogo(context: CanvasRenderingContext2D, t: number, options: StingerOptions) {
  const start = options.cut - 0.3;
  const end = options.cut + 0.45;
  if (t < start || t > end) return;
  const reveal = clamp01((t - start) / 0.28); // Anteil entschlüsselter Zeichen
  const alpha = clamp01((end - t) / 0.15);

  const lines = options.logo.split("\n");
  const size = 44;
  context.font = `${size}px "${options.font}", monospace`;
  const charWidth = context.measureText("M").width;
  const lineHeight = size * 1.05;
  const width = Math.max(...lines.map(line => line.length)) * charWidth;
  const left = (W - width) / 2;
  const topLine = H / 2 - (lines.length * lineHeight) / 2 - 20;
  const tick = Math.floor(t * 30);

  // Fenster hinter dem Logo: zieht sich erst als Linie auf, dann in die Höhe
  const padding = 56;
  const boxWidth = (width + padding * 2) * clamp01((t - start) / 0.08);
  const boxHeight = (lines.length * lineHeight + 110) * Math.max(0.02, clamp01((t - start - 0.08) / 0.1));
  const boxTop = topLine - 40 + (lines.length * lineHeight + 110 - boxHeight) / 2;
  context.globalAlpha = alpha;
  context.fillStyle = options.background;
  context.fillRect((W - boxWidth) / 2, boxTop, boxWidth, boxHeight);
  context.strokeStyle = options.accent;
  context.lineWidth = 2;
  context.strokeRect((W - boxWidth) / 2, boxTop, boxWidth, boxHeight);
  if (boxHeight < lines.length * lineHeight) { context.globalAlpha = 1; return; }

  context.shadowColor = options.accent;
  context.shadowBlur = 24;
  lines.forEach((line, row) => {
    // Glitch: einzelne Zeilen springen kurz zur Seite
    const shift = hash(tick * 13 + row) < 0.12 ? (hash(tick + row * 3) - 0.5) * 40 : 0;
    Array.from(line).forEach((char, index) => {
      if (char === " ") return;
      const solved = hash(row * 100 + index) < reveal; // jedes Zeichen löst sich zu einem anderen Zeitpunkt auf
      context.fillStyle = solved ? options.accent : options.dim;
      context.fillText(solved ? char : glyphAt(row * 1000 + index + tick, options.glyphs), left + index * charWidth + shift, topLine + row * lineHeight);
    });
  });

  context.shadowBlur = 0;
  context.font = `28px "${options.font}", monospace`;
  context.fillStyle = options.dim;
  const typed = options.text.slice(0, Math.floor(clamp01((t - start - 0.15) / 0.25) * options.text.length));
  context.fillText(typed + (tick % 2 ? options.cursor : ""), left, topLine + lines.length * lineHeight + 24);
  context.globalAlpha = 1;
}

// Die Einschaltlinie aus dem Portfolio genau am Übergangspunkt
function drawFlash(context: CanvasRenderingContext2D, t: number, options: StingerOptions) {
  const progress = (t - (options.cut - 0.06)) / 0.2;
  if (progress < 0 || progress > 1) return;
  const lineWidth = W * clamp01(progress / 0.4);
  const lineHeight = 4 + 60 * clamp01((progress - 0.3) / 0.7);
  context.globalAlpha = 1 - clamp01((progress - 0.4) / 0.6);
  context.shadowColor = options.accent;
  context.shadowBlur = 40;
  context.fillStyle = options.flash;
  context.fillRect((W - lineWidth) / 2, H / 2 - lineHeight / 2, lineWidth, lineHeight);
  context.shadowBlur = 0;
  context.globalAlpha = 1;
}
