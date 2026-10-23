// BRB scene of the Kebab theme (DESIGN-KEBAB.md "Szenen"): the same shop as Starting, but the chef takes a tea break:
// the glass in his hand steams, the knife lies on the counter, the spit keeps turning and a paper sign swings from its
// bar. The bon shows the title and the break time, the ticker runs. ?t=<seconds> shows a still; the break time and the
// ticker come from the settings (useScreen).
import { useMemo, useState } from "react";
import { rotating, shortClock } from "../../../core/screens/screens.ts";
import { useScreen } from "../../../core/screens/useScreen.ts";
import { fillTemplate } from "../../../core/template.ts";
import { bonItems } from "../bon.ts";
import { SPIT_TOP } from "../chef.ts";
import { introAt } from "../intro.ts";
import { GLASS_TOP } from "../pause.ts";
import Bon from "../screen/Bon.tsx";
import ShopScreen from "../screen/ShopScreen.tsx";
import Ticker from "../screen/Ticker.tsx";
import { sceneClock } from "../useFrame.ts";
import { kebabNames, useKebab } from "../useKebab.ts";

// fixed: seconds in ms for the rhythm of the changing line
const SECOND_MS = 1000;

export default function Brb() {
  const values = useKebab();
  const [clock] = useState(sceneClock);
  const intro = useMemo(() => introAt(values.introSpeed), [values.introSpeed]);
  const screen = useScreen({ countdownSeconds: 0, countdownAt: "", ticker: values.brbTicker, next: "" });
  const names = kebabNames(values);
  const line = rotating(values.brbLines, values.linesEvery * SECOND_MS, screen.now - screen.start);
  const tea = values.brbTeaOn;
  return (
    <ShopScreen
      values={values} clock={clock} intro={intro} pose={tea ? "tea" : "saw"} sign={tea && values.brbSignOn ? fillTemplate(values.brbSign, names) : null}
      drawIn lights={values.lightsOn} bon={values.bonOn} ticker={Boolean(screen.ticker)} shavings={!tea} steam={tea ? GLASS_TOP : SPIT_TOP}
    >
      {values.bonOn && (
        <Bon
          shop={names.shop} number={fillTemplate(values.startingNumber, names)} title={fillTemplate(values.brbTitle, names)} items={bonItems(values.brbItems, names)}
          label={screen.showAway ? values.brbTimerLabel : ""} big={screen.showAway ? shortClock(screen.away) : ""} line={line}
        />
      )}
      {screen.ticker && <Ticker text={fillTemplate(screen.ticker, names)} speed={values.tickerSpeed} clock={clock} />}
    </ShopScreen>
  );
}
