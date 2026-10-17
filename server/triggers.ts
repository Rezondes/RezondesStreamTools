// Chat triggers: rules from triggers.json in the streamer's profile folder. When (when), who (who), how often (cooldown),
// what and where (do: actions with zone). The file is checked for changes every 2 s, no restart needed.
import { readFile, rename, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { FxAction, FxEvent } from "../src/core/types.ts";
import type { ChatLine } from "./chat.ts";
import { REGEX_TIME_LIMIT_MS, regexMatcher } from "./regexMatch.ts";

export type When = {
  // word: whole word anywhere, contains: substring, exact: whole message,
  // command: message starts with this word (e.g. "!lizard"), regex: regular expression
  type: "word" | "contains" | "exact" | "command" | "regex";
  match: string;
  caseSensitive?: boolean;
};

export type Trigger = {
  name: string;
  enabled?: boolean;
  // Show on the commands page and in the chat help (default yes), with an explanation for viewers
  public?: boolean;
  description?: string;
  when: When;
  // everyone, subscriber, vip, moderator, broadcaster (one role is enough)
  who?: string[];
  cooldown?: number; // seconds, for everyone
  userCooldown?: number; // seconds, per viewer
  do: FxAction[];
};

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function toRegex(when: When): RegExp {
  const flags = when.caseSensitive ? "u" : "iu";
  const pattern = escape(when.match);
  switch (when.type) {
    // Word boundary: no letter and no digit before and after, so "LIZARD!" counts
    case "word": return new RegExp(`(?<![\\p{L}\\p{N}_])${pattern}(?![\\p{L}\\p{N}_])`, flags);
    case "contains": return new RegExp(pattern, flags);
    case "exact": return new RegExp(`^\\s*${pattern}\\s*$`, flags);
    case "command": return new RegExp(`^${pattern}(?=\\s|$)`, flags);
    case "regex": return new RegExp(when.match, flags);
  }
}

export function allowed(trigger: Trigger, roles: string[]) {
  const who = trigger.who ?? ["everyone"];
  // The streamer may always, mods may do everything subs/VIPs may
  return who.includes("everyone") || roles.includes("broadcaster") || who.some(role => roles.includes(role))
    || (roles.includes("moderator") && who.some(role => role === "subscriber" || role === "vip"));
}

// Start time of every action in ms. Actions run one after another: the next starts only after
// delay + duration + after of the previous one. together: appears at the same time as the previous one.
// The action is sent already at the start of delay: the overlay then shows it paused
// (delay), plays it (duration) and leaves it standing paused (after).
export function schedule(actions: FxAction[]): number[] {
  let next = 0; // earliest start for the next action in the sequence
  let previousStart = 0;
  return actions.map(action => {
    const start = action.together ? previousStart : next;
    next = Math.max(next, start + ((action.delay ?? 0) + (action.duration ?? 4) + (action.after ?? 0)) * 1000);
    previousStart = start;
    return start;
  });
}

type Loaded = Trigger & { regex: RegExp };

const WHEN_TYPES = ["word", "contains", "exact", "command", "regex"];
const MAX_DESCRIPTION = 200;

// Checks rules and builds the search patterns. Faulty rules end up in errors and are skipped.
export function compile(list: Trigger[]): { triggers: Loaded[]; errors: string[] } {
  const errors: string[] = [];
  const names = new Set<string>();
  const triggers = list.flatMap(trigger => {
    try {
      if (!trigger.name?.trim()) throw new Error("Name fehlt");
      if (names.has(trigger.name)) throw new Error("Name doppelt vergeben");
      names.add(trigger.name);
      if (!WHEN_TYPES.includes(trigger.when?.type)) throw new Error(`when.type muss ${WHEN_TYPES.join(", ")} sein`);
      if (!trigger.when.match) throw new Error("Suchtext (when.match) fehlt");
      // allowed() expects a list; anything else would end the whole server on the first chat match
      if (trigger.who !== undefined && !(Array.isArray(trigger.who) && trigger.who.every(role => typeof role === "string"))) throw new Error("who muss eine Liste von Rollen sein");
      if ((trigger.description ?? "").length > MAX_DESCRIPTION) throw new Error(`Beschreibung länger als ${MAX_DESCRIPTION} Zeichen`);
      if (!Array.isArray(trigger.do) || trigger.do.length === 0) throw new Error("mindestens eine Aktion nötig");
      trigger.do.forEach((action, index) => {
        if (action.type !== "media" && action.type !== "text") throw new Error(`Aktion ${index + 1}: type muss media oder text sein`);
        if (action.type === "media" && !action.image && !action.video && !action.sound) throw new Error(`Aktion ${index + 1}: Bild, Video oder Sound fehlt`);
        if (action.type === "text" && !action.text) throw new Error(`Aktion ${index + 1}: Text fehlt`);
      });
      return [{ ...trigger, regex: toRegex(trigger.when) }];
    } catch (error) {
      errors.push(`Trigger "${trigger.name || "?"}": ${(error as Error).message}`);
      return [];
    }
  });
  return { triggers, errors };
}

const namesOf = (triggers: Loaded[]) => triggers.map(trigger => trigger.name).join(", ") || "none";

// Rules from the file; throws on broken JSON
async function readTriggerFile(file: string): Promise<Trigger[]> {
  const parsed = JSON.parse(await readFile(file, "utf8")) as { triggers?: Trigger[] };
  return parsed.triggers ?? [];
}

// Via a temporary file, so a crash while writing never leaves half a triggers.json behind
async function writeTriggerFile(file: string, list: Trigger[]) {
  const partial = `${file}.tmp`;
  await writeFile(partial, JSON.stringify({ triggers: list }, null, 2) + "\n");
  await rename(partial, file);
}

// Cooldowns for everyone (name) and per viewer (name:login); ready remembers the time when it fires
function createCooldowns() {
  const lastFired = new Map<string, number>();
  return function ready(trigger: Trigger, login: string, now: number) {
    const userKey = `${trigger.name}:${login}`;
    if (now - (lastFired.get(trigger.name) ?? 0) < (trigger.cooldown ?? 0) * 1000) return false;
    if (now - (lastFired.get(userKey) ?? 0) < (trigger.userCooldown ?? 0) * 1000) return false;
    lastFired.set(trigger.name, now);
    lastFired.set(userKey, now);
    return true;
  };
}

// Checks matches and fires. active: does the trigger still belong to the current list (after a regex check in the worker)
function createMatching(fire: (event: FxEvent) => void, active: (trigger: Loaded) => boolean) {
  const ready = createCooldowns();
  let nextId = 1;
  // Too slow regex triggers stay switched off until the next save or load
  const slow = new WeakSet<Loaded>();

  function run(trigger: Trigger, user: string, message: string) {
    const starts = schedule(trigger.do);
    trigger.do.forEach((action, index) => setTimeout(() => fire({ id: nextId++, zone: action.zone ?? "main", action, user, message }), starts[index]));
  }

  function accept(trigger: Trigger, line: ChatLine, now: number) {
    if (!allowed(trigger, line.roles) || !ready(trigger, line.login, now)) return;
    console.log(`Trigger ${trigger.name} fired by ${line.user}`);
    run(trigger, line.user, line.text);
  }

  async function matchRegex(trigger: Loaded, line: ChatLine, now: number) {
    const result = await regexMatcher.test(trigger.regex.source, trigger.regex.flags, line.text);
    if (result === "slow") {
      slow.add(trigger);
      console.error(`Trigger ${trigger.name}: regex took longer than ${REGEX_TIME_LIMIT_MS} ms and was switched off`);
    }
    if (result === true && active(trigger)) accept(trigger, line, now);
  }

  return {
    run,
    handle(triggers: Loaded[], line: ChatLine) {
      const now = Date.now();
      for (const trigger of triggers) {
        if (trigger.enabled === false || slow.has(trigger)) continue;
        // The streamer's own regex only in the worker with a time limit, the fixed patterns are safe
        if (trigger.when.type === "regex") void matchRegex(trigger, line, now);
        else if (trigger.regex.test(line.text)) accept(trigger, line, now);
      }
    },
  };
}

// Triggers of a streamer. folder: profile folder, fire: effect to the overlays. stop() ends the reloading.
export function startTriggers(folder: string, fire: (event: FxEvent) => void) {
  const file = join(folder, "triggers.json");
  const matching = createMatching(fire, trigger => triggers.includes(trigger));
  let raw: Trigger[] = [];
  let triggers: Loaded[] = [];
  let modified = 0;

  async function load() {
    const info = await stat(file).catch(() => null);
    if (!info || info.mtimeMs === modified) return;
    modified = info.mtimeMs;
    try {
      raw = await readTriggerFile(file);
      // Skip faulty rules so that a rule with a typo does not switch off all the others
      const result = compile(raw);
      triggers = result.triggers;
      result.errors.forEach(error => console.error(error));
      console.log(`Triggers loaded: ${namesOf(triggers)}`);
    } catch (error) {
      console.error(`${file} is not valid JSON, keeping the previous triggers: ${(error as Error).message}`);
    }
  }
  const reload = () => { load().catch((error: unknown) => console.error("Loading triggers failed:", error)); };
  reload();
  const reloadTimer = setInterval(reload, 2000);

  return {
    list: () => triggers.map(trigger => ({ name: trigger.name, enabled: trigger.enabled !== false })),
    // Rules as they are in the file (for the editor in the browser)
    config: () => ({ triggers: raw }),
    // From the editor: check first, write only error-free lists
    async save(list: Trigger[]) {
      const result = compile(list);
      if (result.errors.length) return result.errors;
      await writeTriggerFile(file, list);
      raw = list;
      triggers = result.triggers;
      modified = (await stat(file)).mtimeMs;
      console.log(`Triggers saved: ${namesOf(triggers)}`);
      return [];
    },
    handle: (line: ChatLine) => matching.handle(triggers, line),
    // For testing from the dashboard, without cooldown
    fire(name: string) {
      const trigger = triggers.find(candidate => candidate.name === name);
      if (trigger) matching.run(trigger, "Test", trigger.when.match);
      return Boolean(trigger);
    },
    stop: () => clearInterval(reloadTimer),
  };
}
