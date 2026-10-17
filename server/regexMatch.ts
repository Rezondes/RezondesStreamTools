// Regex-Trigger der Streamer laufen nicht im Server-Prozess, sondern in einem eigenen Worker-Thread mit Zeitlimit:
// ein Muster mit katastrophalem Backtracking (z.B. ^(a+)+$) würde sonst den Server aller Streamer einfrieren.
// Läuft eine Prüfung zu lange, wird der Worker beendet und neu gestartet; das Ergebnis ist dann null.
import { Worker } from "node:worker_threads";

// fixed: Server-Schutzgrenze, eine normale Prüfung dauert unter 1 ms
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

// "slow": diese Prüfung lief zu lange; null: verworfen, weil eine andere Prüfung den Worker blockiert hat
export type RegexResult = boolean | "slow" | null;
type Pending = { resolve: (matched: RegexResult) => void; timer: ReturnType<typeof setTimeout> };

export function createRegexMatcher(limitMs = REGEX_TIME_LIMIT_MS) {
  let worker: Worker | null = null;
  const pending = new Map<number, Pending>();
  let nextId = 1;

  function restart() {
    void worker?.terminate();
    worker = null;
    // Alles, was hinter der hängenden Prüfung wartete, gilt als nicht getroffen
    for (const entry of pending.values()) { clearTimeout(entry.timer); entry.resolve(null); }
    pending.clear();
  }

  function current(): Worker {
    if (worker) return worker;
    const started = new Worker(WORKER_CODE, { eval: true });
    started.on("message", ({ id, matched }: { id: number; matched: boolean }) => {
      const entry = pending.get(id);
      if (!entry) return;
      pending.delete(id);
      clearTimeout(entry.timer);
      // Ohne offene Prüfung hält der Worker den Prozess nicht am Leben
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
        const timer = setTimeout(() => { pending.delete(id); resolve("slow"); restart(); }, limitMs);
        pending.set(id, { resolve, timer });
        const target = current();
        target.ref();
        target.postMessage({ id, pattern, flags, text });
      });
    },
    stop: restart,
  };
}

// Ein Worker für alle Streamer
export const regexMatcher = createRegexMatcher();
