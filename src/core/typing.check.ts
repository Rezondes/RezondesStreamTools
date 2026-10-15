// Ausführen: npm run check
import assert from "node:assert/strict";
import { frames } from "./typing.ts";

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

console.log("typing ok");
