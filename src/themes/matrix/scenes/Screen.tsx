// Full-screen scenes: Starting Soon, BRB, Ending. Built for 1920x1080, scaled to any source size.
// Texts, terminal, countdown, ticker and animations come from the settings.
// Stage, countdown, break time and parameters come from the screens context of the core (src/core/screens).
// Parameters per source: ?min=5 or ?at=20:00 (countdown, starting only), ?next=Friday 8 pm (ending), ?ticker=text
import { useMemo } from "react";
import MatrixRain from "../MatrixRain.tsx";
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

export default function Screen({ kind }: { kind: ScreenKind }) {
  const values = useMatrix();
  const stage = useStage();
  const screen = useScreen({ countdownSeconds: values.countdown, ticker: values.ticker, next: values.endingNext });
  const { now, left, away, ticker, next } = screen;
  const title = useMatrixDecode({ starting: values.startingTitle, brb: values.brbTitle, ending: values.endingTitle }[kind], "screenTitle");
  const logo = useMatrixDecode(values.logo, "logo");

  const progress = kind === "starting" ? screen.progress : 0;

  return (
    <div className={`screen-scene power-${values.powerOn}`}>
      {values.rainScreens && <MatrixRain size={values.rainSizeScreens} opacity={values.rainOpacityScreens} />}
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
