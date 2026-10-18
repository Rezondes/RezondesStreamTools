// Full-screen scenes of the Urlaub theme (Starting, BRB, Ending): beach backdrop per time of day, wooden sign with overline,
// title and subtitle, below it countdown, break time or next stream, rotating quotes and a ticker on an
// airplane or as a wooden bar. Built for 1920x1080, scaled to any source size.
// Stage, countdown, break time, quotes and parameters come from the screens context of the core (src/core/screens).
// Parameter pro Quelle: ?min=5, ?at=20:00, ?next=..., ?ticker=...
import type { CSSProperties } from "react";
import { rotating, shortClock, type ScreenKind } from "../../../core/screens/screens.ts";
import { useScreen } from "../../../core/screens/useScreen.ts";
import { useStage } from "../../../core/screens/useStage.ts";
import Beach, { type TimeOfDay } from "../Beach.tsx";
import { PLANE } from "../beach.ts";
import ShapeIcon from "../ShapeIcon.tsx";
import { useUrlaub } from "../useUrlaub.ts";

// fixed: seconds in ms for the rhythm of the quotes
const SECOND_MS = 1000;

export default function Screen({ kind }: { kind: ScreenKind }) {
  const values = useUrlaub();
  const stage = useStage();
  const { now, start, left, progress, away, ticker, next } = useScreen({ countdownSeconds: values.countdown, ticker: values.ticker, next: values.endingNext });
  const [eyebrow, title, note] = {
    starting: [values.startingEyebrow, values.startingTitle, values.startingNote],
    brb: [values.brbEyebrow, values.brbTitle, values.brbNote],
    ending: [values.endingEyebrow, values.endingTitle, values.endingNote],
  }[kind];
  const time = { starting: values.timeStarting, brb: values.timeBrb, ending: values.timeEnding }[kind] as TimeOfDay;
  const sayings = { starting: values.startingLines, brb: values.brbLines, ending: values.endingLines }[kind];
  const saying = rotating(sayings, values.linesEvery * SECOND_MS, now - start);

  return (
    <div className={`sf-screen power-${values.powerOn}`}>
      <Beach time={time} />
      <div className="sf-stage stage-box" ref={stage}>
        <span className="sf-clock">{new Date(now).toLocaleTimeString(values.locale)}</span>
        <div className={`sf-sign sf-wood sf-sign-${values.signStyle}`}>
          <p className="sf-eyebrow">{eyebrow}</p>
          <h1 className="sf-title">{title}</h1>
          {note && <p className="sf-note">{note}</p>}
        </div>
        {kind === "starting" && (
          <div className="sf-board sf-wood">
            <b className="sf-big">{left > 0 ? values.countdownPrefix + shortClock(left) : values.countdownDone}</b>
            {values.progressStyle !== "aus" && (
              <div className={`sf-progress sf-progress-${values.progressStyle}`} style={{ "--part": progress } as CSSProperties}><span /></div>
            )}
          </div>
        )}
        {kind === "brb" && <div className="sf-board sf-wood"><b className="sf-big">{values.afkPrefix + shortClock(away)}</b></div>}
        {kind === "ending" && next && <div className="sf-board sf-wood"><b className="sf-next">{`${values.endingNextLabel}: ${next}`}</b></div>}
        {saying && <p key={saying} className="sf-saying">{saying}</p>}
      </div>
      {ticker && values.tickerStyle === "flugzeug" && (
        <div className="sf-plane"><span className="sf-banner">{ticker}</span><ShapeIcon shape={PLANE} /></div>
      )}
      {ticker && values.tickerStyle === "leiste" && <div className="sf-ticker sf-wood"><span>{ticker}</span></div>}
    </div>
  );
}
