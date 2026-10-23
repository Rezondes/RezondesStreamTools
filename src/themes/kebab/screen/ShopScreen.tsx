// The shell of the Kebab full-screen scenes (Starting, BRB, Ending): paper, the logo SVG with the arc title and the
// chef at the spit (pose saw or tea), the bon and the ticker of the scene as children, the light that flickers on, and
// the PixiJS layer with shavings and steam in front of the drawing. It builds the entrance timeline (useShopIntro).
// Without drawIn the shop stands from the start and its life begins at once.
import type { Application } from "pixi.js";
import { type ReactNode, useCallback, useMemo, useState } from "react";
import PixiStage from "../../../core/pixi/PixiStage.tsx";
import { useStage } from "../../../core/screens/useStage.ts";
import { VIEW } from "../chef.ts";
import type { Point } from "../food.ts";
import ArcTitle from "../ink/ArcTitle.tsx";
import Chef, { type ChefPoseName } from "../ink/Chef.tsx";
import type { Intro } from "../intro.ts";
import Food from "../pixi/Food.tsx";
import type { KebabValues } from "../settings.ts";
import { useShopIntro } from "./useShopIntro.ts";

type Props = {
  values: KebabValues; clock: () => number; intro: Intro; pose: ChefPoseName; sign: string | null;
  drawIn: boolean; lights: boolean; bon: boolean; ticker: boolean; shavings: boolean; steam: Point | null; children: ReactNode;
};

export default function ShopScreen(props: Props) {
  const { values, clock, intro, pose, sign, drawIn, lights, bon, ticker, shavings, steam, children } = props;
  const stage = useStage();
  const [app, setApp] = useState<Application | null>(null);
  const [lettered, setLettered] = useState(false);
  const onReady = useCallback((ready: Application) => {
    setApp(ready);
    return () => setApp(null);
  }, []);
  const onLettered = useCallback(() => setLettered(true), []);
  useShopIntro({ intro, lights, ready: lettered, drawIn, bon, ticker }, stage);
  const start = (at: number) => (drawIn ? at : 0);
  const steamFrom = useMemo(() => (steam ? { from: steam, at: drawIn ? intro.steam : 0 } : null), [steam, drawIn, intro.steam]);
  return (
    <div className="kb-screen">
      <div className="kb-stage stage-box" ref={stage}>
        <svg className="kb-logo kb-shop" viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.width} ${VIEW.height}`}>
          <ArcTitle text={values.arcText} size={values.arcSize} span={values.arcSpan} stroke={values.arcStroke} onReady={onLettered} />
          <Chef values={values} clock={clock} idleFrom={start(intro.idle)} pose={pose} sign={sign} />
        </svg>
        {children}
        <div className="kb-lights" />
      </div>
      <PixiStage background={null} onReady={onReady} className="kb-food" />
      {app && <Food app={app} clock={clock} values={values} shavingsFrom={shavings ? start(intro.shavings) : null} steam={steamFrom} />}
    </div>
  );
}
