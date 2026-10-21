// Camera of the Dachdecker scenes: every frame where the scene's pose function puts it for the clock of the scene
// (cameraPose or endingPose in schedule.ts), so a still image with ?t shows the same view. shift moves the picture to
// the right by that many stage pixels (room for the protocol in the Ending).
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect } from "react";
import type { PerspectiveCamera } from "three";
import { STAGE } from "../../../core/screens/screens.ts";
import type { BuildClock, CameraPose } from "../schedule.ts";

type Props = { clock: BuildClock; pose: (time: number) => CameraPose; shift?: number };

export default function OrbitCamera({ clock, pose, shift = 0 }: Props) {
  const camera = useThree(state => state.camera) as PerspectiveCamera;
  const size = useThree(state => state.size);
  useEffect(() => {
    if (shift === 0) camera.clearViewOffset();
    else camera.setViewOffset(size.width, size.height, (-shift * size.width) / STAGE.width, 0, size.width, size.height);
  }, [camera, size, shift]);
  useFrame(() => {
    const now = pose(clock.time);
    camera.position.set(...now.position);
    camera.lookAt(...now.target);
  });
  return null;
}
