// Full-screen scenes of the Chaos theme (Starting, BRB, Ending): the wall full of scribbles with the scene's brush
// strokes (two X as standard, each scene its own), the channel name as a tag in the corner, in the middle overline, the
// sprayed title, then per scene the countdown with zigzag or bar progress (Starting), the break time (BRB) or the next
// stream on tape (Ending) as a glowing marker number, rotating quotes, and the ticker on tape at the bottom. Power on:
// the strokes are sprayed in, the scribbles draw themselves, the title lights up last. Built for 1920x1080, scaled to
// any source size. Stage, countdown, break time and parameters come from the screens context of the core
// (src/core/screens). Parameters per source: ?min=5, ?at=20:00, ?next=..., ?ticker=...
import { rotating, shortClock, type ScreenKind } from "../../../core/screens/screens.ts";
import { useScreen } from "../../../core/screens/useScreen.ts";
import { useStage } from "../../../core/screens/useStage.ts";
import Backdrop from "../Backdrop.tsx";
import Progress from "../Progress.tsx";
import SprayTitle from "../SprayTitle.tsx";
import type { GestureKind } from "../strokes.ts";
import { useChaos } from "../useChaos.ts";

// fixed: seconds in ms for the rhythm of the quotes
const SECOND_MS = 1000;

export default function Screen({ kind }: { kind: ScreenKind }) {
  const values = useChaos();
  const stage = useStage();
  const { now, start, left, progress, away, ticker, next } = useScreen({ countdownSeconds: values.countdown, ticker: values.ticker, next: values.endingNext });
  const scene = {
    starting: { eyebrow: values.startingEyebrow, title: values.startingTitle, lines: values.startingLines, gesture: values.gestureStarting, color: values.gestureColorStarting },
    brb: { eyebrow: values.brbEyebrow, title: values.brbTitle, lines: values.brbLines, gesture: values.gestureBrb, color: values.gestureColorBrb },
    ending: { eyebrow: values.endingEyebrow, title: values.endingTitle, lines: values.endingLines, gesture: values.gestureEnding, color: values.gestureColorEnding },
  }[kind];
  const saying = rotating(scene.lines, values.linesEvery * SECOND_MS, now - start);

  return (
    <div className={`ch-screen power-${values.powerOn}`}>
      <Backdrop seed={kind} gesture={scene.gesture as GestureKind} mainColor={scene.color} />
      <div className="ch-stage stage-box" ref={stage}>
        <span className="ch-tag">{values.channelName}</span>
        <main className="ch-center">
          <p className="ch-eyebrow">{scene.eyebrow}</p>
          <SprayTitle text={scene.title} seed={kind} />
          {kind === "starting" && (
            <>
              <b className="ch-big">{left > 0 ? values.countdownPrefix + shortClock(left) : values.countdownDone}</b>
              {values.progressStyle !== "aus" && <Progress share={progress} look={values.progressStyle === "balken" ? "balken" : "zickzack"} />}
            </>
          )}
          {kind === "brb" && <b className="ch-big">{values.afkPrefix + shortClock(away)}</b>}
          {kind === "ending" && next && <p className="ch-next">{`${values.endingNextLabel}: ${next}`}</p>}
          {saying && <p key={saying} className="ch-saying">{saying}</p>}
        </main>
      </div>
      {ticker && <div className="ch-ticker"><span>{ticker}</span></div>}
    </div>
  );
}
