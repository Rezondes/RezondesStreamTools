// Looks of the raid pack of the Dogs theme: which breed and coat a runner gets from its pick (0 to 1, raidPack), only
// from the breeds switched on; at most one look per breed and coat, so the scene builds at most 18 pose caches.
// Check: raidLooks.check.ts.
import { BREED_IDS, type BreedId } from "./breeds.ts";
import { coatsOf } from "./coats.ts";

// fixed: the coat comes from the fraction of the pick times a large prime, independent of the breed
const COAT_SPREAD = 7919;

// The breeds switched on in the settings under prefix<breed> (raidBreed_, chatBreed_); none switched on gives all
export function breedsOn(values: Readonly<Record<string, unknown>>, prefix: string): BreedId[] {
  const on = BREED_IDS.filter(id => values[`${prefix}${id}`] !== false);
  return on.length ? on : [...BREED_IDS];
}

// The breeds of the pack from the settings (raidBreed_<breed>)
export const raidBreeds = (values: Readonly<Record<string, unknown>>) => breedsOn(values, "raidBreed_");

// The look of a runner (or a chatter): breed and coat id from its pick
export function raidLookOf(pick: number, breeds: readonly BreedId[]): { breed: BreedId; coat: string } {
  const breed = breeds[Math.min(breeds.length - 1, Math.floor(pick * breeds.length))];
  const coats = coatsOf(breed);
  const coat = coats[Math.min(coats.length - 1, Math.floor(((pick * COAT_SPREAD) % 1) * coats.length))];
  return { breed, coat: coat.id };
}
