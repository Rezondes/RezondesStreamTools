// Check of ending.ts (PLAN-DOGS.md package 2, AC4): the times of the design (walk in 2.2 s, lie at 2.8 s, sleep from
// 4 s, "Z" every 1.8 s), the light goes from 1 to lampDim between lampDimFrom and lampDimTo, the sounds come once and
// the snoring repeats, the card counts up. Run: node src/themes/dogs/ending.check.ts
import assert from "node:assert/strict";
import { countShare, ENDING, endingDogAt, endingSoundsBetween, lightAt, zzzAt, type EndingTiming } from "./ending.ts";

const timing: EndingTiming = { width: 384, dogWidth: 52, basketX: 196, lampDim: 0.35, lampDimFrom: 5, lampDimTo: 7.5, zzzEvery: 1.8, snoreEvery: 4 };

// Ablauf: from the right edge to the basket, standing, then lying
assert.deepEqual(endingDogAt(timing, 0), { x: 392, mode: "walk", wagSpeed: 10, sink: 0 });
assert.equal(endingDogAt(timing, 1.1).mode, "walk");
assert.ok(endingDogAt(timing, 1.1).x < 392 && endingDogAt(timing, 1.1).x > 170);
assert.deepEqual(endingDogAt(timing, 2.5), { x: 170, mode: "stand", wagSpeed: 10, sink: 0 });
assert.deepEqual(endingDogAt(timing, 3), { x: 170, mode: "lie", wagSpeed: 2, sink: 5 });
assert.equal(ENDING.sleep, 4);

// Light: full until 5 s, then down to 35 % at 7.5 s
assert.equal(lightAt(timing, 4), 1);
assert.ok(lightAt(timing, 6.25) < 1 && lightAt(timing, 6.25) > 0.35);
assert.equal(lightAt(timing, 8), 0.35);

// "Z": none while awake, one after another, at most three, rising and fading
assert.deepEqual(zzzAt(timing, 3.9, [100, 100]), []);
assert.equal(zzzAt(timing, 4.1, [100, 100]).length, 1);
assert.equal(zzzAt(timing, 5.5, [100, 100]).length, 3);
const rising = zzzAt(timing, 4.5, [100, 100])[0];
assert.ok(rising.y < 92 && rising.alpha > 0 && rising.alpha <= 1);

// Sounds: lying down and the lamp once, snoring every 4 s from the sleep on
assert.deepEqual(endingSoundsBetween(timing, 0, 6).map(sound => [sound.kind, sound.at]), [["lie", 2.8], ["snore", 4], ["lamp", 5]]);
assert.deepEqual(endingSoundsBetween(timing, 6, 16).map(sound => sound.at), [8, 12, 16]);
assert.deepEqual(endingSoundsBetween(timing, 3, 3), []);

// The card counts from 0 to 1 within a second after it came
assert.equal(countShare(2), 0);
assert.equal(countShare(4), 1);

console.log("dogs ending ok");
