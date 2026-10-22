// Check for alertName.ts of the standard theme: the name of an alert line stands apart, the rest stays the line.
// Runs with npm test.
import assert from "node:assert/strict";
import { splitName } from "./alertName.ts";

assert.deepEqual(splitName("Trinity hat abonniert!", "Trinity"), { name: "Trinity", rest: "hat abonniert!" });
assert.deepEqual(splitName("Danke Neo für den Raid!", "Neo"), { name: "Neo", rest: "Danke für den Raid!" });
assert.deepEqual(splitName("Der Hype Train ist abgefahren!", "Neo"), { name: "", rest: "Der Hype Train ist abgefahren!" }, "without the name the line stays");
assert.deepEqual(splitName("Neo folgt jetzt!", ""), { name: "", rest: "Neo folgt jetzt!" }, "an empty user takes nothing out");

console.log("standard alertName ok");
