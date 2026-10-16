// Vollbild-Szenen des Standard-Themes (Starting, BRB, Ending): ruhiger Hintergrund mit langsam wandernden
// Farbflächen, in der Mitte Überzeile und Titel, dazu Countdown mit Fortschritt, Pausenzeit oder nächster Stream.
// Für 1920x1080 gebaut, skaliert auf jede Quellgrösse. Bühne, Countdown, Pausenzeit und Parameter kommen aus dem
// Screens-Kontext des Kerns (src/core/screens). Parameter pro Quelle: ?min=5, ?at=20:00, ?next=..., ?ticker=...
import { shortClock, type ScreenKind } from "../../../core/screens/screens.ts";
import { useScreen } from "../../../core/screens/useScreen.ts";
import { useStage } from "../../../core/screens/useStage.ts";
import { useStandard } from "../useStandard.ts";

// fixed: Prozent für die Breite des Fortschrittsbalkens
const PERCENT = 100;

export default function Screen({ kind }: { kind: ScreenKind }) {
  const values = useStandard();
  const stage = useStage();
  const { now, left, progress, away, ticker, next } = useScreen({ countdownSeconds: values.countdown, ticker: values.ticker, next: values.endingNext });
  const [eyebrow, title] = {
    starting: [values.startingEyebrow, values.startingTitle],
    brb: [values.brbEyebrow, values.brbTitle],
    ending: [values.endingEyebrow, values.endingTitle],
  }[kind];

  return (
    <div className="standard-screen">
      {values.blobs && <div className="standard-blobs" aria-hidden="true"><i /><i /><i /></div>}
      <div className="standard-stage stage-box" ref={stage}>
        <header className="standard-top">
          <span className="standard-channel">{values.channelName}</span>
          {values.showClock && <span className="standard-muted">{new Date(now).toLocaleTimeString(values.locale)}</span>}
        </header>
        <main className="standard-center">
          <p className="standard-eyebrow">{eyebrow}</p>
          <h1 className="standard-title">{title}</h1>
          {kind === "starting" && (
            <>
              <div className="standard-big">{left > 0 ? shortClock(left) : values.countdownDone}</div>
              {values.progressBar && <div className="standard-progress"><span style={{ width: `${progress * PERCENT}%` }} /></div>}
            </>
          )}
          {kind === "brb" && (
            <>
              <div className="standard-big">{shortClock(away)}</div>
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
