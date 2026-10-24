// Headphones for the music dog of the Dogs theme (DESIGN-DOGS.md "Musik"): seen from the side one cup over the ear,
// between the collar and the eye, and the band from the cup up over the top of the head. The image grows at the top when
// the band reaches above it (ears). Pure; check: peek.check.ts.
import { BREEDS, type BreedId } from "./breeds.ts";
import { blankImage, setPixel, type PixelImage } from "./pixels.ts";

export type HeadphoneColors = { band: string; cup: string; ink: string };

// fixed: the cup is 3 x 4 pixels inside its outline and starts 1 row above the eye
const CUP = { width: 3, height: 4, aboveEye: 1 };

// The image with headphones; top: rows added above the dog
export function withHeadphones(image: PixelImage, breed: BreedId, colors: HeadphoneColors): { image: PixelImage; top: number } {
  const { collar, eye } = BREEDS[breed];
  const x = Math.round((collar[0][0] + eye[0]) / 2);
  let highest = image.height;
  for (let y = 0; y < image.height && highest === image.height; y++) if (image.colors[y * image.width + x] !== null) highest = y;
  const cupTop = eye[1] - CUP.aboveEye;
  const top = Math.max(0, 2 - highest);
  const worn = blankImage(image.width, image.height + top);
  image.colors.forEach((color, index) => setPixel(worn, index % image.width, Math.floor(index / image.width) + top, color));
  // the band: ink on top, the band color down to the cup
  setPixel(worn, x, highest - 2 + top, colors.ink);
  for (let y = highest - 1; y < cupTop; y++) setPixel(worn, x, y + top, colors.band);
  const left = x - 1;
  for (let y = -1; y <= CUP.height; y++) {
    for (let dx = -1; dx <= CUP.width; dx++) {
      const inside = y >= 0 && y < CUP.height && dx >= 0 && dx < CUP.width;
      setPixel(worn, left + dx, cupTop + y + top, inside ? colors.cup : colors.ink);
    }
  }
  return { image: worn, top };
}

// Where the cup sits in the image with headphones (for the check)
export const cupCenter = (breed: BreedId, top: number): [number, number] => {
  const { collar, eye } = BREEDS[breed];
  return [Math.round((collar[0][0] + eye[0]) / 2), eye[1] - CUP.aboveEye + top + 1];
};
