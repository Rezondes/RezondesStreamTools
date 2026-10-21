// Check for soldiers3d.ts: the five roles with valid ids and unique names in chat, the grenadier fires explosions; parts
// per role (helmet, head, torso, arms, legs and the weapon of the role, the medic with bag and cross and no weapon);
// poses begin and end at rest and are pure in the time; who holds the hill (most soldiers, a tie is contested, nobody is
// empty). Runs with npm test (alone: node src/themes/koth/soldiers3d.check.ts).
import assert from "node:assert/strict";
import { MEDIC } from "../../core/minimeFields.ts";
import { normalizeName } from "../../core/minimes.ts";
import { ANIMATIONS, EXPLOSIVE, findRole, HELD, hillState, muzzleOf, pose, ROLE_IDS, ROLE_SET, ROLES, soldier } from "./soldiers3d.ts";

// roles
{
  assert.deepEqual(ROLE_IDS, ["sturm", MEDIC, "mg", "sniper", "grenadier"]);
  const names = ROLES.flatMap(role => role.names);
  for (const role of ROLES) {
    assert.match(role.id, /^[a-z0-9]{1,30}$/);
    for (const name of role.names) assert.equal(normalizeName(name), name, name);
  }
  assert.equal(new Set(names).size, names.length);
  assert.deepEqual(EXPLOSIVE, ["grenadier"]);
  assert.equal(ROLE_SET.command, "!rolle");
  assert.deepEqual(ROLE_SET.variants.map(variant => variant.id), ROLE_IDS);
  assert.equal(findRole("sniper").label, "Scharfschütze");
  assert.equal(findRole("unknown").id, "sturm");
}

// Teile je Rolle
{
  const weapons = new Set<string>();
  for (const role of ROLE_IDS) {
    const parts = soldier(role);
    for (const joint of ["head", "torso", "armL", "armR", "legL", "legR", "tool"]) assert.ok(parts.some(part => part.joint === joint), `${role}: ${joint}`);
    assert.ok(parts.some(part => part.tone === "helmet" && part.shape === "dome"), `${role}: helmet`);
    assert.ok(parts.some(part => part.tone === "uniform"), `${role}: uniform`);
    for (const part of parts) {
      const centre = part.pivot.map((value, axis) => value + part.offset[axis]);
      assert.ok(centre[1] >= 0 && centre[1] <= 1 && Math.abs(centre[0]) <= 0.5, `${role}: part outside the box`);
    }
    const tool = parts.filter(part => part.joint === "tool");
    weapons.add(JSON.stringify(tool));
    if (role === MEDIC) {
      assert.ok(tool.some(part => part.tone === "bag") && tool.some(part => part.tone === "cross"), "medic bag with cross");
      assert.ok(!tool.some(part => part.tone === "weapon"), "medic without weapon");
      assert.equal(muzzleOf(role), null);
    } else {
      assert.ok(tool.some(part => part.tone === "weapon"), `${role}: weapon`);
      assert.ok((muzzleOf(role)?.[2] ?? 0) > 0.2, `${role}: muzzle in front`);
    }
  }
  assert.equal(weapons.size, ROLE_IDS.length, "every role has its own weapon");
  assert.ok(!soldier("sturm", false).some(part => part.tone === "eye"), "without faces no eyes");
}

// Posen beginnen und enden ruhig
{
  for (const animation of ANIMATIONS) {
    if (!HELD.includes(animation)) {
      for (const end of [0, 1]) for (const value of Object.values(pose(animation, end))) assert.ok(Math.abs(value) < 1e-9, `${animation} at ${end}`);
    }
    assert.ok([0.3, 0.45].some(part => Object.values(pose(animation, part)).some(value => Math.abs(value) > 0.01)), `${animation} moves`);
    assert.deepEqual(pose(animation, 0.3), pose(animation, 0.3));
  }
  // Falling ends lying, getting up begins lying and ends at rest
  assert.equal(pose("down", 0).fall, 0);
  assert.equal(pose("down", 1).fall, 1);
  assert.equal(pose("up", 0).fall, 1);
  assert.equal(pose("up", 1).fall, 0);
  assert.ok(Object.values(pose("unknown", 0.5)).every(value => value === 0));
  // The catalog of the theme does not reuse action names of the core fights
  for (const name of ["sight", "reload", "cover", "prone", "look", "salute", "cheer"]) assert.ok(ANIMATIONS.includes(name), name);
}

// hill
{
  assert.deepEqual(hillState({ blufor: 3, opfor: 1, indfor: 0 }), { kind: "held", team: "blufor" });
  assert.deepEqual(hillState({ blufor: 2, opfor: 2, indfor: 1 }), { kind: "contested" });
  assert.deepEqual(hillState({ blufor: 0, opfor: 0, indfor: 0 }), { kind: "empty" });
  assert.deepEqual(hillState({}), { kind: "empty" });
  assert.deepEqual(hillState({ indfor: 1 }), { kind: "held", team: "indfor" });
}

console.log("koth soldiers3d ok");
