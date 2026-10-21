// Check for schedule.ts of the Dachdecker theme: order and times of the build, scaled with the speed, growth of a beam
// and the camera ride. Runs with npm test.
import assert from "node:assert/strict";
import { BRB_VIEW, BUILD_STEPS, buildSchedule, cameraPose, endingPose, growth, landing, shakeAt, stepEnd, textsEnd } from "./schedule.ts";

const near = (actual: number, expected: number) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} != ${expected}`);

// Order of the build from the design, scaled with buildSpeed
const normal = buildSchedule({ buildSpeed: 1, scrambleMs: 1400 });
assert.deepEqual(BUILD_STEPS, ["walls", "front", "trusses", "purlins", "battens", "tiles"]);
BUILD_STEPS.forEach((name, index) => near(normal[name].start, [0.2, 0.5, 1.4, 2.6, 3.4, 4.6][index]));
const fast = buildSchedule({ buildSpeed: 2, scrambleMs: 1400 });
for (const name of Object.keys(normal) as (keyof typeof normal)[]) {
  near(fast[name].start, normal[name].start / 2);
  near(fast[name].duration, normal[name].duration / 2);
}
near(normal.title.duration, 1.4);

// Growth of a beam: 0 before its start, 1 after its end, later beams and groups later
const front = normal.front;
assert.equal(growth(front, 0, 0.4), 0);
assert.equal(growth(front, 0, 10), 1);
near(growth(front, 0, front.start + front.duration / 2), 0.5);
assert.ok(growth(front, 3, 0.9) < growth(front, 0, 0.9));
assert.ok(growth(normal.trusses, 0, 1.7, 1) < growth(normal.trusses, 0, 1.7, 0));

// Tiles land: 0 before, past 1 on the way, exactly 1 at the end
const tiles = normal.tiles;
near(landing(tiles, 0, 0), 0);
assert.ok(landing(tiles, 0, tiles.start + tiles.duration * 0.6) > 1);
near(landing(tiles, 0, tiles.start + tiles.duration), 1);
near(landing(tiles, 4, 99), 1);
near(stepEnd(normal.trusses, 7, 4), 1.4 + 3 * 0.35 + 6 * 0.04 + 0.5);
near(textsEnd(normal), 2.2 + 1.4 * 0.7 + 0.2);
near(textsEnd(fast), (2.2 + 1.4 * 0.7) / 2 + 0.2);
// The protocol shakes only right after the stamp
const stamp = { start: 6, duration: 0.35, stagger: 0, each: 0 };
assert.equal(shakeAt(stamp, 6.2), 0);
assert.notEqual(shakeAt(stamp, 6.4), 0);
assert.equal(shakeAt(stamp, 7), 0);

// Camera: starts near and high, ends on radius and height, then circles around the centre
const orbit = { radius: 17, height: 6.4, speed: 0.07, intro: true, center: -3 };
const at = (time: number) => cameraPose(normal, orbit, time);
const flat = (pose: ReturnType<typeof at>) => Math.hypot(pose.position[0] - pose.target[0], pose.position[2] - pose.target[2]);
assert.ok(flat(at(0)) < 10 && at(0).position[1] > 8);
near(flat(at(20)), 17);
near(at(20).position[1], 6.4);
assert.notDeepEqual(at(20).position, at(30).position);
near(flat(cameraPose(normal, { ...orbit, intro: false }, 0)), 17);
// BRB looks a little lower and from farther away
assert.ok(cameraPose(normal, { ...orbit, intro: false }, 0, BRB_VIEW).target[1] < at(0).target[1]);
near(flat(cameraPose(normal, { ...orbit, intro: false }, 0, BRB_VIEW)), 17 * BRB_VIEW.radius);

// BRB and Ending keep their times; Ending has protocol, stamp and lights, Starting has none
const brb = buildSchedule({ buildSpeed: 2, scrambleMs: 1400 }, "brb");
near(brb.title.start, 0.6);
const ending = buildSchedule({ buildSpeed: 1, scrambleMs: 1400, countUpMs: 1000, windowStep: 350, stampAt: 6 }, "ending");
near(ending.stamp.start, 6);
near(ending.windows.stagger, 0.35);
near(ending.fireworks.start, 6.4);
assert.ok(normal.stamp.start > 1000 && textsEnd(ending) >= 6.35);

// Ending camera: starts close at the ridge, rides back and up to the whole house
const roofTop = 2.7 + 3.25;
const close = endingPose(ending, orbit, 0, roofTop);
const wide = endingPose(ending, orbit, 5, roofTop);
assert.ok(flat(close) < flat(wide) && close.target[1] > wide.target[1]);
near(close.target[1], roofTop);

console.log("dachdecker schedule ok");
