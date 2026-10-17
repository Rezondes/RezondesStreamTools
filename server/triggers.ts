// Chat-Trigger: Regeln aus triggers.json im Profil-Ordner des Streamers. Wann (when), wer (who), wie oft (cooldown),
// was und wo (do: Aktionen mit zone). Die Datei wird alle 2 s auf Änderungen geprüft, kein Neustart nötig.
import { readFile, rename, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { FxAction, FxEvent } from "../src/core/types.ts";
import type { ChatLine } from "./chat.ts";
import { REGEX_TIME_LIMIT_MS, regexMatcher } from "./regexMatch.ts";

export type When = {
  // word: ganzes Wort irgendwo, contains: Teilstring, exact: ganze Nachricht,
  // command: Nachricht beginnt mit diesem Wort (z.B. "!lizard"), regex: regulärer Ausdruck
  type: "word" | "contains" | "exact" | "command" | "regex";
  match: string;
  caseSensitive?: boolean;
};

export type Trigger = {
  name: string;
  enabled?: boolean;
  // Auf der Befehlsseite und in der Chat-Hilfe zeigen (Standard ja), mit Erklärung für die Zuschauer
  public?: boolean;
  description?: string;
  when: When;
  // everyone, subscriber, vip, moderator, broadcaster (eine Rolle reicht)
  who?: string[];
  cooldown?: number; // Sekunden, für alle
  userCooldown?: number; // Sekunden, pro Zuschauer
  do: FxAction[];
};

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function toRegex(when: When): RegExp {
  const flags = when.caseSensitive ? "u" : "iu";
  const pattern = escape(when.match);
  switch (when.type) {
    // Wortgrenze: davor und danach kein Buchstabe und keine Ziffer, "LIZARD!" zählt also
    case "word": return new RegExp(`(?<![\\p{L}\\p{N}_])${pattern}(?![\\p{L}\\p{N}_])`, flags);
    case "contains": return new RegExp(pattern, flags);
    case "exact": return new RegExp(`^\\s*${pattern}\\s*$`, flags);
    case "command": return new RegExp(`^${pattern}(?=\\s|$)`, flags);
    case "regex": return new RegExp(when.match, flags);
  }
}

export function allowed(trigger: Trigger, roles: string[]) {
  const who = trigger.who ?? ["everyone"];
  // Der Streamer darf immer, Mods dürfen alles, was Subs/VIPs dürfen
  return who.includes("everyone") || roles.includes("broadcaster") || who.some(role => roles.includes(role))
    || (roles.includes("moderator") && who.some(role => role === "subscriber" || role === "vip"));
}

// Startzeit jeder Aktion in ms. Aktionen laufen nacheinander: die nächste beginnt erst nach
// delay + duration + after der vorherigen. together: erscheint gleichzeitig mit der vorherigen.
// Die Aktion wird schon zu Beginn von delay geschickt: das Overlay zeigt sie dann angehalten
// (delay), spielt sie ab (duration) und lässt sie angehalten stehen (after).
export function schedule(actions: FxAction[]): number[] {
  let next = 0; // frühester Start für die nächste Aktion in der Abfolge
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

// Prüft Regeln und baut die Suchmuster. Fehlerhafte Regeln landen in errors und werden übersprungen.
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
      // allowed() erwartet eine Liste; etwas anderes würde beim ersten Chat-Treffer den ganzen Server beenden
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

// Regeln aus der Datei; wirft bei kaputtem JSON
async function readTriggerFile(file: string): Promise<Trigger[]> {
  const parsed = JSON.parse(await readFile(file, "utf8")) as { triggers?: Trigger[] };
  return parsed.triggers ?? [];
}

// Über eine temporäre Datei, damit ein Absturz beim Schreiben nie eine halbe triggers.json hinterlässt
async function writeTriggerFile(file: string, list: Trigger[]) {
  const partial = `${file}.tmp`;
  await writeFile(partial, JSON.stringify({ triggers: list }, null, 2) + "\n");
  await rename(partial, file);
}

// Abklingzeiten für alle (name) und pro Zuschauer (name:login); ready merkt sich den Zeitpunkt, wenn es auslöst
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

// Treffer prüfen und auslösen. active: gehört der Trigger noch zur aktuellen Liste (nach einer Regex-Prüfung im Worker)
function createMatching(fire: (event: FxEvent) => void, active: (trigger: Loaded) => boolean) {
  const ready = createCooldowns();
  let nextId = 1;
  // Zu langsame Regex-Trigger bleiben bis zum nächsten Speichern oder Laden abgeschaltet
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
        // Eigene Regex des Streamers nur im Worker mit Zeitlimit, die festen Muster sind sicher
        if (trigger.when.type === "regex") void matchRegex(trigger, line, now);
        else if (trigger.regex.test(line.text)) accept(trigger, line, now);
      }
    },
  };
}

// Trigger eines Streamers. folder: Profil-Ordner, fire: Effekt an die Overlays. stop() beendet das Nachladen.
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
      // Fehlerhafte Regeln überspringen, damit eine Tippfehler-Regel nicht alle anderen abschaltet
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
    // Regeln so, wie sie in der Datei stehen (für den Editor im Browser)
    config: () => ({ triggers: raw }),
    // Vom Editor: erst prüfen, nur fehlerfreie Listen schreiben
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
    // Zum Testen aus dem Dashboard, ohne Abklingzeit
    fire(name: string) {
      const trigger = triggers.find(candidate => candidate.name === name);
      if (trigger) matching.run(trigger, "Test", trigger.when.match);
      return Boolean(trigger);
    },
    stop: () => clearInterval(reloadTimer),
  };
}
