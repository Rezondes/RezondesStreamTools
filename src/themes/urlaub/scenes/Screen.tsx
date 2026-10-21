// Full-screen scenes of the Urlaub theme (Starting, BRB, Ending): beach backdrop per time of day, wooden sign with overline,
// title and subtitle, below it countdown, break time or next stream, rotating quotes and a ticker on an
// airplane or as a wooden bar. Built for 1920x1080, scaled to any source size. The Starting (PLAN-URLAUB.md package 5) is
// the realistic beach in 3D at sunrise with driftwood signs: the sign drops in on its ropes and swings out, the post rises
// out of the sand, a buoy drifts along a rope as the progress; one GSAP timeline drives it all (stills with ?t=).
// Stage, countdown, break time, quotes and parameters come from the screens context of the core (src/core/screens).
// Parameter pro Quelle: ?min=5, ?at=20:00, ?next=..., ?ticker=...
import { SplitText } from "gsap/SplitText";
import { type RefObject, useRef, useState } from "react";
import { useTimeline } from "../../../core/motion/useTimeline.ts";
import { rotating, shortClock, type ScreenKind } from "../../../core/screens/screens.ts";
import { useScreen } from "../../../core/screens/useScreen.ts";
import { useStage } from "../../../core/screens/useStage.ts";
import Beach, { type TimeOfDay } from "../Beach.tsx";
import { PLANE } from "../beach.ts";
import ShapeIcon from "../ShapeIcon.tsx";
import type { UrlaubValues } from "../settings.ts";
import BuoyRope from "../signs/BuoyRope.tsx";
import DriftwoodSign from "../signs/DriftwoodSign.tsx";
import BeachWorld from "../three/BeachWorld.tsx";
import type { BeachClock } from "../three/Sky.tsx";
import { useUrlaub } from "../useUrlaub.ts";

// fixed: seconds in ms for the rhythm of the quotes
const SECOND_MS = 1000;

// fixed: how long the clock of the realistic Starting runs (s)
const RUN = 24 * 60 * 60;
// fixed: when the parts come in (s): clock, sign drop, post, sign swing, words, note
const AT = { clock: 1.4, drop: 1, post: 1.6, swing: 1.8, words: 1.9, note: 2.4 };
const DROP = { y: -700, duration: 0.8, ease: "power2.in" }; // fixed: the sign drops in on its ropes
const SWING = { duration: 3, ease: "elastic.out(1, 0.18)" }; // fixed: and swings out
const WORDS = { y: 30, opacity: 0, rotate: -6, duration: 0.5, stagger: 0.12, ease: "back.out(2.4)" }; // fixed: title words
const SPREAD = { opacity: 0, letterSpacing: "0.6em", duration: 0.6 }; // fixed: the eyebrow letters close up
const RISE = { opacity: 0, y: 10, duration: 0.4 }; // fixed: the note rises
const POST = { y: 520, duration: 0.9, ease: "back.out(1.4)" }; // fixed: the post rises out of the sand
const CLOCK = { y: -110, duration: 0.6, ease: "back.out(2)" }; // fixed: the clock drops in

// The realistic Starting: the clock of the 3D beach, the signs dropping, swinging and rising
function useStartingTimeline(scope: RefObject<HTMLDivElement | null>, clock: BeachClock, values: UrlaubValues, on: boolean) {
  useTimeline(timeline => {
    const root = scope.current;
    if (!on || !root) return;
    clock.time = 0;
    timeline.to(clock, { time: RUN, duration: RUN, ease: "none" }, 0);
    timeline.from(root.querySelector(".ul-clock"), CLOCK, AT.clock);
    const sign = root.querySelector(".ul-sign");
    if (sign) timeline.from(sign, DROP, AT.drop).fromTo(sign, { rotate: -values.signSwing }, { rotate: 0, ...SWING }, AT.swing);
    const title = root.querySelector(".ul-title");
    if (title) timeline.from(SplitText.create(title, { type: "words" }).words, WORDS, AT.words);
    timeline.from(root.querySelector(".ul-eyebrow"), SPREAD, AT.words);
    const note = root.querySelector(".ul-note");
    if (note) timeline.from(note, RISE, AT.note);
    timeline.from(root.querySelector(".ul-post"), POST, AT.post);
  }, [clock, values, on], scope);
}

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
  const real = kind === "starting";
  const scope = useRef<HTMLDivElement>(null);
  const [clock] = useState<BeachClock>(() => ({ time: 0 }));
  useStartingTimeline(scope, clock, values, real);
  const big = <b className="ul-big">{left > 0 ? values.countdownPrefix + shortClock(left) : values.countdownDone}</b>;
  const heading = (
    <>
      <p className="ul-eyebrow">{eyebrow}</p>
      <h1 className="ul-title">{title}</h1>
      {note && <p className="ul-note">{note}</p>}
    </>
  );

  return (
    <div ref={scope} className={`ul-screen power-${values.powerOn}${real ? " ul-real" : ""}`}>
      {real ? <BeachWorld values={values} clock={clock} /> : <Beach time={time} />}
      <div className="ul-stage stage-box" ref={stage}>
        <span className="ul-clock">{new Date(now).toLocaleTimeString(values.locale)}</span>
        {real ? <DriftwoodSign hanging grain={values.woodGrain} className="ul-sign">{heading}</DriftwoodSign> : <div className={`ul-sign ul-wood ul-sign-${values.signStyle}`}>{heading}</div>}
        {real && (
          <DriftwoodSign hanging={false} grain={values.woodGrain} className="ul-board">
            {big}
            {values.progressStyle !== "aus" && <BuoyRope progress={progress} />}
          </DriftwoodSign>
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
