// Hooks für Chat-Effekte: useFx liefert die sichtbaren Effekte einer Zone mit Position, useFxPhase die
// aktuelle Phase eines Effekts (pre, play, post, done) nach fxPhase.
import { useEffect, useState } from "react";
import { connect } from "../connection.ts";
import { fxLifetime, fxPhase, placeFx, type FxPhase } from "../overlayTiming.ts";
import type { FxAction, FxEvent } from "../types.ts";

export type ShownFx = FxEvent & { x: number; y: number };

export function useFx(zone: string, max: number) {
  const [shown, setShown] = useState<ShownFx[]>([]);
  useEffect(() => {
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const stop = connect({
      fx: event => {
        if (event.zone !== zone) return;
        setShown(list => [...list, { ...event, ...placeFx(event.action.position, Math.random) }].slice(-max));
        const timer = setTimeout(() => {
          timers.delete(timer);
          setShown(list => list.filter(item => item.id !== event.id));
        }, fxLifetime(event.action));
        timers.add(timer);
      },
    });
    return () => { stop(); timers.forEach(timer => clearTimeout(timer)); };
  }, [zone, max]);
  return shown;
}

// Phase ab Erscheinen; wechselt genau zu den Grenzen von delay, duration und after
export function useFxPhase(action: FxAction): FxPhase {
  const [phase, setPhase] = useState<FxPhase>(() => fxPhase(action, 0));
  useEffect(() => {
    const start = Date.now();
    const delayMs = (action.delay ?? 0) * 1000;
    const playEndMs = delayMs + (action.duration ?? 4) * 1000;
    const timers = [delayMs, playEndMs, fxLifetime(action)].map(atMs => setTimeout(() => setPhase(fxPhase(action, Date.now() - start)), atMs));
    return () => timers.forEach(timer => clearTimeout(timer));
  }, [action]);
  return phase;
}
