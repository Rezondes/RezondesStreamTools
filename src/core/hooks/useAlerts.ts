// Hook: alert queue. Returns the current alert and whether it is fading out; the next one follows
// after alertTiming. An alert gets a key so the scene restarts per alert.
import { useEffect, useState } from "react";
import { connect } from "../connection.ts";
import { alertTiming } from "../overlayTiming.ts";
import type { Alert } from "../types.ts";

type QueuedAlert = Alert & { key: number };

export function useAlerts(durationMs: number) {
  const [queue, setQueue] = useState<QueuedAlert[]>([]);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    let key = 0;
    return connect({ alert: alert => setQueue(list => [...list, { ...alert, key: key++ }]) });
  }, []);

  const current = queue[0] ?? null;
  useEffect(() => {
    if (!current) return;
    const timing = alertTiming(durationMs);
    setLeaving(false);
    const leave = setTimeout(() => setLeaving(true), timing.leaveAtMs);
    const next = setTimeout(() => setQueue(list => list.slice(1)), timing.nextAtMs);
    return () => { clearTimeout(leave); clearTimeout(next); };
  }, [current, durationMs]);

  return { current, leaving };
}
