// Check for bon.ts: items with and without a note, placeholders filled, empty lines left out. Runs with npm test.
import assert from "node:assert/strict";
import { bonItems } from "./bon.ts";

assert.deepEqual(bonItems(["1x Stream|mit alles", "1x Chat", "", " |leer"]), [
  { label: "1x Stream", note: "mit alles" },
  { label: "1x Chat", note: "" },
]);
assert.deepEqual(bonItems(["{amount} Gäste|für {user}"], { amount: 12, user: "Neo" }), [{ label: "12 Gäste", note: "für Neo" }]);
assert.deepEqual(bonItems(["a|b|c"]), [{ label: "a", note: "b|c" }], "a second bar stays in the note");

console.log("kebab bon ok");
