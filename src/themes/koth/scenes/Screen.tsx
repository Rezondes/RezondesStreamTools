// Full-screen scenes of the KOTH theme (Starting, BRB, Ending): battlefield per time of day with the hill, in front of it
// the briefing as a tactical map with grid and markers (overline, title, subtitle), below it the countdown to the start of
// the mission, the radio silence or the next mission, rotating quotes as radio lines and a ticker behind a helicopter or
// as a steel bar. Built for 1920x1080, scaled to any source size.
// Stage, countdown, break time, quotes and parameters come from the screens context of the core (src/core/screens).
// Parameter pro Quelle: ?min=5, ?at=20:00, ?next=..., ?ticker=...
import type { CSSProperties } from "react";
import { hash } from "../../../core/hash.ts";
import { rotating, shortClock, type ScreenKind } from "../../../core/screens/screens.ts";
import { useScreen } from "../../../core/screens/useScreen.ts";
import { useStage } from "../../../core/screens/useStage.ts";
import Hill, { type TimeOfDay } from "../Hill.tsx";
import { HELI } from "../hill.ts";
import ShapeIcon from "../ShapeIcon.tsx";
import { useKoth } from "../useKoth.ts";

// fixed: seconds in ms for the rhythm of the quotes
const SECOND_MS = 1000;
// fixed: bars of the radio signal progress
const SIGNAL_BARS = 5;
// fixed: seeds of the marker positions, so the map always looks the same
const markerStyle = (index: number) => ({ "--x": hash(index * 3 + 11), "--y": hash(index * 3 + 12) }) as CSSProperties;

export default function Screen({ kind }: { kind: ScreenKind }) {
  const values = useKoth();
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

  return (
    <div className={`kh-screen power-${values.powerOn}`}>
      <Hill time={time} />
      <div className="kh-stage stage-box" ref={stage}>
        <span className="kh-clock">{new Date(now).toLocaleTimeString(values.locale)}</span>
        <div className={`kh-map${values.mapGrid ? " grid" : ""}`}>
          {Array.from({ length: values.mapMarkers }, (_, index) => (
            <i key={index} className={`kh-marker marker-${index % SIGNAL_BARS}`} style={markerStyle(index)} />
          ))}
          <p className="kh-eyebrow">{eyebrow}</p>
          <h1 className="kh-title">{title}</h1>
          {note && <p className="kh-note">{note}</p>}
        </div>
        {kind === "starting" && (
          <div className="kh-board">
            <b className="kh-big">{left > 0 ? values.countdownPrefix + shortClock(left) : values.countdownDone}</b>
            {values.progressStyle === "balken" && <div className="kh-progress-bar" style={{ "--part": progress } as CSSProperties}><span /></div>}
            {values.progressStyle === "funk" && (
              <div className="kh-progress-signal">
                {Array.from({ length: SIGNAL_BARS }, (_, index) => <i key={index} className={index < Math.round(progress * SIGNAL_BARS) ? "on" : ""} style={{ "--i": index } as CSSProperties} />)}
              </div>
            )}
          </div>
        )}
        {kind === "brb" && <div className="kh-board"><b className="kh-big">{values.afkPrefix + shortClock(away)}</b></div>}
        {kind === "ending" && next && <div className="kh-board"><b className="kh-next">{`${values.endingNextLabel}: ${next}`}</b></div>}
        {saying && <p key={saying} className="kh-saying">{saying}</p>}
      </div>
      {ticker && values.tickerStyle === "heli" && (
        <div className="kh-heli"><span className="kh-banner">{ticker}</span><ShapeIcon shape={HELI} /></div>
      )}
      {ticker && values.tickerStyle === "leiste" && <div className="kh-ticker"><span>{ticker}</span></div>}
    </div>
  );
}
