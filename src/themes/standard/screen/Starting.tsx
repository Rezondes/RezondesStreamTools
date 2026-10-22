// Starting screen of the standard theme (PLAN-STANDARD.md package 1, prototype refs/starting.html): soft light fields
// in both accents with rising light dust in a PixiJS stage, a vignette and fine grain over it. Then GSAP brings in the
// top line, the overline, the title letter by letter rising out of a blur, the rolling countdown with its bar and the
// note at the bottom; a shine runs over the bar every few seconds. ?t=<s> shows a still with the digits settled.
import { SplitText } from "gsap/SplitText";
import type { Application } from "pixi.js";
import { useCallback, useRef, useState } from "react";
import { seekFromQuery } from "../../../core/motion/seek.ts";
import { useTimeline } from "../../../core/motion/useTimeline.ts";
import PixiStage from "../../../core/pixi/PixiStage.tsx";
import { shortClock } from "../../../core/screens/screens.ts";
import { useScreen } from "../../../core/screens/useScreen.ts";
import { useStage } from "../../../core/screens/useStage.ts";
import Aurora from "../pixi/Aurora.tsx";
import Dust from "../pixi/Dust.tsx";
import { useStandard } from "../useStandard.ts";
import Countdown from "./Countdown.tsx";
import Grain from "./Grain.tsx";

// fixed: seconds in ms
const SECOND_MS = 1000;
// fixed: percent for the width of the progress bar
const PERCENT = 100;
// fixed: the order of the entrance in s, like the prototype
const ENTER = { top: 0.2, eyebrow: 0.5, title: 0.8, clock: 1.6, ticker: 2.2, shine: 2.6 };
// fixed: how far things rise in px and how blurred they start, like the prototype
const FROM = { eyebrow: 14, eyebrowBlur: "blur(6px)", char: 46, charBlur: "blur(12px)", clock: 20, ticker: 12 };
// fixed: durations in s and the stagger between letters and between clock and bar, like the prototype
const TIME = { top: 0.8, eyebrow: 0.7, clock: 0.8, ticker: 0.8, char: 0.035, clockBar: 0.15, shine: 1.2 };
// fixed: the shine starts left of the bar and ends right of it, in px
const SHINE = { from: -140, to: 900 };
const SEEK = seekFromQuery(location.search);

export default function Starting() {
  const values = useStandard();
  const stage = useStage();
  const { now, left, progress, ticker } = useScreen({ countdownSeconds: values.countdown, ticker: values.ticker, next: values.endingNext });
  const [app, setApp] = useState<Application | null>(null);
  const startedAt = useRef(performance.now());
  const clock = useCallback(() => SEEK ?? (performance.now() - startedAt.current) / SECOND_MS, []);
  const onReady = useCallback((ready: Application) => {
    setApp(ready);
    return () => setApp(null);
  }, []);

  useTimeline(timeline => {
    timeline.from(".standard-st-top", { opacity: 0, duration: TIME.top }, ENTER.top);
    timeline.from(".standard-st-eyebrow", { opacity: 0, y: FROM.eyebrow, filter: FROM.eyebrowBlur, duration: TIME.eyebrow, ease: "power2.out" }, ENTER.eyebrow);
    const chars = SplitText.create(".standard-st-title", { type: "chars" }).chars;
    timeline.from(chars, { opacity: 0, y: FROM.char, filter: FROM.charBlur, duration: values.titleRiseMs / SECOND_MS, ease: "power3.out", stagger: TIME.char }, ENTER.title);
    timeline.from([".standard-st-count", ".standard-st-bar"], { opacity: 0, y: FROM.clock, duration: TIME.clock, ease: "power2.out", stagger: TIME.clockBar }, ENTER.clock);
    timeline.from(".standard-st-ticker", { opacity: 0, y: FROM.ticker, duration: TIME.ticker, ease: "power2.out" }, ENTER.ticker);
    if (values.progressBar && values.progressShine) {
      const pause = Math.max(0, values.shineEvery - TIME.shine);
      timeline.fromTo(".standard-st-shine", { x: SHINE.from }, { x: SHINE.to, duration: TIME.shine, ease: "power1.inOut", repeat: -1, repeatDelay: pause }, ENTER.shine);
    }
  }, [values.titleRiseMs, values.startingTitle, values.progressBar, values.progressShine, values.shineEvery, Boolean(ticker)], stage);

  return (
    <div className="standard-screen standard-st">
      <PixiStage background={values.background} onReady={onReady} />
      {app && values.blobs && <Aurora app={app} clock={clock} values={values} />}
      {app && <Dust app={app} clock={clock} values={values} />}
      <div className="standard-st-stage stage-box" ref={stage}>
        <div className="standard-st-vignette" />
        {values.grainOn && <div className="standard-st-grain" style={{ opacity: values.grainStrength }}><Grain seed={values.worldSeed} /></div>}
        <header className="standard-st-top">
          <span className="standard-st-channel">{values.channelName}</span>
          {values.showClock && <span className="standard-muted">{new Date(now).toLocaleTimeString(values.locale)}</span>}
        </header>
        <main className="standard-st-center">
          <p className="standard-st-eyebrow">{values.startingEyebrow}</p>
          <h1 className="standard-st-title">{values.startingTitle}</h1>
          <div className="standard-st-count">
            {left > 0 ? <Countdown text={shortClock(left)} rollMs={SEEK === null ? values.digitRollMs : 0} /> : <span className="standard-st-done">{values.countdownDone}</span>}
          </div>
          {values.progressBar && (
            <div className="standard-st-bar">
              <span className="standard-st-fill" style={{ width: `${progress * PERCENT}%` }} />
              {values.progressShine && <span className="standard-st-shine" />}
            </div>
          )}
        </main>
        {ticker && <footer className="standard-st-ticker">{ticker}</footer>}
      </div>
    </div>
  );
}
