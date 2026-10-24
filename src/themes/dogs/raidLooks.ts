// Looks of the raid pack of the Dogs theme: which breed and coat a runner gets from its pick (0 to 1, raidPack), only
// from the breeds switched on; at most one look per breed and coat, so the scene builds at most 18 pose caches.
// Check: raidLooks.check.ts.
import { BREED_IDS, type BreedId } from "./breeds.ts";
import { coatsOf } from "./coats.ts";

// fixed: the coat comes from the fraction of the pick times a large prime, independent of the breed
const COAT_SPREAD = 7919;

// The breeds of the pack from the settings (raidBreed_<breed>); none switched on gives all
export function raidBreeds(values: Readonly<Record<string, unknown>>): BreedId[] {
  const on = BREED_IDS.filter(id => values[`raidBreed_${id}`] !== false);
  return on.length ? on : [...BREED_IDS];
}

// The look of a runner: breed and coat id from its pick
export function raidLookOf(pick: number, breeds: readonly BreedId[]): { breed: BreedId; coat: string } {
  const breed = breeds[Math.min(breeds.length - 1, Math.floor(pick * breeds.length))];
  const coats = coatsOf(breed);
  const coat = coats[Math.min(coats.length - 1, Math.floor(((pick * COAT_SPREAD) % 1) * coats.length))];
  return { breed, coat: coat.id };
}
