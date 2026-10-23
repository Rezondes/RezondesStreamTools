// Starting scene of the Kebab theme (DESIGN-KEBAB.md "Szenen", prototype refs/starting.html): on paper the light
// flickers on, the arc title springs in letter by letter, chef, spit, knife, counter and plate draw themselves; then
// the chef saws, shavings fall onto the plate and steam rises (PixiJS, in front of the drawing). On the right the bon
// comes out of its printer with the countdown, at the bottom the ticker runs. One clock drives everything;
// ?t=<seconds> shows a still. Countdown and ticker come from the settings (useScreen).
import { useMemo, useState } from "react";
import { rotating, shortClock } from "../../../core/screens/screens.ts";
import { useScreen } from "../../../core/screens/useScreen.ts";
import { fillTemplate } from "../../../core/template.ts";
import { bonItems } from "../bon.ts";
import { SPIT_TOP } from "../chef.ts";
import { introAt } from "../intro.ts";
import Bon from "../screen/Bon.tsx";
import ShopScreen from "../screen/ShopScreen.tsx";
import Ticker from "../screen/Ticker.tsx";
import { sceneClock } from "../useFrame.ts";
import { kebabNames, useKebab } from "../useKebab.ts";

// fixed: seconds in ms for the rhythm of the changing line
const SECOND_MS = 1000;

export default function Starting() {
  const values = useKebab();
  const [clock] = useState(sceneClock);
  const intro = useMemo(() => introAt(values.introSpeed), [values.introSpeed]);
  const screen = useScreen({ countdownSeconds: values.countdown, countdownAt: values.countdownAt, ticker: values.ticker, next: "" });
  const names = kebabNames(values);
  const line = rotating(values.startingLines, values.linesEvery * SECOND_MS, screen.now - screen.start);
  return (
    <ShopScreen
      values={values} clock={clock} intro={intro} pose="saw" sign={null} drawIn lights={values.lightsOn}
      bon={values.bonOn} ticker={Boolean(screen.ticker)} shavings steam={SPIT_TOP}
    >
      {values.bonOn && (
        <Bon
          shop={names.shop} number={fillTemplate(values.startingNumber, names)} items={bonItems(values.startingItems, names)}
          label={values.countdownLabel} big={screen.left > 0 ? shortClock(screen.left) : values.countdownDone} line={line}
        />
      )}
      {screen.ticker && <Ticker text={fillTemplate(screen.ticker, names)} speed={values.tickerSpeed} clock={clock} />}
    </ShopScreen>
  );
}
