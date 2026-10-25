// Check for food.ts: shavings follow the time and the seed alone, never more than max, landed ones lie still on the
// plate; the steam loops. Runs with npm test.
import assert from "node:assert/strict";
import { effectiveSettings } from "../../core/settings.ts";
import { shavingsAt, steamAt, steamLookOf, type ShavingOptions } from "./food.ts";
import { type KebabValues, kebabSettings } from "./settings.ts";

const options: ShavingOptions = { start: 3, gapMs: 160, fallMs: 800, max: 140, seed: 11, from: { x: 334, y: 356 }, plate: { x: 296, y: 452 } };

// Before the start none, then one per gap, never more than max
assert.equal(shavingsAt(2, options).length, 0);
assert.equal(shavingsAt(3, options).length, 1);
assert.equal(shavingsAt(4, options).length, 7);
assert.equal(shavingsAt(100, options).length, 140);
assert.equal(shavingsAt(10, { ...options, gapMs: 0 }).length, 0, "no gap, no shavings");

// Same time and seed, same shavings; another seed, other shavings
assert.deepEqual(shavingsAt(5, options), shavingsAt(5, options));
assert.notDeepEqual(shavingsAt(5, options), shavingsAt(5, { ...options, seed: 12 }));

// The first shaving is landed after its fall and lies still on the plate
const first = (time: number) => shavingsAt(time, options)[0];
assert.equal(first(3.4).landed, false);
assert.equal(first(4).landed, true);
assert.deepEqual(first(6), first(9), "a landed shaving does not move");
assert.ok(Math.abs(first(6).x - 296) <= 48 && first(6).y <= 452 && first(6).y > 430, "on the plate");

// A falling shaving is between the knife and the plate
const falling = first(3.4);
assert.ok(falling.y > 330 && falling.y < 452);

// The steam loops: the same after one period, three wisps that fade at the ends of their way
const look = steamLookOf(effectiveSettings(kebabSettings, {}) as unknown as KebabValues);
const period = 1 / look.rate;
const steam = { from: { x: 320, y: 196 }, height: 70, ...look };
const wisps = steamAt(1.2, steam);
assert.equal(wisps.length, 3);
wisps.forEach((wisp, index) => {
  const later = steamAt(1.2 + period, steam)[index];
  assert.ok(Math.abs(wisp.alpha - later.alpha) < 1e-9);
  wisp.points.forEach((point, step) => assert.ok(Math.abs(point.x - later.points[step].x) < 1e-6 && Math.abs(point.y - later.points[step].y) < 1e-6));
});
assert.ok(steamAt(0, steam)[0].alpha < 1e-9, "the first wisp starts invisible");

console.log("kebab food ok");
