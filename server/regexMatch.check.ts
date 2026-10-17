// Check for regexMatch.ts: regex runs in the worker, a catastrophic pattern does not block the server. Runs with npm test.
import assert from "node:assert/strict";
import { createRegexMatcher } from "./regexMatch.ts";

const matcher = createRegexMatcher(50);
assert.equal(await matcher.test("^l+i+z+", "iu", "LLLizzz"), true);
assert.equal(await matcher.test("^gg$", "iu", "gg wp"), false);

// ^(a+)+$ on 40 a and ! would take minutes in the main process; here: "slow" after the time limit
let ticks = 0;
const timer = setInterval(() => { ticks++; }, 5);
const started = Date.now();
assert.equal(await matcher.test("^(a+)+$", "u", "a".repeat(40) + "!"), "slow");
const took = Date.now() - started;
clearInterval(timer);
assert.ok(took < 1000, `time limit does not apply (${took} ms)`);
assert.ok(ticks > 2, "the main process was blocked");

// Afterwards a new worker runs, simultaneous checks all arrive too
assert.deepEqual(await Promise.all([matcher.test("a", "", "a"), matcher.test("b", "", "a")]), [true, false]);

// What waits behind a hanging check counts as not matched
assert.deepEqual(await Promise.all([matcher.test("^(a+)+$", "u", "a".repeat(40) + "!"), matcher.test("a", "", "a")]), ["slow", null]);
matcher.stop();
console.log("regexMatch ok");
