// Chat-Trigger: Regeln aus triggers.json im Profil-Ordner des Streamers. Wann (when), wer (who), wie oft (cooldown),
// was und wo (do: Aktionen mit zone). Die Datei wird alle 2 s auf Änderungen geprüft, kein Neustart nötig.
import { readFile, rename, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { FxAction, FxEvent } from "../src/core/types.ts";
import type { ChatLine } from "./chat.ts";

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
  when: When;
  // everyone, subscriber, vip, moderator, broadcaster (eine Rolle reicht)
  who?: string[];
  cooldown?: number; // Sekunden, für alle
  userCooldown?: number; // Sekunden, pro Zuschauer
  do: FxAction[];
};

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function toRegex(when: When): RegExp {
  const flags = when.caseSensitive ? "u" : "iu";
  const m = escape(when.match);
  switch (when.type) {
    // Wortgrenze: davor und danach kein Buchstabe und keine Ziffer, "LIZARD!" zählt also
    case "word": return new RegExp(`(?<![\\p{L}\\p{N}_])${m}(?![\\p{L}\\p{N}_])`, flags);
    case "contains": return new RegExp(m, flags);
    case "exact": return new RegExp(`^\\s*${m}\\s*$`, flags);
    case "command": return new RegExp(`^${m}(?=\\s|$)`, flags);
    case "regex": return new RegExp(when.match, flags);
  }
}

export function allowed(t: Trigger, roles: string[]) {
  const who = t.who ?? ["everyone"];
  // Der Streamer darf immer, Mods dürfen alles, was Subs/VIPs dürfen
  return who.includes("everyone") || roles.includes("broadcaster") || who.some(w => roles.includes(w))
    || (roles.includes("moderator") && who.some(w => w === "subscriber" || w === "vip"));
}

// Startzeit jeder Aktion in ms. Aktionen laufen nacheinander: die nächste beginnt erst nach
// delay + duration + after der vorherigen. together: erscheint gleichzeitig mit der vorherigen.
// Die Aktion wird schon zu Beginn von delay geschickt: das Overlay zeigt sie dann angehalten
// (delay), spielt sie ab (duration) und lässt sie angehalten stehen (after).
export function schedule(actions: FxAction[]): number[] {
  let next = 0; // frühester Start für die nächste Aktion in der Abfolge
  let prevStart = 0;
  return actions.map(a => {
    const start = a.together ? prevStart : next;
    next = Math.max(next, start + ((a.delay ?? 0) + (a.duration ?? 4) + (a.after ?? 0)) * 1000);
    prevStart = start;
    return start;
  });
}

type Loaded = Trigger & { regex: RegExp };

const WHEN_TYPES = ["word", "contains", "exact", "command", "regex"];

// Prüft Regeln und baut die Suchmuster. Fehlerhafte Regeln landen in errors und werden übersprungen.
export function compile(list: Trigger[]): { triggers: Loaded[]; errors: string[] } {
  const errors: string[] = [];
  const names = new Set<string>();
  const triggers = list.flatMap(t => {
    try {
      if (!t.name?.trim()) throw new Error("Name fehlt");
      if (names.has(t.name)) throw new Error("Name doppelt vergeben");
      names.add(t.name);
      if (!WHEN_TYPES.includes(t.when?.type)) throw new Error(`when.type muss ${WHEN_TYPES.join(", ")} sein`);
      if (!t.when.match) throw new Error("Suchtext (when.match) fehlt");
      if (!Array.isArray(t.do) || t.do.length === 0) throw new Error("mindestens eine Aktion nötig");
      t.do.forEach((a, i) => {
        if (a.type !== "media" && a.type !== "text") throw new Error(`Aktion ${i + 1}: type muss media oder text sein`);
        if (a.type === "media" && !a.image && !a.video && !a.sound) throw new Error(`Aktion ${i + 1}: Bild, Video oder Sound fehlt`);
        if (a.type === "text" && !a.text) throw new Error(`Aktion ${i + 1}: Text fehlt`);
      });
      return [{ ...t, regex: toRegex(t.when) }];
    } catch (e) {
      errors.push(`Trigger "${t.name || "?"}": ${(e as Error).message}`);
      return [];
    }
  });
  return { triggers, errors };
}

