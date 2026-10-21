// Full-screen scenes: Starting Soon, BRB, Ending. Built for 1920x1080, scaled to any source size.
// Texts, terminal, countdown, ticker and animations come from the settings. The code rain is PixiJS (pixi/Rain.tsx);
// the CRT switches on like a tube (a bright line opens with a flash) and now and then glitches in slices while the rain
// shakes, both on one GSAP timeline (PLAN-MATRIX.md package 1).
// Stage, countdown, break time and parameters come from the screens context of the core (src/core/screens).
// Parameters per source: ?min=5 or ?at=20:00 (countdown, starting only), ?next=Friday 8 pm (ending), ?ticker=text
import gsap from "gsap";
import { type RefObject, useMemo, useRef } from "react";
import { useTimeline } from "../../../core/motion/useTimeline.ts";
import Rain, { type RainControl } from "../pixi/Rain.tsx";
import type { MatrixValues } from "../settings.ts";
import { clock } from "../../../core/overlayTiming.ts";
import type { ScreenKind } from "../../../core/screens/screens.ts";
import { useScreen } from "../../../core/screens/useScreen.ts";
import { useStage } from "../../../core/screens/useStage.ts";
import { fillTemplate, textBar } from "../../../core/template.ts";
import { parseLine } from "../../../core/typing.ts";
import { useTerminal } from "../../../core/hooks/useTerminal.ts";
import { useMatrixDecode } from "../useMatrixDecode.ts";
import { placeholders, useMatrix } from "../useMatrix.ts";

// fixed: percentage display and repetitions of the ticker text (the animation runs over half the width)
const SHOW = { percent: 100, tickerRepeat: 6 };
const SECOND_MS = 1000; // fixed: seconds in ms
// When the CRT switches on (s), the share of its time for the line and for opening, the line height, how bright the
// tube starts and how strong the flash is
const POWER = { at: 0.3, line: 0.47, open: 0.53, thin: 0.004, bright: 4, flash: 0.9 }; // fixed: the tube of the prototype
// The glitch: length (s), the slices it jumps in (shift px, inset of the clip) and the bright edge
// fixed: the glitch of the prototype
const GLITCH = { length: 0.2, slices: [{ x: -12, clip: "inset(10% 0 60% 0)" }, { x: 9, clip: "inset(45% 0 20% 0)" }], bright: 1.6 };

// The power on of the CRT and its glitches; the rain shakes during a glitch
function useCrtMotion(scope: RefObject<HTMLDivElement | null>, values: MatrixValues, control: { current: RainControl }) {
  useTimeline(timeline => {
    const crt = scope.current?.querySelector(".crt");
    const flash = scope.current?.querySelector(".crt-flash");
    if (!crt || !flash) return;
    const on = values.crtOnMs / SECOND_MS;
    if (values.powerOn === "crt") {
      timeline.fromTo(crt, { scaleX: 0, scaleY: POWER.thin, filter: `brightness(${POWER.bright})` }, { scaleX: 1, duration: on * POWER.line, ease: "power3.out" }, POWER.at)
        .to(crt, { scaleY: 1, duration: on * POWER.open, ease: "expo.out" }, POWER.at + on * POWER.line)
        .fromTo(flash, { opacity: POWER.flash }, { opacity: 0, duration: on, ease: "power2.out" }, POWER.at + on * POWER.line)
        .to(crt, { filter: "brightness(1)", duration: on }, POWER.at + on);
    }
    if (!values.glitchOn) return;
    const glitch = gsap.timeline({ repeat: -1, repeatDelay: values.glitchEvery });
    glitch.to(crt, { keyframes: [...GLITCH.slices.map(slice => ({ x: slice.x, clipPath: slice.clip, filter: `brightness(${GLITCH.bright})` })), { x: 0, clipPath: "inset(0% 0% 0% 0%)", filter: "brightness(1)" }], duration: GLITCH.length, ease: "steps(3)" })
      .set(control.current, { jitter: 1 }, 0)
      .set(control.current, { jitter: 0 }, GLITCH.length);
    timeline.add(glitch, POWER.at + on + values.glitchEvery);
  }, [values.powerOn, values.crtOnMs, values.glitchOn, values.glitchEvery], scope);
}

