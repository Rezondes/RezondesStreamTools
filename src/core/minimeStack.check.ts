// Check for minimeStack.ts: when a tower starts, its steps from gathering to stepping off, walking together, members
// that leave, chat reactions, the timer, fights, fixed places, the demo and the reserved action names.
// Runs with npm test (alone: node src/core/minimeStack.check.ts).
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { nextEnd, positionAt, react, resettle, type MinimeActor, type MinimeStage } from "./minimeBehavior.ts";
import { COMBAT_ACTIONS, combatCast, readCombat, startFight } from "./minimeCombat.ts";
import { readMinimeOptions } from "./minimeFields.ts";
import { advanceStacks, breakStacks, nextStackAt, readStack, STACK_ACTIONS, startStack, timeline, withLevelVariants, type StackOptions } from "./minimeStack.ts";

const stage: MinimeStage = { motion: { ...readMinimeOptions({}).motion, walkWeight: 0 }, catalog: [], widthPx: 1000 };
const zero = () => 0;
const actor = (login: string, variant: string, x: number, changes: Partial<MinimeActor> = {}): MinimeActor => ({
  login, user: login, color: null, variant, action: "idle", startedAt: 0, durationMs: 100_000, fromX: x, toX: x, facing: 1, leaving: false, ...changes,
});
const typeOf = (entry: MinimeActor) => entry.variant;
const options = (changes: Partial<StackOptions> = {}): StackOptions => {
  const read = readStack({ minimeStack: true, minimeStackLevel1: "a", minimeStackLevel2: "b", minimeStackLevel3: "c", minimeStackWalk: true, minimeStackSpeed: 100 });
  assert.ok(read);
  return { ...read, ...changes };
};
const find = (actors: readonly MinimeActor[], login: string) => actors.find(entry => entry.login === login) as MinimeActor;
const levels = (actors: readonly MinimeActor[]) => Object.fromEntries(actors.filter(entry => entry.stack).map(entry => [entry.login, entry.stack?.level]));

// Settings: off, without the switch or below two levels no towers; level 3 "keiner" ends the tower at two
assert.equal(readStack({}), null);
assert.equal(readStack({ minimeStack: false, minimeStackLevel1: "a", minimeStackLevel2: "b" }), null);
assert.equal(readStack({ minimeStack: true, minimeStackLevel1: "a", minimeStackLevel2: "keiner" }), null);
assert.deepEqual(readStack({ minimeStack: true, minimeStackLevel1: "a", minimeStackLevel2: "b", minimeStackLevel3: "keiner" })?.levels, ["a", "b"]);
assert.deepEqual([options().levels, options().climbMs, options().walkMs], [["a", "b", "c"], 900, 5000]);
assert.equal(readStack({ minimeStack: true, minimeStackLevel1: "a", minimeStackLevel2: "b", minimeStackWalk: false })?.walkMs, 0);

// Starts only with one free minime per level: a, a, b gives no tower; a c in a fight neither; a free c does; at most one
{
  const fighting = actor("c1", "c", 700, { combat: { role: "target", shooter: "x", target: "c1", medic: "m", variant: "c", hit: false } });
  const actors = [actor("a1", "a", 100), actor("a2", "a", 200), actor("b1", "b", 300)];
  assert.equal(startStack(actors, options(), typeOf, stage, 0, zero), actors);
  assert.deepEqual(levels(startStack([...actors, fighting], options(), typeOf, stage, 0, zero)), {});
  const tower = startStack([...actors, actor("c2", "c", 500)], options(), typeOf, stage, 0, zero);
  const stacked = levels(tower);
  assert.equal(Object.keys(stacked).length, 3);
  assert.deepEqual(Object.values(stacked).sort(), [1, 2, 3]);
  assert.equal(new Set(tower.filter(entry => entry.stack).map(entry => entry.variant)).size, 3);
  const more = [...tower, actor("a9", "a", 50), actor("b9", "b", 60), actor("c9", "c", 70)];
  assert.equal(startStack(more, options(), typeOf, stage, 0, zero), more);
  assert.equal(levels(startStack(more, options({ maxTowers: 2 }), typeOf, stage, 0, zero)).a9, 1);
}

// Runs through all steps: gather (the base braces), climb from the bottom up, stacked, stackWalk with one position for
// every level, dismount from the top down, then everybody is free
{
  let actors = startStack([actor("a", "a", 300), actor("b", "b", 500), actor("c", "c", 100)], options(), typeOf, stage, 0, zero);
  assert.deepEqual([find(actors, "a").action, find(actors, "b").action, find(actors, "c").action], ["brace", "gather", "gather"]);
  const seen = new Set<string>();
  const climbs: string[] = [];
  const dismounts: string[] = [];
  let sounds = 0;
  for (let guard = 0; guard < 100 && actors.some(entry => entry.stack); guard++) {
    const now = nextEnd(actors) ?? 0;
    const step = advanceStacks(actors, stage, now, zero);
    sounds += step.climbs;
    for (const entry of step.actors) {
      const before = find(actors, entry.login).action;
      seen.add(entry.action);
      if (entry.action === "climb" && before !== "climb") climbs.push(entry.login);
      if (entry.action === "dismount" && before !== "dismount") dismounts.push(entry.login);
    }
    const walking = step.actors.filter(entry => entry.action === "stackWalk");
    if (walking.length) {
      const mid = walking[0].startedAt + walking[0].durationMs / 2;
      assert.equal(new Set(walking.map(entry => positionAt(entry, mid))).size, 1);
    }
    actors = step.actors;
  }
  assert.deepEqual(climbs, ["b", "c"]);
  assert.deepEqual(dismounts, ["c", "b"]);
  assert.equal(sounds, 2);
  for (const name of ["climb", "stacked", "stackWalk", "dismount"]) assert.ok(seen.has(name), name);
  assert.ok(actors.every(entry => !entry.stack));
}

