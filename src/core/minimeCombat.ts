// Fights of the minimes (PLAN-MINIMES package 11): now and then a shooter aims at a target and fires; a hit target lies
// down until a free medic (with factions: one of its faction) has walked over and revived it, at the latest until the
// lying time is over. Medics never shoot and are never hit. Roles are the variants of the theme, the settings come from
// minimeCombatFields. Every overlay rolls its own fights, the server knows nothing about them.
// Pure (rule 12): time and randomness come in from outside. Used by hooks/useMinimes.ts. Check: minimeCombat.check.ts.
import { advance, at, nextAction, nextEnd, positionAt, shownTeam, shownVariant, type Combat, type MinimeActor, type MinimeStage } from "./minimeBehavior.ts";
import { MEDIC, minimeAimKey, minimeFireKey } from "./minimeFields.ts";
import type { SettingValues } from "./theme.ts";

// Actions of the core in fights; a catalog of a theme must not use them
export const COMBAT_ACTIONS = ["aim", "fire", "hit", "down", "approach", "revive", "up"] as const;

// Events of a fight that may play a sound
export type CombatSound = "shot" | "explosion" | "hit" | "revive";

// Settings of the fights from the values; roles that fire explosions (e.g. a grenadier) come from the theme
export type CombatOptions = {
  minMs: number;
  maxMs: number;
  maxFights: number;
  hitChance: number; // 0 to 1
  downMs: number;
  reviveMs: number;
  medicSpeedPxPerS: number;
  medicGapPx: number; // the medic stops this far beside the target, so it does not stand on it
  upMs: number; // standing up after lying
  sounds: boolean;
  aimMs: (role: string) => number;
  fireMs: (role: string) => number;
  explosive: readonly string[];
};

// Who is who in a scene: role (variant) and faction of a figure, null = none
export type CombatCast = { roleOf: (actor: MinimeActor) => string | null; teamOf: (actor: MinimeActor) => string | null };

const number = (values: SettingValues, key: string, fallback: number) => {
  const value = values[key];
  return typeof value === "number" ? value : fallback;
};

// The fight settings of a theme, null if it has no fights or they are switched off
export function readCombat(values: SettingValues, explosive: readonly string[] = []): CombatOptions | null {
  if (values.minimeCombat !== true) return null;
  const [first, second] = [number(values, "minimeCombatMinS", 20), number(values, "minimeCombatMaxS", 60)];
  return {
    minMs: Math.min(first, second) * 1000,
    maxMs: Math.max(first, second) * 1000,
    maxFights: number(values, "minimeCombatMax", 2),
    hitChance: number(values, "minimeHitChance", 70) / 100,
    downMs: number(values, "minimeDownMs", 12_000),
    reviveMs: number(values, "minimeReviveMs", 2500),
    medicSpeedPxPerS: number(values, "minimeMedicSpeed", 140),
    medicGapPx: number(values, "minimeMedicGap", 40),
    upMs: number(values, "minimeUpMs", 600),
    sounds: values.minimeCombatSounds === true,
    aimMs: role => number(values, minimeAimKey(role), 800),
    fireMs: role => number(values, minimeFireKey(role), 600),
    explosive,
  };
}

// Role a figure shows: the one from the server; in the demo the first demo minime is the medic (demoMedic), the others
// get an allowed role by login; otherwise the fallback of the theme
export function shownRole(actor: MinimeActor, enabled: readonly string[], fallback: string, demoMedic: string | null): string {
  if (!actor.variant && demoMedic === actor.login && enabled.includes(MEDIC)) return MEDIC;
  return shownVariant(actor, enabled, fallback, demoMedic !== null);
}

// The cast of a scene from the allowed roles and factions (demoMedic: login of the demo medic, null outside the demo)
export function combatCast(roles: readonly string[], teams: readonly string[], demoMedic: string | null): CombatCast {
  return {
    roleOf: actor => {
      const role = shownRole(actor, roles, "", demoMedic);
      return roles.includes(role) ? role : null;
    },
    teamOf: actor => (teams.length ? shownTeam(actor, teams, demoMedic !== null) : null),
  };
}

