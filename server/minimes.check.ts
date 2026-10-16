// Check für minimes.ts (Server): Datei einlesen, Chatzeilen übersetzen und die Laufzeit mit falscher Uhr und
// falschen Timern. Läuft mit npm test (einzeln: node server/minimes.check.ts).
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readMinimeOptions } from "../src/core/minimeFields.ts";
import type { ServerMessage } from "../src/core/types.ts";
import type { ChatLine } from "./chat.ts";
import { parseMinimeFile, startMinimes, toMinimeEvent, type MinimeTimers } from "./minimes.ts";

const RULES = readMinimeOptions({}).rules;
const line = (text: string, login = "neo", roles: string[] = []): ChatLine => ({ user: login.toUpperCase(), login, text, roles, color: "#ff0000" });

// Datei: kaputte oder fremde Inhalte ergeben einen leeren Zustand, nur gültige Einträge bleiben
assert.deepEqual(parseMinimeFile(null), { roster: [], colors: {} });
assert.deepEqual(parseMinimeFile("x"), { roster: [], colors: {} });
assert.deepEqual(parseMinimeFile({
  roster: [
    { login: "../a", user: "A", color: null, lastSeen: 1 },
    { login: "b", user: "B", color: "red", lastSeen: 1 },
    { login: "c", user: "C", color: "#00ff00", lastSeen: "jetzt" },
    { login: "neo", user: "Neo", color: "#ff00aa", lastSeen: 5 },
    { login: "neo", user: "Neo", color: null, lastSeen: 6 },
    { login: "trinity", user: "Trinity", color: null, lastSeen: 7 },
  ],
  colors: { neo: { color: "#ff00aa", usedAt: 5, changedAt: 4 }, "x y": { color: "#ffffff", usedAt: 1, changedAt: 1 }, b: { color: "#fff", usedAt: 1, changedAt: 1 } },
}), {
  roster: [{ login: "neo", user: "Neo", color: "#ff00aa", lastSeen: 5 }, { login: "trinity", user: "Trinity", color: null, lastSeen: 7 }],
  colors: { neo: { color: "#ff00aa", usedAt: 5, changedAt: 4 } },
});

// Chatzeilen: Befehle werden zu Ereignissen, alles andere zählt als Chat
assert.deepEqual(toMinimeEvent(line("!join #f0a"), RULES), { type: "join", login: "neo", user: "NEO", color: "#ff00aa", twitchColor: "#ff0000" });
assert.deepEqual(toMinimeEvent(line("!color 0 255 0"), RULES), { type: "color", login: "neo", user: "NEO", color: "#00ff00", twitchColor: "#ff0000" });
assert.deepEqual(toMinimeEvent(line("!leave"), RULES), { type: "leave", login: "neo" });
assert.deepEqual(toMinimeEvent(line("!leave @trinity", "mod", ["moderator"]), RULES), { type: "kick", login: "trinity" });
assert.deepEqual(toMinimeEvent(line("hallo"), RULES), { type: "chat", login: "neo" });
assert.deepEqual(toMinimeEvent(line("!color lila"), RULES), { type: "chat", login: "neo" });

// Laufzeit: Timer werden von Hand ausgelöst, die Uhr steht, bis der Check sie weiterdreht
function fakeTimers() {
  let next = 0;
  const pending = new Map<number, { run: () => void; every: boolean }>();
  const timers: MinimeTimers = {
    setTimeout: run => { pending.set(++next, { run, every: false }); return next; },
    clearTimeout: id => { pending.delete(id as number); },
    setInterval: run => { pending.set(++next, { run, every: true }); return next; },
    clearInterval: id => { pending.delete(id as number); },
  };
  // Alle fälligen Timer einmal laufen lassen (einmalige danach entfernen)
  const fire = () => { for (const [id, timer] of [...pending]) { if (!timer.every) pending.delete(id); timer.run(); } };
  return { timers, fire, count: () => pending.size };
}

const folder = await mkdtemp(join(tmpdir(), "minimes-"));
try {
  const messages: ServerMessage[] = [];
  let now = 1000;
  const clock = fakeTimers();
  const runtime = await startMinimes({ folder, emit: message => messages.push(message), now: () => now, timers: clock.timers, rules: RULES });

  // Einklinken, schreiben, Farbe ändern: Liste und Reaktion gehen an die Overlays
  runtime.handle(line("!join #f0a"));
  runtime.handle(line("hallo"));
  runtime.handle(line("hallo", "smith"));
  assert.deepEqual(messages, [
    { type: "minimes", minimes: [{ login: "neo", user: "NEO", color: "#ff00aa" }] },
    { type: "minimeChat", login: "neo" },
  ]);
  assert.deepEqual(runtime.current(), [{ login: "neo", user: "NEO", color: "#ff00aa" }]);

  // Gebündeltes Speichern: ein Schreib-Timer, der Stand landet in minimes.json
  now = 2000;
  runtime.handle(line("!join", "trinity"));
  clock.fire();
  await new Promise(resolve => setTimeout(resolve, 50));
  const saved = JSON.parse(await readFile(join(folder, "minimes.json"), "utf8")) as { roster: { login: string }[] };
  assert.deepEqual(saved.roster.map(entry => entry.login), ["neo", "trinity"]);

  // Weniger Platz in den Einstellungen kürzt sofort, Ban entfernt, Offline leert
  messages.length = 0;
  runtime.setRules({ ...RULES, max: 1 });
  assert.deepEqual(messages, [{ type: "minimes", minimes: [{ login: "trinity", user: "TRINITY", color: "#ff0000" }] }]);
  runtime.ban("trinity");
  assert.deepEqual(runtime.current(), []);
  runtime.handle(line("!join"));
  runtime.offline();
  assert.deepEqual(runtime.current(), []);

  // Theme ohne Minimes (null): leere Liste, Befehle werden ignoriert, die Datei bleibt erhalten
  runtime.handle(line("!join"));
  messages.length = 0;
  runtime.setRules(null);
  runtime.handle(line("!join", "smith"));
  assert.deepEqual(messages, [{ type: "minimes", minimes: [] }]);
  assert.deepEqual(runtime.current(), []);
  runtime.setRules(RULES);
  assert.deepEqual(runtime.current().map(minime => minime.login), ["neo"]);

  // Aufräumen per Intervall: nach 21 Minuten ohne Nachricht ist neo weg
  now += 21 * 60_000;
  clock.fire();
  assert.deepEqual(runtime.current(), []);

  // stop: keine Timer mehr, letzter Stand gespeichert, neuer Start liest ihn wieder
  runtime.handle(line("!join #00f", "oracle"));
  await runtime.stop();
  assert.equal(clock.count(), 0);
  const again = await startMinimes({ folder, emit: () => {}, now: () => now, timers: fakeTimers().timers, rules: RULES });
  assert.deepEqual(again.current(), [{ login: "oracle", user: "ORACLE", color: "#0000ff" }]);
  await again.stop();

  // Mit echten Timern: Speichern planen und stop räumt alles ab (der Check endet ohne hängende Timer)
  const real = await startMinimes({ folder, emit: () => {}, now: () => now, rules: RULES });
  real.handle(line("!leave", "oracle"));
  await real.stop();
  assert.deepEqual((JSON.parse(await readFile(join(folder, "minimes.json"), "utf8")) as { roster: unknown[] }).roster, []);
} finally {
  await rm(folder, { recursive: true, force: true });
}

console.log("server minimes ok");
