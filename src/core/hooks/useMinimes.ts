// Hook: the minimes of the scene, each with its running action (enter, exit, idle, walk or from the catalog of the
// theme) and position. The movement comes from the theme's minime settings (minimeFields.ts), the list from the
// server (SSE minimes), chat triggers the reaction (SSE minimeChat). With combat the theme has fights
// (minimeCombat.ts): they start now and then, their steps and sounds come from the core. Renders only when an action
// changes. catalog, reaction and combat should be stable (useMemo), widthPx is the width of the scene in px.
import { useEffect, useMemo, useRef, useState } from "react";
import { connect } from "../connection.ts";
import { DEMO_FIRST_LOGIN } from "../demo.ts";
import { advance, react, syncRoster, type MinimeAction, type MinimeActor, type MinimeStage } from "../minimeBehavior.ts";
import { advanceWithCombat, combatCast, nextFightAt, nextWake, readCombat, releaseOrphans, startFight, type CombatSound } from "../minimeCombat.ts";
import { COMBAT_SOUNDS, readMinimeOptions } from "../minimeFields.ts";
import { params } from "../params.ts";
import { playSound } from "../sound.ts";
import type { MinimeVariantSet, SoundValue } from "../theme.ts";
import { useThemeValues } from "./useSettings.ts";

// Fights of a theme: its roles (variants), factions, roles whose shot is an explosion and built-in sounds per event
export type MinimeCombatScene = {
  roles: MinimeVariantSet;
  teams?: MinimeVariantSet;
  explosive?: readonly string[];
  sounds?: Partial<Record<CombatSound, (volume: number) => void>>;
};
type MinimeSceneOptions = { catalog: readonly MinimeAction[]; reaction: MinimeAction | null; widthPx: number; combat?: MinimeCombatScene };

export function useMinimes({ catalog, reaction, widthPx, combat }: MinimeSceneOptions): readonly MinimeActor[] {
  const values = useThemeValues();
  const stage = useMemo<MinimeStage>(() => ({ motion: readMinimeOptions(values).motion, catalog, widthPx }), [values, catalog, widthPx]);
  const fight = useMemo(() => {
    const options = combat ? readCombat(values, combat.explosive) : null;
    if (!combat || !options) return null;
    const rules = readMinimeOptions(values, combat.roles, combat.teams).rules;
    const ids = (list: readonly { id: string }[] | null | undefined) => (list ?? []).map(entry => entry.id);
    return { options, cast: combatCast(ids(rules.variants), ids(rules.teams), params.has("demo") ? DEMO_FIRST_LOGIN : null) };
  }, [values, combat]);
  // For the connection callbacks and the timer always the current values, without reconnecting
  const latest = useRef({ stage, reaction, fight, values, combat });
  useEffect(() => { latest.current = { stage, reaction, fight, values, combat }; }, [stage, reaction, fight, values, combat]);

  // Every change goes through the ref first, so the timer and the connection never work on an old list
  const [actors, setActors] = useState<readonly MinimeActor[]>([]);
  const current = useRef<readonly MinimeActor[]>([]);
  const commit = (next: readonly MinimeActor[]) => {
    if (next === current.current) return;
    current.current = next;
    setActors(next);
  };

  useEffect(() => connect({
    minimes: minimes => commit(releaseOrphans(syncRoster(current.current, minimes, latest.current.stage, Date.now(), Math.random))),
    minimeChat: login => {
      const chosen = latest.current.reaction;
      if (chosen) commit(current.current.map(actor => (actor.login === login ? react(actor, chosen, Date.now()) : actor)));
    },
  }), []);

  // The next try for a fight; null without fights
  const [fightAt, setFightAt] = useState<number | null>(null);
  useEffect(() => setFightAt(fight ? nextFightAt(fight.options, Date.now(), Math.random) : null), [fight]);

  // One timer for the next action end or fight try, not per frame (rule 21)
  useEffect(() => {
    const wake = nextWake(actors, fightAt);
    if (wake === null) return;
    const timer = setTimeout(() => {
      const now = Date.now();
      const { stage: scene, fight: fights, values: settings, combat: theme } = latest.current;
      if (!fights) return commit(advance(current.current, scene, now, Math.random));
      const step = advanceWithCombat(current.current, scene, fights.options, now, Math.random);
      let next = step.actors;
      if (fightAt !== null && now >= fightAt) {
        next = startFight(next, fights.options, fights.cast, now, Math.random);
        setFightAt(nextFightAt(fights.options, now, Math.random));
      }
      commit(next);
      if (!fights.options.sounds) return;
      for (const kind of step.sounds) playSound(settings[COMBAT_SOUNDS[kind]] as SoundValue, volume => theme?.sounds?.[kind]?.(volume));
    }, Math.max(0, wake - Date.now()));
    return () => clearTimeout(timer);
  }, [actors, fightAt]);

  return actors;
}
