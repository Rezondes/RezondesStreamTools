// Check for dogtag.ts: a closed outline with a hole inside, stamped lines with filled placeholders, the alert steps in
// order and the pendulum that drops in, settles and is pulled away. Runs with npm test.
import assert from "node:assert/strict";
import { alertLayout, alertSteps, DOGTAG, dogtagLines, dogtagShape, elasticOut, swingAt } from "./dogtag.ts";

// Outline and hole
const { outline, hole } = dogtagShape();
assert.deepEqual(outline.at(-1), outline[0], "closed");
assert.ok(outline.every(([x, y]) => Math.abs(x) <= DOGTAG.width / 2 + 1e-9 && Math.abs(y) <= DOGTAG.height / 2 + 1e-9), "inside the size");
assert.ok(Math.max(...outline.map(([x]) => x)) > DOGTAG.width / 2 - 1e-6, "reaches the side");
assert.ok(hole.every(([x, y]) => Math.hypot(x, y - DOGTAG.holeY) <= DOGTAG.holeRadius + 1e-9), "hole is round");
assert.ok(DOGTAG.holeY + DOGTAG.holeRadius < DOGTAG.height / 2, "hole inside the tag");

// Stamped lines: placeholders filled, upper case, empty ones left out
assert.deepEqual(
  dogtagLines(["{channel}", "{user}", "{amount}", "", "O pos"], { channel: "Rezondes", user: "Trinity", amount: "" }),
  ["REZONDES", "TRINITY", "O POS"],
);

// Steps in order: drop, radio open, static, head line, name, line
const steps = alertSteps(450, 500);
assert.ok(steps.drop.start < steps.radio.start && steps.radio.start < steps.noise.start && steps.noise.start < steps.tag.start);
assert.ok(steps.tag.start < steps.name.start && steps.name.start < steps.line.start);
assert.ok(Math.abs(steps.tag.start - (0.55 + 0.45 + 0.5)) < 1e-9, "the call comes after open and static");

// Elastic curve keeps its ends and overshoots
assert.equal(elasticOut(0), 0);
assert.equal(elasticOut(1), 1);
assert.ok(Array.from({ length: 50 }, (_, index) => elasticOut(index / 50)).some(value => value > 1));

// Pendulum: above the picture at the start, hanging and settled later, pulled up when leaving
assert.equal(swingAt(0, steps, 1, null, 350).drop, 0);
const settled = swingAt(5, steps, 1, null, 350);
assert.equal(settled.drop, 1);
assert.ok(Math.abs(settled.angle) < 0.01, "settled");
assert.ok(Math.abs(swingAt(0.8, steps, 1, null, 350).angle) > 0.1, "swings");
assert.equal(Math.abs(swingAt(0.8, steps, 0, null, 350).angle), 0, "no swing");
const pulled = swingAt(5, steps, 1, 1, 350);
assert.equal(pulled.drop, 0, "pulled away");
assert.ok(pulled.angle < 0);

// Layout: centered pair around the middle, left and right at the edges, the scale grows the gap
const middle = alertLayout("center", 80, 760, 1);
assert.ok(Math.abs((middle.tag.x - 75 + middle.radio.left + 760) / 2 - 960) < 1e-9, "centered");
assert.equal(middle.radio.top, 80);
assert.equal(alertLayout("left", 80, 760, 1).tag.x, 72 + 75);
assert.equal(alertLayout("right", 80, 760, 1).radio.left + 760, 1920 - 72);
const big = alertLayout("left", 80, 760, 2);
assert.equal(big.radio.left - big.tag.x, 2 * (middle.radio.left - middle.tag.x));
assert.ok(big.tag.y > middle.tag.y, "a bigger tag hangs lower");

console.log("koth dogtag ok");
