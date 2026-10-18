// Check for mangos.ts: the five roles with valid ids, a medic for the fights, unique names in chat, every weapon with paths,
// the grenadier fires explosions. Runs with npm test (alone: node src/themes/plantage/mangos.check.ts).
import assert from "node:assert/strict";
import { MEDIC } from "../../core/minimeFields.ts";
import { normalizeName } from "../../core/minimes.ts";
import { EXPLOSIVE, findRole, MANGO, ROLE_IDS, ROLE_SET, ROLES } from "./mangos.ts";

assert.deepEqual(ROLE_IDS, ["sturm", MEDIC, "mg", "sniper", "grenadier"]);
const names = ROLES.flatMap(role => role.names);
for (const role of ROLES) {
  assert.match(role.id, /^[a-z0-9]{1,30}$/);
  for (const name of role.names) assert.equal(normalizeName(name), name, name);
  assert.ok(role.weapon.some(part => part.kind === "weapon"), role.id);
  for (const part of role.weapon) assert.match(part.d, /^M/, role.id);
}
assert.equal(new Set(names).size, names.length);
assert.deepEqual(EXPLOSIVE, ["grenadier"]);
assert.ok(EXPLOSIVE.every(id => ROLE_IDS.includes(id)));

// Variants for the schema and lookup with fallback; the mango has all its parts
assert.equal(ROLE_SET.command, "!rolle");
assert.deepEqual(ROLE_SET.variants.map(variant => variant.id), ROLE_IDS);
assert.equal(findRole("sniper").label, "Scharfschütze");
assert.equal(findRole("unknown").id, "sturm");
for (const part of [MANGO.body, MANGO.blush, MANGO.leaf, MANGO.helmet, MANGO.strap]) assert.match(part, /^M/);

console.log("plantage mangos ok");
