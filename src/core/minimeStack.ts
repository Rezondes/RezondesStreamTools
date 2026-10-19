// Towers of the minimes (PLAN-MINIMES package 13): now and then, when one free minime of every level type is there, they
// stack up: the upper ones gather at the base (gather, the base braces), climb up level by level from the bottom (climb),
// stand as a tower (stacked), walk together (stackWalk, optional) and step off from the top (dismount). No chat command.
// The steps of a tower follow one timeline from its start, so a late timer never mixes them up. Settings come from
// minimeStackFields. Every overlay rolls its own towers, the server knows nothing about them.
// Pure (rule 12): time and randomness come in from outside. Used by hooks/useMinimes.ts. Check: minimeStack.check.ts.
import { at, nextAction, positionAt, type MinimeActor, type MinimeStage, type Tower } from "./minimeBehavior.ts";
import { STACK_LEVEL_KEYS, STACK_NONE } from "./minimeFields.ts";
import type { SettingValues } from "./theme.ts";
import type { Minime } from "./types.ts";

// Actions of the core in towers; a catalog of a theme must not use them
export const STACK_ACTIONS = ["gather", "brace", "climb", "stacked", "stackWalk", "dismount"] as const;

// Settings of the towers from the values; levels: the type per level from the bottom (at least two)
export type StackOptions = {
  minMs: number;
  maxMs: number;
  maxTowers: number;
  levels: readonly string[];
  speedPxPerS: number;
  climbMs: number;
  stackedMs: number;
  walkMs: number; // 0 = the tower does not walk
  walkPx: number;
  dismountMs: number;
  sound: boolean;
};

// fixed: shortest gathering, so a tower of minimes already standing together still has a step before climbing
const MIN_GATHER_MS = 50;

const number = (values: SettingValues, key: string, fallback: number) => {
  const value = values[key];
  return typeof value === "number" ? value : fallback;
};

// The tower settings of a theme, null if it has no towers, they are switched off or fewer than two levels are set
export function readStack(values: SettingValues): StackOptions | null {
  if (values.minimeStack !== true) return null;
  const levels: string[] = [];
  for (const key of STACK_LEVEL_KEYS) {
    const type = values[key];
    if (typeof type !== "string" || type === STACK_NONE) break;
    levels.push(type);
  }
  if (levels.length < 2) return null;
  const [first, second] = [number(values, "minimeStackMinS", 30), number(values, "minimeStackMaxS", 90)];
  return {
    minMs: Math.min(first, second) * 1000,
    maxMs: Math.max(first, second) * 1000,
    maxTowers: number(values, "minimeStackMax", 1),
    levels,
    speedPxPerS: Math.max(1, number(values, "minimeStackSpeed", 90)),
    climbMs: number(values, "minimeClimbMs", 900),
    stackedMs: number(values, "minimeStackedMs", 4000),
    walkMs: values.minimeStackWalk === true ? number(values, "minimeStackWalkMs", 5000) : 0,
    walkPx: number(values, "minimeStackWalkPx", 300),
    dismountMs: number(values, "minimeDismountMs", 700),
    sound: values.minimeStackSound === true,
  };
}

// When the next tower is tried: a random pause between the minimum and the maximum
export const nextStackAt = (options: StackOptions, now: number, random: () => number) => now + options.minMs + random() * (options.maxMs - options.minMs);

// Demo: the first demo minimes get the types of the levels, so ?demo shows towers (others keep their variant)
export const withLevelVariants = (minimes: readonly Minime[], levels: readonly string[]): Minime[] =>
  minimes.map((minime, index) => (minime.variant || index >= levels.length ? minime : { ...minime, variant: levels[index] }));

const ready = (actor: MinimeActor) => !actor.leaving && !actor.combat && !actor.stack && actor.action !== "enter" && actor.action !== "exit";

function withoutStack(actor: MinimeActor): MinimeActor {
  const rest = { ...actor };
  delete rest.stack;
  return rest;
}

// One step of a member in the timeline of its tower
type Segment = { action: string; start: number; end: number; fromX: number; toX: number };

// All steps of the member on a level (1 = base) from the start of the tower to its end
export function timeline(tower: Tower, level: number): Segment[] {
  const { members, startedAt, gatherEnd, climbMs, stackedMs, walkMs, dismountMs, baseX, walkX } = tower;
  const count = members.length;
  const top = gatherEnd + (count - 1) * climbMs; // everybody is up
  const walkStart = top + stackedMs;
  const walkEnd = walkStart + walkMs;
  const off = walkEnd + (count - level) * dismountMs; // this level steps off (the base: once the last one is down)
  const still = (action: string, start: number, end: number, x: number): Segment => ({ action, start, end, fromX: x, toX: x });
  const together = [{ action: "stackWalk", start: walkStart, end: walkEnd, fromX: baseX, toX: walkX }, still("stacked", walkEnd, off, walkX)];
  if (level === 1) return [still("brace", startedAt, top, baseX), still("stacked", top, walkStart, baseX), ...together].filter(step => step.end > step.start);
  const fromX = tower.fromX[level - 1] ?? baseX;
  const arrive = startedAt + (Math.abs(fromX - baseX) / tower.speedPxPerS) * 1000;
  const climb = gatherEnd + (level - 2) * climbMs;
  return [
    { action: "gather", start: startedAt, end: arrive, fromX, toX: baseX },
    still("idle", arrive, climb, baseX),
    still("climb", climb, climb + climbMs, baseX),
    still("stacked", climb + climbMs, walkStart, baseX),
    ...together,
    still("dismount", off, off + dismountMs, walkX),
  ].filter(step => step.end > step.start);
}

