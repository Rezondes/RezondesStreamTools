// Check of peek.ts (PLAN-DOGS.md package 4, AC2): the cut of every breed keeps head and front paws and has no empty edge.
// Run: node src/themes/dogs/peek.check.ts
import assert from "node:assert/strict";
import { resolveSettings } from "../../core/settings.ts";
import { BREED_IDS, BREEDS } from "./breeds.ts";
import { dogCache } from "./dog.ts";
import { dogLookOf } from "./looks.ts";
import { peekOf, trimImage } from "./peek.ts";
import type { PixelImage } from "./pixels.ts";
import { poseAt } from "./poses.ts";
import { dogsSettings, type DogsValues } from "./settings.ts";

const values = resolveSettings(dogsSettings, {}) as unknown as DogsValues;
const at = (image: PixelImage, x: number, y: number) => image.colors[y * image.width + x];
const row = (image: PixelImage, y: number) => Array.from({ length: image.width }, (_, x) => at(image, x, y));
const column = (image: PixelImage, x: number) => Array.from({ length: image.height }, (_, y) => at(image, x, y));
const painted = (pixels: (string | null)[]) => pixels.some(color => color !== null);

for (const breed of BREED_IDS) {
  const cache = dogCache(dogLookOf(values, breed, ""));
  const stand = cache.pose(poseAt({ time: 0, mode: "stand", fps: 9, wagSpeed: 0, blinkEvery: 0, pant: false }));
  // Ausschnitt: no empty edge, narrower than the dog, as tall as head to paws
  const peek = peekOf(stand, breed);
  for (const edge of [row(peek, 0), row(peek, peek.height - 1), column(peek, 0), column(peek, peek.width - 1)]) assert.ok(painted(edge), `${breed}: empty edge`);
  assert.ok(peek.width < trimImage(stand).width && peek.width >= BREEDS[breed].mouth[0] - BREEDS[breed].legs.hips[2], breed);
  assert.equal(peek.height, trimImage(stand).height, `${breed}: head to paws`);
}
assert.deepEqual([trimImage({ width: 2, height: 2, colors: [null, null, null, null] }).width], [1]);

console.log("dogs peek ok");
