// Check for rain.ts of the Dachdecker theme: roof height, bounce off the roof, time based steps, splashes that die,
// wind gusts and lightning. Runs with npm test.
import assert from "node:assert/strict";
import { boltAt, boltPoints, createRain, DAMPING, flashLevel, gust, roofHeight, roofOf, roofSurface, stepRain } from "./rain.ts";

const near = (actual: number, expected: number, epsilon = 1e-4) => assert.ok(Math.abs(actual - expected) < epsilon, `${actual} != ${expected}`);
const roof = roofOf({ span: 8.4, rise: 3.25, trusses: 5, gap: 1.5, overhang: 0.12 });
const still = () => 0.5;

// Roof height: rise at the ridge, 0 above the wall, negative on the overhang
near(roofHeight(roof, 0), 3.25);
near(roofHeight(roof, 4.2), 0);
assert.ok(roofHeight(roof, 4.5) < 0);

// A drop that crosses the face is mirrored (moves up and outwards), damped and never ends below the roof
const single = () => {
  const rain = createRain(1, 8, still);
  [rain.x[0], rain.y[0], rain.z[0], rain.vx[0], rain.vy[0], rain.vz[0]] = [2, roofSurface(roof, 2) + 0.1, -3, 0, -20, 0];
  return rain;
};
const bounce = single();
stepRain(bounce, 0.05, { roof, speed: 1, wind: 0, splashes: 3, ground: true }, still);
assert.ok(bounce.y[0] >= roofSurface(roof, 2) - 1e-6);
assert.ok(bounce.vy[0] > 0 && bounce.vx[0] > 0, "away from the face");
near(Math.hypot(bounce.vx[0], bounce.vy[0]), 20 * DAMPING, 1e-3);
assert.ok(bounce.splash.life.some(life => life > 0), "splashes");

// Time based: two steps of 1 equal one of 2 for a drop without impact; the number of drops stays
const open = { roof: null, speed: 1, wind: 1, splashes: 0, ground: false };
const make = () => { const rain = createRain(1, 0, still); rain.y[0] = 100; rain.vy[0] = -20; return rain; };
const twice = make();
stepRain(twice, 1, open, still);
stepRain(twice, 1, open, still);
const once = make();
stepRain(once, 2, open, still);
near(twice.y[0], once.y[0]);
near(twice.x[0], once.x[0]);
const many = createRain(500, 100, Math.random);
for (let step = 0; step < 100; step++) stepRain(many, 1 / 60, { roof, speed: 1, wind: 0.5, splashes: 3, ground: true }, Math.random);
assert.equal(many.x.length, 500);

// Splashes die after their life
const fading = single();
stepRain(fading, 0.05, { roof, speed: 1, wind: 0, splashes: 3, ground: true }, still);
for (let step = 0; step < 60; step++) stepRain(fading, 0.05, { roof: null, speed: 1, wind: 0, splashes: 0, ground: false }, still);
assert.ok(fading.splash.life.every(life => life <= 0));

// Gusts stay between -1 and the maximum and change smoothly
for (let time = 0; time < 30; time += 0.25) {
  const wind = gust(time, 3.5, 2.5, 7);
  assert.ok(wind >= -1 && wind <= 2.5);
  assert.ok(Math.abs(gust(time + 0.01, 3.5, 2.5, 7) - wind) < 0.05);
}

// Lightning: none at first, then bolts at their interval, the flash fades, the same bolt has the same shape
assert.equal(boltAt(1, 8), null);
assert.deepEqual(boltAt(2.5 + 8 + 0.1, 8)?.index, 1);
assert.equal(flashLevel(0.01), 1);
assert.equal(flashLevel(2), 0);
assert.deepEqual(boltPoints(7, 2), boltPoints(7, 2));
assert.ok(boltPoints(7, 2).every(([, y, depth]) => y > 2 && depth < -20));

console.log("dachdecker rain ok");
