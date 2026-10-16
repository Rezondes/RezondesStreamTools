// Vollbild-Szenen des Südfrucht-Themes (Starting, BRB, Ending): Strandkulisse je Tageszeit, Holzschild mit Überzeile,
// Titel und Untertitel, darunter Countdown, Pausenzeit oder nächster Stream, wechselnde Sprüche und ein Ticker am
// Flugzeug oder als Holzleiste. Für 1920x1080 gebaut, skaliert auf jede Quellgrösse.
// Parameter pro Quelle: ?min=5, ?at=20:00, ?next=..., ?ticker=...
import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useNow } from "../../../core/hooks/useNow.ts";
import { clock, countdownEnd } from "../../../core/overlayTiming.ts";
import { numberParam, params } from "../../../core/params.ts";
import Beach, { type TimeOfDay } from "../Beach.tsx";
import { PLANE } from "../beach.ts";
import ShapeIcon from "../ShapeIcon.tsx";
import { useSuedfrucht } from "../useSuedfrucht.ts";

type Kind = "starting" | "brb" | "ending";

// fixed: Bühnengrösse, auf die alle Masse der Vollbild-Szenen ausgelegt sind (theme.css .sf-stage)
const STAGE = { width: 1920, height: 1080 };
// fixed: Umrechnungen; unter einer Stunde zeigt die Uhr nur Minuten:Sekunden (clock liefert HH:MM:SS, ab Zeichen 3)
const TIME = { secondMs: 1000, minuteSeconds: 60, hourSeconds: 3600, minutesFrom: 3 };

const short = (seconds: number) => (seconds < TIME.hourSeconds ? clock(seconds).slice(TIME.minutesFrom) : clock(seconds));

export default function Screen({ kind }: { kind: Kind }) {
  const values = useSuedfrucht();
  const stage = useStage();
  const [start] = useState(Date.now);
  const now = useNow();
  const minutes = numberParam("min", values.countdown / TIME.minuteSeconds);
  const end = useMemo(() => countdownEnd(params.get("at"), minutes * TIME.minuteSeconds, new Date(start)), [minutes, start]);
  const left = Math.max(0, (end - now) / TIME.secondMs);
  const progress = end > start ? 1 - (left * TIME.secondMs) / (end - start) : 1;
  const [eyebrow, title, note] = {
    starting: [values.startingEyebrow, values.startingTitle, values.startingNote],
    brb: [values.brbEyebrow, values.brbTitle, values.brbNote],
    ending: [values.endingEyebrow, values.endingTitle, values.endingNote],
  }[kind];
  const time = { starting: values.timeStarting, brb: values.timeBrb, ending: values.timeEnding }[kind] as TimeOfDay;
  const sayings = { starting: values.startingLines, brb: values.brbLines, ending: values.endingLines }[kind];
  const saying = sayings.length ? sayings[Math.floor((now - start) / (values.linesEvery * TIME.secondMs)) % sayings.length] : "";
  const next = params.get("next") ?? values.endingNext;
  const ticker = params.get("ticker") ?? values.ticker;

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
            <b className="sf-big">{left > 0 ? values.countdownPrefix + short(left) : values.countdownDone}</b>
            {values.progressStyle !== "aus" && (
              <div className={`sf-progress sf-progress-${values.progressStyle}`} style={{ "--part": progress } as CSSProperties}><span /></div>
            )}
          </div>
        )}
        {kind === "brb" && <div className="sf-board sf-wood"><b className="sf-big">{values.afkPrefix + short((now - start) / TIME.secondMs)}</b></div>}
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
