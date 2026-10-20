// Full-screen scenes of the Chaos theme (so far Starting): the wall full of scribbles with the scene's brush strokes
// (two X as standard), the channel name as a tag in the corner, in the middle overline, the sprayed title, the
// countdown as a glowing marker number with a zigzag or bar progress, rotating quotes, and the ticker on tape at the
// bottom. Power on: the strokes are sprayed in, the scribbles draw themselves, the title lights up last. Built for
// 1920x1080, scaled to any source size. Stage, countdown and parameters come from the screens context of the core
// (src/core/screens). Parameters per source: ?min=5, ?at=20:00, ?ticker=...
import { rotating, shortClock } from "../../../core/screens/screens.ts";
import { useScreen } from "../../../core/screens/useScreen.ts";
import { useStage } from "../../../core/screens/useStage.ts";
import Backdrop from "../Backdrop.tsx";
import Progress from "../Progress.tsx";
import SprayTitle from "../SprayTitle.tsx";
import type { GestureKind } from "../strokes.ts";
import { useChaos } from "../useChaos.ts";

// fixed: seconds in ms for the rhythm of the quotes
const SECOND_MS = 1000;

export default function Screen({ kind }: { kind: "starting" }) {
  const values = useChaos();
  const stage = useStage();
  const { now, start, left, progress, ticker } = useScreen({ countdownSeconds: values.countdown, ticker: values.ticker, next: "" });
  const saying = rotating(values.startingLines, values.linesEvery * SECOND_MS, now - start);

  return (
    <div className={`ch-screen power-${values.powerOn}`}>
      <Backdrop seed={kind} gesture={values.gestureStarting as GestureKind} mainColor={values.gestureColorStarting} />
      <div className="ch-stage stage-box" ref={stage}>
        <span className="ch-tag">{values.channelName}</span>
        <main className="ch-center">
          <p className="ch-eyebrow">{values.startingEyebrow}</p>
          <SprayTitle text={values.startingTitle} seed={kind} />
          <b className="ch-big">{left > 0 ? values.countdownPrefix + shortClock(left) : values.countdownDone}</b>
          {values.progressStyle !== "aus" && <Progress share={progress} look={values.progressStyle === "balken" ? "balken" : "zickzack"} />}
          {saying && <p key={saying} className="ch-saying">{saying}</p>}
        </main>
      </div>
      {ticker && <div className="ch-ticker"><span>{ticker}</span></div>}
    </div>
  );
}
