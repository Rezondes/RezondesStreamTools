// Full-screen scenes of the Bärenbande theme (Starting, BRB, Ending): the watercolor world per time of day, the bear the
// streamer chose for the scene (or the tower) standing on the meadow, a paper sign with overline, title and subtitle,
// below it countdown (with a path a little bear walks along, or a bar), break time or next stream, rotating quotes and a
// paper ticker. Starting: the bear waves. BRB: the Eisbär cooks, the Grizzly holds a sign, the Panda looks at its phone.
// Ending: the bears wave, the Panda takes a selfie. Built for 1920x1080, scaled to any source size.
// Stage, countdown, break time, quotes and parameters come from the screens context of the core (src/core/screens).
// Parameter pro Quelle: ?min=5, ?at=20:00, ?next=..., ?ticker=...
import type { CSSProperties } from "react";
import { rotating, shortClock, type ScreenKind } from "../../../core/screens/screens.ts";
import { useScreen } from "../../../core/screens/useScreen.ts";
import { useStage } from "../../../core/screens/useStage.ts";
import Bear from "../Bear.tsx";
import type { BearId, PoseName } from "../bears.ts";
import Hero from "../Hero.tsx";
import { useBears } from "../useBears.ts";
import World, { type TimeOfDay } from "../World.tsx";

// fixed: seconds in ms for the rhythm of the quotes
const SECOND_MS = 1000;

// The pose of every bear per scene
const POSES: Record<ScreenKind, Record<BearId, PoseName>> = {
  starting: { eisbaer: "wave", grizzly: "wave", panda: "wave" },
  brb: { eisbaer: "cook", grizzly: "sign", panda: "phone" },
  ending: { eisbaer: "wave", grizzly: "wave", panda: "selfie" },
};

export default function Screen({ kind }: { kind: ScreenKind }) {
  const values = useBears();
  const stage = useStage();
  const { now, start, left, progress, away, ticker, next } = useScreen({ countdownSeconds: values.countdown, ticker: values.ticker, next: values.endingNext });
  const [eyebrow, title, note] = {
    starting: [values.startingEyebrow, values.startingTitle, values.startingNote],
    brb: [values.brbEyebrow, values.brbTitle, values.brbNote],
    ending: [values.endingEyebrow, values.endingTitle, values.endingNote],
  }[kind];
  const time = { starting: values.timeStarting, brb: values.timeBrb, ending: values.timeEnding }[kind] as TimeOfDay;
  const bear = { starting: values.bearStarting, brb: values.bearBrb, ending: values.bearEnding }[kind];
  const sayings = { starting: values.startingLines, brb: values.brbLines, ending: values.endingLines }[kind];
  const saying = rotating(sayings, values.linesEvery * SECOND_MS, now - start);

  return (
    <div className={`bb-screen power-${values.powerOn} bb-side-${values.bearSide} bb-facing-${values.facing} ${values.blinkEvery > 0 ? "bb-blinking" : ""} ${values.breathe ? "bb-breathing" : ""}`}>
      <World time={time} />
      <div className="bb-stage stage-box" ref={stage}>
        <span className="bb-clock bb-pill">{new Date(now).toLocaleTimeString(values.locale)}</span>
        <div className="bb-hero-spot">
          <span className="bb-ground-shadow" />
          <Hero choice={bear} poses={POSES[kind]} sign={values.brbSign} className="bb-hero" />
          <span className="bb-name bb-pill">{values.channelName}</span>
        </div>
        <div className="bb-board">
          <div className="bb-sign bb-card">
            <p className="bb-eyebrow bb-pill">{eyebrow}</p>
            <h1 className="bb-title">{title}</h1>
            {note && <p className="bb-note">{note}</p>}
          </div>
          {kind === "starting" && (
            <div className="bb-count bb-card">
              <b className="bb-big">{left > 0 ? values.countdownPrefix + shortClock(left) : values.countdownDone}</b>
              {values.progressStyle === "weg" && (
                <div className="bb-progress-path" style={{ "--part": progress } as CSSProperties}>
                  <span className="bb-walker"><Bear bear="grizzly" pose="stand" /></span>
                </div>
              )}
              {values.progressStyle === "balken" && <div className="bb-progress-bar" style={{ "--part": progress } as CSSProperties}><span /></div>}
            </div>
          )}
          {kind === "brb" && <div className="bb-count bb-card"><b className="bb-big">{values.afkPrefix + shortClock(away)}</b></div>}
          {kind === "ending" && next && <div className="bb-count bb-card"><b className="bb-next">{`${values.endingNextLabel}: ${next}`}</b></div>}
          {saying && <p key={saying} className="bb-saying bb-pill">{saying}</p>}
        </div>
      </div>
      {ticker && <div className="bb-ticker"><span>{ticker}</span></div>}
    </div>
  );
}
