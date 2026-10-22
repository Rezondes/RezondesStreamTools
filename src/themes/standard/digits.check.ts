// Check for digits.ts of the standard theme: only the changed places of a clock text roll, from 0 to 1, aligned from
// the right when the length changes. Runs with npm test.
import assert from "node:assert/strict";
import { rollDigits } from "./digits.ts";

// Rollen: 04:59 to 05:00 changes three places, the colon stays
const places = (rolls: ReturnType<typeof rollDigits>) => rolls.map(roll => [roll.index, roll.from, roll.to]);
assert.deepEqual(places(rollDigits("04:59", "05:00", 0.5)), [[1, "4", "5"], [3, "5", "0"], [4, "9", "0"]]);
assert.deepEqual(rollDigits("04:59", "04:59", 0.5), [], "same texts roll nothing");
assert.equal(rollDigits("04:59", "05:00", 0)[0].rolled, 0);
assert.equal(rollDigits("04:59", "05:00", 1)[0].rolled, 1);
assert.equal(rollDigits("04:59", "05:00", 7)[0].rolled, 1, "past the end it stays rolled");
assert.equal(rollDigits("04:59", "05:00", -1)[0].rolled, 0, "before the start it has not rolled");
const half = rollDigits("04:59", "05:00", 0.5)[0].rolled;
assert.ok(half > 0.5 && half < 1, "eases out: more than half way at half time");

// a shorter text lines up from the right: 10:00 to 9:59, the places of the new text roll, the dropped 1 just goes
assert.deepEqual(places(rollDigits("10:00", "9:59", 0.2)), [[0, "0", "9"], [2, "0", "5"], [3, "0", "9"]]);
// a longer one: 9:59 to 10:00, the new leading place rolls in from nothing
assert.deepEqual(places(rollDigits("9:59", "10:00", 0.2)), [[0, "", "1"], [1, "9", "0"], [3, "5", "0"], [4, "9", "0"]]);

console.log("standard digits ok");
