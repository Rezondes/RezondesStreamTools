// Check for beam.ts: length, start and direction of a beam between two points. Runs with npm test.
import assert from "node:assert/strict";
import { Quaternion, Vector3 } from "three";
import { beamTransform } from "./beam.ts";

const close = (actual: number, expected: number) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} != ${expected}`);
const forwardOf = (quaternion: [number, number, number, number]) => new Vector3(0, 0, 1).applyQuaternion(new Quaternion(...quaternion));

// Along +z: length 2, no rotation
const straight = beamTransform([0, 0, 0], [0, 0, 2]);
close(straight.length, 2);
assert.deepEqual(straight.position, [0, 0, 0]);
close(forwardOf(straight.quaternion).z, 1);

// A rafter from the eaves to the ridge: local +z points to the ridge, the end lies at start + length * direction
const rafter = beamTransform([-4.2, 0, 0], [0, 3.25, 0]);
close(rafter.length, Math.hypot(4.2, 3.25));
const end = forwardOf(rafter.quaternion).multiplyScalar(rafter.length).add(new Vector3(-4.2, 0, 0));
close(end.x, 0);
close(end.y, 3.25);
close(end.z, 0);

// Zero length gives no rotation instead of NaN
const point = beamTransform([1, 1, 1], [1, 1, 1]);
assert.equal(point.length, 0);
assert.deepEqual(point.quaternion, [0, 0, 0, 1]);

console.log("beam ok");
