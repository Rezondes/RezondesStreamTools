// Minimes eines Streamers auf dem Server: liest Chatzeilen, führt die Liste mit den Regeln aus src/core/minimes.ts,
// speichert sie gebündelt in minimes.json im Profil-Ordner und schickt jede Änderung an die Overlays (SSE).
// rules = null: das gewählte Theme hat keine Minimes, dann ruht alles und die Overlays bekommen eine leere Liste.
// Gestartet von server/streamer.ts. Check: minimes.check.ts.
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { applyMinime, emptyMinimeState, MAX_STORED_COLORS, parseCommand, type MinimeEntry, type MinimeEvent, type MinimeRules, type MinimeState } from "../src/core/minimes.ts";
import type { Minime, ServerMessage } from "../src/core/types.ts";
import { writeAtomic } from "./atomicFile.ts";
import type { ChatLine } from "./chat.ts";

// Timer von aussen, damit der Check sie von Hand auslösen kann (Regel 32)
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
  random?: () => number; // Zufall für die Vergabe von Typen, Standard Math.random
};

// fixed: Schreiblast, viele Chatnachrichten ergeben höchstens eine Datei alle 2 s
const SAVE_DELAY_MS = 2000;
// fixed: Takt des Aufräumens; wie lange ein Minime ohne Nachricht bleibt, ist einstellbar
const PRUNE_EVERY_MS = 60_000;
// fixed: Speicherschutz für die Liste in der Datei (die Einstellung erlaubt höchstens 100)
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
  // Typ fehlt in Dateien von vor den Typen, ungültige Typen werden zu null
  const variant = typeof value.variant === "string" && VARIANT.test(value.variant) ? value.variant : null;
  return { login: value.login, user: value.user, color: value.color, variant, lastSeen: value.lastSeen };
}

// Gemerkte Farben (key "color") oder Typen (key "variant"): nur gültige Einträge, die neuesten bis zur Obergrenze
function toRemembered(value: unknown, key: "color" | "variant", pattern: RegExp) {
  if (!isObject(value)) return {};
  const valid = Object.entries(value).flatMap(([login, stored]) => {
    if (!LOGIN.test(login) || !isObject(stored) || typeof stored[key] !== "string" || !pattern.test(stored[key])) return [];
    return isTime(stored.usedAt) && isTime(stored.changedAt) ? [{ login, entry: { [key]: stored[key], usedAt: stored.usedAt, changedAt: stored.changedAt } }] : [];
  });
  const newest = valid.sort((first, second) => second.entry.usedAt - first.entry.usedAt).slice(0, MAX_STORED_COLORS);
  return Object.fromEntries(newest.map(({ login, entry }) => [login, entry]));
}

// Gelesene minimes.json auf gültige Form bringen: ungültige und doppelte Einträge fallen weg
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

// Chatzeile als Ereignis: ein Befehl oder sonst eine normale Nachricht
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
    // Keine oder kaputte Datei: leer anfangen
    return emptyMinimeState();
  }
}

// Startet die Minimes eines Streamers. handle: jede Chatzeile, ban: Ban oder Timeout, offline: Stream beendet,
// setRules: geänderte Einstellungen, current: die Liste für ein neu verbundenes Overlay, stop: Timer aus und speichern.
export async function startMinimes(setup: MinimeSetup) {
  const timers = setup.timers ?? REAL_TIMERS;
  const file = join(setup.folder, "minimes.json");
  let state = await readState(file);
  let rules = setup.rules;
  let saveTimer: unknown = null;

  const random = setup.random ?? Math.random;
  const current = (): Minime[] => (rules ? state.roster.map(({ login, user, color, variant }) => ({ login, user, color, variant })) : []);
  // Speichern nacheinander, mit dem Stand zum Zeitpunkt des Schreibens: ein älterer Vorgang überschreibt nie einen neueren
  let saving = Promise.resolve();
  const save = () => {
    saving = saving.then(() => writeAtomic(file, JSON.stringify(state))).catch((error: unknown) => console.error("Saving minimes failed:", error));
    return saving;
  };
  const scheduleSave = () => {
    saveTimer ??= timers.setTimeout(() => { saveTimer = null; void save(); }, SAVE_DELAY_MS);
  };
  // announce: false, wenn der Aufrufer die Liste danach selbst schickt
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
