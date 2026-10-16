// Vollbild-Szenen des Standard-Themes (Starting, BRB, Ending): ruhiger Hintergrund mit langsam wandernden
// Farbflächen, in der Mitte Überzeile und Titel, dazu Countdown mit Fortschritt, Pausenzeit oder nächster Stream.
// Für 1920x1080 gebaut, skaliert auf jede Quellgrösse. Parameter pro Quelle: ?min=5, ?at=20:00, ?next=..., ?ticker=...
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { numberParam, params } from "../../../core/params.ts";
import { clock, countdownEnd } from "../../../core/overlayTiming.ts";
import { useNow } from "../../../core/hooks/useNow.ts";
import { useStandard } from "../useStandard.ts";

type Kind = "starting" | "brb" | "ending";

// fixed: Bühnengrösse, auf die alle Masse der Vollbild-Szenen ausgelegt sind (theme.css .standard-stage)
const STAGE = { width: 1920, height: 1080 };
// fixed: Umrechnungen; unter einer Stunde zeigt die Uhr nur Minuten:Sekunden (clock liefert HH:MM:SS, ab Zeichen 3)
const TIME = { secondMs: 1000, minuteSeconds: 60, hourSeconds: 3600, minutesFrom: 3 };
// fixed: Prozent für die Breite des Fortschrittsbalkens
const PERCENT = 100;

const short = (seconds: number) => (seconds < TIME.hourSeconds ? clock(seconds).slice(TIME.minutesFrom) : clock(seconds));

export default function Screen({ kind }: { kind: Kind }) {
  const values = useStandard();
  const stage = useStage();
  const [start] = useState(Date.now);
  const now = useNow();
  const minutes = numberParam("min", values.countdown / TIME.minuteSeconds);
  const end = useMemo(() => countdownEnd(params.get("at"), minutes * TIME.minuteSeconds, new Date(start)), [minutes, start]);
  const left = Math.max(0, (end - now) / TIME.secondMs);
  const progress = end > start ? 1 - (left * TIME.secondMs) / (end - start) : 1;
  const [eyebrow, title] = {
    starting: [values.startingEyebrow, values.startingTitle],
    brb: [values.brbEyebrow, values.brbTitle],
    ending: [values.endingEyebrow, values.endingTitle],
  }[kind];
  const next = params.get("next") ?? values.endingNext;
  const ticker = params.get("ticker") ?? values.ticker;

  return (
    <div className="standard-screen">
      {values.blobs && <div className="standard-blobs" aria-hidden="true"><i /><i /><i /></div>}
      <div className="standard-stage" ref={stage}>
        <header className="standard-top">
          <span className="standard-channel">{values.channelName}</span>
          {values.showClock && <span className="standard-muted">{new Date(now).toLocaleTimeString(values.locale)}</span>}
        </header>
        <main className="standard-center">
          <p className="standard-eyebrow">{eyebrow}</p>
          <h1 className="standard-title">{title}</h1>
          {kind === "starting" && (
            <>
              <div className="standard-big">{left > 0 ? short(left) : values.countdownDone}</div>
              {values.progressBar && <div className="standard-progress"><span style={{ width: `${progress * PERCENT}%` }} /></div>}
            </>
          )}
          {kind === "brb" && (
            <>
              <div className="standard-big">{short((now - start) / TIME.secondMs)}</div>
              <p className="standard-muted">{values.brbNote}</p>
            </>
          )}
          {kind === "ending" && next && <p className="standard-muted">{values.endingNextLabel}: {next}</p>}
        </main>
        {ticker && <footer className="standard-ticker">{ticker}</footer>}
      </div>
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
