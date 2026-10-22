// Light fields and light dust of the standard theme on a 2D canvas, for the stinger and the banners (render.ts): the
// same fields and motes as the screens (aurora.ts), scaled from the 1920x1080 stage to any size, added on top of each
// other as soft radial gradients and dots. Pure function of seed and time. Check: lights.check.ts.
import { type AuroraOptions, auroraField, moteAt } from "./aurora.ts";

export type LightsOptions = AuroraOptions & { dust: number }; // dust: number of motes

const STAGE = { width: 1920, height: 1080 };
// Alpha of the fade at the edge of the bright core as two hex digits, and where the core ends, like the screens
const CORE = { alpha: "73", at: 0.35 };

export function paintLights(context: CanvasRenderingContext2D, options: LightsOptions, time: number, width: number, height: number, alpha = 1) {
  const [scaleX, scale] = [width / STAGE.width, height / STAGE.height];
  context.save();
  context.globalCompositeOperation = "lighter";
  for (let index = 0; index < options.count; index++) {
    const field = auroraField(options, index, time);
    const [x, y, radius] = [field.x * scaleX, field.y * scale, field.radius * scale];
    const fade = context.createRadialGradient(x, y, 0, x, y, radius);
    fade.addColorStop(0, field.color);
    fade.addColorStop(CORE.at, `${field.color}${CORE.alpha}`);
    fade.addColorStop(1, `${field.color}00`);
    context.globalAlpha = field.alpha * alpha;
    context.fillStyle = fade;
    context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  for (let index = 0; index < options.dust; index++) {
    const mote = moteAt(options, index, time);
    context.globalAlpha = mote.alpha * alpha;
    context.fillStyle = mote.color;
    context.beginPath();
    context.arc(mote.x * scaleX, mote.y * scale, (mote.size * scale) / 4, 0, Math.PI * 2);
    context.fill();
  }
  context.restore();
}
