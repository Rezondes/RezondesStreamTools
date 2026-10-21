// Check for boneMotion.ts: every move begins and ends in the rest pose (landing ends in it), the angles stay in the
// bounds, and the Starting bear waddles in, lands and waves. Runs with npm test.
import assert from "node:assert/strict";
import {
  blinkAt, BONE_LIMITS, breathAt, ENTER, LAND_LENGTH, landAt, REST_BODY, startingMotion, swayAt, SWAY_LOOP_SECONDS, waddleAt, waddleLength, waveAt, waveLoop,
  type BodyFrame, type StartingMotion,
} from "./boneMotion.ts";

const near = (actual: number, expected: number, label: string) => assert.ok(Math.abs(actual - expected) < 1e-9, `${label}: ${actual}`);
const atRest = (frame: BodyFrame, label: string) => {
  for (const key of Object.keys(REST_BODY) as (keyof BodyFrame)[]) near(frame[key], REST_BODY[key], `${label} ${key}`);
};
const within = (value: number, [low, high]: readonly [number, number], label: string) => assert.ok(value >= low && value <= high, `${label}: ${value}`);

// Ruhepose: waddling, the wave, the sway and the breath begin and end at rest
atRest(waddleAt(0, 6, 7), "waddle start");
atRest(waddleAt(waddleLength(7), 6, 7), "waddle end");
atRest(landAt(LAND_LENGTH, 0.1), "land end");
near(waveAt(0, 1.5), 0, "wave start");
near(waveAt(waveLoop(1.5), 1.5), 0, "wave loop");
near(swayAt(0, 4), 0, "sway start");
near(swayAt(SWAY_LOOP_SECONDS, 4), 0, "sway loop");
near(breathAt(0, 0.012, 3.6), 1, "breath start");
near(breathAt(3.6, 0.012, 3.6), 1, "breath loop");

// Landing presses the bear flat and wider first
const pressed = landAt(0.12, 0.1);
assert.ok(pressed.scaleY < 1 && pressed.scaleX > 1);

// The bounds hold even for settings at their maximum
for (let time = 0; time < 3; time += 0.01) {
  within(waddleAt(time, 20, 7).rotate, BONE_LIMITS.body, "waddle");
  within(landAt(time, 0.4).scaleY, BONE_LIMITS.scale, "land");
  within(waveAt(time, 3), BONE_LIMITS.arm, "wave");
  within(swayAt(time, 15), BONE_LIMITS.head, "sway");
}

// Blinking: open at the start, shut for a moment before every interval ends, never with 0
assert.equal(blinkAt(0, 2.6), 1);
assert.equal(blinkAt(2.55, 2.6), 0.1);
assert.equal(blinkAt(2.55, 0), 1);

// Starting: hidden before the entry, coming in from the side, at its spot after the walk, waving after the landing
const motion: StartingMotion = { waddleIn: true, waddleAngle: 6, landSquash: 0.1, waveSpeed: 1, headSway: 4, blinkEvery: 2.6, breathe: false, breathAmount: 0.012, breathSeconds: 3.6 };
assert.equal(startingMotion(0.5, motion, -1).visible, false);
assert.ok(startingMotion(1, motion, -1).body.x < 0 && startingMotion(1, motion, 1).body.x > 0);
near(startingMotion(ENTER.land, motion, -1).body.x, 0, "at its spot");
assert.equal(startingMotion(ENTER.wave - 0.1, motion, -1).arm, 0);
assert.ok(startingMotion(ENTER.wave + waveLoop(1) / 2, motion, -1).arm < 0);
// Without the entry the bear stands from the start and waves
const standing = startingMotion(0.2, { ...motion, waddleIn: false }, -1);
assert.ok(standing.visible && standing.body.x === 0 && standing.arm < 0);

console.log("boneMotion ok");
