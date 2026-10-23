// Full-screen scenes: Starting Soon, BRB, Ending. Built for 1920x1080, scaled to any source size.
// Texts, terminal, countdown, ticker and animations come from the settings. The code rain is PixiJS (pixi/Rain.tsx);
// the CRT switches on like a tube (a bright line opens with a flash) and now and then glitches in slices while the rain
// shakes, both on one GSAP timeline (PLAN-MATRIX.md package 1). BRB: the rain runs slow and dark, every few seconds a
// reconnect attempt pulls it, types a line and glitches. Ending: the numbers of the stream count up, then the rain falls
// out of the picture and the CRT switches off to a line and a dot, the next stream stays (package 2).
// Stage, countdown, break time and parameters come from the screens context of the core (src/core/screens).
// Countdown, ticker and next stream come from the settings (useScreen).
import gsap from "gsap";
import { type RefObject, useMemo, useRef } from "react";
import type { SceneClock } from "../../../core/motion/useClockValue.ts";
import { useTimeline } from "../../../core/motion/useTimeline.ts";
import Rain, { type RainControl } from "../pixi/Rain.tsx";
import { GLITCH, glitchKeys, POWER, powerOn } from "../crtMotion.ts";
import { rainTime, type Tempo } from "../rain.ts";
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
const POWER_AT = 0.3; // fixed: when the CRT switches on (s)
// fixed: a reconnect attempt: how long the rain pulls (s), how long the line types (s) and stays (s)
const RETRY = { pull: 0.8, type: 0.5, stay: 1.6 };
// The Ending: when the numbers start counting after the power on (s) and how far apart (s), how long the rain falls out
// before the CRT switches off (s), the switch off (line, dot, s)
const LOGOUT = { fall: 1.6, line: 0.25, dot: 0.2 }; // fixed: timing of the CRT switching off at the end
const DAY = 86400; // fixed: how long the scene clock runs (s)

// The speed of the rain over the time of a scene
function tempoOf(kind: ScreenKind, values: MatrixValues): Tempo {
  if (kind !== "brb") return { base: values.rainSpeed };
  return { base: values.rainSpeed * values.brbRainSpeed, pulls: { every: values.brbRetryEvery, length: RETRY.pull, boost: values.rainSpeed } };
}

// The power on of the CRT and its glitches (the rain shakes during a glitch), the reconnect attempts of the BRB and the
// switch off of the Ending; the scene clock runs along for the counting numbers
function useCrtMotion(scope: RefObject<HTMLDivElement | null>, kind: ScreenKind, values: MatrixValues, control: { current: RainControl }, sceneClock: SceneClock) {
  useTimeline(timeline => {
    const root = scope.current;
    const crt = root?.querySelector(".crt");
    const flash = root?.querySelector(".crt-flash");
    if (!root || !crt || !flash) return;
    sceneClock.time = 0;
    control.current.drain = null;
    timeline.to(sceneClock, { time: DAY, duration: DAY, ease: "none" }, 0);
    const on = values.crtOnMs / SECOND_MS;
    if (values.powerOn === "crt") powerOn(timeline, crt, POWER_AT, on, flash);
    const retry = root.querySelector(".retry");
    if (kind === "brb" && retry) {
      const attempt = gsap.timeline({ repeat: -1, repeatDelay: values.brbRetryEvery });
      attempt.fromTo(retry, { text: "", opacity: 1 }, { text: values.brbRetryText, duration: RETRY.type, ease: "none" }, 0)
        .to(crt, { keyframes: glitchKeys(), duration: GLITCH.length, ease: "steps(3)" }, 0)
        .set(control.current, { jitter: 1 }, 0)
        .set(control.current, { jitter: 0 }, GLITCH.length)
        .to(retry, { opacity: 0, duration: RETRY.type }, RETRY.stay);
      timeline.add(attempt, values.brbRetryEvery);
    }
    const after = root.querySelector(".after-off");
    if (kind === "ending" && after && values.crtOffAt > 0) {
      const off = values.crtOffAt;
      timeline.set(control.current, { drain: rainTime(off, tempoOf(kind, values)) }, off)
        .to(crt, { scaleY: POWER.thin, filter: `brightness(${POWER.bright})`, duration: LOGOUT.line, ease: "power2.in" }, off + LOGOUT.fall)
        .to(crt, { scaleX: 0, duration: LOGOUT.dot, ease: "power2.in" }, off + LOGOUT.fall + LOGOUT.line)
        .fromTo(after, { opacity: 0 }, { opacity: 1, duration: on }, off + LOGOUT.fall + LOGOUT.line + LOGOUT.dot);
    }
    if (!values.glitchOn) return;
    const glitch = gsap.timeline({ repeat: -1, repeatDelay: values.glitchEvery });
    glitch.to(crt, { keyframes: glitchKeys(), duration: GLITCH.length, ease: "steps(3)" })
      .set(control.current, { jitter: 1 }, 0)
      .set(control.current, { jitter: 0 }, GLITCH.length);
    timeline.add(glitch, POWER_AT + on + values.glitchEvery);
  }, [kind, values.powerOn, values.crtOnMs, values.glitchOn, values.glitchEvery, values.brbRetryEvery, values.brbRetryText, values.crtOffAt, values.rainSpeed, values.brbRainSpeed], scope);
}

// What the rain reads every frame: its speed over the scene time, the glitch shake and the end of the rain
function useRainControl(kind: ScreenKind, values: MatrixValues) {
  const control = useRef<RainControl>({ tempo: seconds => seconds, jitter: 0, drain: null });
  const tempo = tempoOf(kind, values);
  control.current.tempo = seconds => rainTime(seconds, tempo);
  return control;
}

export default function Screen({ kind }: { kind: ScreenKind }) {
  const values = useMatrix();
  const stage = useStage();
  const scope = useRef<HTMLDivElement>(null);
  const control = useRainControl(kind, values);
  const sceneClock = useRef<SceneClock>({ time: 0 }).current;
  useCrtMotion(scope, kind, values, control, sceneClock);
  const screen = useScreen({ countdownSeconds: values.countdown, countdownAt: values.countdownAt, ticker: values.ticker, next: values.endingNext });
  const { now, left, away, showAway, ticker, next } = screen;
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
              {showAway && <div className="big">{values.afkPrefix}{clock(away)}</div>}
              <div className="muted">{values.brbNote}</div>
              <div className="retry" />
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
        {kind === "ending" && values.crtOffAt > 0 && <div className="after-off glow">{next ? `${values.endingNextLabel}${next}` : values.endingThanks}</div>}
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
