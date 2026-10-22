// Fine grain over the standard screens against color banding in the soft light fields: one small noise tile from the
// seed, stretched over the stage and laid over it barely visible (grainStrength). Static, so it never flickers.
import { useEffect, useRef } from "react";
import { hash } from "../../../core/hash.ts";

// fixed: edge of the noise tile in px, like the prototype (refs/starting.html)
const SIZE = 256;
// fixed: one pixel has four channels (red, green, blue, alpha)
const CHANNELS = 4;
// fixed: highest value of a channel
const FULL = 255;

export default function Grain({ seed }: { seed: number }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const context = canvas.current?.getContext("2d");
    if (!context) return;
    const image = context.createImageData(SIZE, SIZE);
    for (let start = 0; start < image.data.length; start += CHANNELS) {
      const shade = hash(seed * SIZE * SIZE + start / CHANNELS) * FULL;
      image.data.set([shade, shade, shade, FULL], start);
    }
    context.putImageData(image, 0, 0);
  }, [seed]);
  return <canvas className="standard-grain" ref={canvas} width={SIZE} height={SIZE} aria-hidden="true" />;
}
