// Hook: skaliert die Bühne (1920x1080, STAGE in screens.ts) auf das Fenster bzw. die OBS-Quelle; setzt --s am Element.
// Das Element bekommt die Klasse stage-box (stage.css: Mitte der Quelle, Grösse, Skalierung).
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
