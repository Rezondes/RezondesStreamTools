// Hook: scales the stage (1920x1080, STAGE in screens.ts) to the window or the OBS source; sets --s on the element.
// The element gets the class stage-box (stage.css: center of the source, size, scaling).
import { useLayoutEffect, useRef } from "react";
import { stageScale } from "./screens.ts";
import "./stage.css";

export function useStage() {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const fit = () => ref.current?.style.setProperty("--s", String(stageScale(innerWidth, innerHeight)));
    fit();
    addEventListener("resize", fit);
    return () => removeEventListener("resize", fit);
  }, []);
  return ref;
}
