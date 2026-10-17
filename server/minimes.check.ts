// Check for minimes.ts (server): read the file, translate chat lines and the runtime with a fake clock and
// fake timers. Runs with npm test (alone: node server/minimes.check.ts).
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

// File: broken or foreign content gives an empty state, only valid entries stay
assert.deepEqual(parseMinimeFile(null), { roster: [], colors: {}, variants: {} });
assert.deepEqual(parseMinimeFile("x"), { roster: [], colors: {}, variants: {} });
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
  roster: [{ login: "neo", user: "Neo", color: "#ff00aa", variant: null, lastSeen: 5 }, { login: "trinity", user: "Trinity", color: null, variant: null, lastSeen: 7 }],
  colors: { neo: { color: "#ff00aa", usedAt: 5, changedAt: 4 } },
  variants: {},
});

// File with variants: valid ones stay, invalid ids become null or drop out
assert.deepEqual(parseMinimeFile({
  roster: [{ login: "neo", user: "Neo", color: null, variant: "mango", lastSeen: 1 }, { login: "smith", user: "Smith", color: null, variant: "../x", lastSeen: 1 }],
  variants: { neo: { variant: "mango", usedAt: 1, changedAt: 1 }, smith: { variant: "../x", usedAt: 1, changedAt: 1 } },
}), {
  roster: [{ login: "neo", user: "Neo", color: null, variant: "mango", lastSeen: 1 }, { login: "smith", user: "Smith", color: null, variant: null, lastSeen: 1 }],
  colors: {},
  variants: { neo: { variant: "mango", usedAt: 1, changedAt: 1 } },
});

// Chat lines: commands become events, everything else counts as chat
assert.deepEqual(toMinimeEvent(line("!join #f0a"), RULES), { type: "join", login: "neo", user: "NEO", color: "#ff00aa", variant: null, twitchColor: "#ff0000" });
assert.deepEqual(toMinimeEvent(line("!color 0 255 0"), RULES), { type: "color", login: "neo", user: "NEO", color: "#00ff00", twitchColor: "#ff0000" });
assert.deepEqual(toMinimeEvent(line("!leave"), RULES), { type: "leave", login: "neo" });
assert.deepEqual(toMinimeEvent(line("!leave @trinity", "mod", ["moderator"]), RULES), { type: "kick", login: "trinity" });
assert.deepEqual(toMinimeEvent(line("hello"), RULES), { type: "chat", login: "neo" });
assert.deepEqual(toMinimeEvent(line("!color lila"), RULES), { type: "chat", login: "neo" });

// Runtime: timers are fired by hand, the clock stands still until the check moves it on
function fakeTimers() {
  let next = 0;
  const pending = new Map<number, { run: () => void; every: boolean }>();
  const timers: MinimeTimers = {
    setTimeout: run => { pending.set(++next, { run, every: false }); return next; },
    clearTimeout: id => { pending.delete(id as number); },
    setInterval: run => { pending.set(++next, { run, every: true }); return next; },
    clearInterval: id => { pending.delete(id as number); },
  };
  // Run all due timers once (remove one-shot timers afterwards)
  const fire = () => { for (const [id, timer] of [...pending]) { if (!timer.every) pending.delete(id); timer.run(); } };
  return { timers, fire, count: () => pending.size };
}

