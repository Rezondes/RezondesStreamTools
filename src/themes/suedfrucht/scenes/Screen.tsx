// Vollbild-Szenen des Südfrucht-Themes (Starting, BRB, Ending): Strandkulisse je Tageszeit, Holzschild mit Überzeile,
// Titel und Untertitel, darunter Countdown, Pausenzeit oder nächster Stream, wechselnde Sprüche und ein Ticker am
// Flugzeug oder als Holzleiste. Für 1920x1080 gebaut, skaliert auf jede Quellgrösse.
// Bühne, Countdown, Pausenzeit, Sprüche und Parameter kommen aus dem Screens-Kontext des Kerns (src/core/screens).
// Parameter pro Quelle: ?min=5, ?at=20:00, ?next=..., ?ticker=...
import type { CSSProperties } from "react";
import { rotating, shortClock, type ScreenKind } from "../../../core/screens/screens.ts";
import { useScreen } from "../../../core/screens/useScreen.ts";
import { useStage } from "../../../core/screens/useStage.ts";
import Beach, { type TimeOfDay } from "../Beach.tsx";
import { PLANE } from "../beach.ts";
import ShapeIcon from "../ShapeIcon.tsx";
import { useSuedfrucht } from "../useSuedfrucht.ts";

// fixed: Sekunden in ms für den Takt der Sprüche
const SECOND_MS = 1000;

export default function Screen({ kind }: { kind: ScreenKind }) {
  const values = useSuedfrucht();
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
    <div className={`sf-screen power-${values.powerOn}`}>
      <Beach time={time} />
      <div className="sf-stage" ref={stage}>
        <span className="sf-clock">{new Date(now).toLocaleTimeString(values.locale)}</span>
        <div className={`sf-sign sf-wood sf-sign-${values.signStyle}`}>
          <p className="sf-eyebrow">{eyebrow}</p>
          <h1 className="sf-title">{title}</h1>
          {note && <p className="sf-note">{note}</p>}
        </div>
        {kind === "starting" && (
          <div className="sf-board sf-wood">
            <b className="sf-big">{left > 0 ? values.countdownPrefix + shortClock(left) : values.countdownDone}</b>
            {values.progressStyle !== "aus" && (
              <div className={`sf-progress sf-progress-${values.progressStyle}`} style={{ "--part": progress } as CSSProperties}><span /></div>
            )}
          </div>
        )}
        {kind === "brb" && <div className="sf-board sf-wood"><b className="sf-big">{values.afkPrefix + shortClock(away)}</b></div>}
        {kind === "ending" && next && <div className="sf-board sf-wood"><b className="sf-next">{`${values.endingNextLabel}: ${next}`}</b></div>}
        {saying && <p key={saying} className="sf-saying">{saying}</p>}
      </div>
      {ticker && values.tickerStyle === "flugzeug" && (
        <div className="sf-plane"><span className="sf-banner">{ticker}</span><ShapeIcon shape={PLANE} /></div>
      )}
      {ticker && values.tickerStyle === "leiste" && <div className="sf-ticker sf-wood"><span>{ticker}</span></div>}
    </div>
  );
}
