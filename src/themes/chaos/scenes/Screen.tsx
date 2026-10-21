// Full-screen scenes of the Chaos theme (Starting, BRB, Ending): the wall full of scribbles with the scene's brush
// strokes (two X as standard, each scene its own), the channel name as a tag in the corner, in the middle overline, the
// sprayed title, then per scene the countdown with zigzag or bar progress (Starting), the break time (BRB) or the next
// stream on tape (Ending) as a glowing marker number, rotating quotes, and the ticker on tape at the bottom. Power on:
// the strokes are sprayed in, the scribbles draw themselves, the title lights up last. Built for 1920x1080, scaled to
// any source size. Starting is painted in PixiJS (PLAN-CHAOS.md package 6): brush strokes with neon glow and spray
// mist, the scribbles boil through three takes, the title is sprayed on, and after the build everything keeps moving.
// Stage, countdown, break time and parameters come from the screens context of the core (src/core/screens).
// Parameters per source: ?min=5, ?at=20:00, ?next=..., ?ticker=..., ?t=<s> (still)
import { type Application, Container } from "pixi.js";
import { useCallback, useRef, useState } from "react";
import { seedOf } from "../../../core/hash.ts";
import { seekFromQuery } from "../../../core/motion/seek.ts";
import PixiStage from "../../../core/pixi/PixiStage.tsx";
import { rotating, shortClock, type ScreenKind } from "../../../core/screens/screens.ts";
import { useScreen } from "../../../core/screens/useScreen.ts";
import { useStage } from "../../../core/screens/useStage.ts";
import Backdrop from "../Backdrop.tsx";
import BoilingScribbles from "../BoilingScribbles.tsx";
import Brushes from "../pixi/Brushes.tsx";
import Dust from "../pixi/Dust.tsx";
import Spray from "../pixi/Spray.tsx";
import Wall from "../pixi/Wall.tsx";
import Progress from "../Progress.tsx";
import SprayTitle from "../SprayTitle.tsx";
import type { GestureKind } from "../strokes.ts";
import { useChaos } from "../useChaos.ts";

// fixed: seconds in ms for the rhythm of the quotes
const SECOND_MS = 1000;
// The build of the prototype (refs/starting.html)
// fixed: the title is sprayed from 2 s on at this height
const TITLE = { at: 2, y: 436 };
// fixed: the movement after the build starts at 4.6 s
const IDLE_FROM = 4.6;
const SEEK = seekFromQuery(location.search);

type Painted = { app: Application; world: Container };

// The painted wall of a screen: PixiJS (wall, strokes with glow, spray, dust) under the boiling scribbles
function PaintedWall({ seed, gesture, mainColor }: { seed: string; gesture: GestureKind; mainColor: string }) {
  const values = useChaos();
  const [painted, setPainted] = useState<Painted | null>(null);
  const startedAt = useRef(performance.now());
  const clock = useCallback(() => SEEK ?? (performance.now() - startedAt.current) / SECOND_MS, []);
  const onReady = useCallback((app: Application) => {
    const world = new Container();
    app.stage.addChild(world);
    setPainted({ app, world });
    return () => setPainted(null);
  }, []);
  const base = seedOf(seed);
  return (
    <div className="ch-backdrop" aria-hidden="true">
      <PixiStage background={values.ground} onReady={onReady} />
      {painted && (
        <>
          <Wall world={painted.world} values={values} seed={base} />
          <Brushes app={painted.app} world={painted.world} clock={clock} values={values} gesture={gesture} mainColor={mainColor} seed={base} idleFrom={IDLE_FROM} />
          <Spray app={painted.app} world={painted.world} clock={clock} values={values} gesture={gesture} mainColor={mainColor} seed={base} titleAt={TITLE.at} titleY={TITLE.y} />
          <Dust app={painted.app} world={painted.world} clock={clock} values={values} seed={base} idleFrom={IDLE_FROM} />
        </>
      )}
      <BoilingScribbles seed={seed} clock={clock} idleFrom={IDLE_FROM} />
      <div className="ch-world-haze" />
    </div>
  );
}

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
    <div className={`ch-screen power-${values.powerOn}${kind === "starting" ? " ch-painted" : ""}`}>
      {kind === "starting"
        ? <PaintedWall seed={kind} gesture={scene.gesture as GestureKind} mainColor={scene.color} />
        : <Backdrop seed={kind} gesture={scene.gesture as GestureKind} mainColor={scene.color} />}
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
