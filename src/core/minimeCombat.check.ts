// Check for minimeCombat.ts: when a fight starts, its steps up to standing up, misses, factions, the lying time, partners
// that leave, the timer, the sounds and the reserved action names. Runs with npm test (alone: node src/core/minimeCombat.check.ts).
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { react, syncRoster, type MinimeActor, type MinimeStage } from "./minimeBehavior.ts";
import { advanceWithCombat, COMBAT_ACTIONS, combatCast, nextWake, readCombat, releaseOrphans, shownRole, startFight, type CombatOptions } from "./minimeCombat.ts";
import { readMinimeOptions } from "./minimeFields.ts";

const stage: MinimeStage = { motion: { ...readMinimeOptions({}).motion, walkWeight: 0 }, catalog: [], widthPx: 1000 };
const zero = () => 0;
const actor = (login: string, variant: string, x: number, changes: Partial<MinimeActor> = {}): MinimeActor => ({
  login, user: login, color: null, variant, action: "idle", startedAt: 0, durationMs: 100_000, fromX: x, toX: x, facing: 1, leaving: false, ...changes,
});
const options = (changes: Partial<CombatOptions> = {}): CombatOptions => {
  const read = readCombat({ minimeCombat: true, minimeHitChance: 100, minimeMedicSpeed: 100, minimeDownMs: 20_000, minimeReviveMs: 1000 }, ["grenade"]);
  assert.ok(read);
  return { ...read, ...changes };
};
const cast = combatCast(["medic", "mg", "grenade"], [], null);
const find = (actors: readonly MinimeActor[], login: string) => actors.find(entry => entry.login === login) as MinimeActor;
const roles = (actors: readonly MinimeActor[]) => Object.fromEntries(actors.filter(entry => entry.combat).map(entry => [entry.login, entry.combat?.role]));

// Settings: off or without the switch no fights; on with the defaults of minimeCombatFields
assert.equal(readCombat({}), null);
assert.equal(readCombat({ minimeCombat: false }), null);
assert.deepEqual([options().minMs, options().maxMs, options().maxFights, options().aimMs("mg"), options().fireMs("mg")], [20_000, 60_000, 2, 800, 600]);

// No medic: no fight, the same array
{
  const actors = [actor("a", "mg", 100), actor("b", "mg", 500)];
  assert.equal(startFight(actors, options(), cast, 0, zero), actors);
}

// A whole fight: aim, fire (shot), down (hit), the medic walks beside the target, revives, the target stands up
{
  const actors = [actor("a", "mg", 100), actor("b", "mg", 500), actor("m", "medic", 900)];
  let state = startFight(actors, options(), cast, 0, zero);
  assert.deepEqual(roles(state), { a: "target", b: "shooter", m: "medic" });
  const shooter = find(state, "b");
  assert.deepEqual([shooter.action, shooter.durationMs, shooter.facing, find(state, "a").action], ["aim", 800, -1, "idle"]);
  let step = advanceWithCombat(state, stage, options(), 800, zero);
  assert.deepEqual([find(step.actors, "b").action, step.sounds], ["fire", ["shot"]]);
  step = advanceWithCombat(step.actors, stage, options(), 1400, zero);
  state = step.actors;
  assert.deepEqual(step.sounds, ["hit"]);
  assert.equal(find(state, "b").combat, undefined);
  assert.deepEqual([find(state, "a").action, find(state, "a").combat?.hit], ["down", true]);
  const medic = find(state, "m");
  // From 900 to beside the target at 100 + 40, with 100 px/s
  assert.deepEqual([medic.action, medic.fromX, medic.toX, medic.facing, medic.durationMs], ["approach", 900, 140, -1, 7600]);
  step = advanceWithCombat(state, stage, options(), 9000, zero);
  assert.deepEqual([find(step.actors, "m").action, step.sounds], ["revive", ["revive"]]);
  assert.equal(find(step.actors, "a").startedAt + find(step.actors, "a").durationMs, 10_000);
  step = advanceWithCombat(step.actors, stage, options(), 10_000, zero);
  assert.deepEqual([find(step.actors, "a").action, find(step.actors, "a").combat, find(step.actors, "m").combat], ["up", undefined, undefined]);
}

