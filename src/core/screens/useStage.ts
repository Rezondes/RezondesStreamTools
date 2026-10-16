// Hook: skaliert die Bühne (1920x1080, STAGE in screens.ts) auf das Fenster bzw. die OBS-Quelle; setzt --s am Element.
import { useLayoutEffect, useRef } from "react";
import { stageScale } from "./screens.ts";

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
