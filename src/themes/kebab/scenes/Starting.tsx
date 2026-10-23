// Starting scene of the Kebab theme (DESIGN-KEBAB.md "Szenen", prototype refs/starting.html): on paper the light
// flickers on, the arc title springs in letter by letter, chef, spit, knife, counter and plate draw themselves; then
// the chef saws, shavings fall onto the plate and steam rises (PixiJS, in front of the drawing). On the right the bon
// comes out of its printer with the countdown, at the bottom the ticker runs. One clock drives everything;
// ?t=<seconds> shows a still. Countdown and ticker come from the settings (useScreen).
import type { Application } from "pixi.js";
import { useCallback, useMemo, useState } from "react";
import PixiStage from "../../../core/pixi/PixiStage.tsx";
import { rotating, shortClock } from "../../../core/screens/screens.ts";
import { useScreen } from "../../../core/screens/useScreen.ts";
import { useStage } from "../../../core/screens/useStage.ts";
import { fillTemplate } from "../../../core/template.ts";
import { bonItems } from "../bon.ts";
import { VIEW } from "../chef.ts";
import ArcTitle from "../ink/ArcTitle.tsx";
import Chef from "../ink/Chef.tsx";
import { introAt } from "../intro.ts";
import Food from "../pixi/Food.tsx";
import Bon from "../screen/Bon.tsx";
import Ticker from "../screen/Ticker.tsx";
import { useShopIntro } from "../screen/useShopIntro.ts";
import { sceneClock } from "../useFrame.ts";
import { kebabNames, useKebab } from "../useKebab.ts";

// fixed: seconds in ms for the rhythm of the changing line
const SECOND_MS = 1000;

export default function Starting() {
  const values = useKebab();
  const stage = useStage();
  const [clock] = useState(sceneClock);
  const [app, setApp] = useState<Application | null>(null);
  const [lettered, setLettered] = useState(false);
  const intro = useMemo(() => introAt(values.introSpeed), [values.introSpeed]);
  const screen = useScreen({ countdownSeconds: values.countdown, countdownAt: values.countdownAt, ticker: values.ticker, next: "" });
  const names = kebabNames(values);
  const onReady = useCallback((ready: Application) => {
    setApp(ready);
    return () => setApp(null);
  }, []);
  const onLettered = useCallback(() => setLettered(true), []);
  useShopIntro({ intro, lights: values.lightsOn, ready: lettered, bon: values.bonOn, ticker: Boolean(screen.ticker) }, stage);
  const line = rotating(values.startingLines, values.linesEvery * SECOND_MS, screen.now - screen.start);
  return (
    <div className="kb-screen">
      <div className="kb-stage stage-box" ref={stage}>
        <svg className="kb-logo" viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.width} ${VIEW.height}`}>
          <ArcTitle text={values.arcText} size={values.arcSize} span={values.arcSpan} stroke={values.arcStroke} onReady={onLettered} />
          <Chef values={values} clock={clock} idleFrom={intro.idle} />
        </svg>
        {values.bonOn && (
          <Bon
            shop={names.shop} number={fillTemplate(values.startingNumber, names)} items={bonItems(values.startingItems, names)}
            label={values.countdownLabel} big={screen.left > 0 ? shortClock(screen.left) : values.countdownDone} line={line}
          />
        )}
        {screen.ticker && <Ticker text={fillTemplate(screen.ticker, names)} speed={values.tickerSpeed} clock={clock} />}
        <div className="kb-lights" />
      </div>
      <PixiStage background={null} onReady={onReady} className="kb-food" />
      {app && <Food app={app} clock={clock} values={values} shavingsFrom={intro.shavings} steamFrom={intro.steam} />}
    </div>
  );
}
