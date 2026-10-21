// Check for crtMotion.ts: the tube opens after its line and is bright at the end of the switch on, the flash starts with
// the opening; a glitch ends on the whole picture. A recording timeline stands in for GSAP. Runs with npm test.
import assert from "node:assert/strict";
import { glitchKeys, POWER, powerOn } from "./crtMotion.ts";

const calls: { kind: string; at: number }[] = [];
const timeline = {
  fromTo: (...args: unknown[]) => { calls.push({ kind: "fromTo", at: args[3] as number }); return timeline; },
  to: (...args: unknown[]) => { calls.push({ kind: "to", at: args[2] as number }); return timeline; },
};
const tube = {} as Element;
const recorder = timeline as unknown as gsap.core.Timeline;
powerOn(recorder, tube, 0.5, 1, tube);
assert.deepEqual(calls.map(call => call.at), [0.5, 0.5 + POWER.line, 1.5, 0.5 + POWER.line]);
calls.length = 0;
powerOn(recorder, tube, 0, 2);
assert.equal(calls.length, 3);

const keys = glitchKeys();
assert.deepEqual(keys.at(-1), { x: 0, clipPath: "inset(0% 0% 0% 0%)", filter: "brightness(1)" });
assert.ok(keys.length > 2);

console.log("matrix crtMotion ok");
