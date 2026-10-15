// Stinger des Starter-Themes: Streifen im Farbverlauf gleiten von links herein, decken am Übergangspunkt (cut) das
// ganze Bild, zeigen kurz den Text und gleiten nach rechts hinaus. Ausserhalb der Streifen transparent.
// Reine Funktion der Zeit, darum Frame für Frame renderbar. Check: stinger.check.ts.
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const FPS = 60;

export type StarterStingerOptions = {
  duration: number; // Sekunden
  cut: number; // Sekunden, in OBS als Übergangspunkt eintragen
  panels: number; // Anzahl der Streifen
  text: string;
  font: string;
  accent: string;
  accent2: string;
  textColor: string;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
// Weich beschleunigen und abbremsen
const ease = (progress: number) => (progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2);

export function drawStarterStinger(context: CanvasRenderingContext2D, time: number, options: StarterStingerOptions) {
  const { cut, duration } = options;
  const count = Math.max(1, Math.round(options.panels));
  const band = HEIGHT / count;
  context.clearRect(0, 0, WIDTH, HEIGHT);
  const gradient = context.createLinearGradient(0, 0, WIDTH, HEIGHT);
  gradient.addColorStop(0, options.accent);
  gradient.addColorStop(1, options.accent2);
  context.fillStyle = gradient;

  // Jeder Streifen startet etwas später; alle sind am cut ganz drin und verlassen das Bild bis zum Ende
  const inLength = cut * 0.7;
  const outLength = (duration - cut) * 0.7;
  for (let index = 0; index < count; index++) {
    const delay = count > 1 ? (index / (count - 1)) * 0.3 : 0;
    const enter = ease(clamp01((time - delay * cut) / inLength));
    const leave = ease(clamp01((time - cut - delay * (duration - cut)) / outLength));
    const right = enter * WIDTH;
    const left = leave * WIDTH;
    // 1 px Überlappung, damit zwischen den Streifen keine Haarlinie bleibt
    if (right - left > 0) context.fillRect(left, index * band, right - left, band + 1);
  }

  // Text in der Mitte, nur solange alles bedeckt ist
  const shown = 1 - clamp01(Math.abs(time - cut) / (Math.min(cut, duration - cut) * 0.5));
  if (shown <= 0) return;
  context.globalAlpha = shown;
  context.fillStyle = options.textColor;
  context.font = `800 120px "${options.font}", sans-serif`;
  context.textBaseline = "middle";
  const width = context.measureText(options.text).width;
  context.fillText(options.text, (WIDTH - width) / 2, HEIGHT / 2);
  context.globalAlpha = 1;
}
