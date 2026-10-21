// Check for boneMotion.ts: every move begins and ends in the rest pose (landing ends in it), the angles stay in the
// bounds, the props stay at the paw (they turn and lift with the arm), and a screen bear waddles in, lands and plays its
// move. Runs with npm test.
import assert from "node:assert/strict";
import {
  blinkAt, BONE_LIMITS, breathAt, ENTER, flashAt, LAND_LENGTH, landAt, moveAt, REST_BODY, sceneMotion, swayAt, SWAY_LOOP_SECONDS, waddleAt, waddleLength, waveAt,
  waveLoop, type BodyFrame, type Move, type SceneMotion,
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

// Neue Abläufe: every move begins in the rest pose and stays in the bounds
const settings = { waveSpeed: 1, headSway: 4, flashEvery: 4 };
const MOVES: Move[] = ["wave", "cook", "phone", "sign", "selfie", "still"];
for (const move of MOVES) {
  for (const [key, value] of Object.entries(moveAt(move, 0, settings))) near(value, 0, `${move} starts at rest: ${key}`);
  for (let time = 0; time < 8; time += 0.01) {
    const pose = moveAt(move, time, settings);
    within(pose.arm, BONE_LIMITS.arm, `${move} arm`);
    within(pose.head, BONE_LIMITS.head, `${move} head`);
    within(pose.lift, BONE_LIMITS.lift, `${move} lift`);
  }
}
// Each move does what it says: the pan swings, the head nods, the sign bobs, the flash goes off
assert.ok(moveAt("cook", 0.2, settings).arm > 0 && moveAt("cook", 0.7, settings).arm < 0);
assert.ok(moveAt("phone", 0.8, settings).head > 0);
assert.ok(moveAt("sign", 0.55, settings).lift < 0);
near(flashAt(3.9, 4), 1 - (3.9 - 3.75) / 0.25, "flash");
assert.equal(flashAt(1, 4), 0);
assert.equal(flashAt(3.9, 0), 0);

// A screen bear: hidden before the entry, coming in from the side, at its spot after the walk, moving after the landing
const motion: SceneMotion = { ...settings, waddleIn: true, waddleAngle: 6, landSquash: 0.1, blinkEvery: 2.6, breathe: false, breathAmount: 0.012, breathSeconds: 3.6 };
assert.equal(sceneMotion(0.5, "wave", motion, -1).visible, false);
assert.ok(sceneMotion(1, "wave", motion, -1).body.x < 0 && sceneMotion(1, "wave", motion, 1).body.x > 0);
near(sceneMotion(ENTER.land, "wave", motion, -1).body.x, 0, "at its spot");
assert.equal(sceneMotion(ENTER.move - 0.1, "wave", motion, -1).arm, 0);
assert.ok(sceneMotion(ENTER.move + waveLoop(1) / 2, "wave", motion, -1).arm < 0);
assert.ok(sceneMotion(ENTER.move + 0.55, "sign", motion, -1).lift < 0);
// Without the entry the bear stands from the start and moves
const standing = sceneMotion(0.2, "wave", { ...motion, waddleIn: false }, -1);
assert.ok(standing.visible && standing.body.x === 0 && standing.arm < 0);

console.log("boneMotion ok");
