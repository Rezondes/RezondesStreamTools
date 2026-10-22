// Full-screen scenes of the standard theme (Starting, BRB, Ending). Starting shows the light fields with GSAP motion
// (screen/Starting.tsx); BRB and Ending keep the calm background with slowly moving color areas, in the middle
// overline and title, plus break time or next stream, until PLAN-STANDARD.md package 2. Built for 1920x1080, scaled
// to any source size. Stage, countdown, break time and parameters come from the screens context of the core
// (src/core/screens). Parameters per source: ?min=5, ?at=20:00, ?next=..., ?ticker=...
import { shortClock, type ScreenKind } from "../../../core/screens/screens.ts";
import { useScreen } from "../../../core/screens/useScreen.ts";
import { useStage } from "../../../core/screens/useStage.ts";
import Starting from "../screen/Starting.tsx";
import { useStandard } from "../useStandard.ts";

export default function Screen({ kind }: { kind: ScreenKind }) {
  return kind === "starting" ? <Starting /> : <Calm kind={kind} />;
}

function Calm({ kind }: { kind: "brb" | "ending" }) {
  const values = useStandard();
  const stage = useStage();
  const { now, away, ticker, next } = useScreen({ countdownSeconds: values.countdown, ticker: values.ticker, next: values.endingNext });
  const [eyebrow, title] = {
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
