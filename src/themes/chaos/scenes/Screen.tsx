// Full-screen scenes of the Chaos theme (Starting, BRB, Ending): the wall full of scribbles with the scene's brush
// strokes (two X as standard, each scene its own), the channel name as a tag in the corner, in the middle overline, the
// sprayed title, then per scene the countdown with zigzag or bar progress (Starting), the break time (BRB) or the next
// stream on tape (Ending) as a glowing marker number, rotating quotes, and the ticker on tape at the bottom. Power on:
// the strokes are sprayed in, the scribbles draw themselves, the title lights up last. Built for 1920x1080, scaled to
// any source size. All three are painted in PixiJS (PLAN-CHAOS.md packages 6 and 7), each with its own seed: brush
// strokes with neon glow and spray mist, the scribbles boil through three takes (slower at BRB), the title is sprayed on
// (at the Ending with more drips), and after the build everything keeps moving.
// Stage, countdown, break time and parameters come from the screens context of the core (src/core/screens).
// Countdown, ticker and next stream come from the settings (useScreen). ?t=<s> shows a still.
import gsap from "gsap";
import { type RefObject, useEffect, useRef } from "react";
import { seekFromQuery } from "../../../core/motion/seek.ts";
import { useTimeline } from "../../../core/motion/useTimeline.ts";
import { rotating, shortClock, type ScreenKind } from "../../../core/screens/screens.ts";
import { useScreen } from "../../../core/screens/useScreen.ts";
import { useStage } from "../../../core/screens/useStage.ts";
import Progress from "../Progress.tsx";
import PaintedWall from "../PaintedWall.tsx";
import SprayTitle from "../SprayTitle.tsx";
import type { GestureKind } from "../strokes.ts";
import { glitchAt } from "../idle.ts";
import type { ChaosValues } from "../settings.ts";
import { useChaos } from "../useChaos.ts";

// fixed: seconds in ms for the rhythm of the quotes
const SECOND_MS = 1000;
const SEEK = seekFromQuery(location.search);
// fixed: the second copy of the title glitches this much later (s)
const GLITCH_LAG = 0.08;
// fixed: the eyebrow scrambles in before the title (s, how long, with which glyphs)
const EYEBROW = { at: 1.4, length: 0.6, chars: "!?#@*%&$" };
// fixed: the number slaps on after the title (s, how big and turned it starts, how long, the shake)
const SLAP = { at: 2.8, scale: 2.6, turn: -10, length: 0.32, shake: [-8, 6, -3, 0] };

// The glitch of the title (two shifted copies) from the time, glitchEvery apart (idle.ts)
function useTitleGlitch(scope: RefObject<HTMLDivElement | null>, every: number) {
  useEffect(() => {
    const started = performance.now();
    const tick = () => {
      const title = scope.current?.querySelector<HTMLElement>(".ch-title");
      if (!title) return;
      const seconds = SEEK ?? (performance.now() - started) / SECOND_MS;
      for (const [name, at] of [["a", seconds], ["b", seconds - GLITCH_LAG]] as const) {
        const slice = glitchAt(at, every);
        title.style.setProperty(`--g${name}-on`, slice ? "1" : "0");
        title.style.setProperty(`--g${name}-x`, String(slice?.shift ?? 0));
        title.style.setProperty(`--g${name}-clip`, slice?.clip ?? "inset(0% 0% 0% 0%)");
      }
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [scope, every]);
}

// The eyebrow scrambles in, the big number slaps on and shakes
function useScreenEntry(scope: RefObject<HTMLDivElement | null>, values: ChaosValues, kind: ScreenKind) {
  useTimeline(timeline => {
    const eyebrow = scope.current?.querySelector(".ch-eyebrow");
    if (eyebrow?.textContent) timeline.from(eyebrow, { duration: EYEBROW.length, scrambleText: { text: eyebrow.textContent, chars: EYEBROW.chars } }, EYEBROW.at);
    const big = scope.current?.querySelector(".ch-big");
    if (big) {
      timeline.from(big, { opacity: 0, scale: SLAP.scale, rotate: SLAP.turn, duration: SLAP.length, ease: "power4.in" }, SLAP.at)
        .to(big, { keyframes: SLAP.shake.map(x => ({ x })), duration: SLAP.length, ease: "none" }, SLAP.at + SLAP.length);
    }
  }, [kind, values.powerOn], scope);
}

export default function Screen({ kind }: { kind: ScreenKind }) {
  const values = useChaos();
  const stage = useStage();
  const { now, start, left, progress, away, showAway, ticker, next } = useScreen({ countdownSeconds: values.countdown, countdownAt: values.countdownAt, ticker: values.ticker, next: values.endingNext });
  const scene = {
    starting: { eyebrow: values.startingEyebrow, title: values.startingTitle, lines: values.startingLines, gesture: values.gestureStarting, color: values.gestureColorStarting },
    brb: { eyebrow: values.brbEyebrow, title: values.brbTitle, lines: values.brbLines, gesture: values.gestureBrb, color: values.gestureColorBrb },
    ending: { eyebrow: values.endingEyebrow, title: values.endingTitle, lines: values.endingLines, gesture: values.gestureEnding, color: values.gestureColorEnding },
  }[kind];
  const saying = rotating(scene.lines, values.linesEvery * SECOND_MS, now - start);
  const scope = useRef<HTMLDivElement>(null);
  useTitleGlitch(scope, values.glitchEvery);
  useScreenEntry(scope, values, kind);

  return (
    <div ref={scope} className={`ch-screen ch-painted power-${values.powerOn}`}>
      <PaintedWall seed={kind} gesture={scene.gesture as GestureKind} mainColor={scene.color} boilFps={kind === "brb" ? values.brbBoilFps : values.boilFps} />
      <div className="ch-stage stage-box" ref={stage}>
        <span className="ch-tag">{values.channelName}</span>
        <main className="ch-center">
          <p className="ch-eyebrow">{scene.eyebrow}</p>
          <SprayTitle text={scene.title} seed={kind} extraDrips={kind === "ending" ? values.endingDrips : 0} />
          {kind === "starting" && (
            <>
              <b className="ch-big">{left > 0 ? values.countdownPrefix + shortClock(left) : values.countdownDone}</b>
              {values.progressStyle !== "aus" && <Progress share={progress} look={values.progressStyle === "balken" ? "balken" : "zickzack"} />}
            </>
          )}
          {kind === "brb" && showAway && <b className="ch-big">{values.afkPrefix + shortClock(away)}</b>}
          {kind === "ending" && next && <p className="ch-next">{`${values.endingNextLabel}: ${next}`}</p>}
          {saying && <p key={saying} className="ch-saying">{saying}</p>}
        </main>
      </div>
      {ticker && <div className="ch-ticker"><span>{ticker}</span></div>}
    </div>
  );
}