// When the next fight is tried: a random pause between the minimum and the maximum
export const nextFightAt = (options: CombatOptions, now: number, random: () => number) => now + options.minMs + random() * (options.maxMs - options.minMs);

// When the one timer of the scene fires: the next action end or the next fight try, whichever comes first (rule 21);
// null = nothing to wait for
export function nextWake(actors: readonly MinimeActor[], fightAt: number | null): number | null {
  const end = nextEnd(actors);
  if (end === null) return fightAt;
  return fightAt === null ? end : Math.min(end, fightAt);
}

const ready = (actor: MinimeActor) => !actor.leaving && !actor.combat && actor.action !== "enter" && actor.action !== "exit";
const facingTo = (from: number, to: number): 1 | -1 => (to >= from ? 1 : -1);

// The minime without its part in a fight
function withoutCombat(actor: MinimeActor): MinimeActor {
  const rest = { ...actor };
  delete rest.combat;
  return rest;
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

// Starts a fight if one is possible: a shooter, a target of another faction (any without factions) and a free medic of
// the target's faction, all ready; at most maxFights at once. Otherwise actors stay the same array.
export function startFight(actors: readonly MinimeActor[], options: CombatOptions, cast: CombatCast, now: number, random: () => number): readonly MinimeActor[] {
  if (actors.filter(actor => actor.combat?.role === "target").length >= options.maxFights) return actors;
  const available = actors.filter(actor => ready(actor) && cast.roleOf(actor) !== null);
  const medics = available.filter(actor => cast.roleOf(actor) === MEDIC);
  const fighters = available.filter(actor => cast.roleOf(actor) !== MEDIC);
  for (const shooter of shuffled(fighters, random)) {
    const enemy = (actor: MinimeActor) => actor !== shooter && (cast.teamOf(shooter) === null || cast.teamOf(actor) !== cast.teamOf(shooter));
    for (const target of shuffled(fighters.filter(enemy), random)) {
      const medic = shuffled(medics, random).find(medic => cast.teamOf(medic) === cast.teamOf(target));
      if (medic) return begin(actors, { shooter, target, medic }, options, cast, now);
    }
  }
  return actors;
}

type Cast = { shooter: MinimeActor; target: MinimeActor; medic: MinimeActor };

function begin(actors: readonly MinimeActor[], { shooter, target, medic }: Cast, options: CombatOptions, cast: CombatCast, now: number) {
  const logins = { shooter: shooter.login, target: target.login, medic: medic.login, hit: false };
  const variant = cast.roleOf(shooter) ?? "";
  const [from, to] = [positionAt(shooter, now), positionAt(target, now)];
  // The target stands still until the shot decides; its waiting never ends before that
  const waitMs = options.aimMs(variant) + options.fireMs(variant) + options.downMs;
  const changed = new Map<string, MinimeActor>([
    [shooter.login, { ...at(shooter, "aim", now, options.aimMs(variant), from), facing: facingTo(from, to), combat: { role: "shooter", ...logins, variant } }],
    [target.login, { ...at(target, "idle", now, waitMs, to), combat: { role: "target", ...logins, variant: cast.roleOf(target) } }],
    [medic.login, { ...medic, combat: { role: "medic", ...logins, variant: cast.roleOf(medic) } }],
  ]);
  return actors.map(actor => changed.get(actor.login) ?? actor);
}

// Next step of every fight whose action ended, then the normal next action of the others; sounds: events that started
export function advanceWithCombat(actors: readonly MinimeActor[], stage: MinimeStage, options: CombatOptions, now: number, random: () => number): { actors: readonly MinimeActor[]; sounds: CombatSound[] } {
  const ended = (actor: MinimeActor) => actor.startedAt + actor.durationMs <= now;
  if (!actors.some(ended)) return { actors, sounds: [] };
  const byLogin = new Map(actors.map(actor => [actor.login, actor]));
  const sounds: CombatSound[] = [];
  const set = (actor: MinimeActor) => byLogin.set(actor.login, actor);
  const get = (login: string) => byLogin.get(login);
  const next = (actor: MinimeActor) => nextAction(withoutCombat(actor), stage, now, random);

  const resolve = (combat: Combat, hit: boolean) => {
    const target = get(combat.target);
    const medic = get(combat.medic);
    if (!target?.combat || target.leaving || target.combat.shooter !== combat.shooter) return;
    const ownMedic = medic?.combat && !medic.leaving && medic.combat.target === target.login ? medic : null;
    if (!hit) {
      set(next(target));
      if (ownMedic) set(withoutCombat(ownMedic));
      return;
    }
    const x = target.toX;
    set({ ...at(target, "down", now, options.downMs, x), combat: { ...target.combat, hit: true } });
    sounds.push("hit");
    if (!ownMedic?.combat) return;
    const from = positionAt(ownMedic, now);
    const to = x + (from <= x ? -options.medicGapPx : options.medicGapPx);
    const durationMs = (Math.abs(to - from) / options.medicSpeedPxPerS) * 1000;
    set({ ...at(ownMedic, "approach", now, durationMs, from), toX: to, facing: facingTo(from, x), combat: { ...ownMedic.combat, hit: true } });
  };

  const step = (actor: MinimeActor, combat: Combat) => {
    const variant = combat.variant ?? "";
    if (combat.role === "shooter" && actor.action === "aim") {
      set(at(actor, "fire", now, options.fireMs(variant), actor.toX));
      sounds.push(options.explosive.includes(variant) ? "explosion" : "shot");
    } else if (combat.role === "shooter" && actor.action === "fire") {
      set(next(actor));
      resolve(combat, random() < options.hitChance);
    } else if (combat.role === "medic" && actor.action === "approach") {
      const target = get(combat.target);
      if (target && !target.leaving && target.action === "down" && target.combat?.medic === actor.login) {
        set(at(actor, "revive", now, options.reviveMs, actor.toX));
        set({ ...target, durationMs: now + options.reviveMs - target.startedAt });
        sounds.push("revive");
      } else set(next(actor));
    } else if (combat.role === "medic" && actor.action === "revive") {
      set(next(actor));
    } else if (combat.role === "target" && actor.action === "down") {
      set(withoutCombat(at(actor, "up", now, options.upMs, actor.toX)));
      // A medic still on its way finishes its movement without the fight
      const medic = get(combat.medic);
      if (medic?.combat?.target === actor.login) set(withoutCombat(medic));
    } else {
      // Waiting medic or target: its own next action, still part of the fight
      set({ ...nextAction(actor, stage, now, random), combat });
    }
  };

  for (const login of actors.map(actor => actor.login)) {
    const actor = get(login);
    if (actor?.combat && !actor.leaving && ended(actor)) step(actor, actor.combat);
  }
  const stepped = actors.map(actor => byLogin.get(actor.login) ?? actor);
  return { actors: advance(stepped, stage, now, random), sounds };
}

// Fights whose partners left: a target whose shooter left before the shot and its medic are free again; a shooter and
// medic whose target left are free again (they finish their running action); a lying target stays until its time is over
export function releaseOrphans(actors: readonly MinimeActor[]): readonly MinimeActor[] {
  const present = new Set(actors.filter(actor => !actor.leaving).map(actor => actor.login));
  let changed = false;
  const next = actors.map(actor => {
    const combat = actor.combat;
    if (!combat || actor.leaving) return actor;
    const shotMissing = !combat.hit && !present.has(combat.shooter);
    const orphan = combat.role === "target" ? shotMissing : !present.has(combat.target) || (combat.role === "medic" && shotMissing);
    if (!orphan) return actor;
    changed = true;
    return withoutCombat(actor);
  });
  return changed ? next : actors;
}
