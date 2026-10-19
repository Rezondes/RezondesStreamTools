// Behavior of the minimes in the scene: which action every minime is doing, where it walks, when it appears
// and disappears. Built in are enter, exit, idle and walk; everything else the theme brings as a catalog
// (name, duration, weight) and shows it via the name. Pure (rule 12): time and randomness come in from outside.
// Used by hooks/useMinimes.ts. Check: minimeBehavior.check.ts.
import { hash, seedOf } from "./hash.ts";
import type { MinimeMotion } from "./minimeFields.ts";
import type { Minime } from "./types.ts";

// Theme's own action: weight 0 = never comes by itself (e.g. the reaction to chat)
export type MinimeAction = { name: string; durationMs: number; weight: number };

// Part of a minime in a fight (minimeCombat.ts): its role there, the logins of shooter, target and medic, the variant
// (weapon) from the start of the fight and whether the target was hit
export type Combat = { role: "shooter" | "target" | "medic"; shooter: string; target: string; medic: string; variant: string | null; hit: boolean };

// A tower (minimeStack.ts): its members from the bottom (logins) with the type of each level, when it started, where every
// member stood then, where it stands and where it walks to, where every level lands when it steps off, and the timing
export type Tower = {
  members: readonly string[];
  types: readonly string[];
  startedAt: number;
  fromX: readonly number[];
  baseX: number;
  walkX: number;
  landX: readonly number[];
  speedPxPerS: number;
  gatherEnd: number;
  climbMs: number;
  stackedMs: number;
  walkMs: number;
  dismountMs: number;
};
// Part of a minime in a tower: level 1 = bottom (the base)
export type StackPart = { level: number; tower: Tower };

// A minime with its running action. Position in px: fromX at the start, toX at the end (walk, approach, gather,
// stackWalk and dismount move). facing: 1 = looks right, -1 = left. leaving: is disappearing (exit) and drops out afterwards.
// combat: in a fight. stack: in a tower.
export type MinimeActor = Minime & {
  action: string;
  startedAt: number;
  durationMs: number;
  fromX: number;
  toX: number;
  facing: 1 | -1;
  leaving: boolean;
  combat?: Combat;
  stack?: StackPart;
  slot?: number;
};

// Fixed places (minimePlacement slots): count places per area; with factions one area per faction in their order from
// left to right, teamOf gives the faction of a minime
export type MinimeSlots = { count: number; teams: readonly string[]; teamOf: (minime: Minime) => string | null };

// Actions that move the figure from fromX to toX
const MOVING = new Set(["walk", "approach", "gather", "stackWalk", "dismount"]);

// Everything the choice needs: movement from the settings, catalog of the theme, width of the scene in px, fixed places
export type MinimeStage = { motion: MinimeMotion; catalog: readonly MinimeAction[]; widthPx: number; slots?: MinimeSlots };

// fixed: minimum duration of every action, so a duration of 0 does not give a loop without a pause
const MIN_DURATION_MS = 50;

// Position at time now: proportional between fromX and toX while moving, otherwise toX
export function positionAt(actor: MinimeActor, now: number): number {
  if (!MOVING.has(actor.action) || actor.durationMs <= 0) return actor.toX;
  const progress = Math.min(1, Math.max(0, (now - actor.startedAt) / actor.durationMs));
  return actor.fromX + (actor.toX - actor.fromX) * progress;
}

// The minime starts an action at its place x
export const at = (actor: MinimeActor, action: string, now: number, durationMs: number, x: number): MinimeActor =>
  ({ ...actor, action, startedAt: now, durationMs: Math.max(MIN_DURATION_MS, durationMs), fromX: x, toX: x });

// Target of a walk: random direction; if it does not fit the picture, the other one; if none fits, up to the edge
function walk(actor: MinimeActor, stage: MinimeStage, now: number, random: () => number): MinimeActor {
  const { marginPx, walkMinPx, walkMaxPx, speedPxPerS } = stage.motion;
  const low = marginPx, high = Math.max(marginPx, stage.widthPx - marginPx);
  const distance = walkMinPx + random() * (walkMaxPx - walkMinPx);
  const preferred: 1 | -1 = random() < 0.5 ? -1 : 1;
  const fits = (direction: number) => { const target = actor.toX + direction * distance; return target >= low && target <= high; };
  const facing: 1 | -1 = fits(preferred) || !fits(-preferred) ? preferred : preferred === 1 ? -1 : 1;
  const toX = Math.min(high, Math.max(low, actor.toX + facing * distance));
  const durationMs = (Math.abs(toX - actor.toX) / speedPxPerS) * 1000;
  return { ...actor, action: "walk", startedAt: now, durationMs: Math.max(MIN_DURATION_MS, durationMs), fromX: actor.toX, toX, facing };
}

