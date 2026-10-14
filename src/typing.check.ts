// Ausführen: npm run check
import assert from "node:assert/strict";
import { frames } from "./typing.ts";

const last = (f: { text: string }[]) => f.at(-1)!.text;
const fixed = () => 0.5;

assert.equal(last(frames("hallo", fixed)), "hallo");
assert.equal(frames("hallo", fixed).length, 5);

// Vertippen, löschen, korrigieren
assert.equal(last(frames(["sudo sytsem", { del: 4 }, "stemctl"], fixed)), "sudo systemctl");
// Löschen geht nie unter null
assert.equal(last(frames(["ab", { del: 9 }], fixed)), "");
// Pause ändert den Text nicht
const p = frames(["x", { pause: 1500 }], fixed);
assert.deepEqual(p.at(-1), { text: "x", wait: 1500 });
// Auf die Tastatur hauen: genau so viele Zeichen mehr, schnell hintereinander
const s = frames(["start ", { smash: 12 }], fixed);
assert.equal(last(s).length, 18);
assert.ok(s.slice(-12).every(f => f.wait < 50));

console.log("typing ok");
