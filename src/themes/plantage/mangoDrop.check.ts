// Check for mangoDrop.ts of the Plantage theme: the mango lands at the set time, squashes to the set share and returns to
// its shape without a jump; it rolls away when the alert leaves; the text keeps its gap to the medallion. Runs with
// npm test.
import assert from "node:assert/strict";
import { alertLayout, mangoDrop, mangoRoll, MIN_GAP } from "./mangoDrop.ts";

const OPTIONS = { land: 0.62, squash: 0.28, height: 430 };
const close = (first: number, second: number, room = 1e-9) => Math.abs(first - second) < room;

// Aufprall: above before the landing, on the medallion from the landing on, squashed to the set share right after it
assert.equal(mangoDrop(0, OPTIONS).y, -430);
assert.ok(mangoDrop(0.3, OPTIONS).y < 0 && mangoDrop(0.3, OPTIONS).y > -430);
assert.equal(mangoDrop(0.62, OPTIONS).y, 0);
assert.equal(mangoDrop(3, OPTIONS).y, 0);
const pressed = mangoDrop(0.62 + 0.08, OPTIONS);
assert.ok(close(pressed.scaleX, 1.28) && close(pressed.scaleY, 0.72), "squashed to the set share");
const steps = 600;
let flattest = 1;
for (let step = 1; step <= steps; step++) {
  const [before, now] = [mangoDrop(((step - 1) / steps) * 2.5, OPTIONS), mangoDrop((step / steps) * 2.5, OPTIONS)];
  assert.ok(Math.abs(now.scaleY - before.scaleY) < 0.13, `no jump in shape at ${step}`);
  assert.ok(Math.abs(now.y - before.y) < 40, `no jump in place at ${step}`);
  flattest = Math.min(flattest, now.scaleY);
}
assert.ok(close(flattest, 0.72, 1e-6), "never flatter than the set squash");
assert.deepEqual(mangoDrop(2.5, OPTIONS), { y: 0, rotation: 0, scaleX: 1, scaleY: 1 }, "round again at the end");
assert.deepEqual(mangoDrop(1.1, OPTIONS), mangoDrop(1.1, OPTIONS));

// Rolling away
assert.deepEqual(mangoRoll(0), { x: 0, y: 0, rotation: 0 });
assert.ok(mangoRoll(0.8).y > 900 && mangoRoll(2).x === mangoRoll(0.8).x);

// Abstand: the text starts the set gap right of the outer ring, never closer than the minimum
const layout = alertLayout({ medal: 260, ring: 16, overlap: 10, gap: 48 });
assert.equal(layout.textStart - (260 + 16), 48);
assert.equal(layout.cardLeft + layout.textPadding, layout.textStart);
assert.equal(alertLayout({ medal: 260, ring: 16, overlap: 10, gap: 5 }).textStart - 276, MIN_GAP);

console.log("plantage mangoDrop ok");