function onStep(actor: MinimeActor, step: Segment): MinimeActor {
  const facing = step.toX === step.fromX ? actor.facing : step.toX > step.fromX ? 1 : -1;
  return { ...actor, action: step.action, startedAt: step.start, durationMs: step.end - step.start, fromX: step.fromX, toX: step.toX, facing };
}

// Random order without changing the list
function shuffled<T>(list: readonly T[], random: () => number): T[] {
  const copy = [...list];
  for (let index = copy.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [copy[index], copy[other]] = [copy[other], copy[index]];
  }
  return copy;
}

// Starts a tower if one free minime of every level type is there and fewer than maxTowers stand; typeOf: the type a
// figure shows. Otherwise actors stay the same array.
export function startStack(actors: readonly MinimeActor[], options: StackOptions, typeOf: (actor: MinimeActor) => string | null, stage: MinimeStage, now: number, random: () => number): readonly MinimeActor[] {
  const towers = new Set(actors.flatMap(actor => (actor.stack ? [actor.stack.tower] : [])));
  if (towers.size >= options.maxTowers) return actors;
  const free = shuffled(actors.filter(ready), random);
  const picked: MinimeActor[] = [];
  for (const type of options.levels) {
    const member = free.find(actor => typeOf(actor) === type && !picked.includes(actor));
    if (!member) return actors;
    picked.push(member);
  }
  const fromX = picked.map(actor => positionAt(actor, now));
  const baseX = fromX[0];
  const farthest = Math.max(...fromX.map(x => Math.abs(x - baseX)));
  const low = stage.motion.marginPx, high = Math.max(low, stage.widthPx - stage.motion.marginPx);
  const preferred = random() < 0.5 ? -1 : 1;
  const fits = (direction: number) => { const x = baseX + direction * options.walkPx; return x >= low && x <= high; };
  const direction = fits(preferred) || !fits(-preferred) ? preferred : -preferred;
  const tower: Tower = {
    members: picked.map(actor => actor.login),
    types: options.levels,
    startedAt: now,
    fromX,
    baseX,
    walkX: options.walkMs > 0 ? Math.min(high, Math.max(low, baseX + direction * options.walkPx)) : baseX,
    speedPxPerS: options.speedPxPerS,
    gatherEnd: now + Math.max(MIN_GATHER_MS, (farthest / options.speedPxPerS) * 1000),
    climbMs: options.climbMs,
    stackedMs: options.stackedMs,
    walkMs: options.walkMs,
    dismountMs: options.dismountMs,
  };
  const changed = new Map(picked.map((actor, index) => {
    const level = index + 1;
    const [first] = timeline(tower, level);
    return [actor.login, onStep({ ...actor, stack: { level, tower } }, first)];
  }));
  return actors.map(actor => changed.get(actor.login) ?? actor);
}

// Next step of every tower member whose step ended; after its last step a member is free again (its normal next action,
// with fixed places back to its place). climbs: how many climbs started (for the sound).
export function advanceStacks(actors: readonly MinimeActor[], stage: MinimeStage, now: number, random: () => number): { actors: readonly MinimeActor[]; climbs: number } {
  let climbs = 0;
  let changed = false;
  const next = actors.map(actor => {
    if (!actor.stack || actor.leaving || actor.startedAt + actor.durationMs > now) return actor;
    changed = true;
    const step = timeline(actor.stack.tower, actor.stack.level).find(candidate => candidate.end > now);
    if (!step) return nextAction(withoutStack(actor), stage, now, random);
    if (step.action === "climb") climbs++;
    return onStep(actor, step);
  });
  return { actors: changed ? next : actors, climbs };
}

// Towers whose member left or changed its type: every level above it steps off at once and is free, the levels below
// go on while at least two stand; a base alone is free again. Without a change actors stay the same array.
export function breakStacks(actors: readonly MinimeActor[], typeOf: (actor: MinimeActor) => string | null, stage: MinimeStage, now: number, random: () => number): readonly MinimeActor[] {
  const byLogin = new Map(actors.map(actor => [actor.login, actor]));
  const towers = new Set(actors.flatMap(actor => (actor.stack ? [actor.stack.tower] : [])));
  let changed = false;
  for (const tower of towers) {
    const holds = (login: string, index: number) => {
      const member = byLogin.get(login);
      return !!member && !member.leaving && member.stack?.tower === tower && typeOf(member) === tower.types[index];
    };
    const broken = tower.members.findIndex((login, index) => !holds(login, index));
    if (broken < 0) continue;
    tower.members.forEach((login, index) => {
      const member = byLogin.get(login);
      if (!member || member.stack?.tower !== tower) return;
      const free = withoutStack(member);
      if (index === broken || member.leaving) byLogin.set(login, free);
      else if (index > broken) byLogin.set(login, at(free, "dismount", now, tower.dismountMs, positionAt(member, now)));
      else if (broken < 2) byLogin.set(login, nextAction(free, stage, now, random));
      else return;
      changed = true;
    });
  }
  return changed ? actors.map(actor => byLogin.get(actor.login) ?? actor) : actors;
}
