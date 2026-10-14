// Ausführen: npm run check
import assert from "node:assert/strict";
import { allowed, compile, schedule, toRegex, type Trigger } from "./triggers.ts";

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

const t = (who?: string[]): Trigger => ({ name: "x", when: { type: "word", match: "x" }, who, do: [] });
assert.ok(allowed(t(), []));
assert.ok(!allowed(t(["subscriber"]), []));
assert.ok(allowed(t(["subscriber"]), ["subscriber"]));
assert.ok(allowed(t(["subscriber"]), ["moderator"]));
assert.ok(!allowed(t(["moderator"]), ["vip"]));
assert.ok(allowed(t(["moderator"]), ["broadcaster"]));

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
]);
assert.equal(bad.triggers.length, 1);
assert.equal(bad.errors.length, 4);
assert.match(bad.errors[0], /doppelt/);

console.log("triggers ok");
