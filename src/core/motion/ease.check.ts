// Check for ease.ts: every named curve is a valid CustomEase path from 0,0 to 1,1 with a unique name, and easeAt
// evaluates the curves like GSAP. Runs with npm test.
import assert from "node:assert/strict";
import { EASE_CHOICES, EASE_NAMES, EASES, easeAt, type EaseChoice } from "./ease.ts";

assert.equal(new Set(EASE_NAMES).size, EASE_NAMES.length);
for (const name of EASE_NAMES) {
  const path = EASES[name];
  assert.ok(path.startsWith("M0,0 C"), `${name}: starts at 0,0 with a curve`);
  assert.ok(path.endsWith(" 1,1"), `${name}: ends at 1,1`);
  // A cubic segment has three points, so all points after M come in threes
  const points = path.slice(path.indexOf("C") + 1).trim().split(/\s+/);
  assert.equal(points.length % 3, 0, `${name}: complete cubic segments`);
  assert.ok(points.every(point => /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(point)), `${name}: x,y pairs`);
}
assert.deepEqual(EASE_NAMES, ["nagel", "federnd", "weich", "stempel"]);

// Curves without GSAP: ends at 0 and 1, linear is the identity, nagel and federnd overshoot, and the values match
// CustomEase (reference numbers taken once from gsap 3.15 CustomEase at 0.1, 0.25, 0.4, 0.5, 0.6, 0.75, 0.9)
assert.deepEqual(EASE_CHOICES, ["linear", "nagel", "federnd", "weich", "stempel"]);
for (const name of EASE_CHOICES) {
  assert.ok(Math.abs(easeAt(name, 0)) < 1e-6, `${name} starts at 0`);
  assert.ok(Math.abs(easeAt(name, 1) - 1) < 1e-6, `${name} ends at 1`);
}
assert.equal(easeAt("linear", 0.3), 0.3);
assert.ok(Math.abs(easeAt("weich", -1)) < 1e-6);
assert.ok(Math.abs(easeAt("weich", 2) - 1) < 1e-6);
const AT = [0.1, 0.25, 0.4, 0.5, 0.6, 0.75, 0.9];
const REFERENCE: Record<string, number[]> = {
  nagel: [0.1775, 0.7846, 1.1152, 1.1, 1.019, 0.9613, 0.9919],
  federnd: [0.104, 0.6, 1.096, 1.2, 1.138, 0.9557, 0.9775],
  weich: [0.0246, 0.1971, 0.5271, 0.7131, 0.8389, 0.9468, 0.9925],
  stempel: [0.9474, 1.0267, 1.0037, 0.9982, 0.997, 0.998, 0.9995],
};
for (const [name, values] of Object.entries(REFERENCE)) {
  values.forEach((value, index) => assert.ok(Math.abs(easeAt(name as EaseChoice, AT[index]) - value) < 0.01, `${name} at ${AT[index]}`));
}
assert.ok(AT.some(x => easeAt("nagel", x) > 1) && AT.some(x => easeAt("federnd", x) > 1), "nagel and federnd overshoot");

console.log("ease ok");
