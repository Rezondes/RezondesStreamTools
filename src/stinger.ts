// Stinger-Übergang für OBS. Reine Funktion der Zeit: gleiches t ergibt immer dasselbe Bild,
// darum lässt er sich Frame für Frame exakt rendern (siehe scenes/Stinger.tsx und vite.config.ts).
// Ablauf: Matrix-Spalten fallen herein und decken alles ab, Logo entschlüsselt sich,
// am Schnittpunkt CUT blitzt die Einschaltlinie, dann fallen die Spalten unten heraus.
import { LOGO } from "./scenes/Screen.tsx";
import { GLYPHS } from "./util.ts";

export const W = 1920;
export const H = 1080;
export const FPS = 60;
export const DURATION = 1.6; // Sekunden
export const CUT = 0.75; // Sekunden, in OBS als "Übergangspunkt" eintragen (750 ms)

const SIZE = 24;
const COLS = W / SIZE;
const ROWS = H / SIZE;
const FALL = 0.42; // Sekunden, die eine Spalte zum Herein- bzw. Herausfallen braucht

// Deterministischer Zufall aus einer Zahl, Ergebnis 0..1
export function hash(n: number) {
  let x = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b);
  x ^= x >>> 13;
  x = Math.imul(x, 0xc2b2ae35);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeIn = (p: number) => p * p;
export const glyphAt = (seed: number) => GLYPHS[(hash(seed) * GLYPHS.length) | 0];

export function drawStinger(ctx: CanvasRenderingContext2D, t: number) {
  ctx.clearRect(0, 0, W, H);
  ctx.textBaseline = "top";
  ctx.font = `${SIZE}px "Share Tech Mono", monospace`;
  const tick = Math.floor(t * 18); // Zeichen flackern 18-mal pro Sekunde

  for (let c = 0; c < COLS; c++) {
    // Spalten starten versetzt; am CUT sind alle unten angekommen, danach fallen sie heraus
    const inStart = hash(c) * (CUT - FALL - 0.02);
    const outStart = CUT + 0.08 + hash(c + 5000) * (DURATION - CUT - FALL - 0.1);
    const bottom = easeIn(clamp01((t - inStart) / FALL)) * H;
    const top = easeIn(clamp01((t - outStart) / FALL)) * H;
    if (bottom <= top) continue;

    const x = c * SIZE;
    ctx.fillStyle = "#000";
    ctx.fillRect(x, top, SIZE, bottom - top);

    // Die führende Kante leuchtet: beim Hereinfallen unten, beim Herausfallen oben
    const falling = bottom < H;
    const edge = falling ? bottom : top;
    for (let r = 0; r < ROWS; r++) {
      const y = r * SIZE;
      if (y + SIZE <= top || y >= bottom) continue;
      if (hash(c * 977 + r * 131) < 0.35) continue; // Lücken wie im echten Regen
      const d = Math.abs(edge - y) / SIZE; // Abstand zur Kante in Zeilen
      if (d < 1.5) { ctx.fillStyle = "#d8ffcc"; ctx.globalAlpha = 1; }
      else if (d < 5) { ctx.fillStyle = "#39FF14"; ctx.globalAlpha = 1; }
      else { ctx.fillStyle = "#1E9E0F"; ctx.globalAlpha = 0.35 + 0.5 * hash(c * 31 + r + tick); }
      ctx.fillText(glyphAt(c * 7919 + r * 104729 + tick), x + 4, y);
    }
    ctx.globalAlpha = 1;
  }

  drawLogo(ctx, t);
  drawFlash(ctx, t);
}

function drawLogo(ctx: CanvasRenderingContext2D, t: number) {
  const start = CUT - 0.3;
  const end = CUT + 0.45;
  if (t < start || t > end) return;
  const reveal = clamp01((t - start) / 0.28); // Anteil entschlüsselter Zeichen
  const alpha = clamp01((end - t) / 0.15);

  const lines = LOGO.split("\n");
  const size = 44;
  ctx.font = `${size}px "Share Tech Mono", monospace`;
  const charW = ctx.measureText("M").width;
  const lineH = size * 1.05;
  const width = Math.max(...lines.map(l => l.length)) * charW;
  const x0 = (W - width) / 2;
  const y0 = H / 2 - (lines.length * lineH) / 2 - 20;
  const tick = Math.floor(t * 30);

  // Schwarzes Fenster hinter dem Logo: zieht sich erst als Linie auf, dann in die Höhe
  const padX = 56;
  const boxW = (width + padX * 2) * clamp01((t - start) / 0.08);
  const boxH = (lines.length * lineH + 110) * Math.max(0.02, clamp01((t - start - 0.08) / 0.1));
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "#000";
  ctx.fillRect((W - boxW) / 2, y0 - 40 + (lines.length * lineH + 110 - boxH) / 2, boxW, boxH);
  ctx.strokeStyle = "#39FF14";
  ctx.lineWidth = 2;
  ctx.strokeRect((W - boxW) / 2, y0 - 40 + (lines.length * lineH + 110 - boxH) / 2, boxW, boxH);
  if (boxH < lines.length * lineH) { ctx.globalAlpha = 1; return; }

  ctx.shadowColor = "#39FF14";
  ctx.shadowBlur = 24;
  lines.forEach((line, row) => {
    // Glitch: einzelne Zeilen springen kurz zur Seite
    const shift = hash(tick * 13 + row) < 0.12 ? (hash(tick + row * 3) - 0.5) * 40 : 0;
    Array.from(line).forEach((ch, i) => {
      if (ch === " ") return;
      const order = hash(row * 100 + i); // jedes Zeichen löst sich zu einem anderen Zeitpunkt auf
      const solved = order < reveal;
      ctx.fillStyle = solved ? "#39FF14" : "#1E9E0F";
      ctx.fillText(solved ? ch : glyphAt(row * 1000 + i + tick), x0 + i * charW + shift, y0 + row * lineH);
    });
  });

  ctx.shadowBlur = 0;
  ctx.font = `28px "Share Tech Mono", monospace`;
  ctx.fillStyle = "#1E9E0F";
  const sub = "> SZENENWECHSEL";
  const shown = sub.slice(0, Math.floor(clamp01((t - start - 0.15) / 0.25) * sub.length));
  ctx.fillText(shown + (tick % 2 ? "█" : ""), x0, y0 + lines.length * lineH + 24);
  ctx.globalAlpha = 1;
}

// Die Einschaltlinie aus dem Portfolio genau am Schnittpunkt
function drawFlash(ctx: CanvasRenderingContext2D, t: number) {
  const p = (t - (CUT - 0.06)) / 0.2;
  if (p < 0 || p > 1) return;
  const widthP = clamp01(p / 0.4);
  const fade = 1 - clamp01((p - 0.4) / 0.6);
  const lineW = W * widthP;
  const lineH = 4 + 60 * clamp01((p - 0.3) / 0.7);
  ctx.globalAlpha = fade;
  ctx.shadowColor = "#39FF14";
  ctx.shadowBlur = 40;
  ctx.fillStyle = "#d8ffcc";
  ctx.fillRect((W - lineW) / 2, H / 2 - lineH / 2, lineW, lineH);
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
}
