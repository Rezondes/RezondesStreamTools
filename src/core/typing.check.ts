// Check für typing.ts: Einzelbilder beim Tippen und Drehbücher aus Text. Läuft mit npm test.
import assert from "node:assert/strict";
import { frames, parseLine } from "./typing.ts";

const last = (list: { text: string }[]) => list.at(-1)!.text;
const fixed = () => 0.5;

assert.equal(last(frames("hallo", fixed)), "hallo");
assert.equal(frames("hallo", fixed).length, 5);

// Vertippen, löschen, korrigieren
assert.equal(last(frames(["sudo sytsem", { del: 4 }, "stemctl"], fixed)), "sudo systemctl");
// Löschen geht nie unter null
assert.equal(last(frames(["ab", { del: 9 }], fixed)), "");
// Pause ändert den Text nicht
const paused = frames(["x", { pause: 1500 }], fixed);
assert.deepEqual(paused.at(-1), { text: "x", wait: 1500 });
// Auf die Tastatur hauen: genau so viele Zeichen mehr, schnell hintereinander
const smashed = frames(["start ", { smash: 12 }], fixed);
assert.equal(last(smashed).length, 18);
assert.ok(smashed.slice(-12).every(frame => frame.wait < 50));

// Tempo: doppelt so schnell halbiert jede Wartezeit beim Tippen
const normal = frames("abc", fixed), fast = frames("abc", fixed, 2);
assert.deepEqual(fast.map(frame => frame.wait), normal.map(frame => frame.wait / 2));

// Drehbuch aus den Einstellungen: {del n}, {pause ms}, {smash n} zwischen getipptem Text
assert.equal(parseLine("ganz normal"), "ganz normal");
assert.deepEqual(parseLine("sudo sytsem{del 4}stemctl{pause 900}{smash 3}"), ["sudo sytsem", { del: 4 }, "stemctl", { pause: 900 }, { smash: 3 }]);
// Unbekannte Klammern bleiben Text
assert.equal(parseLine("echo {user} {del x}"), "echo {user} {del x}");

console.log("typing ok");
