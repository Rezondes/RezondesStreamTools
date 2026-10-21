// Check for scramble.ts of the Dachdecker theme: texts reveal from the left, spaces stay, fixed per tick. Runs with
// npm test.
import assert from "node:assert/strict";
import { DIGITS, scrambled } from "./scramble.ts";

assert.equal(scrambled("STREAM STARTET", 1, 3), "STREAM STARTET");
const start = scrambled("STREAM STARTET", 0, 3);
assert.equal(start.length, 14);
assert.equal(start[6], " ");
assert.notEqual(start, "STREAM STARTET");
assert.equal(scrambled("STREAM STARTET", 0, 3), start);
assert.notEqual(scrambled("STREAM STARTET", 0, 4), start);
// Half revealed: the left half is the text
assert.equal(scrambled("ABCDEFGH", 0.5, 1).slice(0, 4), "ABCD");
// Digits only for the countdown, the colon stays
const count = scrambled("04:59", 0, 9, DIGITS);
assert.match(count, /^\d\d:\d\d$/);

console.log("dachdecker scramble ok");
