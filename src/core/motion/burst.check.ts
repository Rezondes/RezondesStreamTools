// Check for burst.ts: a burst from the time alone (same seed and time, same particles), two seeds differ, nothing
// before the start or after the life, and the plain flight without gravity and drag. Runs with npm test.
import assert from "node:assert/strict";
import { burstAt, type BurstOptions } from "./burst.ts";

const near = (actual: number, expected: number, label: string) => assert.ok(Math.abs(actual - expected) < 1e-6, `${label}: ${actual} vs ${expected}`);

const options: BurstOptions = { origin: { x: 960, y: 540 }, direction: -Math.PI / 2, spread: Math.PI, speed: [400, 900], gravity: 1200, drag: 1.5, life: 2 };

// Deterministic: same seed and time, same values
assert.deepEqual(burstAt(7, 30, 0.8, options), burstAt(7, 30, 0.8, options));
assert.equal(burstAt(7, 30, 0.8, options).length, 30);
// Two seeds give different bursts
assert.notDeepEqual(burstAt(7, 30, 0.8, options), burstAt(8, 30, 0.8, options));

// Before the start and after the life every particle is invisible; in between they are visible
assert.ok(burstAt(7, 30, -0.1, options).every(particle => particle.opacity === 0), "before the start");
assert.ok(burstAt(7, 30, 2, options).every(particle => particle.opacity === 0), "after the life");
assert.ok(burstAt(7, 30, 0.5, options).every(particle => particle.opacity === 1), "full in the first part of the life");
const fading = burstAt(7, 30, 1.8, options);
assert.ok(fading.every(particle => particle.opacity > 0 && particle.opacity < 1), "fades out at the end");

// Without gravity and drag a particle is its speed away from the start after 1 s, along its direction
const plain: BurstOptions = { origin: { x: 100, y: 200 }, direction: 0, spread: 0, speed: [300, 300], gravity: 0, drag: 0, life: 5 };
for (const particle of burstAt(3, 5, 1, plain)) {
  near(Math.hypot(particle.x - 100, particle.y - 200), 300, "distance after 1 s");
  near(particle.y, 200, "straight along the direction");
}
// At the start every particle sits at the origin
for (const particle of burstAt(3, 5, 0, options)) near(Math.hypot(particle.x - 960, particle.y - 540), 0, "starts at the origin");

// Drag slows down: a burst with drag flies less far than without
const far = (drag: number) => Math.max(...burstAt(5, 10, 1, { ...plain, drag }).map(particle => particle.x - 100));
assert.ok(far(2) < far(0), "drag shortens the flight");
// Gravity pulls down (y grows)
const fallen = burstAt(5, 10, 1, { ...plain, gravity: 1000 });
assert.ok(fallen.every(particle => particle.y > 200), "gravity pulls down");
// Gravity with drag still pulls down and stays finite
assert.ok(burstAt(5, 10, 1, { ...plain, gravity: 1000, drag: 2 }).every(particle => particle.y > 200 && Number.isFinite(particle.y)), "gravity with drag");

console.log("burst ok");
