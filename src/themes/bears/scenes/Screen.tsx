// Full-screen scenes of the Bärenbande theme (Starting, BRB, Ending): the watercolor world per time of day, the bear the
// streamer chose for the scene (or the tower) standing on the meadow, a paper sign with overline, title and subtitle,
// below it countdown (with a path a little bear walks along, or a bar), break time or next stream, rotating quotes and a
// paper ticker (PLAN-BEARS.md packages 11 and 12): the world is painted as watercolor and paints itself in, the bear (or
// the tower) waddles in and lands, then plays its move with its bones (boneMotion.ts), the cards plop in, all on one GSAP
// timeline (stills with ?t=). Starting: the bear waves. BRB: the Eisbär cooks (the pan swings), the Grizzly holds a sign
// (it bobs), the Panda looks at its phone (the head nods). Ending: the bears wave goodbye, the Panda takes a selfie with
// a flash. Built for 1920x1080, scaled to any source size.
// Stage, countdown, break time, quotes and parameters come from the screens context of the core (src/core/screens).
// Parameter pro Quelle: ?min=5, ?at=20:00, ?next=..., ?ticker=...
import { SplitText } from "gsap/SplitText";
import { type CSSProperties, type RefObject, useRef } from "react";
import { useTimeline } from "../../../core/motion/useTimeline.ts";
import { rotating, shortClock, type ScreenKind } from "../../../core/screens/screens.ts";
import { useScreen } from "../../../core/screens/useScreen.ts";
import { useStage } from "../../../core/screens/useStage.ts";
import Bear, { bearDriver } from "../Bear.tsx";
import { isBearChoice, TOWER, type BearId } from "../bears.ts";
import { type Move, sceneMotion } from "../boneMotion.ts";
import type { PoseName } from "../rig.ts";
import Hero from "../Hero.tsx";
import type { BearsValues } from "../settings.ts";
import { useBears } from "../useBears.ts";
import WorldCanvas from "../WorldCanvas.tsx";
import type { TimeOfDay } from "../world.ts";

// fixed: seconds in ms for the rhythm of the quotes
const SECOND_MS = 1000;

// The pose of every bear per scene
const POSES: Record<ScreenKind, Record<BearId, PoseName>> = {
  starting: { eisbaer: "wave", grizzly: "wave", panda: "wave" },
  brb: { eisbaer: "cook", grizzly: "sign", panda: "phone" },
  ending: { eisbaer: "wave", grizzly: "wave", panda: "selfie" },
};

// The move every pose plays after the entry
const MOVE_OF: Partial<Record<PoseName, Move>> = { wave: "wave", cook: "cook", phone: "phone", sign: "sign", selfie: "selfie" };

// fixed: how long the timeline runs (s); the moves of the bear loop inside it
const RUN = 24 * 60 * 60;
const PERCENT = 100; // fixed: settings in percent to shares
// fixed: when the cards come in (s): sign, clock, title letters, eyebrow, countdown, note
const CARDS_AT = { sign: 1.4, clock: 1.6, title: 1.7, eyebrow: 1.8, count: 2, note: 2.3 };
// fixed: the cards plop in squashed and stretched, the clock drops in, the letters fall in, the eyebrow pops, the note rises
const PLOP = { scaleX: 0.4, scaleY: 1.4, opacity: 0, duration: 0.7, ease: "elastic.out(1, 0.45)", transformOrigin: "50% 100%" };
const DROP = { y: -110, duration: 0.6, ease: "back.out(2)" }; // fixed: see above
const LETTERS = { y: -60, scaleY: 1.4, opacity: 0, duration: 0.5, ease: "bounce.out", stagger: 0.03 }; // fixed: see above
const POP = { scale: 0, rotate: -12, duration: 0.5, ease: "back.out(3)" }; // fixed: see above
const RISE = { opacity: 0, y: 12, duration: 0.4 }; // fixed: see above

// The build of a screen: the world paints in, the bear waddles in, lands and plays its move, the cards plop in
function useScreenTimeline(scope: RefObject<HTMLDivElement | null>, values: BearsValues, choice: string, kind: ScreenKind) {
  useTimeline(timeline => {
    const root = scope.current;
    if (!root) return;
    const spot = root.querySelector<HTMLElement>(".bb-hero-spot");
    const svg = spot?.querySelector<SVGSVGElement>("svg.bb-hero");
    const flash = root.querySelector<HTMLElement>(".bb-flash");
    const bear = isBearChoice(choice) && choice !== TOWER ? choice : null;
    const drive = svg && bear ? bearDriver(svg, bear, POSES[kind][bear]) : null;
    const move = (bear && MOVE_OF[POSES[kind][bear]]) || "still";
    const motion = {
      waddleIn: values.waddleIn, waddleAngle: values.bearWaddle, landSquash: values.landSquash / PERCENT, waveSpeed: values.waveSpeed, headSway: values.headSway,
      blinkEvery: values.blinkEvery / SECOND_MS, breathe: values.breathe, breathAmount: values.breathAmount / PERCENT, breathSeconds: values.breatheMs / SECOND_MS,
      flashEvery: values.flashEvery,
    };
    const side = values.bearSide === "rechts" ? 1 : -1;
    const clock = { seconds: 0 };
    const place = () => {
      const frame = sceneMotion(clock.seconds, move, motion, side);
      if (spot) {
        spot.style.visibility = frame.visible ? "" : "hidden";
        spot.style.translate = `${frame.body.x}px 0`;
      }
      drive?.(frame);
      if (flash) flash.style.opacity = String(frame.flash);
    };
    place();
    timeline.to(clock, { seconds: RUN, duration: RUN, ease: "none", onUpdate: place }, 0);
    if (values.powerOn !== "aquarell") return;
    timeline.fromTo(root.querySelector(".bb-painted"), { "--paint": 0 }, { "--paint": 1, duration: values.powerOnDuration / SECOND_MS, ease: "power1.inOut" }, 0);
    timeline.from(root.querySelector(".bb-sign"), PLOP, CARDS_AT.sign);
    timeline.from(root.querySelector(".bb-clock"), DROP, CARDS_AT.clock);
    const title = root.querySelector(".bb-title");
    if (title) timeline.from(SplitText.create(title, { type: "words,chars" }).chars, LETTERS, CARDS_AT.title);
    timeline.from(root.querySelector(".bb-sign .bb-eyebrow"), POP, CARDS_AT.eyebrow);
    timeline.from(root.querySelectorAll(".bb-count"), PLOP, CARDS_AT.count);
    timeline.from(root.querySelector(".bb-sign .bb-note"), RISE, CARDS_AT.note);
  }, [values, choice, kind], scope);
}

export default function Screen({ kind }: { kind: ScreenKind }) {
  const values = useBears();
  const stage = useStage();
  const scope = useRef<HTMLDivElement>(null);
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
  useScreenTimeline(scope, values, bear, kind);

  return (
    <div ref={scope} className={`bb-screen bb-timed power-${values.powerOn} bb-side-${values.bearSide} bb-facing-${values.facing}`}>
      <WorldCanvas time={time} />
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
      <span className="bb-flash" />
    </div>
  );
}
