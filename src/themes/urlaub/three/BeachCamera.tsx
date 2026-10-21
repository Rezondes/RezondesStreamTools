// The camera of the realistic Urlaub beach: low on the sand looking out to sea, swaying a little with the clock (off
// without drift).
import { useFrame, useThree } from "@react-three/fiber";
import type { BeachClock } from "./Sky.tsx";

// fixed: how far back the camera stands, where it looks, how far it sways sideways and up
const BACK = 34;
const TARGET = [0, 3.4, -20] as const;
const SWAY = { side: 3, up: 0.15 };

export default function BeachCamera({ clock, height, drift }: { clock: BeachClock; height: number; drift: boolean }) {
  const camera = useThree(state => state.camera);
  useFrame(() => {
    const time = drift ? clock.time : 0;
    camera.position.set(Math.sin(time * 0.04) * SWAY.side, height + Math.sin(time * 0.1) * SWAY.up, BACK);
    camera.lookAt(...TARGET);
  });
  return null;
}
