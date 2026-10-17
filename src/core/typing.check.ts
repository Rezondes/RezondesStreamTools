// Check for typing.ts: frames while typing and scripts from text. Runs with npm test.
import assert from "node:assert/strict";
import { frames, parseLine } from "./typing.ts";

const last = (list: { text: string }[]) => list.at(-1)!.text;
const fixed = () => 0.5;

assert.equal(last(frames("hallo", fixed)), "hallo");
assert.equal(frames("hallo", fixed).length, 5);

// Typo, delete, correct
assert.equal(last(frames(["sudo sytsem", { del: 4 }, "stemctl"], fixed)), "sudo systemctl");
// Deleting never goes below zero
assert.equal(last(frames(["ab", { del: 9 }], fixed)), "");
// A pause does not change the text
const paused = frames(["x", { pause: 1500 }], fixed);
assert.deepEqual(paused.at(-1), { text: "x", wait: 1500 });
// Smashing the keyboard: exactly that many more characters, quickly one after another
const smashed = frames(["start ", { smash: 12 }], fixed);
assert.equal(last(smashed).length, 18);
assert.ok(smashed.slice(-12).every(frame => frame.wait < 50));

// Speed: twice as fast halves every wait while typing
const normal = frames("abc", fixed), fast = frames("abc", fixed, 2);
assert.deepEqual(fast.map(frame => frame.wait), normal.map(frame => frame.wait / 2));

// Script from the settings: {del n}, {pause ms}, {smash n} between typed text
assert.equal(parseLine("quite normal"), "quite normal");
assert.deepEqual(parseLine("sudo sytsem{del 4}stemctl{pause 900}{smash 3}"), ["sudo sytsem", { del: 4 }, "stemctl", { pause: 900 }, { smash: 3 }]);
// Unknown braces stay text
assert.equal(parseLine("echo {user} {del x}"), "echo {user} {del x}");

console.log("typing ok");
