// Hook: the minimes of the scene, each with its running action (enter, exit, idle, walk or from the catalog of the
// theme) and position. The movement comes from the theme's minime settings (minimeFields.ts), the list from the
// server (SSE minimes), chat triggers the reaction (SSE minimeChat). Renders only when an action changes.
// catalog and reaction should be stable (useMemo), widthPx is the width of the scene in px.
import { useEffect, useMemo, useRef, useState } from "react";
import { connect } from "../connection.ts";
import { advance, nextEnd, react, syncRoster, type MinimeAction, type MinimeActor, type MinimeStage } from "../minimeBehavior.ts";
import { readMinimeOptions } from "../minimeFields.ts";
import { useThemeValues } from "./useSettings.ts";

type MinimeSceneOptions = { catalog: readonly MinimeAction[]; reaction: MinimeAction | null; widthPx: number };

export function useMinimes({ catalog, reaction, widthPx }: MinimeSceneOptions): readonly MinimeActor[] {
  const values = useThemeValues();
  const stage = useMemo<MinimeStage>(() => ({ motion: readMinimeOptions(values).motion, catalog, widthPx }), [values, catalog, widthPx]);
  // For the connection callbacks always the current stage and reaction, without reconnecting
  const latest = useRef({ stage, reaction });
  useEffect(() => { latest.current = { stage, reaction }; }, [stage, reaction]);

  const [actors, setActors] = useState<readonly MinimeActor[]>([]);
  useEffect(() => connect({
    minimes: minimes => setActors(current => syncRoster(current, minimes, latest.current.stage, Date.now(), Math.random)),
    minimeChat: login => {
      const chosen = latest.current.reaction;
      if (chosen) setActors(current => current.map(actor => (actor.login === login ? react(actor, chosen, Date.now()) : actor)));
    },
  }), []);

  // One timer for the next action end, not per frame (rule 21)
  useEffect(() => {
    const end = nextEnd(actors);
    if (end === null) return;
    const timer = setTimeout(() => setActors(current => advance(current, latest.current.stage, Date.now(), Math.random)), Math.max(0, end - Date.now()));
    return () => clearTimeout(timer);
  }, [actors]);

  return actors;
}
