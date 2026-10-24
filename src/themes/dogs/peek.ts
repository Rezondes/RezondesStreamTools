// The chat cut of a dog in the Dogs theme (DESIGN-DOGS.md "Chat"): head and front paws, from just behind the front legs
// to the nose, without empty edges, so the dog peeks out next to a sign. Pure; check: peek.check.ts.
import { BREEDS, type BreedId } from "./breeds.ts";
import { blankImage, setPixel, type PixelImage } from "./pixels.ts";

// fixed: the cut starts 2 pixels behind the front hip
const BEHIND_HIP = 2;

// The part of an image inside its painted pixels (an empty image stays 1 x 1)
export function trimImage(image: PixelImage): PixelImage {
  const at = (x: number, y: number) => image.colors[y * image.width + x];
  let [left, top, right, bottom] = [image.width, image.height, -1, -1];
  for (let y = 0; y < image.height; y++) {
    for (let x = 0; x < image.width; x++) {
      if (at(x, y) === null) continue;
      [left, top, right, bottom] = [Math.min(left, x), Math.min(top, y), Math.max(right, x), Math.max(bottom, y)];
    }
  }
  if (right < 0) return blankImage(1, 1);
  const trimmed = blankImage(right - left + 1, bottom - top + 1);
  for (let y = top; y <= bottom; y++) for (let x = left; x <= right; x++) setPixel(trimmed, x - left, y - top, at(x, y));
  return trimmed;
}

// Head and front paws of a pose image of the breed
export function peekOf(image: PixelImage, breed: BreedId): PixelImage {
  const left = Math.max(0, BREEDS[breed].legs.hips[2] - BEHIND_HIP);
  const front = blankImage(image.width, image.height);
  for (let y = 0; y < image.height; y++) for (let x = left; x < image.width; x++) setPixel(front, x, y, image.colors[y * image.width + x]);
  return trimImage(front);
}
