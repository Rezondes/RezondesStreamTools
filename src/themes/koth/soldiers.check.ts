// Check for soldiers.ts: the five roles with valid ids, a medic for the fights, unique names in chat, every weapon with
// paths, the grenadier fires explosions; who holds the hill (most soldiers, a tie is contested, nobody is empty).
// Runs with npm test (alone: node src/themes/koth/soldiers.check.ts).
import assert from "node:assert/strict";
import { MEDIC } from "../../core/minimeFields.ts";
import { normalizeName } from "../../core/minimes.ts";
import { EXPLOSIVE, findRole, hillState, ROLE_IDS, ROLE_SET, ROLES, SOLDIER } from "./soldiers.ts";

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
assert.equal(ROLE_SET.command, "!rolle");
assert.deepEqual(ROLE_SET.variants.map(variant => variant.id), ROLE_IDS);
assert.equal(findRole("sniper").label, "Scharfschütze");
assert.equal(findRole("unknown").id, "sturm");
for (const part of [SOLDIER.legs, SOLDIER.torso, SOLDIER.belt, SOLDIER.sleeve, SOLDIER.head, SOLDIER.helmet]) assert.match(part, /^M/);

// The hill: most soldiers hold it, a tie at the top is contested, without soldiers it is empty
assert.deepEqual(hillState({ blufor: 3, opfor: 1, indfor: 0 }), { kind: "held", team: "blufor" });
assert.deepEqual(hillState({ blufor: 2, opfor: 2, indfor: 1 }), { kind: "contested" });
assert.deepEqual(hillState({ blufor: 0, opfor: 0, indfor: 0 }), { kind: "empty" });
assert.deepEqual(hillState({}), { kind: "empty" });
assert.deepEqual(hillState({ indfor: 1 }), { kind: "held", team: "indfor" });

console.log("koth soldiers ok");
