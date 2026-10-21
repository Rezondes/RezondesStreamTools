// Check for roughScribbles.ts of the Chaos theme: the same seed gives the same sketch, another seed another take; every
// kind has a filled inside when the fill is on and none when it is off. Runs with npm test.
import assert from "node:assert/strict";
import { ROUGH_KINDS, roughScribble } from "./roughScribbles.ts";

// fester Zufall: same seed, same paths; other seed, other paths
for (const kind of ROUGH_KINDS) {
  const first = roughScribble(kind, 60, 11, 2, true);
  assert.deepEqual(roughScribble(kind, 60, 11, 2, true), first, kind);
  assert.notDeepEqual(roughScribble(kind, 60, 12, 2, true), first, `${kind} takes differ`);
  assert.ok(first.some(part => part.filled), `${kind} filled`);
  assert.ok(first.some(part => !part.filled), `${kind} outline`);
  assert.ok(!roughScribble(kind, 60, 11, 2, false).some(part => part.filled), `${kind} without fill`);
}

console.log("chaos roughScribbles ok");
