// Hook: die Minimes der Szene, jedes mit seiner laufenden Aktion (enter, exit, idle, walk oder aus dem Katalog des
// Themes) und Position. Die Bewegung kommt aus den Minime-Einstellungen des Themes (minimeFields.ts), die Liste vom
// Server (SSE minimes), Chat löst die Reaktion aus (SSE minimeChat). Rendert nur, wenn eine Aktion wechselt.
// catalog und reaction sollten stabil sein (useMemo), widthPx ist die Breite der Szene in px.
import { useEffect, useMemo, useRef, useState } from "react";
import { connect } from "../connection.ts";
import { advance, nextEnd, react, syncRoster, type MinimeAction, type MinimeActor, type MinimeStage } from "../minimeBehavior.ts";
import { readMinimeOptions } from "../minimeFields.ts";
import { useThemeValues } from "./useSettings.ts";

export type MinimeSceneOptions = { catalog: readonly MinimeAction[]; reaction: MinimeAction | null; widthPx: number };

export function useMinimes({ catalog, reaction, widthPx }: MinimeSceneOptions): readonly MinimeActor[] {
  const values = useThemeValues();
  const stage = useMemo<MinimeStage>(() => ({ motion: readMinimeOptions(values).motion, catalog, widthPx }), [values, catalog, widthPx]);
  // Für die Rückrufe der Verbindung immer die aktuelle Bühne und Reaktion, ohne neu zu verbinden
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

  // Ein Timer auf das nächste Aktionsende, nicht pro Bild (Regel 21)
  useEffect(() => {
    const end = nextEnd(actors);
    if (end === null) return;
    const timer = setTimeout(() => setActors(current => advance(current, latest.current.stage, Date.now(), Math.random)), Math.max(0, end - Date.now()));
    return () => clearTimeout(timer);
  }, [actors]);

  return actors;
}
