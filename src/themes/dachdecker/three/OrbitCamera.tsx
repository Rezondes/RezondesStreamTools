// Camera of the Dachdecker scenes: rides out from near and high and then circles slowly around the roof frame, every
// frame from the clock of the scene (cameraPose in schedule.ts), so a still image with ?t shows the same view.
import { useFrame } from "@react-three/fiber";
import { type BuildClock, cameraPose, type Orbit, type Schedule } from "../schedule.ts";

export default function OrbitCamera({ clock, schedule, orbit }: { clock: BuildClock; schedule: Schedule; orbit: Orbit }) {
  useFrame(({ camera }) => {
    const pose = cameraPose(schedule, orbit, clock.time);
    camera.position.set(...pose.position);
    camera.lookAt(...pose.target);
  });
  return null;
}