// Area of the places of a faction in px: the width between the margins, split evenly among the factions
function area(stage: MinimeStage, team: string | null): [number, number] {
  const low = stage.motion.marginPx, high = Math.max(low, stage.widthPx - stage.motion.marginPx);
  const teams = stage.slots?.teams ?? [];
  const index = team === null ? -1 : teams.indexOf(team);
  if (index < 0) return [low, high];
  const part = (high - low) / teams.length;
  return [low + index * part, low + (index + 1) * part];
}

// Position of a place in px: the middle of its share of the area
export function slotX(stage: MinimeStage, team: string | null, slot: number): number {
  const [low, high] = area(stage, team);
  const count = Math.max(1, stage.slots?.count ?? 1);
  return low + ((slot + 0.5) * (high - low)) / count;
}

// Free place of a faction farthest from the taken ones (the first one when all are free or none is free)
function freeSlot(stage: MinimeStage, team: string | null, others: readonly MinimeActor[]): number {
  const slots = stage.slots;
  if (!slots) return 0;
  const taken = new Set(others.filter(other => !other.leaving && other.slot !== undefined && slots.teamOf(other) === team).map(other => other.slot));
  const free = Array.from({ length: slots.count }, (_, slot) => slot).filter(slot => !taken.has(slot));
  if (!free.length || !taken.size) return free[0] ?? 0;
  const gap = (slot: number) => Math.min(...[...taken].map(other => Math.abs((other ?? 0) - slot)));
  return free.reduce((best, slot) => (gap(slot) > gap(best) ? slot : best));
}

// The minime walks to x (with fixed places: back to its place)
export function walkTo(actor: MinimeActor, stage: MinimeStage, now: number, x: number): MinimeActor {
  const from = positionAt(actor, now);
  const durationMs = (Math.abs(x - from) / stage.motion.speedPxPerS) * 1000;
  return { ...at(actor, "walk", now, durationMs, from), toX: x, facing: x >= from ? 1 : -1 };
}

// Next action by weight: idle, walk or one from the catalog; all weights 0 give idle. With fixed places nobody walks
// away from its place, and whoever is away (e.g. a medic after reviving) walks back first.
export function nextAction(actor: MinimeActor, stage: MinimeStage, now: number, random: () => number): MinimeActor {
  if (stage.slots && actor.slot !== undefined) {
    const home = slotX(stage, stage.slots.teamOf(actor), actor.slot);
    if (Math.abs(home - actor.toX) > 0.5) return walkTo(actor, stage, now, home);
  }
  const walkWeight = stage.slots ? 0 : stage.motion.walkWeight;
  const choices = [{ name: "idle", weight: stage.motion.idleWeight }, { name: "walk", weight: walkWeight }, ...stage.catalog];
  const total = choices.reduce((sum, choice) => sum + Math.max(0, choice.weight), 0);
  let rest = random() * total;
  const chosen = choices.find(choice => (rest -= Math.max(0, choice.weight)) < 0)?.name ?? "idle";
  if (chosen === "walk") return walk(actor, stage, now, random);
  const own = stage.catalog.find(action => action.name === chosen);
  if (own) return at(actor, own.name, now, own.durationMs, actor.toX);
  const { idleMinMs, idleMaxMs } = stage.motion;
  return at(actor, "idle", now, idleMinMs + random() * (idleMaxMs - idleMinMs), actor.toX);
}

// Adapts the shown minimes to the list from the server: new ones appear (enter) at a random place or on the free fixed
// place farthest from the others, missing ones disappear (exit), known ones take over name and color (with fixed places a
// new faction walks to a place in its area), whoever comes back during exit appears there again
export function syncRoster(actors: readonly MinimeActor[], minimes: readonly Minime[], stage: MinimeStage, now: number, random: () => number): MinimeActor[] {
  const wanted = new Map(minimes.map(minime => [minime.login, minime]));
  const slots = stage.slots;
  const shown: MinimeActor[] = [];
  for (const actor of actors) {
    const minime = wanted.get(actor.login);
    if (!minime) shown.push(actor.leaving ? actor : { ...at(actor, "exit", now, stage.motion.exitMs, positionAt(actor, now)), leaving: true });
    else if (actor.leaving) shown.push({ ...at(actor, "enter", now, stage.motion.enterMs, actor.toX), ...minime, leaving: false });
    else if (slots && actor.slot !== undefined && slots.teamOf(minime) !== slots.teamOf(actor)) {
      const slot = freeSlot(stage, slots.teamOf(minime), [...shown, ...actors.filter(other => other.login !== actor.login)]);
      shown.push({ ...walkTo(actor, stage, now, slotX(stage, slots.teamOf(minime), slot)), ...minime, slot });
    } else shown.push({ ...actor, ...minime });
  }
  const known = new Set(actors.map(actor => actor.login));
  const span = Math.max(0, stage.widthPx - 2 * stage.motion.marginPx);
  for (const minime of minimes.filter(minime => !known.has(minime.login))) {
    const slot = slots ? freeSlot(stage, slots.teamOf(minime), shown) : undefined;
    const x = slot === undefined ? stage.motion.marginPx + random() * span : slotX(stage, slots?.teamOf(minime) ?? null, slot);
    const entering = { ...minime, action: "enter", startedAt: now, durationMs: Math.max(MIN_DURATION_MS, stage.motion.enterMs), fromX: x, toX: x, facing: 1 as const, leaving: false };
    shown.push(slot === undefined ? entering : { ...entering, slot });
  }
  return shown;
}

