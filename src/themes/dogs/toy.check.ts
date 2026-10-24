// Check of toy.ts (PLAN-DOGS.md package 3, AC4): the toy starts at dropBounce, is on the ground after the fall, never
// rises above dropBounce and rests after its hops. Run: node src/themes/dogs/toy.check.ts
import assert from "node:assert/strict";
import { toyHeight } from "./toy.ts";

// Hüpfen: from the drop height down, three hops, then rest
assert.equal(toyHeight(0, 14), 14);
let landings = 0;
let previous = toyHeight(0, 14);
for (let step = 1; step <= 2000; step++) {
  const height = toyHeight(step / 1000, 14);
  assert.ok(height >= 0 && height <= 14, `height ${height}`);
  if (previous > 0 && height === 0) landings++;
  previous = height;
}
assert.ok(landings >= 1, "touches the ground");
assert.equal(toyHeight(2, 14), 0, "rests after its hops");
assert.ok(toyHeight(0.45, 14) > 0, "hops again after the fall");
assert.equal(toyHeight(1, 0), 0, "no bounce from a drop of 0");

console.log("dogs toy ok");
