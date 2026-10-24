// Hook: width and height of the window (the OBS source), updated after a resize; with waitMs > 0 only once the size has
// stood still that long (for drawing that is expensive to repeat).
import { useEffect, useState } from "react";

export type Viewport = { width: number; height: number };

const current = (): Viewport => ({ width: innerWidth, height: innerHeight });

export function useViewport(waitMs = 0): Viewport {
  const [size, setSize] = useState(current);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const update = () => setSize(previous => {
      const next = current();
      return next.width === previous.width && next.height === previous.height ? previous : next;
    });
    const onResize = () => {
      if (waitMs <= 0) return update();
      clearTimeout(timer);
      timer = setTimeout(update, waitMs);
    };
    addEventListener("resize", onResize);
    return () => {
      clearTimeout(timer);
      removeEventListener("resize", onResize);
    };
  }, [waitMs]);
  return size;
}
