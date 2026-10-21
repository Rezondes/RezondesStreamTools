// A beam between two points (plans/PLAN-GRAFIK.md, package 3): position at the start, rotation so that local +z points to
// the end, and the length. A box translated by half its length along z then grows from the start with scale.z 0 to 1.
import { Quaternion, Vector3 } from "three";

export type Point3 = readonly [number, number, number];
export type BeamTransform = { position: Point3; quaternion: [number, number, number, number]; length: number };

const FORWARD = new Vector3(0, 0, 1);

export function beamTransform(from: Point3, to: Point3): BeamTransform {
  const direction = new Vector3(to[0] - from[0], to[1] - from[1], to[2] - from[2]);
  const length = direction.length();
  const rotation = length > 0 ? new Quaternion().setFromUnitVectors(FORWARD, direction.normalize()) : new Quaternion();
  return { position: from, quaternion: [rotation.x, rotation.y, rotation.z, rotation.w], length };
}
