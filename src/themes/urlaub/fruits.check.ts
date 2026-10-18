// Check for fruits.ts: exactly the 16 fruits, valid ids, unique names in chat, each with a fruit area and
// a face in the shape. Runs with npm test (alone: node src/themes/urlaub/fruits.check.ts).
import assert from "node:assert/strict";
import { normalizeName } from "../../core/minimes.ts";
import { findFruit, FRUIT_IDS, FRUIT_SET, FRUITS } from "./fruits.ts";

assert.deepEqual(FRUIT_IDS, [
  "mango", "sternfrucht", "papaya", "ananasguave", "nashi", "pepino", "kaktusfeige", "durian",
  "zitrone", "ananas", "kokosnuss", "drachenfrucht", "maracuja", "banane", "litschi", "wassermelone",
]);

// ids match the pattern of the variants, names are already normalized and unique across all fruits
const names = FRUITS.flatMap(fruit => fruit.names);
for (const fruit of FRUITS) {
  assert.match(fruit.id, /^[a-z0-9]{1,30}$/);
  assert.ok(fruit.names.length > 0, fruit.id);
  for (const name of fruit.names) assert.equal(normalizeName(name), name, name);
  assert.ok(fruit.parts.some(part => part.kind === "body"), `${fruit.id}: no fruit area`);
  for (const part of fruit.parts) assert.match(part.d, /^M/, fruit.id);
  assert.ok(fruit.face.x > 0 && fruit.face.x < 100 && fruit.face.y > 0 && fruit.face.y < 100 && fruit.face.size > 0, fruit.id);
}
assert.equal(new Set(names).size, names.length);

// Variants for the schema and lookup with fallback
assert.equal(FRUIT_SET.command, "!frucht");
assert.deepEqual(FRUIT_SET.variants.map(variant => variant.id), FRUIT_IDS);
assert.equal(findFruit("papaya").label, "Papaya");
assert.equal(findFruit("does-not-exist").id, "mango");

console.log("urlaub fruits ok");