// The timeline: the walk goes the walking distance from the base; gathering goes to the base
{
  const [tower] = startStack([actor("a", "a", 300), actor("b", "b", 500)], options({ levels: ["a", "b"] }), typeOf, stage, 0, zero);
  assert.ok(tower.stack);
  const walk = timeline(tower.stack.tower, 1).find(step => step.action === "stackWalk");
  assert.deepEqual([walk?.fromX, Math.abs((walk?.toX ?? 0) - 300)], [300, 300]);
  assert.deepEqual(timeline(tower.stack.tower, 2)[0], { action: "gather", start: 0, end: 2000, fromX: 500, toX: 300 });
  // Without walking no stackWalk
  const [still] = startStack([actor("a", "a", 300), actor("b", "b", 500)], options({ levels: ["a", "b"], walkMs: 0 }), typeOf, stage, 0, zero);
  assert.ok(still.stack && !timeline(still.stack.tower, 1).some(step => step.action === "stackWalk"));
}

// A leaving minime breaks the tower above it: level 2 leaves, level 3 steps off, the base alone is free again
{
  const actors = startStack([actor("a", "a", 300), actor("b", "b", 300), actor("c", "c", 300)], options(), typeOf, stage, 0, zero);
  const left = actors.map(entry => (entry.login === "b" ? { ...entry, action: "exit", leaving: true } : entry));
  const broken = breakStacks(left, typeOf, stage, 10, zero);
  assert.deepEqual(levels(broken), {});
  assert.equal(find(broken, "c").action, "dismount");
  assert.notEqual(find(broken, "a").action, "brace");
  assert.equal(breakStacks(broken, typeOf, stage, 10, zero), broken);
  // Level 3 changes its type (counts as leaving): the two below go on
  const top = breakStacks(actors.map(entry => (entry.login === "c" ? { ...entry, variant: "a" } : entry)), typeOf, stage, 10, zero);
  assert.deepEqual(levels(top), { a: 1, b: 2 });
  assert.equal(breakStacks(top, typeOf, stage, 10, zero), top);
  assert.equal(breakStacks(actors, typeOf, stage, 10, zero), actors);
}

// Chat reactions leave tower members alone; the timer includes the tower steps; next try between min and max
{
  const actors = startStack([actor("a", "a", 300), actor("b", "b", 500)], options({ levels: ["a", "b"] }), typeOf, stage, 0, zero);
  const member = find(actors, "b");
  assert.equal(react(member, { name: "wave", durationMs: 500, weight: 0 }, 10), member);
  assert.equal(nextEnd(actors), 2000);
  assert.deepEqual([nextStackAt(options(), 0, zero), nextStackAt(options(), 0, () => 1)], [30_000, 90_000]);
}

// Fights and towers never share a minime; with fixed places members stay, and once free walk back to their place
{
  const fights = readCombat({ minimeCombat: true });
  assert.ok(fights);
  const actors = startStack([actor("a", "a", 300), actor("b", "b", 500)], options({ levels: ["a", "b"] }), typeOf, stage, 0, zero);
  assert.equal(startFight(actors, fights, combatCast(["a", "b"], [], null), 0, zero), actors);
  const slots: MinimeStage = { ...stage, slots: { count: 2, teams: [], teamOf: () => null } };
  const placed = actors.map(entry => ({ ...entry, slot: 1 }));
  assert.equal(resettle(placed, slots, 0), placed);
  const done = advanceStacks(placed, slots, 1_000_000, zero).actors;
  assert.ok(done.every(entry => !entry.stack && entry.action === "walk"));
}

// Demo: the first demo minimes get the level types, the others and chosen variants stay
assert.deepEqual(
  withLevelVariants([{ login: "x", user: "x", color: null, variant: null }, { login: "y", user: "y", color: null, variant: "z" }, { login: "w", user: "w", color: null, variant: null }], ["a", "b"]).map(minime => minime.variant),
  ["a", "z", null],
);

// Reserved names: no theme catalog uses an action of the towers, and towers and fights use different names
const themes = join("src", "themes");
for (const theme of readdirSync(themes, { withFileTypes: true }).filter(entry => entry.isDirectory())) {
  const scene = join(themes, theme.name, "scenes", "Minimes.tsx");
  if (!existsSync(scene)) continue;
  const names = [...readFileSync(scene, "utf8").matchAll(/name: "(\w+)"/g)].map(match => match[1]);
  for (const name of names) assert.ok(!(STACK_ACTIONS as readonly string[]).includes(name), `${scene}: "${name}" is an action of the towers`);
}
assert.ok(!STACK_ACTIONS.some(name => (COMBAT_ACTIONS as readonly string[]).includes(name)));

console.log("minimeStack ok");