// The same with the medic first in the list: reviving and lying end together, both are free
{
  let state = startFight([actor("m", "medic", 900), actor("b", "mg", 500), actor("a", "mg", 100)], options(), cast, 0, zero);
  for (const now of [800, 1400]) state = advanceWithCombat(state, stage, options(), now, zero).actors;
  const target = Object.entries(roles(state)).find(([, role]) => role === "target")?.[0] as string;
  const arrival = find(state, "m").startedAt + find(state, "m").durationMs;
  state = advanceWithCombat(state, stage, options(), arrival, zero).actors;
  state = advanceWithCombat(state, stage, options(), arrival + 1000, zero).actors;
  assert.deepEqual([find(state, target).action, roles(state)], ["up", {}]);
}

// A miss frees target and medic; a grenade sounds as an explosion
{
  const actors = [actor("a", "grenade", 100), actor("b", "mg", 500), actor("m", "medic", 900)];
  let state = startFight(actors, options({ hitChance: 0 }), cast, 0, () => 0.99);
  const shooter = Object.entries(roles(state)).find(([, role]) => role === "shooter")?.[0] as string;
  let step = advanceWithCombat(state, stage, options({ hitChance: 0 }), 800, zero);
  assert.deepEqual(step.sounds, [find(state, shooter).variant === "grenade" ? "explosion" : "shot"]);
  step = advanceWithCombat(step.actors, stage, options({ hitChance: 0 }), 1400, zero);
  state = step.actors;
  assert.deepEqual([roles(state), step.sounds], [{}, []]);
}

// The lying time is over before the medic arrives: the target stands up, the medic finishes its way without the fight
{
  const actors = [actor("a", "mg", 100), actor("b", "mg", 500), actor("m", "medic", 990)];
  const short = options({ downMs: 1000 });
  let state = startFight(actors, short, cast, 0, zero);
  state = advanceWithCombat(advanceWithCombat(state, stage, short, 800, zero).actors, stage, short, 1400, zero).actors;
  const step = advanceWithCombat(state, stage, short, 2400, zero);
  assert.deepEqual([find(step.actors, "a").action, find(step.actors, "m").action, roles(step.actors)], ["up", "approach", {}]);
}

// A waiting medic keeps its own actions and stays in the fight; arriving at a target that is leaving, it is free again
{
  const actors = [actor("a", "mg", 100), actor("b", "mg", 500), actor("m", "medic", 900, { durationMs: 300 })];
  let state = startFight(actors, options(), cast, 0, zero);
  state = advanceWithCombat(state, stage, options(), 300, zero).actors;
  assert.deepEqual([find(state, "m").startedAt, find(state, "m").combat?.role], [300, "medic"]);
  state = advanceWithCombat(advanceWithCombat(state, stage, options(), 800, zero).actors, stage, options(), 1400, zero).actors;
  const arrival = find(state, "m").startedAt + find(state, "m").durationMs;
  state = state.map(entry => (entry.login === "a" ? { ...entry, leaving: true, action: "exit", durationMs: 100_000 } : entry));
  const step = advanceWithCombat(state, stage, options(), arrival, zero);
  assert.deepEqual([find(step.actors, "m").combat, step.sounds], [undefined, []]);
}

