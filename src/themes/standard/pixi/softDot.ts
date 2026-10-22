// Soft round texture for the light fields and the light dust: a white radial fade with a brighter core, tinted per
// sprite. Drawn once per component and destroyed with it.
import { Texture } from "pixi.js";

// fixed: alpha of the fade at the edge of the core, like the prototype (refs/starting.html)
const CORE_ALPHA = 0.45;
// fixed: an alpha mask in white, its color comes from the tint of each sprite
const white = (alpha: number) => `rgba(255,255,255,${alpha})`;

export function softDot(size: number, core: number): Texture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const context = canvas.getContext("2d")!;
  const middle = size / 2;
  const fade = context.createRadialGradient(middle, middle, 0, middle, middle, middle);
  fade.addColorStop(0, white(1));
  fade.addColorStop(core, white(CORE_ALPHA));
  fade.addColorStop(1, white(0));
  context.fillStyle = fade;
  context.fillRect(0, 0, size, size);
  return Texture.from(canvas);
}
