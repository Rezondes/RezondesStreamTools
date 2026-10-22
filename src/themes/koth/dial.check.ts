// Check for dial.ts: a frequency of the FM band with one decimal, the same track on the same frequency. Runs with npm test.
import assert from "node:assert/strict";
import { dialFrequency } from "./dial.ts";

for (const track of ["a", "Wake Up", "track-42", ""]) {
  const frequency = dialFrequency(track);
  assert.match(frequency, /^\d{2,3}\.\d$/);
  assert.ok(Number(frequency) >= 87.5 && Number(frequency) <= 108, frequency);
  assert.equal(dialFrequency(track), frequency);
}
assert.notEqual(dialFrequency("a"), dialFrequency("b"));

console.log("koth dial ok");
