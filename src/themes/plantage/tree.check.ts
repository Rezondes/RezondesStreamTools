// Check for tree.ts of the Plantage theme: air perspective mixes every tone with the sky by the haze, only clear trees
// carry mangos, the crown has three tones, the sway is a pure function of the time. Runs with npm test.
import assert from "node:assert/strict";
import { mixHex } from "../../core/color.ts";
import { MANGO_HAZE, swayAt, tree } from "./tree.ts";

const COLORS = { sky: "#ffd7a8", trunk: "#6d4c2f", trunkDark: "#553820", leafDark: "#1d5e27", leaf: "#2f8f3a", leafLight: "#58b84a", mango: "#ffb02e", mangoBlush: "#ff7a35", gloss: "#fff1b8", shadow: "#3a220f" };

// Luftperspektive: every color of a hazy tree is the mix of its own color with the sky
const clear = tree(1, 0, COLORS);
const hazy = tree(0.4, 0.55, COLORS);
for (const tone of ["leafDark", "leaf", "leafLight", "trunk"] as const) {
  assert.ok(clear.some(shape => shape.color === COLORS[tone]), `${tone} clear`);
  assert.ok(hazy.some(shape => shape.color === mixHex(COLORS[tone], COLORS.sky, 0.55)), `${tone} hazy`);
  assert.ok(!hazy.some(shape => shape.color === COLORS[tone]), `${tone} not pure in the haze`);
}
assert.ok(clear.some(shape => shape.color === COLORS.mango), "clear trees carry mangos");
assert.ok(!tree(1, 0, COLORS, false).some(shape => shape.color === COLORS.mango), "mangos switched off");
assert.ok(!tree(1, MANGO_HAZE, COLORS).some(shape => shape.color === mixHex(COLORS.mango, COLORS.sky, MANGO_HAZE)), "no mangos in the haze");
assert.equal(tree(1, 1, COLORS).find(shape => shape.kind === "ellipse")?.alpha, 0, "no shadow in full haze");

// Size scales every shape
const big = tree(2, 0, COLORS).find(shape => shape.kind === "circle");
const small = clear.find(shape => shape.kind === "circle");
assert.ok(big?.kind === "circle" && small?.kind === "circle" && big.r === small.r * 2);

// Sway from the time
assert.equal(swayAt(3, 1, 1), swayAt(3, 1, 1));
assert.equal(Math.abs(swayAt(3, 1, 0)), 0);
assert.ok(Math.abs(swayAt(3, 1, 1)) <= 0.02);
assert.ok(Math.abs(swayAt(3, 1, 1, "grass")) <= 0.08 && swayAt(3, 1, 1, "grass") !== swayAt(3, 1, 1));

console.log("plantage tree ok");
