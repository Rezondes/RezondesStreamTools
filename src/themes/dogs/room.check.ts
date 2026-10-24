// Check of room.ts (PLAN-DOGS.md package 2, AC3): the basket holds the lying dog with its lower edge behind the front
// rim, the stars come from a fixed seed, the room fills the world, shade and glow follow the lamp.
// Run: node src/themes/dogs/room.check.ts
import assert from "node:assert/strict";
import { BREED_IDS } from "./breeds.ts";
import { dogCache } from "./dog.ts";
import { ENDING } from "./ending.ts";
import { poseAt } from "./poses.ts";
import { basketImages, darknessOf, glowImages, ROOM, roomImage, shadeImage, starsOf, twinkleImage, twinkles, zImage, type RoomColors } from "./room.ts";

const colors: RoomColors = {
  night: "#3b3a63", windowSky: "#1b2547", floor: "#7d5233", rug: "#8f6fc7", lamp: "#ffe9a8", basket: "#c48a4f", pillow: "#ffc9d9", cream: "#fff6e6", edge: "#e9d2bd",
  ink: "#2e1d14", light: "#ffffff", trunk: "#a8754a", accent: "#c24535", lilac: "#c9b6ff", picture: "#ffd2b8",
};
const coat = { base: "#cc7633", mark: "#fbf6ee", dark: "#a85a22", nose: "#1d1715", pattern: "solid" as const };
const shared = { ink: "#2e1d14", eye: "#1d1412", tongue: "#e98a95", collar: "#c24535", tag: "#ffd23f", light: "#ffffff" };

// Körbchen und Sterne: the lying dog (its top 3 above the rim minus its height, sunk by 5) ends behind the front rim
const basket = basketImages(colors, 216);
for (const breed of BREED_IDS) {
  const cache = dogCache({ breed, colors: coat, shared, spots: { share: 0, seed: 1 } });
  const lying = cache.pose(poseAt({ time: 5, mode: "lie", fps: 9, wagSpeed: 2, blinkEvery: 0, pant: false }));
  const top = ROOM.basketY - cache.height + 3 + ENDING.sink;
  const lowest = Math.max(...lying.colors.map((color, index) => (color ? Math.floor(index / lying.width) : -1))) + top;
  assert.ok(lowest >= basket.frontTop && lowest <= basket.frontTop + basket.front.height, `${breed}: lower edge ${lowest} behind the front rim from ${basket.frontTop}`);
}
assert.ok(basket.backTop < basket.frontTop, "the back rim is above the front rim");
// No gap at the sides: from the outer edge of the back rim down to the front rim every row is painted
for (const x of [1, basket.back.width - 2]) {
  const painted = (image: typeof basket.back, top: number, y: number) => y >= top && y < top + image.height && image.colors[(y - top) * image.width + x] !== null;
  const first = basket.backTop + basket.back.colors.findIndex((color, index) => color !== null && index % basket.back.width === x) / basket.back.width;
  for (let y = Math.floor(first); y <= basket.frontTop; y++) assert.ok(painted(basket.back, basket.backTop, y) || painted(basket.front, basket.frontTop, y), `basket side at ${x}, ${y}`);
}
assert.deepEqual(starsOf(16, 1), starsOf(16, 1));
assert.notDeepEqual(starsOf(16, 1), starsOf(16, 2));
assert.equal(starsOf(16, 1).length, 16);
const star = starsOf(1, 1)[0];
assert.ok([...Array(100).keys()].some(step => twinkles(star, 0, step / 10)) && [...Array(100).keys()].some(step => !twinkles(star, 0, step / 10)));

// The room fills the world; the moon can be switched off
const room = roomImage(384, 216, colors, starsOf(16, 1), true);
assert.ok(room.colors.every(Boolean), "every pixel painted");
assert.equal(room.colors[0], colors.night);
assert.equal(room.colors[215 * 384 + 3], colors.floor);
assert.notDeepEqual(roomImage(384, 216, colors, starsOf(16, 1), false).colors, room.colors);

// Shade lit and dimmed differ, the glow has two discs, darkness, twinkle and "Z" use the settings
assert.notDeepEqual(shadeImage(colors, true).image.colors, shadeImage(colors, false).image.colors);
assert.ok(shadeImage(colors, true).image.colors.includes(colors.lamp));
assert.equal(glowImages(colors).length, 2);
assert.notEqual(darknessOf(colors), colors.night);
assert.equal(twinkleImage(colors).colors.filter(Boolean).length, 5);
assert.ok(zImage(colors).colors.includes(colors.cream));

console.log("dogs room ok");
