// Soft round dot for smoke and sparks of the Dachdecker theme: a white radial fade on a small canvas, tinted by the
// material color. Drawn once per scene and freed with it.
import { CanvasTexture } from "three";

const SIZE = 64;

export function softTexture(): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = SIZE;
  const context = canvas.getContext("2d")!;
  const fade = context.createRadialGradient(SIZE / 2, SIZE / 2, 0, SIZE / 2, SIZE / 2, SIZE / 2);
  // fixed: an alpha mask, its color comes from the material
  fade.addColorStop(0, "white");
  // fixed: an alpha mask, its color comes from the material
  fade.addColorStop(1, "transparent");
  context.fillStyle = fade;
  context.fillRect(0, 0, SIZE, SIZE);
  return new CanvasTexture(canvas);
}
