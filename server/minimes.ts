// Minimes of a streamer on the server: reads chat lines, keeps the list with the rules from src/core/minimes.ts,
// saves it batched to minimes.json in the profile folder and sends every change to the overlays (SSE).
// rules = null: the chosen theme has no minimes, then everything rests and the overlays get an empty list.
// Started by server/streamer.ts. Check: minimes.check.ts.
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { applyMinime, emptyMinimeState, MAX_STORED_COLORS, parseCommand, type MinimeEntry, type MinimeEvent, type MinimeRules, type MinimeState } from "../src/core/minimes.ts";
import type { Minime, ServerMessage } from "../src/core/types.ts";
import { writeAtomic } from "./atomicFile.ts";
import type { ChatLine } from "./chat.ts";

// Timers from outside, so the check can fire them by hand (rule 32)
export type MinimeTimers = {
  setTimeout: (run: () => void, delayMs: number) => unknown;
  clearTimeout: (id: unknown) => void;
  setInterval: (run: () => void, delayMs: number) => unknown;
  clearInterval: (id: unknown) => void;
};

const REAL_TIMERS: MinimeTimers = {
  setTimeout: (run, delayMs) => setTimeout(run, delayMs),
  clearTimeout: id => clearTimeout(id as ReturnType<typeof setTimeout>),
  setInterval: (run, delayMs) => setInterval(run, delayMs),
  clearInterval: id => clearInterval(id as ReturnType<typeof setInterval>),
};

type MinimeSetup = {
  folder: string;
  emit: (message: ServerMessage) => void;
  now: () => number;
  rules: MinimeRules | null;
  timers?: MinimeTimers;
  random?: () => number; // randomness for assigning variants, default Math.random
};

// fixed: write load, many chat messages result in at most one file every 2 s
const SAVE_DELAY_MS = 2000;
// fixed: cleanup interval; how long a minime stays without a message is configurable
const PRUNE_EVERY_MS = 60_000;
// fixed: memory guard for the list in the file (the setting allows at most 100)
const MAX_ROSTER = 100;

const LOGIN = /^[a-z0-9_]{1,25}$/;
const COLOR = /^#[0-9a-f]{6}$/;
const VARIANT = /^[a-z0-9]{1,30}$/;
const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const isTime = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

function toEntry(value: unknown): MinimeEntry | null {
  if (!isObject(value) || typeof value.login !== "string" || !LOGIN.test(value.login)) return null;
  if (typeof value.user !== "string" || !value.user || value.user.length > 50 || !isTime(value.lastSeen)) return null;
  if (value.color !== null && !(typeof value.color === "string" && COLOR.test(value.color))) return null;
  // The variant is missing in files from before variants, invalid variants become null
  const variant = typeof value.variant === "string" && VARIANT.test(value.variant) ? value.variant : null;
  return { login: value.login, user: value.user, color: value.color, variant, lastSeen: value.lastSeen };
}

// Remembered colors (key "color") or variants (key "variant"): only valid entries, the newest up to the limit
function toRemembered(value: unknown, key: "color" | "variant", pattern: RegExp) {
  if (!isObject(value)) return {};
  const valid = Object.entries(value).flatMap(([login, stored]) => {
    if (!LOGIN.test(login) || !isObject(stored) || typeof stored[key] !== "string" || !pattern.test(stored[key])) return [];
    return isTime(stored.usedAt) && isTime(stored.changedAt) ? [{ login, entry: { [key]: stored[key], usedAt: stored.usedAt, changedAt: stored.changedAt } }] : [];
  });
  const newest = valid.sort((first, second) => second.entry.usedAt - first.entry.usedAt).slice(0, MAX_STORED_COLORS);
  return Object.fromEntries(newest.map(({ login, entry }) => [login, entry]));
}

