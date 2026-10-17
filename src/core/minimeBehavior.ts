// Behavior of the minimes in the scene: which action every minime is doing, where it walks, when it appears
// and disappears. Built in are enter, exit, idle and walk; everything else the theme brings as a catalog
// (name, duration, weight) and shows it via the name. Pure (rule 12): time and randomness come in from outside.
// Used by hooks/useMinimes.ts. Check: minimeBehavior.check.ts.
import { hash, seedOf } from "./hash.ts";
import type { MinimeMotion } from "./minimeFields.ts";
import type { Minime } from "./types.ts";

// Theme's own action: weight 0 = never comes by itself (e.g. the reaction to chat)
export type MinimeAction = { name: string; durationMs: number; weight: number };

// A minime with its running action. Position in px: fromX at the start, toX at the end (only walk changes it).
// facing: 1 = looks right, -1 = left. leaving: is disappearing (exit) and drops out afterwards.
export type MinimeActor = Minime & {
  action: string;
  startedAt: number;
  durationMs: number;
  fromX: number;
  toX: number;
  facing: 1 | -1;
  leaving: boolean;
};

// Everything the choice needs: movement from the settings, catalog of the theme, width of the scene in px
export type MinimeStage = { motion: MinimeMotion; catalog: readonly MinimeAction[]; widthPx: number };

// fixed: minimum duration of every action, so a duration of 0 does not give a loop without a pause
const MIN_DURATION_MS = 50;

// Position at time now: proportional between fromX and toX during walk, otherwise toX
export function positionAt(actor: MinimeActor, now: number): number {
  if (actor.action !== "walk" || actor.durationMs <= 0) return actor.toX;
  const progress = Math.min(1, Math.max(0, (now - actor.startedAt) / actor.durationMs));
  return actor.fromX + (actor.toX - actor.fromX) * progress;
}

const at = (actor: MinimeActor, action: string, now: number, durationMs: number, x: number): MinimeActor =>
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

// Next action by weight: idle, walk or one from the catalog; all weights 0 give idle
export function nextAction(actor: MinimeActor, stage: MinimeStage, now: number, random: () => number): MinimeActor {
  const choices = [{ name: "idle", weight: stage.motion.idleWeight }, { name: "walk", weight: stage.motion.walkWeight }, ...stage.catalog];
  const total = choices.reduce((sum, choice) => sum + Math.max(0, choice.weight), 0);
  let rest = random() * total;
  const chosen = choices.find(choice => (rest -= Math.max(0, choice.weight)) < 0)?.name ?? "idle";
  if (chosen === "walk") return walk(actor, stage, now, random);
  const own = stage.catalog.find(action => action.name === chosen);
  if (own) return at(actor, own.name, now, own.durationMs, actor.toX);
  const { idleMinMs, idleMaxMs } = stage.motion;
  return at(actor, "idle", now, idleMinMs + random() * (idleMaxMs - idleMinMs), actor.toX);
}

// Adapts the shown minimes to the list from the server: new ones appear (enter) at a random place, missing ones
// disappear (exit), known ones take over name and color, whoever comes back during exit appears there again
export function syncRoster(actors: readonly MinimeActor[], minimes: readonly Minime[], stage: MinimeStage, now: number, random: () => number): MinimeActor[] {
  const wanted = new Map(minimes.map(minime => [minime.login, minime]));
  const shown = actors.map(actor => {
    const minime = wanted.get(actor.login);
    if (!minime) return actor.leaving ? actor : { ...at(actor, "exit", now, stage.motion.exitMs, positionAt(actor, now)), leaving: true };
    if (actor.leaving) return { ...at(actor, "enter", now, stage.motion.enterMs, actor.toX), ...minime, leaving: false };
    return { ...actor, ...minime };
  });
  const known = new Set(actors.map(actor => actor.login));
  const span = Math.max(0, stage.widthPx - 2 * stage.motion.marginPx);
  const joined = minimes.filter(minime => !known.has(minime.login)).map(minime => {
    const x = stage.motion.marginPx + random() * span;
    return { ...minime, action: "enter", startedAt: now, durationMs: Math.max(MIN_DURATION_MS, stage.motion.enterMs), fromX: x, toX: x, facing: 1 as const, leaving: false };
  });
  return [...shown, ...joined];
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

// Reaction to chat: interrupts everything except appearing and disappearing, at the current place
export function react(actor: MinimeActor, reaction: MinimeAction, now: number): MinimeActor {
  if (actor.leaving || actor.action === "enter" || actor.action === "exit") return actor;
  return at(actor, reaction.name, now, reaction.durationMs, positionAt(actor, now));
}

// CSS variables of a figure, the same for every theme: position (--x), duration of the movement (--move, only when
// walking, the movement is a CSS transition), duration of the action (--action-ms) and facing (--facing, 1 or -1)
export function actorStyle(actor: MinimeActor): Record<string, string | number> {
  return { "--x": `${actor.toX}px`, "--move": actor.action === "walk" ? `${actor.durationMs}ms` : "0ms", "--action-ms": `${actor.durationMs}ms`, "--facing": actor.facing };
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
