// Ending scene of the Kebab theme (DESIGN-KEBAB.md "Szenen"): the shop stands, the chef saws a last time, then the
// roller shutter comes down with the arc title and the title of the scene on it; on the right the bon says the shop is
// closed and names the next stream. The numbers of the stream are an overlay of their own (scenes/Stats.tsx).
// ?t=<seconds> shows a still; the next stream comes from the settings (useScreen).
import { useMemo, useState } from "react";
import { useScreen } from "../../../core/screens/useScreen.ts";
import { fillTemplate } from "../../../core/template.ts";
import { bonItems } from "../bon.ts";
import { SPIT_TOP } from "../chef.ts";
import { introAt } from "../intro.ts";
import Bon from "../screen/Bon.tsx";
import ShopScreen from "../screen/ShopScreen.tsx";
import Shutter from "../screen/Shutter.tsx";
import { sceneClock } from "../useFrame.ts";
import { kebabNames, useKebab } from "../useKebab.ts";

export default function Ending() {
  const values = useKebab();
  const [clock] = useState(sceneClock);
  const intro = useMemo(() => introAt(values.introSpeed), [values.introSpeed]);
  const screen = useScreen({ countdownSeconds: 0, countdownAt: "", ticker: "", next: values.endingNext });
  const names = kebabNames(values);
  return (
    <ShopScreen
      values={values} clock={clock} intro={intro} pose="saw" drawIn={false} lights={false}
      bon={values.bonOn} ticker={false} shavings={false} steam={SPIT_TOP}
    >
      {values.shutterOn && <Shutter values={values} clock={clock} title={fillTemplate(values.endingTitle, names)} />}
      {values.bonOn && (
        <Bon
          shop={names.shop} number={fillTemplate(values.startingNumber, names)} title={fillTemplate(values.endingClosed, names)}
          items={bonItems(values.endingItems, names)} label={screen.next ? values.endingNextLabel : ""} big={screen.next} small line=""
        />
      )}
      {!values.shutterOn && <div className="kb-ending-title">{fillTemplate(values.endingTitle, names)}</div>}
    </ShopScreen>
  );
}
