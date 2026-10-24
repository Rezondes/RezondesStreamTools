// The dog of a chatter in the Dogs theme: breed and coat from the login (seedOf, hash), only from the breeds switched on
// for the chat (chatBreed_<breed>); the same login always gets the same dog. Check: lookOf.check.ts.
import { hash, seedOf } from "../../core/hash.ts";
import { breedsOn, raidLookOf } from "./raidLooks.ts";

export const chatBreeds = (values: Readonly<Record<string, unknown>>) => breedsOn(values, "chatBreed_");

export const lookOf = (login: string, values: Readonly<Record<string, unknown>>) => raidLookOf(hash(seedOf(login.toLowerCase())), chatBreeds(values));