// Factions: never the own faction, the medic of the target's faction, one faction alone fights nobody
{
  const teams = { a: "blau", b: "rot", m: "blau", n: "rot" } as Record<string, string>;
  const factions = { ...combatCast(["medic", "mg"], ["blau", "rot"], null), teamOf: (entry: MinimeActor) => teams[entry.login] };
  const actors = [actor("a", "mg", 100), actor("b", "mg", 500), actor("m", "medic", 900), actor("n", "medic", 950)];
  for (const random of [zero, () => 0.5, () => 0.99]) {
    const state = startFight(actors, options(), factions, 0, random);
    const target = Object.entries(roles(state)).find(([, role]) => role === "target")?.[0] as string;
    const medic = Object.entries(roles(state)).find(([, role]) => role === "medic")?.[0] as string;
    assert.equal(teams[medic], teams[target]);
  }
  const lonely = { ...factions, teamOf: () => "blau" };
  assert.equal(startFight(actors, options(), lonely, 0, zero), actors);
}

// At most maxFights at once; a medic helps only one
{
  const actors = [actor("a", "mg", 100), actor("b", "mg", 500), actor("c", "mg", 600), actor("d", "mg", 700), actor("m", "medic", 900)];
  const first = startFight(actors, options({ maxFights: 1 }), cast, 0, zero);
  assert.equal(startFight(first, options({ maxFights: 1 }), cast, 0, zero), first);
  assert.equal(startFight(first, options({ maxFights: 2 }), cast, 0, zero), first, "no second free medic");
}

// Chat reactions and role changes do not interrupt a fight
{
  const state = startFight([actor("a", "mg", 100), actor("b", "mg", 500), actor("m", "medic", 900)], options(), cast, 0, zero);
  const shooter = find(state, "b");
  assert.equal(react(shooter, { name: "wave", durationMs: 500, weight: 0 }, 100), shooter);
  const synced = syncRoster(state, state.map(entry => ({ login: entry.login, user: entry.user, color: null, variant: entry.login === "b" ? "medic" : entry.variant })), stage, 100, zero);
  assert.deepEqual([find(synced, "b").variant, find(synced, "b").combat?.variant], ["medic", "mg"]);
}

// Partners that leave: the shooter before the shot frees target and medic; a leaving target frees shooter and medic
{
  const state = startFight([actor("a", "mg", 100), actor("b", "mg", 500), actor("m", "medic", 900)], options(), cast, 0, zero);
  const withoutShooter = releaseOrphans(state.map(entry => (entry.login === "b" ? { ...entry, leaving: true } : entry)));
  assert.deepEqual([find(withoutShooter, "a").combat, find(withoutShooter, "m").combat], [undefined, undefined]);
  const withoutTarget = releaseOrphans(state.map(entry => (entry.login === "a" ? { ...entry, leaving: true } : entry)));
  assert.deepEqual([find(withoutTarget, "b").combat, find(withoutTarget, "m").combat], [undefined, undefined]);
  assert.equal(releaseOrphans(state), state);
}

// One timer: the next action end or the next fight try, whichever comes first
assert.equal(nextWake([actor("a", "mg", 0, { durationMs: 500 })], 300), 300);
assert.equal(nextWake([actor("a", "mg", 0, { durationMs: 500 })], 900), 500);
assert.equal(nextWake([], 900), 900);
assert.equal(nextWake([], null), null);

// Demo: the first demo minime is the medic, so ?demo shows fights
assert.equal(shownRole(actor("neo", "", 0, { variant: null }), ["medic", "mg"], "mg", "neo"), "medic");
assert.equal(shownRole(actor("tank", "", 0, { variant: null }), ["mg"], "mg", "neo"), "mg");

// Reserved names: no theme catalog uses an action of the fights
const themes = join("src", "themes");
for (const theme of readdirSync(themes, { withFileTypes: true }).filter(entry => entry.isDirectory())) {
  const scene = join(themes, theme.name, "scenes", "Minimes.tsx");
  if (!existsSync(scene)) continue;
  const names = [...readFileSync(scene, "utf8").matchAll(/name: "(\w+)"/g)].map(match => match[1]);
  for (const name of names) assert.ok(!(COMBAT_ACTIONS as readonly string[]).includes(name), `${scene}: "${name}" is an action of the fights`);
}

console.log("minimeCombat ok");
