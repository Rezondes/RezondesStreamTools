// Vollbild-Szenen: Starting Soon, BRB, Ending. Für 1920x1080 gebaut, skaliert auf jede Quellgrösse.
// Texte, Terminal, Countdown, Ticker und Animationen kommen aus den Einstellungen.
// Parameter pro Quelle: ?min=5 oder ?at=20:00 (Countdown, nur starting), ?next=Freitag 20 Uhr (ending), ?ticker=Text
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import MatrixRain from "../MatrixRain.tsx";
import { numberParam, params } from "../../../core/params.ts";
import { clock, countdownEnd } from "../../../core/overlayTiming.ts";
import { fillTemplate, textBar } from "../../../core/template.ts";
import { parseLine } from "../../../core/typing.ts";
import { useNow } from "../../../core/hooks/useNow.ts";
import { useTerminal } from "../../../core/hooks/useTerminal.ts";
import { useMatrixDecode } from "../decode.ts";
import { placeholders, useMatrix } from "../values.ts";

type Kind = "starting" | "brb" | "ending";

// fixed: Bühnengrösse, auf die alle Masse der Vollbild-Szenen ausgelegt sind (theme.css .stage)
const STAGE = { width: 1920, height: 1080 };
// fixed: Umrechnungen von Sekunden und Minuten
const TIME = { secondMs: 1000, minuteSeconds: 60 };
// fixed: Prozentanzeige und Wiederholungen des Ticker-Texts (die Animation läuft über die halbe Breite)
const SHOW = { percent: 100, tickerRepeat: 6 };

export default function Screen({ kind }: { kind: Kind }) {
  const values = useMatrix();
  const stage = useStage();
  const [start] = useState(Date.now);
  const now = useNow();
  const minutes = numberParam("min", values.countdown / TIME.minuteSeconds);
  const end = useMemo(() => countdownEnd(params.get("at"), minutes * TIME.minuteSeconds, new Date(start)), [minutes, start]);
  const title = useMatrixDecode({ starting: values.startingTitle, brb: values.brbTitle, ending: values.endingTitle }[kind], "screenTitle");
  const logo = useMatrixDecode(values.logo, "logo");

  const left = Math.max(0, (end - now) / TIME.secondMs);
  const progress = kind === "starting" && end > start ? 1 - (left * TIME.secondMs) / (end - start) : 0;
  const ticker = params.get("ticker") ?? values.ticker;
  const next = params.get("next") ?? values.endingNext;

  return (
    <div className={`screen-scene power-${values.powerOn}`}>
      {values.rainScreens && <MatrixRain size={values.rainSizeScreens} opacity={values.rainOpacityScreens} />}
      <div className="stage" ref={stage}>
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
              <div className="big">{values.afkPrefix}{clock((now - start) / TIME.secondMs)}</div>
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

// Tippt die Zeilen aus den Einstellungen nacheinander ab (inklusive Vertipper), endlos im Kreis
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

// Skaliert die Bühne auf das Fenster bzw. die OBS-Quelle
function useStage() {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const fit = () => ref.current?.style.setProperty("--s", String(Math.min(innerWidth / STAGE.width, innerHeight / STAGE.height)));
    fit();
    addEventListener("resize", fit);
    return () => removeEventListener("resize", fit);
  }, []);
  return ref;
}
