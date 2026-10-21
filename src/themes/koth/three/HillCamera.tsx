// Camera of the KOTH Starting: every frame where cameraPose (build.ts) puts it for the clock of the scene, so a still
// image with ?t shows the same view.
import { useFrame, useThree } from "@react-three/fiber";
import type { CameraOptions, KothClock } from "../build.ts";
import { cameraPose } from "../build.ts";

export default function HillCamera({ clock, options }: { clock: KothClock; options: CameraOptions }) {
  const camera = useThree(state => state.camera);
  useFrame(() => {
    const pose = cameraPose(clock.time, options);
    camera.position.set(...pose.position);
    camera.lookAt(...pose.target);
  });
  return null;
}
