// Fine grain over the standard screens against color banding in the soft light fields: one small noise tile from the
// seed, stretched over the stage and laid over it barely visible (grainStrength). Static, so it never flickers. tile:
// the edge of the noise tile in px (grainTile), the larger, the finer the grain.
import { useEffect, useRef } from "react";
import { hash } from "../../../core/hash.ts";

// fixed: one pixel has four channels (red, green, blue, alpha)
const CHANNELS = 4;
// fixed: highest value of a channel
const FULL = 255;

export default function Grain({ seed, tile }: { seed: number; tile: number }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const size = Math.max(1, Math.round(tile));
  useEffect(() => {
    const context = canvas.current?.getContext("2d");
    if (!context) return;
    const image = context.createImageData(size, size);
    for (let start = 0; start < image.data.length; start += CHANNELS) {
      const shade = hash(seed * size * size + start / CHANNELS) * FULL;
      image.data.set([shade, shade, shade, FULL], start);
    }
    context.putImageData(image, 0, 0);
  }, [seed, size]);
  return <canvas className="standard-grain" ref={canvas} width={size} height={size} aria-hidden="true" />;
}