// Trigger eines Streamers. folder: Profil-Ordner, fire: Effekt an die Overlays. stop() beendet das Nachladen.
export function startTriggers(folder: string, fire: (event: FxEvent) => void) {
  const file = join(folder, "triggers.json");
  let raw: Trigger[] = [];
  let triggers: Loaded[] = [];
  let mtime = 0;
  let nextId = 1;
  const lastFired = new Map<string, number>(); // "name" und "name:login" -> Zeitpunkt

  async function load() {
    const info = await stat(file).catch(() => null);
    if (!info || info.mtimeMs === mtime) return;
    mtime = info.mtimeMs;
    try {
      raw = JSON.parse(await readFile(file, "utf8")).triggers ?? [];
      // Fehlerhafte Regeln überspringen, damit eine Tippfehler-Regel nicht alle anderen abschaltet
      const result = compile(raw);
      triggers = result.triggers;
      result.errors.forEach(e => console.error(e));
      console.log(`Triggers loaded: ${triggers.map(t => t.name).join(", ") || "none"}`);
    } catch (e) {
      console.error(`${file} is not valid JSON, keeping the previous triggers: ${(e as Error).message}`);
    }
  }
  const reload = () => { load().catch((error: unknown) => console.error("Loading triggers failed:", error)); };
  reload();
  const reloadTimer = setInterval(reload, 2000);

  function run(t: Trigger, user: string, message: string) {
    const starts = schedule(t.do);
    t.do.forEach((action, i) => setTimeout(() => fire({ id: nextId++, zone: action.zone ?? "main", action, user, message }), starts[i]));
  }

  return {
    list: () => triggers.map(t => ({ name: t.name, enabled: t.enabled !== false })),

    // Regeln so, wie sie in der Datei stehen (für den Editor im Browser)
    config: () => ({ triggers: raw }),

    // Vom Editor: erst prüfen, nur fehlerfreie Listen schreiben. Über eine temporäre Datei,
    // damit ein Absturz beim Schreiben nie eine halbe triggers.json hinterlässt.
    async save(list: Trigger[]) {
      const result = compile(list);
      if (result.errors.length) return result.errors;
      const tmp = `${file}.tmp`;
      await writeFile(tmp, JSON.stringify({ triggers: list }, null, 2) + "\n");
      await rename(tmp, file);
      raw = list;
      triggers = result.triggers;
      mtime = (await stat(file)).mtimeMs;
      console.log(`Triggers saved: ${triggers.map(t => t.name).join(", ") || "none"}`);
      return [];
    },

    handle(line: ChatLine) {
      const now = Date.now();
      for (const t of triggers) {
        if (t.enabled === false || !t.regex.test(line.text) || !allowed(t, line.roles)) continue;
        const userKey = `${t.name}:${line.login}`;
        if (now - (lastFired.get(t.name) ?? 0) < (t.cooldown ?? 0) * 1000) continue;
        if (now - (lastFired.get(userKey) ?? 0) < (t.userCooldown ?? 0) * 1000) continue;
        lastFired.set(t.name, now);
        lastFired.set(userKey, now);
        console.log(`Trigger ${t.name} fired by ${line.user}`);
        run(t, line.user, line.text);
      }
    },

    // Zum Testen von der Übersicht aus, ohne Abklingzeit
    fire(name: string) {
      const t = triggers.find(t => t.name === name);
      if (t) run(t, "Test", t.when.match);
      return Boolean(t);
    },

    stop: () => clearInterval(reloadTimer),
  };
}
export type TriggerStore = ReturnType<typeof startTriggers>;
