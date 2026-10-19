// Hook: the minimes of the scene, each with its running action (enter, exit, idle, walk or from the catalog of the
// theme) and position. The movement comes from the theme's minime settings (minimeFields.ts), the list from the
// server (SSE minimes), chat triggers the reaction (SSE minimeChat). With combat the theme has fights
// (minimeCombat.ts): they start now and then, their steps and sounds come from the core. With stack the theme has towers
// (minimeStack.ts) the same way. Renders only when an action changes. catalog, reaction, combat and stack should be
// stable (useMemo or a constant), widthPx is the width of the scene in px.
import { useEffect, useMemo, useRef, useState } from "react";
import { connect } from "../connection.ts";
import { DEMO_FIRST_LOGIN } from "../demo.ts";
import { advance, react, resettle, shownTeam, shownVariant, syncRoster, type MinimeAction, type MinimeActor, type MinimeStage } from "../minimeBehavior.ts";
import { advanceWithCombat, combatCast, nextFightAt, nextWake, readCombat, releaseOrphans, startFight, type CombatCast, type CombatOptions, type CombatSound } from "../minimeCombat.ts";
import { COMBAT_SOUNDS, readMinimeOptions, STACK_SOUND } from "../minimeFields.ts";
import { advanceStacks, breakStacks, nextStackAt, readStack, startStack, withLevelVariants } from "../minimeStack.ts";
import { params } from "../params.ts";
import { playSound } from "../sound.ts";
import type { MinimeVariantSet, SettingValues, SoundValue } from "../theme.ts";
import { useThemeValues } from "./useSettings.ts";

// Fights of a theme: its roles (variants), factions, roles whose shot is an explosion and built-in sounds per event
export type MinimeCombatScene = {
  roles: MinimeVariantSet;
  teams?: MinimeVariantSet;
  explosive?: readonly string[];
  sounds?: Partial<Record<CombatSound, (volume: number) => void>>;
};
// Towers of a theme: its variants (the level types) and a built-in climb sound
export type MinimeStackScene = { variants: MinimeVariantSet; sound?: (volume: number) => void };
type MinimeSceneOptions = { catalog: readonly MinimeAction[]; reaction: MinimeAction | null; widthPx: number; combat?: MinimeCombatScene; stack?: MinimeStackScene };

const earliest = (first: number | null, second: number | null) => (first === null ? second : second === null ? first : Math.min(first, second));

// Towers of a scene: the settings and the type a figure shows; null without towers
function useTowers(values: SettingValues, stack: MinimeStackScene | undefined) {
  return useMemo(() => {
    const options = stack ? readStack(values) : null;
    if (!stack || !options) return null;
    const enabled = (readMinimeOptions(values, stack.variants).rules.variants ?? []).map(variant => variant.id);
    const demo = params.has("demo");
    return { options, typeOf: (actor: MinimeActor) => shownVariant(actor, enabled, "", demo) };
  }, [values, stack]);
}
type Towers = ReturnType<typeof useTowers>;
type Fights = { options: CombatOptions; cast: CombatCast } | null;
type Scene = { stage: MinimeStage; fight: Fights; values: SettingValues; combat?: MinimeCombatScene; towers: Towers; stack?: MinimeStackScene };

// One step of the timer: tower members first (so the normal advance leaves them alone), then fights or the normal next
// actions, a due fight or tower starts; plays the sounds of what started
function tick(actors: readonly MinimeActor[], scene: Scene, now: number, fightDue: boolean, stackDue: boolean): readonly MinimeActor[] {
  const { stage, fight, values, towers } = scene;
  const stacked = advanceStacks(actors, stage, now, Math.random);
  let next = stacked.actors;
  let sounds: CombatSound[] = [];
  if (fight) {
    const step = advanceWithCombat(next, stage, fight.options, now, Math.random);
    next = fightDue ? startFight(step.actors, fight.options, fight.cast, now, Math.random) : step.actors;
    sounds = fight.options.sounds ? step.sounds : [];
  } else next = advance(next, stage, now, Math.random);
  if (towers && stackDue) next = startStack(next, towers.options, towers.typeOf, stage, now, Math.random);
  if (towers?.options.sound && stacked.climbs) playSound(values[STACK_SOUND] as SoundValue, volume => scene.stack?.sound?.(volume));
  for (const kind of sounds) playSound(values[COMBAT_SOUNDS[kind]] as SoundValue, volume => scene.combat?.sounds?.[kind]?.(volume));
  return next;
}

