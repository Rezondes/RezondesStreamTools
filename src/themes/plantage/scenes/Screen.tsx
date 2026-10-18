// Full-screen scenes of the Plantage theme (Starting, BRB, Ending): mango field per time of day, wooden sign with overline,
// title and subtitle, below it countdown (with a filling basket or a branch), break time or next stream, rotating quotes
// on a harvest slip, the streamer as the mango picker and a ticker behind a crop duster or as a wooden bar.
// Built for 1920x1080, scaled to any source size.
// Stage, countdown, break time, quotes and parameters come from the screens context of the core (src/core/screens).
// Parameter pro Quelle: ?min=5, ?at=20:00, ?next=..., ?ticker=...
import type { CSSProperties } from "react";
import { rotating, shortClock, type ScreenKind } from "../../../core/screens/screens.ts";
import { useScreen } from "../../../core/screens/useScreen.ts";
import { useStage } from "../../../core/screens/useStage.ts";
import Field, { type TimeOfDay } from "../Field.tsx";
import { ICONS, PLANE } from "../field.ts";
import Picker from "../Picker.tsx";
import ShapeIcon from "../ShapeIcon.tsx";
import { usePlantage } from "../usePlantage.ts";

// fixed: seconds in ms for the rhythm of the quotes
const SECOND_MS = 1000;
// fixed: mangos in the progress basket
const BASKET_MANGOS = 6;

export default function Screen({ kind }: { kind: ScreenKind }) {
  const values = usePlantage();
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
    <div className={`pl-screen power-${values.powerOn}`}>
      <Field time={time} />
      {values.picker && <Picker kind={kind} />}
      <div className="pl-stage stage-box" ref={stage}>
        <span className="pl-clock">{new Date(now).toLocaleTimeString(values.locale)}</span>
        <div className={`pl-sign pl-wood pl-sign-${values.signStyle}`}>
          <p className="pl-eyebrow">{eyebrow}</p>
          <h1 className="pl-title">{title}</h1>
          {note && <p className="pl-note">{note}</p>}
        </div>
        {kind === "starting" && (
          <div className="pl-board pl-wood">
            <b className="pl-big">{left > 0 ? values.countdownPrefix + shortClock(left) : values.countdownDone}</b>
            {values.progressStyle === "korb" && <Basket part={progress} />}
            {values.progressStyle === "ast" && (
              <div className="pl-progress-ast" style={{ "--part": progress } as CSSProperties}><span><ShapeIcon shape={ICONS.mango} /></span></div>
            )}
          </div>
        )}
        {kind === "brb" && <div className="pl-board pl-wood"><b className="pl-big">{values.afkPrefix + shortClock(away)}</b></div>}
        {kind === "ending" && next && <div className="pl-board pl-wood"><b className="pl-next">{`${values.endingNextLabel}: ${next}`}</b></div>}
        {saying && <p key={saying} className="pl-saying">{saying}</p>}
      </div>
      {ticker && values.tickerStyle === "flugzeug" && (
        <div className="pl-plane"><span className="pl-banner">{ticker}</span><ShapeIcon shape={PLANE} /></div>
      )}
      {ticker && values.tickerStyle === "leiste" && <div className="pl-ticker pl-wood"><span>{ticker}</span></div>}
    </div>
  );
}

// Countdown progress as a basket that fills up with mangos, one more for every part of the waiting time
function Basket({ part }: { part: number }) {
  const filled = Math.round(part * BASKET_MANGOS);
  return (
    <div className="pl-progress-korb">
      {Array.from({ length: BASKET_MANGOS }, (_, index) => (
        <span key={index} className={index < filled ? "full" : ""}><ShapeIcon shape={ICONS.mango} /></span>
      ))}
    </div>
  );
}
