// Deterministischer Zufall für Renderer (Stinger, Banner) und Szenen: gleiche Zahl, gleicher Wert (Regel 21).
// Check: hash.check.ts.

// Wert 0 bis unter 1 aus einer ganzen Zahl
export function hash(seed: number) {
  let mixed = Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b);
  mixed ^= mixed >>> 13;
  mixed = Math.imul(mixed, 0xc2b2ae35);
  mixed ^= mixed >>> 16;
  return (mixed >>> 0) / 4294967296;
}

// Zahl aus einem Text (z.B. einem Login) als seed für hash
export function seedOf(text: string) {
  let seed = 0;
  for (const character of text) seed = Math.imul(seed, 31) + (character.codePointAt(0) ?? 0);
  return seed;
}
