// Twitch-Banner als GIF: Profilbanner (1200x480) und Offline-Banner des Video-Players (1920x1080).
// Wie der Stinger eine reine Funktion der Zeit; alle Bewegungen wiederholen sich exakt nach
// LOOP Sekunden, darum läuft das GIF ohne Sprung in Endlosschleife.
import { LOGO } from "./scenes/Screen.tsx";
import { glyphAt, hash } from "./stinger.ts";

export const LOOP = 4; // Sekunden

const FONT = '"Share Tech Mono", monospace';
const GREEN = "#39FF14";
const DIM = "#1E9E0F";
const LINE = "#0E4D07";

// Matrix-Regen, der nach LOOP Sekunden wieder genau gleich aussieht:
// jede Spalte läuft in dieser Zeit eine ganze Zahl von Durchgängen
function rain(ctx: CanvasRenderingContext2D, t: number, w: number, h: number, size: number, alpha: number) {
  const cols = Math.ceil(w / size);
  const rows = Math.ceil(h / size);
  const tick = Math.floor(t * 8); // 8 Zeichenwechsel pro Sekunde
  ctx.font = `${size}px ${FONT}`;
  ctx.textBaseline = "top";
  for (let c = 0; c < cols; c++) {
    const len = 8 + ((hash(c * 3 + 1) * 18) | 0);
    const span = rows + len;
    const cycles = 1 + ((hash(c * 7 + 2) * 2) | 0);
    const head = Math.floor((hash(c * 11 + 3) * span + (t / LOOP) * cycles * span) % span);
    for (let k = 0; k < len; k++) {
      const row = head - k;
      if (row < 0 || row >= rows) continue;
      ctx.globalAlpha = alpha * (1 - k / len);
      ctx.fillStyle = k === 0 ? "#d8ffcc" : k < 4 ? GREEN : DIM;
      ctx.fillText(glyphAt(c * 7919 + row * 104729 + tick), c * size, row * size);
    }
  }
  ctx.globalAlpha = 1;
}

function scanlines(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);
}

function text(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, size: number, color: string, glow = 0) {
  ctx.font = `${size}px ${FONT}`;
  ctx.textBaseline = "top";
  ctx.fillStyle = color;
  ctx.shadowColor = GREEN;
  ctx.shadowBlur = glow;
  ctx.fillText(s, x, y);
  ctx.shadowBlur = 0;
}

// ASCII-Logo mit gelegentlichem Zeilen-Glitch (zwei kurze Zuckungen pro Schleife)
function logo(ctx: CanvasRenderingContext2D, t: number, cx: number, y: number, size: number) {
  const lines = LOGO.split("\n");
  ctx.font = `${size}px ${FONT}`;
  const charW = ctx.measureText("M").width;
  const x0 = cx - (Math.max(...lines.map(l => l.length)) * charW) / 2;
  const glitching = (t > 1.2 && t < 1.32) || (t > 3.1 && t < 3.18);
  lines.forEach((line, row) => {
    const shift = glitching && hash(row + Math.floor(t * 30)) < 0.5 ? (hash(row * 5 + Math.floor(t * 30)) - 0.5) * size * 1.4 : 0;
    text(ctx, line, x0 + shift, y + row * size * 1.05, size, GREEN, size * 0.5);
  });
  return { x0, bottom: y + lines.length * size * 1.05 };
}

// Rahmen mit hellen Ecken wie beim Webcam-Rahmen
function frame(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, corner: number) {
  ctx.fillStyle = "rgba(0,0,0,0.82)";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = DIM;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
  ctx.strokeStyle = GREEN;
  ctx.lineWidth = 5;
  ctx.shadowColor = GREEN;
  ctx.shadowBlur = 12;
  for (const [px, py, dx, dy] of [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]]) {
    ctx.beginPath();
    ctx.moveTo(px, py + dy * corner);
    ctx.lineTo(px, py);
    ctx.lineTo(px + dx * corner, py);
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
}

const blink = (t: number) => Math.floor(t * 2) % 2 === 0;

// Profilbanner 1200x480. Unten links legt Twitch je nach Ansicht Profilbild und Name darüber,
// darum sitzt alles Wichtige mittig und oben.
export function drawProfileBanner(ctx: CanvasRenderingContext2D, t: number) {
  const w = 1200, h = 480;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, w, h);
  rain(ctx, t, w, h, 16, 0.55);
  frame(ctx, 170, 70, 860, 300, 28);
  const l = logo(ctx, t, w / 2, 110, 26);
  text(ctx, "> just a dude who loves programming" + (blink(t) ? "█" : ""), l.x0, l.bottom + 30, 26, GREEN, 8);
  text(ctx, "C# · .NET · TypeScript · Games", l.x0, l.bottom + 72, 20, DIM);
  scanlines(ctx, w, h);
}

// Offline-Banner 1920x1080, im Stil der Starting-/Ending-Szenen
export function drawOfflineBanner(ctx: CanvasRenderingContext2D, t: number) {
  const w = 1920, h = 1080;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, w, h);
  rain(ctx, t, w, h, 22, 0.4);

  const bx = 260, by = 150, bw = 1400, bh = 780;
  frame(ctx, bx, by, bw, bh, 40);
  text(ctx, "REZONDES://stream/offline", bx + 48, by + 26, 24, DIM);
  if (blink(t)) text(ctx, "○ OFFLINE", bx + bw - 200, by + 26, 24, GREEN, 6);
  ctx.fillStyle = LINE;
  ctx.fillRect(bx + 48, by + 70, bw - 96, 2);

  const l = logo(ctx, t, w / 2, by + 120, 32);
  // Titel mit kurzem Farbversatz-Glitch
  const title = "STREAM OFFLINE";
  ctx.font = `110px ${FONT}`;
  const tx = w / 2 - ctx.measureText(title).width / 2;
  const ty = l.bottom + 50;
  if ((t > 2.0 && t < 2.12) || (t > 3.6 && t < 3.66)) {
    text(ctx, title, tx - 6, ty, 110, "#b6ff9e");
    text(ctx, title, tx + 6, ty, 110, LINE);
  }
  text(ctx, title, tx, ty, 110, GREEN, 30);

  const msg = "> Folge dem Kanal, dann verpasst du den nächsten Stream nicht.";
  ctx.font = `30px ${FONT}`;
  text(ctx, msg, w / 2 - ctx.measureText(msg).width / 2, ty + 150, 30, DIM);

  // Terminal unten
  const lines = ["connection closed by remote host", "saving session ... ok", "awaiting next broadcast"];
  ctx.fillStyle = LINE;
  ctx.fillRect(bx + 48, by + bh - 180, bw - 96, 2);
  lines.forEach((s, i) => text(ctx, `root@rezondes:~$ ${s}`, bx + 48, by + bh - 160 + i * 40, 26, i === lines.length - 1 ? GREEN : DIM));
  ctx.font = `26px ${FONT}`;
  const lastW = ctx.measureText(`root@rezondes:~$ ${lines.at(-1)} `).width;
  if (blink(t)) text(ctx, "█", bx + 48 + lastW, by + bh - 160 + (lines.length - 1) * 40, 26, GREEN);

  scanlines(ctx, w, h);
}