const folder = await mkdtemp(join(tmpdir(), "minimes-"));
try {
  const messages: ServerMessage[] = [];
  let now = 1000;
  const clock = fakeTimers();
  const runtime = await startMinimes({ folder, emit: message => messages.push(message), now: () => now, timers: clock.timers, rules: RULES });

  // Join, write, change color: list and reaction go to the overlays
  runtime.handle(line("!join #f0a"));
  runtime.handle(line("hello"));
  runtime.handle(line("hello", "smith"));
  assert.deepEqual(messages, [
    { type: "minimes", minimes: [{ login: "neo", user: "NEO", color: "#ff00aa", variant: null }] },
    { type: "minimeChat", login: "neo" },
  ]);
  assert.deepEqual(runtime.current(), [{ login: "neo", user: "NEO", color: "#ff00aa", variant: null }]);

  // Batched saving: one write timer, the state lands in minimes.json
  now = 2000;
  runtime.handle(line("!join", "trinity"));
  clock.fire();
  await new Promise(resolve => setTimeout(resolve, 50));
  const saved = JSON.parse(await readFile(join(folder, "minimes.json"), "utf8")) as { roster: { login: string }[] };
  assert.deepEqual(saved.roster.map(entry => entry.login), ["neo", "trinity"]);

  // Less room in the settings shortens immediately, a ban removes, offline clears
  messages.length = 0;
  runtime.setRules({ ...RULES, max: 1 });
  assert.deepEqual(messages, [{ type: "minimes", minimes: [{ login: "trinity", user: "TRINITY", color: "#ff0000", variant: null }] }]);
  runtime.ban("trinity");
  assert.deepEqual(runtime.current(), []);
  runtime.handle(line("!join"));
  runtime.offline();
  assert.deepEqual(runtime.current(), []);

  // Theme without minimes (null): empty list, commands are ignored, the file is kept
  runtime.handle(line("!join"));
  messages.length = 0;
  runtime.setRules(null);
  runtime.handle(line("!join", "smith"));
  assert.deepEqual(messages, [{ type: "minimes", minimes: [] }]);
  assert.deepEqual(runtime.current(), []);
  runtime.setRules(RULES);
  assert.deepEqual(runtime.current().map(minime => minime.login), ["neo"]);

  // Cleanup by interval: after 21 minutes without a message neo is gone
  now += 21 * 60_000;
  clock.fire();
  assert.deepEqual(runtime.current(), []);

  // stop: no timers anymore, last state saved, a new start reads it again
  runtime.handle(line("!join #00f", "oracle"));
  await runtime.stop();
  assert.equal(clock.count(), 0);
  const again = await startMinimes({ folder, emit: () => {}, now: () => now, timers: fakeTimers().timers, rules: RULES });
  assert.deepEqual(again.current(), [{ login: "oracle", user: "ORACLE", color: "#0000ff", variant: null }]);
  await again.stop();

  // With real timers: schedule a save and stop cleans up everything (the check ends without hanging timers)
  const real = await startMinimes({ folder, emit: () => {}, now: () => now, rules: RULES });
  real.handle(line("!leave", "oracle"));
  await real.stop();
  assert.deepEqual((JSON.parse(await readFile(join(folder, "minimes.json"), "utf8")) as { roster: unknown[] }).roster, []);
} finally {
  await rm(folder, { recursive: true, force: true });
}

// Variant mode: !join without a choice gives a random allowed variant, !frucht switches; the list carries the variant
{
  const typed = await mkdtemp(join(tmpdir(), "minimes-types-"));
  try {
    const types = { ...RULES, commands: { ...RULES.commands, look: "!frucht" }, variants: [{ id: "mango", names: ["mango"] }, { id: "sternfrucht", names: ["sternfrucht", "karambole"] }] };
    const sent: ServerMessage[] = [];
    const runtime = await startMinimes({ folder: typed, emit: message => sent.push(message), now: () => 1000, timers: fakeTimers().timers, rules: types, random: () => 0 });
    runtime.handle(line("!join"));
    runtime.handle(line("!frucht karambole"));
    assert.deepEqual(sent, [
      { type: "minimes", minimes: [{ login: "neo", user: "NEO", color: null, variant: "mango" }] },
      { type: "minimes", minimes: [{ login: "neo", user: "NEO", color: null, variant: "sternfrucht" }] },
    ]);
    assert.deepEqual(toMinimeEvent(line("!frucht mango"), types), { type: "variant", login: "neo", user: "NEO", variant: "mango" });
    await runtime.stop();
  } finally {
    await rm(typed, { recursive: true, force: true });
  }
}

console.log("server minimes ok");
