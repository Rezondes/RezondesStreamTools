// Regex triggers of the streamers do not run in the server process but in their own worker thread with a time limit:
// a pattern with catastrophic backtracking (e.g. ^(a+)+$) would otherwise freeze the server of all streamers.
// If a check takes too long, the worker is terminated and restarted; the result is then null.
import { Worker } from "node:worker_threads";

// fixed: server protection limit, a normal check takes under 1 ms
export const REGEX_TIME_LIMIT_MS = 50;

const WORKER_CODE = `
const { parentPort } = require("node:worker_threads");
const cache = new Map();
parentPort.on("message", ({ id, pattern, flags, text }) => {
  const key = flags + "/" + pattern;
  let regex = cache.get(key);
  if (!regex) {
    if (cache.size > 500) cache.clear();
    regex = new RegExp(pattern, flags);
    cache.set(key, regex);
  }
  parentPort.postMessage({ id, matched: regex.test(text) });
});
`;

// "slow": this check ran too long; null: dropped because another check blocked the worker
export type RegexResult = boolean | "slow" | null;
type Pending = { resolve: (matched: RegexResult) => void; timer?: ReturnType<typeof setTimeout> };

export function createRegexMatcher(limitMs = REGEX_TIME_LIMIT_MS) {
  let worker: Worker | null = null;
  // Time only counts once the worker runs: its startup (over 50 ms under load) is not a slow regex
  let online: Promise<void> = Promise.resolve();
  const pending = new Map<number, Pending>();
  let nextId = 1;

  function restart() {
    void worker?.terminate();
    worker = null;
    // Everything that waited behind the hanging check counts as not matched
    for (const entry of pending.values()) { clearTimeout(entry.timer); entry.resolve(null); }
    pending.clear();
  }

  function current(): Worker {
    if (worker) return worker;
    const started = new Worker(WORKER_CODE, { eval: true });
    online = new Promise(resolve => started.once("online", () => resolve()));
    started.on("message", ({ id, matched }: { id: number; matched: boolean }) => {
      const entry = pending.get(id);
      if (!entry) return;
      pending.delete(id);
      clearTimeout(entry.timer);
      // Without a pending check the worker does not keep the process alive
      if (pending.size === 0) started.unref();
      entry.resolve(matched);
    });
    started.on("error", (error: unknown) => {
      console.error("Regex worker failed:", error);
      if (worker === started) restart();
    });
    worker = started;
    return started;
  }

  return {
    test(pattern: string, flags: string, text: string): Promise<RegexResult> {
      return new Promise(resolve => {
        const id = nextId++;
        const entry: Pending = { resolve };
        pending.set(id, entry);
        const target = current();
        target.ref();
        target.postMessage({ id, pattern, flags, text });
        void online.then(() => {
          if (pending.get(id) === entry) entry.timer = setTimeout(() => { pending.delete(id); resolve("slow"); restart(); }, limitMs);
        });
      });
    },
    stop: restart,
  };
}

// One worker for all streamers
export const regexMatcher = createRegexMatcher();
