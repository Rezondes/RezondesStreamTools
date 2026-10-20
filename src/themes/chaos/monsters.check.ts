// Check for monsters.ts: the same login always gives the same monster, many logins give many forms, every line stays in
// the box of the figure and the feet stand on the ground. Runs with npm test.
import assert from "node:assert/strict";
import { GROUND, monsterOf, splatOf } from "./monsters.ts";
import { pointsOf } from "./paths.ts";

// Same login, same monster; another login draws another one
assert.deepEqual(monsterOf("neo"), monsterOf("neo"));
assert.notDeepEqual(monsterOf("neo"), monsterOf("trinity"));

// Variety: 50 logins show at least six different forms
const logins = Array.from({ length: 50 }, (_, index) => `chatter${index}`);
assert.ok(new Set(logins.map(login => monsterOf(login).form)).size >= 6);

// Every part is a path inside the box of the figure; the body closes, legs and mouth stay open lines
for (const login of logins.slice(0, 10)) {
  const monster = monsterOf(login);
  const parts = [monster.body, ...monster.eyes, ...monster.pupils, monster.mouth, monster.grin, ...monster.legs, ...monster.arms, ...monster.extras];
  for (const path of parts) {
    assert.ok(path.startsWith("M"), login);
    assert.ok(pointsOf(path).every(([x, y]) => Math.abs(x) <= 0.6 && y >= -0.75 && y <= GROUND + 0.01), `${login} leaves its box`);
  }
  assert.ok(monster.body.endsWith("Z"));
  assert.ok(![monster.mouth, ...monster.legs].some(path => path.endsWith("Z")));
  assert.equal(monster.eyes.length, 2);
  // At least one foot reaches the ground
  assert.ok(monster.legs.some(leg => pointsOf(leg).some(([, y]) => y > GROUND - 0.03)), `${login} floats`);
}

// The splat of a chat reaction: a closed blob and droplets, the same for the same seed
const splat = splatOf(3);
assert.deepEqual(splatOf(3), splat);
assert.ok(splat.length > 1 && splat.every(path => path.endsWith("Z")));

console.log("monsters ok");
