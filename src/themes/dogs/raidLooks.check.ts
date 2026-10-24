// Check of raidLooks.ts: runners only get breeds that are switched on, every look is a real coat of its breed, there
// are never more than 18 looks, and the same pick gives the same look. Run: node src/themes/dogs/raidLooks.check.ts
import assert from "node:assert/strict";
import { coatsOf } from "./coats.ts";
import { raidBreeds, raidLookOf } from "./raidLooks.ts";

assert.equal(raidBreeds({}).length, 6);
assert.deepEqual(raidBreeds({ raidBreed_corgi: false, raidBreed_shiba: false, raidBreed_labrador: false, raidBreed_dalmatiner: false, raidBreed_dackel: false }), ["mops"]);
const none = Object.fromEntries(["corgi", "shiba", "labrador", "dalmatiner", "dackel", "mops"].map(id => [`raidBreed_${id}`, false]));
assert.equal(raidBreeds(none).length, 6, "none switched on gives all");
const looks = new Set<string>();
for (let step = 0; step < 1000; step++) {
  const look = raidLookOf(step / 1000, raidBreeds({}));
  assert.ok(coatsOf(look.breed).some(coat => coat.id === look.coat));
  looks.add(`${look.breed}/${look.coat}`);
}
assert.ok(looks.size <= 18 && looks.size > 10);
assert.deepEqual(raidLookOf(0.37, ["mops"]), raidLookOf(0.37, ["mops"]));
assert.equal(raidLookOf(0.999, ["corgi", "mops"]).breed, "mops");

console.log("dogs raidLooks ok");
