// Check for seek.ts: ?t= gives the time in seconds, missing or invalid values give null. Runs with npm test.
import assert from "node:assert/strict";
import { seekFromQuery } from "./seek.ts";

assert.equal(seekFromQuery("?t=4.2"), 4.2);
assert.equal(seekFromQuery("?demo&preview&t=0"), 0);
assert.equal(seekFromQuery("?t=abc"), null);
assert.equal(seekFromQuery("?t=-1"), null);
assert.equal(seekFromQuery("?t="), null);
assert.equal(seekFromQuery(""), null);

console.log("seek ok");
