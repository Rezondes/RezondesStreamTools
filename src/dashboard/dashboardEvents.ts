// Changes from the server for the open dashboard (GET /api/dashboard/events, one DashboardChange per message): a part
// of the page loads again when the server says it changed, instead of asking every few seconds. One stream for the
// whole page; it opens with the first listener and closes with the last. After every connect all listeners load once,
// so nothing that changed while the stream was down stays old. Check: dashboardEvents.check.ts.
import type { DashboardChange } from "../generated/DashboardChange.ts";

type Listener = () => void;
// The part of EventSource the feed uses, so the check can play the server
export type ChangeSource = {
  onopen: ((event: Event) => void) | null;
  onmessage: ((event: MessageEvent<string>) => void) | null;
  onerror: ((event: Event) => void) | null;
  readyState: number;
  close: () => void;
};
// Runs later and returns how to cancel it
type Later = (run: () => void, ms: number) => () => void;

// fixed: pause before connecting again after the server closed the stream (ms); EventSource retries a broken
// connection by itself
const RETRY_MS = 10_000;
// fixed: EventSource.CLOSED
const CLOSED = 2;

export function changeFeed(open: () => ChangeSource, later: Later) {
  const listeners = new Map<DashboardChange, Set<Listener>>();
  let source: ChangeSource | null = null;
  let cancelRetry: (() => void) | null = null;
  const everyone = () => listeners.forEach(set => set.forEach(listener => listener()));
  const connect = () => {
    const next = open();
    next.onopen = everyone;
    next.onmessage = event => listeners.get(JSON.parse(event.data) as DashboardChange)?.forEach(listener => listener());
    next.onerror = () => { if (next.readyState === CLOSED) cancelRetry = later(connect, RETRY_MS); };
    source = next;
  };
  // Listens to one kind of change; the return value stops listening
  return (change: DashboardChange, listener: Listener) => {
    const set = listeners.get(change) ?? new Set<Listener>();
    listeners.set(change, set);
    set.add(listener);
    if (!source) connect();
    return () => {
      set.delete(listener);
      if ([...listeners.values()].some(rest => rest.size > 0)) return;
      source?.close();
      source = null;
      cancelRetry?.();
      cancelRetry = null;
    };
  };
}

const later: Later = (run, ms) => {
  const timer = setTimeout(run, ms);
  return () => clearTimeout(timer);
};

export const onChange = changeFeed(() => new EventSource("/api/dashboard/events"), later);
