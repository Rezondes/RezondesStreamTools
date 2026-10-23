// Full-screen scenes of the standard theme (PLAN-STANDARD.md packages 1 and 2, prototype refs/starting.html): soft
// light fields in both accents with rising light dust in a PixiJS stage, a vignette and fine grain over it. Starting
// shows the rolling countdown and the bar with a wandering shine, BRB lets the fields breathe slower and darker and
// rolls the break time, Ending counts the stream numbers up and lets the fields sink away. GSAP brings in the top line,
// the overline, the title letter by letter rising out of a blur and the rest. Built for 1920x1080, scaled to any
// source size. ?t=<s> shows a still with the digits settled; per source: ?min=5, ?at=20:00, ?next=..., ?ticker=...
import { SplitText } from "gsap/SplitText";
import type { Application } from "pixi.js";
import { type RefObject, useCallback, useRef, useState } from "react";
import { seekFromQuery } from "../../../core/motion/seek.ts";
import { useTimeline } from "../../../core/motion/useTimeline.ts";
import PixiStage from "../../../core/pixi/PixiStage.tsx";
import { type ScreenKind, shortClock } from "../../../core/screens/screens.ts";
import { useScreen } from "../../../core/screens/useScreen.ts";
import { useStage } from "../../../core/screens/useStage.ts";
import Aurora from "../pixi/Aurora.tsx";
import Dust from "../pixi/Dust.tsx";
import type { StandardValues } from "../settings.ts";
import { useStandard } from "../useStandard.ts";
import Countdown from "./Countdown.tsx";
import Grain from "./Grain.tsx";

// fixed: seconds in ms
const SECOND_MS = 1000;
// fixed: percent for the width of the progress bar
const PERCENT = 100;
// fixed: the order of the entrance in s, like the prototype
const ENTER = { top: 0.2, eyebrow: 0.5, title: 0.8, rest: 1.6, ticker: 2.2, shine: 2.6 };
// fixed: how far things rise in px and how blurred they start, like the prototype
const FROM = { eyebrow: 14, eyebrowBlur: "blur(6px)", char: 46, charBlur: "blur(12px)", rest: 20, ticker: 12 };
// fixed: durations in s and the stagger between letters and between the parts below the title, like the prototype
const TIME = { top: 0.8, eyebrow: 0.7, rest: 0.8, ticker: 0.8, char: 0.035, restStagger: 0.15, shine: 1.2 };
// fixed: the shine starts left of the bar and ends right of it, in px
const SHINE = { from: -140, to: 900 };
const SEEK = seekFromQuery(location.search);

type Screen = ReturnType<typeof useScreen>;
type Entrance = { title: string; shine: boolean; ticker: boolean; next: boolean };

// The entrance: top line, overline, title letter by letter, the parts below, the note at the bottom, the shine
function useEntrance(kind: ScreenKind, values: StandardValues, entrance: Entrance, stage: RefObject<HTMLDivElement | null>) {
  useTimeline(timeline => {
    timeline.from(".standard-st-top", { opacity: 0, duration: TIME.top }, ENTER.top);
    timeline.from(".standard-st-eyebrow", { opacity: 0, y: FROM.eyebrow, filter: FROM.eyebrowBlur, duration: TIME.eyebrow, ease: "power2.out" }, ENTER.eyebrow);
    const chars = SplitText.create(".standard-st-title", { type: "chars" }).chars;
    timeline.from(chars, { opacity: 0, y: FROM.char, filter: FROM.charBlur, duration: values.titleRiseMs / SECOND_MS, ease: "power3.out", stagger: TIME.char }, ENTER.title);
    timeline.from(".standard-st-rise", { opacity: 0, y: FROM.rest, duration: TIME.rest, ease: "power2.out", stagger: TIME.restStagger }, ENTER.rest);
    if (entrance.ticker) timeline.from(".standard-st-ticker", { opacity: 0, y: FROM.ticker, duration: TIME.ticker, ease: "power2.out" }, ENTER.ticker);
    if (entrance.shine) {
      const pause = Math.max(0, values.shineEvery - TIME.shine);
      timeline.fromTo(".standard-st-shine", { x: SHINE.from }, { x: SHINE.to, duration: TIME.shine, ease: "power1.inOut", repeat: -1, repeatDelay: pause }, ENTER.shine);
    }
  }, [kind, entrance.title, values.titleRiseMs, entrance.shine, values.shineEvery, entrance.ticker, entrance.next], stage);
}

