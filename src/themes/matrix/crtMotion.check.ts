// Check for crtMotion.ts: the tube opens after its line and is bright at the end of the switch on, the flash starts with
// the opening; a glitch ends on the whole picture; a line types itself and glitches. A recording timeline stands in for
// GSAP. Runs with npm test.
import assert from "node:assert/strict";
import { effectiveSettings } from "../../core/settings.ts";
import { glitchKeys, powerOn, tubeLookOf, typeIn } from "./crtMotion.ts";
import { type MatrixValues, matrixSettings } from "./settings.ts";

const look = tubeLookOf(effectiveSettings(matrixSettings, {}) as MatrixValues);

const calls: { kind: string; at: number; to?: unknown }[] = [];
const timeline = {
  fromTo: (...args: unknown[]) => { calls.push({ kind: "fromTo", at: args[3] as number, to: args[2] }); return timeline; },
  to: (...args: unknown[]) => { calls.push({ kind: "to", at: args[2] as number }); return timeline; },
};
const tube = {} as Element;
const recorder = timeline as unknown as gsap.core.Timeline;
powerOn(recorder, tube, 0.5, 1, look, tube);
assert.deepEqual(calls.map(call => call.at), [0.5, 0.5 + look.power.line, 1.5, 0.5 + look.power.line]);
calls.length = 0;
powerOn(recorder, tube, 0, 2, look);
assert.equal(calls.length, 3);

const keys = glitchKeys(look);
assert.deepEqual(keys[0], { x: -12, clipPath: "inset(10% 0 60% 0)", filter: "brightness(1.6)" }, "the slices of the settings");
assert.deepEqual(keys.at(-1), { x: 0, clipPath: "inset(0% 0% 0% 0%)", filter: "brightness(1)" });
assert.ok(keys.length > 2);

// Typing: the line types from nothing to its text at its time, glitches as it starts, takes longer at a lower speed and
// never longer than the longest
calls.length = 0;
typeIn(recorder, { textContent: "> hallo" } as Element, 2, 1, look);
assert.deepEqual(calls.map(call => [call.kind, call.at]), [["fromTo", 2], ["to", 2]]);
const typed = calls[0].to as { text: string; duration: number };
assert.equal(typed.text, "> hallo");
assert.ok(Math.abs(typed.duration - 7 * look.typing.perChar) < 1e-9);
calls.length = 0;
typeIn(recorder, { textContent: "x".repeat(500) } as Element, 0, 0.5, look);
assert.equal((calls[0].to as { duration: number }).duration, look.typing.longest);

console.log("matrix crtMotion ok");
