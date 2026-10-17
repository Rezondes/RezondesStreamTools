// Check für loginStates.ts: offene OAuth-Anmeldungen. Läuft mit npm test.
import assert from "node:assert/strict";
import { createLoginStates, sameBrowser } from "./loginStates.ts";

const now = 1_800_000_000_000;

// Ein state liefert seinen Wert genau einmal
const states = createLoginStates<string>(600_000, 3);
states.add("a", "rezondes", now);
assert.equal(states.take("a", now + 1000), "rezondes");
assert.equal(states.take("a", now + 1000), null);
// Unbekannt oder leer: null
assert.equal(states.take("", now), null);
assert.equal(states.take("fremd", now), null);

// Abgelaufen nach ttlMs
states.add("b", "freund", now);
assert.equal(states.take("b", now + 600_000), null);

// Über dem Limit fallen die ältesten weg
for (const state of ["c", "d", "e", "f"]) states.add(state, state, now);
assert.equal(states.take("c", now), null);
assert.equal(states.take("f", now), "f");
assert.equal(states.take("d", now), "d");

// Der Callback gilt nur im Browser, der die Anmeldung begonnen hat: Cookie-state und Query-state gleich
assert.equal(sameBrowser("abc123", "abc123"), true);
assert.equal(sameBrowser(undefined, "abc123"), false);
assert.equal(sameBrowser("abc124", "abc123"), false);
assert.equal(sameBrowser("abc", "abc123"), false);
assert.equal(sameBrowser("", ""), false);

console.log("loginStates ok");