export default function Screen({ kind }: { kind: ScreenKind }) {
  const values = useMatrix();
  const stage = useStage();
  const scope = useRef<HTMLDivElement>(null);
  const control = useRef<RainControl>({ tempo: seconds => seconds * values.rainSpeed, jitter: 0 });
  control.current.tempo = seconds => seconds * values.rainSpeed;
  useCrtMotion(scope, values, control);
  const screen = useScreen({ countdownSeconds: values.countdown, ticker: values.ticker, next: values.endingNext });
  const { now, left, away, ticker, next } = screen;
  const title = useMatrixDecode({ starting: values.startingTitle, brb: values.brbTitle, ending: values.endingTitle }[kind], "screenTitle");
  const logo = useMatrixDecode(values.logo, "logo");

  const progress = kind === "starting" ? screen.progress : 0;

  return (
    <div ref={scope} className={`screen-scene power-${values.powerOn}`}>
      {values.rainScreens && <Rain opacity={values.rainOpacityScreens} control={control} />}
      <div className="stage stage-box" ref={stage}>
        <div className="crt">
          <div className="crt-flash" aria-hidden="true" />
          <header className="crt-bar">
            <span>{fillTemplate(values.sceneHeader, { ...placeholders(values), scene: kind })}</span>
            <span className="blink">{values.liveText}</span>
            <span>{new Date(now).toLocaleTimeString(values.locale)}</span>
          </header>

          {values.screenLogo && <pre className="logo">{logo}</pre>}
          <h1 className="title glow">{title}<span className="cursor">{values.cursor}</span></h1>

          {kind === "starting" && (
            <div className="status">
              <div className="big">{left > 0 ? `${values.countdownPrefix}${clock(left)}` : values.countdownDone}</div>
              {values.progressBar && (
                <div className="bar">
                  [{textBar(progress, values.progressWidth, values.barFull, values.barEmpty)}] {Math.round(progress * SHOW.percent)}%
                </div>
              )}
            </div>
          )}
          {kind === "brb" && (
            <div className="status">
              <div className="big">{values.afkPrefix}{clock(away)}</div>
              <div className="muted">{values.brbNote}</div>
            </div>
          )}
          {kind === "ending" && (
            <div className="status">
              <div className="big">{values.endingThanks}</div>
              {next && <div className="muted">{values.endingNextLabel}{next}</div>}
            </div>
          )}

          {values.terminal && <Terminal source={{ starting: values.startingLines, brb: values.brbLines, ending: values.endingLines }[kind]} />}
        </div>
        {ticker && (
          <div className="ticker"><span>{`${ticker}${values.tickerSeparator}`.repeat(SHOW.tickerRepeat)}</span></div>
        )}
      </div>
    </div>
  );
}

// Types the lines from the settings one after another (including typos), endlessly in a loop
function Terminal({ source }: { source: readonly string[] }) {
  const values = useMatrix();
  const lines = useMemo(() => source.map(parseLine), [source]);
  const { shown, typing } = useTerminal(lines, {
    visible: values.terminalVisible,
    startDelayMs: values.terminalStartDelay,
    pauseMinMs: values.terminalPauseMin,
    pauseMaxMs: Math.max(values.terminalPauseMin, values.terminalPauseMax),
    speed: values.typingSpeed,
  });
  const prompt = fillTemplate(values.prompt, placeholders(values));

  return (
    <div className="term">
      {shown.map((line, index) => <div key={index} className="muted">{prompt} {line}</div>)}
      <div>{prompt} {typing}<span className="cursor">{values.cursor}</span></div>
    </div>
  );
}
