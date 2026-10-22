// Hook: scales the stage (1920x1080, STAGE in screens.ts) to the frame of the scene (the OBS source, or the stage itself
// for an alert cut out of it, sceneArea.ts); sets --s on the element.
// The element gets the class stage-box (stage.css: center of the source, size, scaling).
import { useLayoutEffect, useRef } from "react";
import { sceneFrame } from "../sceneArea.ts";
import { stageScale } from "./screens.ts";
import "./stage.css";

export function useStage() {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const fit = () => {
      const { width, height } = sceneFrame();
      ref.current?.style.setProperty("--s", String(stageScale(width, height)));
    };
    fit();
    addEventListener("resize", fit);
    return () => removeEventListener("resize", fit);
  }, []);
  return ref;
}
