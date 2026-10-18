// Check for beachThings.ts: exactly the 16 beach things, valid ids, unique names in chat, each with a main area and a
// face in the shape. Runs with npm test (alone: node src/themes/urlaub/beachThings.check.ts).
import assert from "node:assert/strict";
import { normalizeName } from "../../core/minimes.ts";
import { BEACH_THINGS, findThing, THING_IDS, THING_SET } from "./beachThings.ts";

assert.deepEqual(THING_IDS, [
  "rettungsring", "badeente", "wasserball", "surfbrett", "sonnenschirm", "flamingo", "liegestuhl", "sandeimer",
  "eis", "muschel", "seestern", "krebs", "schnorchel", "sonnenbrille", "cocktail", "strandtasche",
]);

// ids match the pattern of the variants, names are already normalized and unique across all things
const names = BEACH_THINGS.flatMap(thing => thing.names);
for (const thing of BEACH_THINGS) {
  assert.match(thing.id, /^[a-z0-9]{1,30}$/);
  assert.ok(thing.names.length > 0, thing.id);
  for (const name of thing.names) assert.equal(normalizeName(name), name, name);
  assert.ok(thing.parts.some(part => part.kind === "body"), `${thing.id}: no main area`);
  for (const part of thing.parts) assert.match(part.d, /^M/, thing.id);
  assert.ok(thing.face.x > 0 && thing.face.x < 100 && thing.face.y > 0 && thing.face.y < 100 && thing.face.size > 0, thing.id);
}
assert.equal(new Set(names).size, names.length);
// Several words in chat become one name ("Eis am Stiel")
assert.ok(findThing("eis").names.includes(normalizeName("Eis am Stiel")));

// Variants for the schema and lookup with fallback
assert.equal(THING_SET.command, "!typ");
assert.deepEqual(THING_SET.variants.map(variant => variant.id), THING_IDS);
assert.equal(findThing("badeente").label, "Badeente");
assert.equal(findThing("mango").id, "rettungsring");

console.log("urlaub beach things ok");
