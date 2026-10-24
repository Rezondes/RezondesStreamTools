// Hook: alert queue. Returns the current alert and whether it is fading out; the next one follows
// after alertTiming. An alert gets a key so the scene restarts per alert. duration: one number for all alerts or a
// function per alert (alertDurationMs); it is read when an alert starts, a change applies from the next alert on.
import { useEffect, useRef, useState } from "react";
import { connect } from "../connection.ts";
import { type AlertDuration, alertDurationMs, alertTiming } from "../overlayTiming.ts";
import type { Alert } from "../types.ts";

type QueuedAlert = Alert & { key: number };

export function useAlerts(duration: AlertDuration) {
  const [queue, setQueue] = useState<QueuedAlert[]>([]);
  // The key of the alert that is fading out: a plain flag stayed true into the first frame of the next alert, which
  // then began as leaving (the Plantage mango rolled away at once)
  const [leavingKey, setLeavingKey] = useState<number | null>(null);
  const latest = useRef(duration);
  latest.current = duration;

  useEffect(() => {
    let key = 0;
    return connect({ alert: alert => setQueue(list => [...list, { ...alert, key: key++ }]) });
  }, []);

  const current = queue[0] ?? null;
  useEffect(() => {
    if (!current) return;
    const timing = alertTiming(alertDurationMs(latest.current, current));
    const leave = setTimeout(() => setLeavingKey(current.key), timing.leaveAtMs);
    const next = setTimeout(() => setQueue(list => list.slice(1)), timing.nextAtMs);
    return () => { clearTimeout(leave); clearTimeout(next); };
  }, [current]);

  return { current, leaving: current !== null && leavingKey === current.key };
}
