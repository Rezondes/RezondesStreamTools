// Hook: the pose image of a small dog next to a sign, following the scene clock (wagging, blinking); it renders again
// only when the pose changes. still: the first pose only (performance level niedrig). Check through the scenes.
import { useState } from "react";
import type { DogCache } from "./dog.ts";
import type { PixelImage } from "./pixels.ts";
import { poseAt, poseKey, type PoseInput } from "./poses.ts";
import { useFrame } from "./useFrame.ts";

export function usePose(cache: DogCache, input: Omit<PoseInput, "time">, clock: () => number, still: boolean): PixelImage {
  const [shown, setShown] = useState(() => ({ key: "", image: cache.pose(poseAt({ ...input, time: 0 })) }));
  useFrame(clock, time => {
    const state = poseAt({ ...input, time: still ? 0 : time });
    const key = poseKey(state);
    if (key !== shown.key || cache.pose(state) !== shown.image) setShown({ key, image: cache.pose(state) });
  });
  return shown.image;
}
