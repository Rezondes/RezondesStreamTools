// Check for loginStates.ts: pending OAuth logins. Runs with npm test.
import assert from "node:assert/strict";
import { createLoginStates, sameBrowser } from "./loginStates.ts";

const now = 1_800_000_000_000;

// A state returns its value exactly once
const states = createLoginStates<string>(600_000, 3);
states.add("a", "rezondes", now);
assert.equal(states.take("a", now + 1000), "rezondes");
assert.equal(states.take("a", now + 1000), null);
// Unknown or empty: null
assert.equal(states.take("", now), null);
assert.equal(states.take("foreign", now), null);

// Expired after ttlMs
states.add("b", "friend", now);
assert.equal(states.take("b", now + 600_000), null);

// Above the limit the oldest drop out
for (const state of ["c", "d", "e", "f"]) states.add(state, state, now);
assert.equal(states.take("c", now), null);
assert.equal(states.take("f", now), "f");
assert.equal(states.take("d", now), "d");

// The callback only counts in the browser that started the login: cookie state and query state equal
assert.equal(sameBrowser("abc123", "abc123"), true);
assert.equal(sameBrowser(undefined, "abc123"), false);
assert.equal(sameBrowser("abc124", "abc123"), false);
assert.equal(sameBrowser("abc", "abc123"), false);
assert.equal(sameBrowser("", ""), false);

console.log("loginStates ok");
