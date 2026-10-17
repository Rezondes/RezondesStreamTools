// Deterministic randomness for renderers (stinger, banners) and scenes: same number, same value (rule 21).
// Check: hash.check.ts.

// Value from 0 to below 1 from an integer
export function hash(seed: number) {
  let mixed = Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b);
  mixed ^= mixed >>> 13;
  mixed = Math.imul(mixed, 0xc2b2ae35);
  mixed ^= mixed >>> 16;
  return (mixed >>> 0) / 4294967296;
}

// Number from a text (e.g. a login) as seed for hash
export function seedOf(text: string) {
  let seed = 0;
  for (const character of text) seed = Math.imul(seed, 31) + (character.codePointAt(0) ?? 0);
  return seed;
}