// After a change of the places (number or width): places outside get the next free one, everybody resting walks to
// the position of its place. Without a change actors stays the same array.
export function resettle(actors: readonly MinimeActor[], stage: MinimeStage, now: number): readonly MinimeActor[] {
  const slots = stage.slots;
  if (!slots) return actors;
  let changed = false;
  const settled: MinimeActor[] = [];
  for (const actor of actors) {
    if (actor.slot === undefined || actor.leaving || actor.combat || actor.stack || actor.action === "walk") {
      settled.push(actor);
      continue;
    }
    const team = slots.teamOf(actor);
    const slot = actor.slot < slots.count ? actor.slot : freeSlot(stage, team, [...settled, ...actors.filter(other => other.login !== actor.login && (other.slot ?? 0) < slots.count)]);
    const x = slotX(stage, team, slot);
    if (slot === actor.slot && x === actor.toX) {
      settled.push(actor);
      continue;
    }
    changed = true;
    settled.push({ ...walkTo(actor, stage, now, x), slot });
  }
  return changed ? settled : actors;
}

// Advances expired actions, removes vanished ones. Without a change actors stays the same array.
export function advance(actors: readonly MinimeActor[], stage: MinimeStage, now: number, random: () => number): readonly MinimeActor[] {
  const ended = (actor: MinimeActor) => actor.startedAt + actor.durationMs <= now;
  if (!actors.some(ended)) return actors;
  return actors.filter(actor => !(actor.leaving && ended(actor))).map(actor => (ended(actor) ? nextAction(actor, stage, now, random) : actor));
}

// When the next action ends; null = no minimes
export function nextEnd(actors: readonly MinimeActor[]): number | null {
  return actors.length ? Math.min(...actors.map(actor => actor.startedAt + actor.durationMs)) : null;
}

// Reaction to chat: interrupts everything except appearing, disappearing, fights and towers, at the current place
export function react(actor: MinimeActor, reaction: MinimeAction, now: number): MinimeActor {
  if (actor.leaving || actor.combat || actor.stack || actor.action === "enter" || actor.action === "exit") return actor;
  return at(actor, reaction.name, now, reaction.durationMs, positionAt(actor, now));
}

// CSS variables of a figure, the same for every theme: position (--x), duration of the movement (--move, only while
// moving, the movement is a CSS transition), duration of the action (--action-ms) and facing (--facing, 1 or -1)
export function actorStyle(actor: MinimeActor): Record<string, string | number> {
  return { "--x": `${actor.toX}px`, "--move": MOVING.has(actor.action) ? `${actor.durationMs}ms` : "0ms", "--action-ms": `${actor.durationMs}ms`, "--facing": actor.facing };
}

// Key of a running action: new for every action, so its animation also plays from the start twice in a row
export const actorRun = (actor: MinimeActor) => `${actor.action}-${actor.startedAt}`;

// Variant a figure shows (themes with variants): the one from the server; without variant in the demo an allowed one by
// login (always the same), otherwise the default variant of the theme
export function shownVariant(actor: MinimeActor, enabled: readonly string[], fallback: string, demo: boolean) {
  if (actor.variant) return actor.variant;
  if (demo && enabled.length) return enabled[Math.floor(hash(seedOf(actor.login)) * enabled.length)];
  return fallback;
}

// Faction a figure shows (themes with factions): the one from the server; without one in the demo an allowed one by login
// (always the same, independent of the variant), otherwise the first allowed; null without allowed factions
export function shownTeam(actor: Minime, enabled: readonly string[], demo: boolean): string | null {
  if (actor.team) return actor.team;
  if (demo && enabled.length) return enabled[Math.floor(hash(seedOf(`team:${actor.login}`)) * enabled.length)];
  return enabled[0] ?? null;
}

// Members per allowed faction among the figures that are not leaving, every allowed faction with its count (also 0)
export function teamCounts(actors: readonly MinimeActor[], enabled: readonly string[], demo: boolean): Record<string, number> {
  const counts = Object.fromEntries(enabled.map(id => [id, 0]));
  for (const actor of actors.filter(actor => !actor.leaving)) {
    const team = shownTeam(actor, enabled, demo);
    if (team !== null && team in counts) counts[team] += 1;
  }
  return counts;
}