// Below the title: countdown and bar (Starting), break time and note (BRB), next stream (Ending); the stream numbers
// are an overlay of their own (scenes/Stats.tsx)
function Below({ kind, values, screen }: { kind: ScreenKind; values: StandardValues; screen: Screen }) {
  const rollMs = SEEK === null ? values.digitRollMs : 0;
  if (kind === "brb") {
    return (
      <>
        {screen.showAway && <div className="standard-st-count standard-st-rise"><Countdown text={shortClock(screen.away)} rollMs={rollMs} /></div>}
        {values.brbNote && <p className="standard-st-note standard-st-rise">{values.brbNote}</p>}
      </>
    );
  }
  if (kind === "ending") return screen.next ? <p className="standard-st-note standard-st-rise">{values.endingNextLabel}: {screen.next}</p> : null;
  return (
    <>
      <div className="standard-st-count standard-st-rise">
        {screen.left > 0 ? <Countdown text={shortClock(screen.left)} rollMs={rollMs} /> : <span className="standard-st-done">{values.countdownDone}</span>}
      </div>
      {values.progressBar && (
        <div className="standard-st-bar standard-st-rise">
          <span className="standard-st-fill" style={{ width: `${screen.progress * PERCENT}%` }} />
          {values.progressShine && <span className="standard-st-shine" />}
        </div>
      )}
    </>
  );
}

export default function LightScreen({ kind }: { kind: ScreenKind }) {
  const values = useStandard();
  const stage = useStage();
  const screen = useScreen({ countdownSeconds: values.countdown, countdownAt: values.countdownAt, ticker: values.ticker, next: values.endingNext });
  const [app, setApp] = useState<Application | null>(null);
  const startedAt = useRef(performance.now());
  const clock = useCallback(() => SEEK ?? (performance.now() - startedAt.current) / SECOND_MS, []);
  const onReady = useCallback((ready: Application) => {
    setApp(ready);
    return () => setApp(null);
  }, []);
  const [eyebrow, title] = {
    starting: [values.startingEyebrow, values.startingTitle],
    brb: [values.brbEyebrow, values.brbTitle],
    ending: [values.endingEyebrow, values.endingTitle],
  }[kind];
  const shine = kind === "starting" && values.progressBar && values.progressShine;
  useEntrance(kind, values, { title, shine, ticker: Boolean(screen.ticker), next: Boolean(screen.next) }, stage);

  return (
    <div className="standard-screen standard-st">
      <PixiStage background={values.background} onReady={onReady} />
      {app && values.blobs && <Aurora app={app} clock={clock} values={values} kind={kind} />}
      {app && <Dust app={app} clock={clock} values={values} kind={kind} />}
      <div className="standard-st-stage stage-box" ref={stage}>
        <div className="standard-st-vignette" />
        {values.grainOn && <div className="standard-st-grain" style={{ opacity: values.grainStrength }}><Grain seed={values.worldSeed} /></div>}
        <header className="standard-st-top">
          <span className="standard-st-channel">{values.channelName}</span>
          {values.showClock && <span className="standard-muted">{new Date(screen.now).toLocaleTimeString(values.locale)}</span>}
        </header>
        <main className="standard-st-center">
          <p className="standard-st-eyebrow">{eyebrow}</p>
          <h1 className="standard-st-title">{title}</h1>
          <Below kind={kind} values={values} screen={screen} />
        </main>
        {screen.ticker && <footer className="standard-st-ticker">{screen.ticker}</footer>}
      </div>
    </div>
  );
}