// Brings a read minimes.json into valid shape: invalid and duplicate entries drop out
export function parseMinimeFile(raw: unknown): MinimeState {
  if (!isObject(raw)) return emptyMinimeState();
  const roster: MinimeEntry[] = [];
  for (const entry of Array.isArray(raw.roster) ? raw.roster.map(toEntry) : []) {
    if (entry && !roster.some(known => known.login === entry.login)) roster.push(entry);
  }
  return {
    roster: roster.slice(0, MAX_ROSTER),
    colors: toRemembered(raw.colors, "color", COLOR) as MinimeState["colors"],
    variants: toRemembered(raw.variants, "variant", VARIANT) as MinimeState["variants"],
  };
}

// Chat line as an event: a command or otherwise a normal message
export function toMinimeEvent(line: ChatLine, rules: MinimeRules): MinimeEvent {
  const command = parseCommand(line.text, line.roles, rules);
  const twitchColor = line.color ?? null;
  switch (command?.type) {
    case "join": return { type: "join", login: line.login, user: line.user, color: command.color, variant: command.variant, twitchColor };
    case "color": return { type: "color", login: line.login, user: line.user, color: command.color, twitchColor };
    case "variant": return { type: "variant", login: line.login, user: line.user, variant: command.variant };
    case "leave": return { type: "leave", login: line.login };
    case "kick": return { type: "kick", login: command.login };
    case undefined: return { type: "chat", login: line.login };
  }
}

async function readState(file: string): Promise<MinimeState> {
  try {
    return parseMinimeFile(JSON.parse(await readFile(file, "utf8")));
  } catch {
    // No file or a broken one: start empty
    return emptyMinimeState();
  }
}

// Starts the minimes of a streamer. handle: every chat line, ban: ban or timeout, offline: stream ended,
// setRules: changed settings, current: the list for a newly connected overlay, stop: timers off and save.
export async function startMinimes(setup: MinimeSetup) {
  const timers = setup.timers ?? REAL_TIMERS;
  const file = join(setup.folder, "minimes.json");
  let state = await readState(file);
  let rules = setup.rules;
  let saveTimer: unknown = null;

  const random = setup.random ?? Math.random;
  const current = (): Minime[] => (rules ? state.roster.map(({ login, user, color, variant }) => ({ login, user, color, variant })) : []);
  // Save one after another, with the state at the time of writing: an older operation never overwrites a newer one
  let saving = Promise.resolve();
  const save = () => {
    saving = saving.then(() => writeAtomic(file, JSON.stringify(state))).catch((error: unknown) => console.error("Saving minimes failed:", error));
    return saving;
  };
  const scheduleSave = () => {
    saveTimer ??= timers.setTimeout(() => { saveTimer = null; void save(); }, SAVE_DELAY_MS);
  };
  // announce: false when the caller sends the list itself afterwards
  const apply = (event: MinimeEvent, announce = true) => {
    if (!rules) return;
    const result = applyMinime(state, event, setup.now(), rules, random);
    if (result.state !== state) {
      state = result.state;
      scheduleSave();
    }
    if (result.changed && announce) setup.emit({ type: "minimes", minimes: current() });
    if (result.react) setup.emit({ type: "minimeChat", login: result.react });
  };

  apply({ type: "prune" });
  const pruning = timers.setInterval(() => apply({ type: "prune" }), PRUNE_EVERY_MS);

  return {
    handle: (line: ChatLine) => { if (rules) apply(toMinimeEvent(line, rules)); },
    ban: (login: string) => apply({ type: "ban", login }),
    offline: () => { if (rules?.clearOffline) apply({ type: "clear" }); },
    setRules(next: MinimeRules | null) {
      rules = next;
      apply({ type: "prune" }, false);
      setup.emit({ type: "minimes", minimes: current() });
    },
    current,
    async stop() {
      timers.clearInterval(pruning);
      if (saveTimer !== null) timers.clearTimeout(saveTimer);
      saveTimer = null;
      await save();
    },
  };
}
export type MinimeRuntime = Awaited<ReturnType<typeof startMinimes>>;
