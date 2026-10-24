// Check of lookOf.ts (PLAN-DOGS.md package 4, AC1): the same login gets the same dog, only switched on breeds, only real
// coats of the breed, and different logins spread over the breeds. Run: node src/themes/dogs/lookOf.check.ts
import assert from "node:assert/strict";
import { BREED_IDS } from "./breeds.ts";
import { coatsOf } from "./coats.ts";
import { chatBreeds, lookOf } from "./lookOf.ts";

// Aussehen aus dem Login
assert.deepEqual(lookOf("Pfotenfreund42", {}), lookOf("pfotenfreund42", {}));
const onlyMops = Object.fromEntries(BREED_IDS.filter(id => id !== "mops").map(id => [`chatBreed_${id}`, false]));
assert.deepEqual(chatBreeds(onlyMops), ["mops"]);
const breeds = new Set<string>();
for (let index = 0; index < 300; index++) {
  const look = lookOf(`viewer${index}`, {});
  assert.ok(coatsOf(look.breed).some(coat => coat.id === look.coat), `${look.breed}/${look.coat}`);
  assert.equal(lookOf(`viewer${index}`, onlyMops).breed, "mops");
  breeds.add(look.breed);
}
assert.equal(breeds.size, BREED_IDS.length, "logins spread over all breeds");

console.log("dogs lookOf ok");
