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
    <div className={`ul-screen power-${values.powerOn}`}>
      <Beach time={time} />
      <div className="ul-stage stage-box" ref={stage}>
        <span className="ul-clock">{new Date(now).toLocaleTimeString(values.locale)}</span>
        <div className={`ul-sign ul-wood ul-sign-${values.signStyle}`}>
          <p className="ul-eyebrow">{eyebrow}</p>
          <h1 className="ul-title">{title}</h1>
          {note && <p className="ul-note">{note}</p>}
        </div>
        {kind === "starting" && (
          <div className="ul-board ul-wood">
            <b className="ul-big">{left > 0 ? values.countdownPrefix + shortClock(left) : values.countdownDone}</b>
            {values.progressStyle !== "aus" && (
              <div className={`ul-progress ul-progress-${values.progressStyle}`} style={{ "--part": progress } as CSSProperties}><span /></div>
            )}
          </div>
        )}
        {kind === "brb" && <div className="ul-board ul-wood"><b className="ul-big">{values.afkPrefix + shortClock(away)}</b></div>}
        {kind === "ending" && next && <div className="ul-board ul-wood"><b className="ul-next">{`${values.endingNextLabel}: ${next}`}</b></div>}
        {saying && <p key={saying} className="ul-saying">{saying}</p>}
      </div>
      {ticker && values.tickerStyle === "flugzeug" && (
        <div className="ul-plane"><span className="ul-banner">{ticker}</span><ShapeIcon shape={PLANE} /></div>
      )}
      {ticker && values.tickerStyle === "leiste" && <div className="ul-ticker ul-wood"><span>{ticker}</span></div>}
    </div>
  );
}
