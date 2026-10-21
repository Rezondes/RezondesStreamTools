// Check for briefing.ts: typing, decoding and the radio lines with static follow the time. Runs with npm test.
import assert from "node:assert/strict";
import { radioLine, scrambled, typed } from "./briefing.ts";

// Typing: nothing, half, all; never beyond the ends
assert.equal(typed("ZIEL", 0), "");
assert.equal(typed("ZIEL", 0.5), "ZI");
assert.equal(typed("ZIEL", 2), "ZIEL");
assert.equal(typed("ZIEL", -1), "");

// Decoding: the same length all the time, revealed from the left, done at the end, same tick same signs
const count = "T-04:59";
assert.equal(scrambled(count, 0, 3).length, count.length);
assert.equal(scrambled(count, 1, 3), count);
assert.ok(scrambled(count, 0.5, 3).startsWith("T-0"));
assert.equal(scrambled(count, 0.2, 7), scrambled(count, 0.2, 7));
assert.notEqual(scrambled(count, 0, 7), scrambled(count, 0, 8));

// Radio: nothing before the start, a line types in, stays, static at the end of its turn, then the next line
const lines = ["> FUNK", "> HÜGEL"];
const timing = { every: 4, typing: 1, noise: 0.5 };
assert.deepEqual(radioLine(lines, -1, timing, 0), { text: "", noise: false });
assert.deepEqual(radioLine([], 3, timing, 0), { text: "", noise: false });
assert.equal(radioLine(lines, 0.5, timing, 0).text, "> F");
assert.deepEqual(radioLine(lines, 2, timing, 0), { text: "> FUNK", noise: false });
const noise = radioLine(lines, 3.7, timing, 5);
assert.ok(noise.noise && noise.text.length > 0 && !noise.text.includes("F"));
assert.equal(radioLine(lines, 6, timing, 0).text, "> HÜGEL");
assert.equal(radioLine(lines, 10, timing, 0).text, "> FUNK", "starts over");
assert.equal(radioLine(lines, 4.2, { every: 4, typing: 0, noise: 0 }, 0).text, "> HÜGEL", "without typing at once");

console.log("koth briefing ok");
