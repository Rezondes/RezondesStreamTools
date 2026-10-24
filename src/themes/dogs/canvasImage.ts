// A pixel image of the kit on a 2D canvas (the clips of render.ts): one rect per run of equal color in a row
// (rowRuns), scale canvas pixels per image pixel, from (x, y). Pure apart from the context; check: canvasImage.check.ts.
import { rowRuns, type PixelImage } from "./pixels.ts";

export function drawPixels(context: CanvasRenderingContext2D, image: PixelImage, scale: number, x = 0, y = 0) {
  for (const run of rowRuns(image)) {
    context.fillStyle = run.color;
    context.fillRect(x + run.x * scale, y + run.y * scale, run.width * scale, scale);
  }
}
