// Check of alert.ts (PLAN-DOGS.md package 3, AC1 to AC3): without raid the times of the prototype, with raid the wait
// ends 0.3 s after the last runner and the alert lengths match the prototype, at most raidMaxDogs run.
// Run: node src/themes/dogs/alert.check.ts
import assert from "node:assert/strict";
import { raidPack } from "../../core/alerts/raidPack.ts";
import { effectiveSettings } from "../../core/settings.ts";
import { ALERT_FEET, alertBubbleAt, alertDogAt, alertScaleOf, alertSchedule as scheduleWith, alertSoundsBetween, alertTimesOf, cardAt, toyAt } from "./alert.ts";
import { type DogsValues, dogsSettings } from "./settings.ts";

const ALERT_TIMES = alertTimesOf(effectiveSettings(dogsSettings, {}) as unknown as DogsValues);
const alertSchedule = (duration: number, packEndMs: number, barkEvery: number) => scheduleWith(duration, packEndMs, barkEvery, ALERT_TIMES);

const track = { start: -56, stop: 92, out: 394 };
const plain = alertSchedule(8.2, 0, 5);

// Ablauf: stop 1.25 s, drop 1.3 s, card 1.4 s, bark 2.0 s, pick up 5.85 s, run 6.2 s, end 8.2 s
assert.deepEqual(ALERT_TIMES.stop, 1.25);
assert.equal(plain.end, 8.2);
assert.equal(plain.shift, 0);
assert.deepEqual(plain.barks, [2, 3.4]);
assert.equal(alertDogAt(plain, track, 0.5).mode, "walk");
assert.deepEqual(alertDogAt(plain, track, 1.25), { x: 92, mode: "stand" });
assert.equal(alertDogAt(plain, track, 2.2).mode, "bark");
assert.equal(alertDogAt(plain, track, 6.3).mode, "walk");
assert.ok(alertDogAt(plain, track, 6.3).x > 92);
assert.equal(alertDogAt(plain, track, 7.4).x, 394);
assert.equal(toyAt(plain, 1).held, true);
assert.equal(toyAt(plain, 2).held, false);
assert.equal(toyAt(plain, 6).held, true);
assert.equal(toyAt(plain, 8).gone, true);
assert.equal(toyAt(plain, 3).slide, 14);
assert.equal(cardAt(plain, 1).come, 0);
assert.equal(cardAt(plain, 3).come, 1);
assert.equal(cardAt(plain, 7).leave, 1);
assert.equal(alertBubbleAt(plain, 1.9), 0);
assert.equal(alertBubbleAt(plain, 3), 1);
assert.equal(alertBubbleAt(plain, 5.8), 0);
assert.deepEqual(alertSoundsBetween(plain, 0, 8.2).map(sound => sound.kind), ["run", "toy", "card", "bark", "bark", "leave"]);

// Raid verlängert: the wait ends 0.3 s after the last runner; the lengths of the prototype for 5 to 1000 raiders
const raid = (raiders: number) => alertSchedule(8.2, raidPack({ raiders, maxDogs: 1000, maxOnScreen: 12, crossMs: 2400, speedSpread: 0.2, lanes: 4, seed: 1 }).endMs, 5);
assert.deepEqual([5, 15, 50, 100, 500, 1000].map(raiders => Math.round(raid(raiders).end * 10) / 10), [8.2, 9.8, 16.8, 26.8, 106.8, 206.8]);
const big = raid(100);
assert.ok(Math.abs(big.packStart + 99 * 0.2 + 2.4 + 0.3 - (ALERT_TIMES.stand + big.shift)) < 1e-9);
assert.equal(alertDogAt(big, track, 20).mode === "walk", false, "the dog waits with the card");
assert.deepEqual(big.barks.slice(0, 4), [2, 3.4, 7, 12]);
assert.ok(big.barks.every(bark => bark < ALERT_TIMES.stand + big.shift - 1));

// Höchstzahl: 1000 raiders with raidMaxDogs 300 run 300 dogs (the text keeps the amount of the alert)
assert.equal(raidPack({ raiders: 1000, maxDogs: 300, maxOnScreen: 12, crossMs: 2400, speedSpread: 0.2, lanes: 4, seed: 1 }).runners.length, 300);


// Size: 60 % of pixel size 5 draws with 3 screen pixels per pixel, the card at 0.6, the world lifted down so the feet
// stay on the screen row of the full size; 100 % changes nothing, at least 1 screen pixel per pixel
assert.deepEqual(alertScaleOf(5, 60), { pixel: 3, ratio: 0.6, lift: ALERT_FEET * 2 });
assert.equal(ALERT_FEET * 3 + alertScaleOf(5, 60).lift, ALERT_FEET * 5);
assert.deepEqual(alertScaleOf(5, 100), { pixel: 5, ratio: 1, lift: 0 });
assert.equal(alertScaleOf(3, 10).pixel, 1);

console.log("dogs alert ok");
