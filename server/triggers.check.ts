// Ausführen: npm run check
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { allowed, compile, schedule, startTriggers, toRegex, type Trigger } from "./triggers.ts";

const word = toRegex({ type: "word", match: "LIZARD" });
assert.ok(word.test("LIZARD"));
assert.ok(word.test("lol lizard!"));
assert.ok(word.test("🦎LIZARD🦎"));
assert.ok(!word.test("LIZARDS"));
assert.ok(!word.test("bigLIZARD"));

assert.ok(toRegex({ type: "command", match: "!lizard" }).test("!lizard bitte"));
assert.ok(!toRegex({ type: "command", match: "!lizard" }).test("sag !lizard"));
assert.ok(toRegex({ type: "exact", match: "gg" }).test(" GG "));
assert.ok(!toRegex({ type: "exact", match: "gg" }).test("gg wp"));
assert.ok(!toRegex({ type: "word", match: "LIZARD", caseSensitive: true }).test("lizard"));
// Sonderzeichen im match werden wörtlich genommen
assert.ok(toRegex({ type: "contains", match: "a+b" }).test("xa+by"));
assert.ok(toRegex({ type: "regex", match: "^l+i+z+" }).test("llllizzz"));

const withWho = (who?: string[]): Trigger => ({ name: "x", when: { type: "word", match: "x" }, who, do: [] });
assert.ok(allowed(withWho(), []));
assert.ok(!allowed(withWho(["subscriber"]), []));
assert.ok(allowed(withWho(["subscriber"]), ["subscriber"]));
assert.ok(allowed(withWho(["subscriber"]), ["moderator"]));
assert.ok(!allowed(withWho(["moderator"]), ["vip"]));
assert.ok(allowed(withWho(["moderator"]), ["broadcaster"]));

// Ablauf: Aktion erscheint zu Beginn von delay; die nächste kommt nach delay + duration + after
assert.deepEqual(schedule([{ type: "media" }]), [0]);
assert.deepEqual(schedule([
  { type: "media", delay: 1, duration: 3, after: 2 }, // erscheint bei 0, spielt 1 bis 4 s, steht bis 6 s
  { type: "text", duration: 2 },                       // erscheint bei 6 s
  { type: "text", together: true, delay: 0.5 },        // erscheint mit der vorherigen, läuft bis 6 + 0,5 + 4
  { type: "media", duration: 1 },                      // nach dem längeren der beiden: 10,5 s
]), [0, 6000, 6000, 10500]);

// Prüfung für den Editor: fehlerhafte Regeln melden, gültige trotzdem übernehmen
const good: Trigger = { name: "a", when: { type: "word", match: "x" }, do: [{ type: "media", image: "a.gif" }] };
assert.deepEqual(compile([good]).errors, []);
const bad = compile([
  good,
  { ...good },                                                      // doppelter Name
  { ...good, name: "b", when: { type: "regex", match: "(" } },      // kaputter Ausdruck
  { ...good, name: "c", do: [{ type: "media" }] },                  // Medium fehlt
  { ...good, name: "d", do: [] },                                   // keine Aktion
  { ...good, name: "e", description: "x".repeat(201) },             // Beschreibung zu lang
  { ...good, name: "f", who: "moderator" as unknown as string[] },  // who keine Liste: würde handle() abstürzen lassen
  { ...good, name: "g", who: [1] as unknown as string[] },          // who mit Nicht-Text
]);
assert.equal(bad.triggers.length, 1);
assert.equal(bad.errors.length, 7);
// Öffentlich und Beschreibung (für die Befehlsseite) sind erlaubt
assert.deepEqual(compile([{ ...good, public: false, description: "Echse" }]).errors, []);
assert.match(bad.errors[0], /doppelt/);

// Regex-Trigger laufen im Worker: ein normales Muster löst aus, ein katastrophales blockiert den Server nicht
// und wird abgeschaltet
const folder = await mkdtemp(join(tmpdir(), "triggers-"));
const fired: string[] = [];
const runtime = startTriggers(folder, event => fired.push(event.action.text ?? ""));
const text = (name: string, match: string): Trigger => ({ name, when: { type: "regex", match }, do: [{ type: "text", text: name, duration: 0 }] });
assert.deepEqual(await runtime.save([text("lizard", "^l+i+z+"), text("evil", "^(a+)+$")]), []);
const line = (value: string) => ({ user: "Neo", login: "neo", text: value, roles: [] });
runtime.handle(line("LLLizzz"));
const started = Date.now();
runtime.handle(line("a".repeat(40) + "!"));
assert.ok(Date.now() - started < 100, "handle() wartet nicht auf den Worker");
await new Promise(resolve => setTimeout(resolve, 300));
assert.deepEqual(fired, ["lizard"]);
// Abgeschaltet: auch ein passender Text löst nicht mehr aus und startet keine Prüfung
runtime.handle(line("aaa"));
await new Promise(resolve => setTimeout(resolve, 100));
assert.deepEqual(fired, ["lizard"]);
runtime.stop();
await rm(folder, { recursive: true, force: true });

console.log("triggers ok");
