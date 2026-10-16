// Stinger des Südfrucht-Themes: eine grosse Welle mit Schaumkrone rollt von links ins Bild, deckt am Übergangspunkt
// (cut) alles in Meeresfarben ab, zeigt kurz den Text und eine Palme und läuft rechts wieder hinaus. Davor und danach
// transparent. Reine Funktion der Zeit, darum Frame für Frame renderbar. Check: stinger.check.ts.
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const FPS = 60;

export type SuedfruchtStingerOptions = {
  duration: number; // Sekunden
  cut: number; // Sekunden, in OBS als Übergangspunkt eintragen
  waves: number; // Wellenschichten
  foam: boolean;
  palm: boolean;
  text: string;
  font: string;
  sea: string;
  seaDeep: string;
  foamColor: string;
  textColor: string;
  palmColor: string;
};

// fixed: Tiefe der Wellenkrone, Abstand der Schichten, Wellenlänge der Krone, Breite der Schaumlinie
const CREST = 160;
const LAYER = 110;
const CREST_WAVE = 220;
const FOAM_WIDTH = 14;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
// Weich beschleunigen und abbremsen
const ease = (progress: number) => (progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2);

// Wellenkrone rechts an der Kante x: Bögen nach rechts, phase verschiebt sie mit der Zeit
function crest(context: CanvasRenderingContext2D, x: number, phase: number) {
  context.beginPath();
  context.moveTo(x, 0);
  for (let y = 0; y <= HEIGHT; y += CREST_WAVE / 8) {
    context.lineTo(x + (CREST / 2) * (1 + Math.sin((y / CREST_WAVE) * Math.PI * 2 + phase)), y);
  }
  context.lineTo(x, HEIGHT);
  context.closePath();
}

// Palme als Silhouette: gebogener Stamm und fünf Blätter
function drawPalm(context: CanvasRenderingContext2D, color: string) {
  context.fillStyle = color;
  context.beginPath();
  context.moveTo(260, HEIGHT);
  context.quadraticCurveTo(240, 700, 330, 430);
  context.lineTo(360, 440);
  context.quadraticCurveTo(290, 700, 320, HEIGHT);
  context.closePath();
  context.fill();
  for (const [x, y] of [[120, 470], [180, 330], [380, 300], [520, 380], [560, 520]]) {
    context.beginPath();
    context.moveTo(345, 430);
    context.quadraticCurveTo((345 + x) / 2, Math.min(y, 430) - 90, x, y);
    context.quadraticCurveTo((345 + x) / 2, Math.min(y, 430) - 30, 345, 440);
    context.fill();
  }
}

export function drawSuedfruchtStinger(context: CanvasRenderingContext2D, time: number, options: SuedfruchtStingerOptions) {
  const { cut, duration } = options;
  context.clearRect(0, 0, WIDTH, HEIGHT);
  const enter = ease(clamp01(time / (cut * 0.9)));
  const leave = ease(clamp01((time - cut) / ((duration - cut) * 0.9)));
  // Vorderkante kommt von links bis hinter den rechten Rand, Hinterkante folgt nach dem Übergangspunkt
  const right = enter * (WIDTH + 2 * CREST) - CREST;
  const left = leave * (WIDTH + 2 * CREST) - CREST;
  if (right - left <= 0) return;
  const layers = Math.max(1, Math.round(options.waves));
  for (let layer = 0; layer < layers; layer++) {
    const shift = (layers - 1 - layer) * LAYER;
    context.fillStyle = layer === layers - 1 ? options.sea : options.seaDeep;
    context.globalAlpha = layer === layers - 1 ? 1 : 0.55 + (0.45 * layer) / layers;
    context.fillRect(left + shift, 0, right - left, HEIGHT);
    crest(context, right + shift, time * 6 + layer);
    context.fill();
  }
  context.globalAlpha = 1;
  if (options.foam) {
    context.strokeStyle = options.foamColor;
    context.lineWidth = FOAM_WIDTH;
    crest(context, right, time * 6 + layers - 1);
    context.stroke();
  }

  // Text und Palme um den Übergangspunkt, nur auf der bedeckten Fläche (sonst stünden sie über dem durchsichtigen Bild)
  const shown = 1 - clamp01(Math.abs(time - cut) / (Math.min(cut, duration - cut) * 0.6));
  if (shown <= 0) return;
  context.save();
  context.beginPath();
  context.rect(left, 0, right - left, HEIGHT);
  context.clip();
  context.globalAlpha = shown;
  if (options.palm) drawPalm(context, options.palmColor);
  context.fillStyle = options.textColor;
  context.font = `400 140px "${options.font}", cursive`;
  context.textBaseline = "middle";
  const width = context.measureText(options.text).width;
  context.fillText(options.text, (WIDTH - width) / 2, HEIGHT / 2);
  context.restore();
}
