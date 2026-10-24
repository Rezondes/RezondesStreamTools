// Check of headphones.ts (PLAN-DOGS.md package 4, AC2): on every breed the cup lies on the dog and the band starts above
// its head; the image grows at the top by the added rows. Run: node src/themes/dogs/headphones.check.ts
import assert from "node:assert/strict";
import { resolveSettings } from "../../core/settings.ts";
import { BREED_IDS } from "./breeds.ts";
import { dogCache } from "./dog.ts";
import { cupCenter, withHeadphones } from "./headphones.ts";
import { dogLookOf } from "./looks.ts";
import type { PixelImage } from "./pixels.ts";
import { poseAt } from "./poses.ts";
import { dogsSettings, type DogsValues } from "./settings.ts";

const values = resolveSettings(dogsSettings, {}) as unknown as DogsValues;
const at = (image: PixelImage, x: number, y: number) => image.colors[y * image.width + x];
const column = (image: PixelImage, x: number) => Array.from({ length: image.height }, (_, y) => at(image, x, y));

// Kopfhörer
for (const breed of BREED_IDS) {
  const stand = dogCache(dogLookOf(values, breed, "")).pose(poseAt({ time: 0, mode: "stand", fps: 9, wagSpeed: 0, blinkEvery: 0, pant: false }));
  const worn = withHeadphones(stand, breed, { band: "#b", cup: "#c", ink: "#i" });
  const [cupX, cupY] = cupCenter(breed, worn.top);
  assert.equal(at(worn.image, cupX, cupY), "#c");
  assert.notEqual(at(stand, cupX, cupY - worn.top), null, `${breed}: cup on the head`);
  const firstDog = column(stand, cupX).findIndex(color => color !== null) + worn.top;
  assert.equal(column(worn.image, cupX)[firstDog - 2], "#i", `${breed}: band above the head`);
  assert.equal(worn.image.height, stand.height + worn.top);
}

console.log("dogs headphones ok");
