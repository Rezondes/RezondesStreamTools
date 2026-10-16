// Check für fruits.ts: genau die 16 Früchte, gültige ids, eindeutige Namen im Chat, jede mit Fruchtfläche und
// Gesicht in der Form. Läuft mit npm test (einzeln: node src/themes/suedfrucht/fruits.check.ts).
import assert from "node:assert/strict";
import { normalizeName } from "../../core/minimes.ts";
import { findFruit, FRUIT_IDS, FRUIT_SET, FRUITS } from "./fruits.ts";

assert.deepEqual(FRUIT_IDS, [
  "mango", "sternfrucht", "papaya", "ananasguave", "nashi", "pepino", "kaktusfeige", "durian",
  "zitrone", "ananas", "kokosnuss", "drachenfrucht", "maracuja", "banane", "litschi", "wassermelone",
]);

// ids passen zum Muster der Typen, Namen sind schon vereinheitlicht und über alle Früchte eindeutig
const names = FRUITS.flatMap(fruit => fruit.names);
for (const fruit of FRUITS) {
  assert.match(fruit.id, /^[a-z0-9]{1,30}$/);
  assert.ok(fruit.names.length > 0, fruit.id);
  for (const name of fruit.names) assert.equal(normalizeName(name), name, name);
  assert.ok(fruit.parts.some(part => part.kind === "body"), `${fruit.id}: keine Fruchtfläche`);
  for (const part of fruit.parts) assert.match(part.d, /^M/, fruit.id);
  assert.ok(fruit.face.x > 0 && fruit.face.x < 100 && fruit.face.y > 0 && fruit.face.y < 100 && fruit.face.size > 0, fruit.id);
}
assert.equal(new Set(names).size, names.length);

// Typen für das Schema und Suche mit Ersatz
assert.equal(FRUIT_SET.command, "!frucht");
assert.deepEqual(FRUIT_SET.variants.map(variant => variant.id), FRUIT_IDS);
assert.equal(findFruit("papaya").label, "Papaya");
assert.equal(findFruit("gibt-es-nicht").id, "mango");

console.log("suedfrucht fruits ok");