export function useMinimes({ catalog, reaction, widthPx, combat, stack }: MinimeSceneOptions): readonly MinimeActor[] {
  const values = useThemeValues();
  const stage = useMemo<MinimeStage>(() => {
    const { motion, rules } = readMinimeOptions(values, combat?.roles, combat?.teams);
    if (motion.placement !== "slots") return { motion, catalog, widthPx };
    // Fixed places: as many as minimes may join, per faction its own area
    const teams = (rules.teams ?? []).map(team => team.id);
    const demo = params.has("demo");
    return { motion, catalog, widthPx, slots: { count: rules.max, teams, teamOf: minime => (teams.length ? shownTeam(minime, teams, demo) : null) } };
  }, [values, catalog, widthPx, combat]);
  const fight = useMemo(() => {
    const options = combat ? readCombat(values, combat.explosive) : null;
    if (!combat || !options) return null;
    const rules = readMinimeOptions(values, combat.roles, combat.teams).rules;
    const ids = (list: readonly { id: string }[] | null | undefined) => (list ?? []).map(entry => entry.id);
    return { options, cast: combatCast(ids(rules.variants), ids(rules.teams), params.has("demo") ? DEMO_FIRST_LOGIN : null) };
  }, [values, combat]);
  const towers = useTowers(values, stack);
  // For the connection callbacks and the timer always the current values, without reconnecting
  const latest = useRef({ stage, reaction, fight, values, combat, towers, stack });
  useEffect(() => { latest.current = { stage, reaction, fight, values, combat, towers, stack }; }, [stage, reaction, fight, values, combat, towers, stack]);

  // Every change goes through the ref first, so the timer and the connection never work on an old list
  const [actors, setActors] = useState<readonly MinimeActor[]>([]);
  const current = useRef<readonly MinimeActor[]>([]);
  const commit = (next: readonly MinimeActor[]) => {
    if (next === current.current) return;
    current.current = next;
    setActors(next);
  };

  useEffect(() => connect({
    minimes: list => {
      const { stage: scene, towers: stacks } = latest.current;
      const now = Date.now();
      // In the demo the first minimes get the level types, so towers come
      const minimes = stacks && params.has("demo") ? withLevelVariants(list, stacks.options.levels) : list;
      const shown = releaseOrphans(syncRoster(current.current, minimes, scene, now, Math.random));
      commit(stacks ? breakStacks(shown, stacks.typeOf, scene, now, Math.random) : shown);
    },
    minimeChat: login => {
      const chosen = latest.current.reaction;
      if (chosen) commit(current.current.map(actor => (actor.login === login ? react(actor, chosen, Date.now()) : actor)));
    },
  }), []);

  // Places changed (number, width, placement): minimes with a place go to its new position
  useEffect(() => commit(resettle(current.current, stage, Date.now())), [stage]);

  // The next try for a fight; null without fights
  const [fightAt, setFightAt] = useState<number | null>(null);
  useEffect(() => setFightAt(fight ? nextFightAt(fight.options, Date.now(), Math.random) : null), [fight]);

  // The next try for a tower; null without towers
  const [stackAt, setStackAt] = useState<number | null>(null);
  useEffect(() => setStackAt(towers ? nextStackAt(towers.options, Date.now(), Math.random) : null), [towers]);

  // One timer for the next action end, fight or tower try, not per frame (rule 21)
  useEffect(() => {
    const wake = nextWake(actors, earliest(fightAt, stackAt));
    if (wake === null) return;
    const timer = setTimeout(() => {
      const now = Date.now();
      const scene = latest.current;
      const fightDue = !!scene.fight && fightAt !== null && now >= fightAt;
      const stackDue = !!scene.towers && stackAt !== null && now >= stackAt;
      commit(tick(current.current, scene, now, fightDue, stackDue));
      if (scene.fight && fightDue) setFightAt(nextFightAt(scene.fight.options, now, Math.random));
      if (scene.towers && stackDue) setStackAt(nextStackAt(scene.towers.options, now, Math.random));
    }, Math.max(0, wake - Date.now()));
    return () => clearTimeout(timer);
  }, [actors, fightAt, stackAt]);

  return actors;
}
