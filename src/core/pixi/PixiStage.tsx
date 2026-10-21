// PixiJS stage (plans/PLAN-GRAFIK.md, package 5): an Application in stage size (1920x1080, scaled with useStage like the
// 2D scenes), transparent or with a color. The theme gets the application once it is ready and draws into it; on unmount
// the application with its textures is destroyed (rule 17).
import { Application } from "pixi.js";
import { useEffect, useRef } from "react";
import { STAGE } from "../screens/screens.ts";
import { useStage } from "../screens/useStage.ts";

type Props = {
  background: string | null; // null = transparent
  onReady: (app: Application) => (() => void) | void; // may return its own cleanup
  className?: string;
};

export default function PixiStage({ background, onReady, className = "" }: Props) {
  const stage = useStage();
  const host = useRef<HTMLDivElement>(null);
  const ready = useRef(onReady);
  ready.current = onReady;
  useEffect(() => {
    const app = new Application();
    let cleanup: (() => void) | void;
    let alive = true;
    void app.init({ width: STAGE.width, height: STAGE.height, backgroundAlpha: background === null ? 0 : 1, background: background ?? undefined, antialias: true }).then(() => {
      if (!alive) { app.destroy(true, true); return; }
      host.current?.appendChild(app.canvas);
      cleanup = ready.current(app);
    });
    return () => {
      alive = false;
      cleanup?.();
      // init may still run; destroy after it finished, otherwise right away
      if (app.renderer) app.destroy(true, true);
    };
  }, [background]);
  return (
    <div className={`stage-box ${className}`} ref={stage}>
      <div ref={host} />
    </div>
  );
}
