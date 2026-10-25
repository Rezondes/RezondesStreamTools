// Full-screen scenes of the Plantage theme (PLAN-PLANTAGE.md packages 2 and 3): the plantation as a PixiJS world in depth
// layers with camera swing, swaying trees, falling leaves and light motes, at the time of day of the screen: Starting
// with the sunrise while the picker reaches into the tree, BRB at noon while the picker picks mangos into the basket,
// Ending with the sunset, fireflies and the picker waving with a full basket. Over it frosted cards fall in like ripe
// fruit and settle (GSAP): pill, title word by word, subtitle, the countdown with mangos plopping into the basket, the
// break time or the next stream, rotating sayings and the clock. Built for 1920x1080, scaled to any source size.
// ?t=<s> shows a still. Countdown, ticker and next stream come from the settings (useScreen).
import { SplitText } from "gsap/SplitText";
import { type Application, Container } from "pixi.js";
import { type CSSProperties, type RefObject, useCallback, useRef, useState } from "react";
import { seekFromQuery } from "../../../core/motion/seek.ts";
import { useTimeline } from "../../../core/motion/useTimeline.ts";
import PixiStage from "../../../core/pixi/PixiStage.tsx";
import { rotating, type ScreenKind, shortClock } from "../../../core/screens/screens.ts";
import { useScreen } from "../../../core/screens/useScreen.ts";
import { useStage } from "../../../core/screens/useStage.ts";
import Basket from "../cards/Basket.tsx";
import FrostCard from "../cards/FrostCard.tsx";
import { ICONS, PLANE } from "../field.ts";
import Drift from "../pixi/Drift.tsx";
import Picker from "../pixi/Picker.tsx";
import WorldLayer from "../pixi/WorldLayer.tsx";
import { skyOf } from "../world.ts";
import type { PlantageValues } from "../settings.ts";
import ShapeIcon from "../ShapeIcon.tsx";
import { usePlantage } from "../usePlantage.ts";

// fixed: seconds in ms
const SECOND_MS = 1000;
const SEEK = seekFromQuery(location.search);

type Scene = { app: Application; world: Container };
type Screen = ReturnType<typeof useScreen>;

const textsOf = (values: PlantageValues, kind: ScreenKind) => ({
  starting: { eyebrow: values.startingEyebrow, title: values.startingTitle, note: values.startingNote, sayings: values.startingLines },
  brb: { eyebrow: values.brbEyebrow, title: values.brbTitle, note: values.brbNote, sayings: values.brbLines },
  ending: { eyebrow: values.endingEyebrow, title: values.endingTitle, note: values.endingNote, sayings: values.endingLines },
}[kind]);

// The frosted cards and the timeline that lets them fall in
function Cards({ kind, values, screen, stage }: { kind: ScreenKind; values: PlantageValues; screen: Screen; stage: RefObject<HTMLDivElement | null> }) {
  const { now, start, left, away, showAway, progress, next } = screen;
  const texts = textsOf(values, kind);
  useTimeline(timeline => {
    const drop = values.cardDropMs / SECOND_MS;
    // the entrance of the settings: when and how fast each card comes, from how far, the tilt of the falling card
    timeline.from(".pl-st-clock", { y: -values.fromClock, duration: values.clockDrop, ease: "federnd" }, values.enterClock);
    timeline.from(".pl-st-card", { y: -values.fromCard, rotate: -values.fromTilt, duration: drop, ease: "federnd" }, values.enterCard);
    timeline.from(".pl-st-count", { y: values.fromCount, duration: drop, ease: "federnd" }, values.enterCount);
    timeline.from(SplitText.create(".pl-st-title", { type: "words" }).words, { y: values.fromWord, opacity: 0, duration: values.wordRise, stagger: values.wordStep, ease: "back.out(2)" }, values.enterWords);
    timeline.from(".pl-st-pill", { scale: 0, duration: values.pillPop, ease: "back.out(3)" }, values.enterPill);
    timeline.from(".pl-st-note", { opacity: 0, y: values.fromNote, duration: values.noteFade }, values.enterNote);
    timeline.from(".pl-st-line", { scale: 0, duration: values.linePop, ease: "back.out(2.4)" }, values.enterLine);
  }, [values, texts.title, texts.note], stage);
  const saying = rotating(texts.sayings, values.linesEvery * SECOND_MS, now - start);
  return (
    <div className="pl-st-stage stage-box" ref={stage}>
      <FrostCard className="pl-st-clock">{new Date(now).toLocaleTimeString(values.locale)}</FrostCard>
      <FrostCard className="pl-st-card">
        <span className="pl-st-pill"><i />{texts.eyebrow}</span>
        <h1 className="pl-st-title">{texts.title}</h1>
        <p className={`pl-st-note${texts.note ? "" : " empty"}`}>{texts.note}</p>
      </FrostCard>
      <FrostCard className={`pl-st-count${kind === "ending" && !next ? " empty" : ""}`}>
        {kind === "starting" && <b>{left > 0 ? values.countdownPrefix + shortClock(left) : values.countdownDone}</b>}
        {kind === "starting" && values.progressStyle === "korb" && <Basket part={progress} mangos={values.basketMangos} />}
        {kind === "starting" && values.progressStyle === "ast" && (
          <div className="pl-progress-ast" style={{ "--part": progress } as CSSProperties}><span><ShapeIcon shape={ICONS.mango} /></span></div>
        )}
        {kind === "brb" && showAway && <b>{values.afkPrefix + shortClock(away)}</b>}
        {kind === "ending" && <b className="pl-st-next">{`${values.endingNextLabel}: ${next}`}</b>}
      </FrostCard>
      <FrostCard className={`pl-st-line${saying ? "" : " empty"}`}>{saying}</FrostCard>
    </div>
  );
}

export default function Screen({ kind }: { kind: ScreenKind }) {
  const values = usePlantage();
  const stage = useStage();
  const screen = useScreen({ countdownSeconds: values.countdown, countdownAt: values.countdownAt, ticker: values.ticker, next: values.endingNext });
  const [scene, setScene] = useState<Scene | null>(null);
  const startedAt = useRef(performance.now());
  const clock = useCallback(() => SEEK ?? (performance.now() - startedAt.current) / SECOND_MS, []);
  const onReady = useCallback((app: Application) => {
    const world = new Container();
    app.stage.addChild(world);
    setScene({ app, world });
    return () => setScene(null);
  }, []);
  const { ticker } = screen;

  return (
    <div className={`pl-screen pl-world-screen pl-${kind}`}>
      <PixiStage background={skyOf(values, kind)} onReady={onReady} />
      {scene && (
        <>
          <WorldLayer app={scene.app} world={scene.world} clock={clock} values={values} kind={kind} />
          {values.picker && <Picker app={scene.app} world={scene.world} clock={clock} values={values} kind={kind} reachAt={values.enterReach} />}
          <Drift app={scene.app} clock={clock} values={values} kind={kind} />
        </>
      )}
      <Cards kind={kind} values={values} screen={screen} stage={stage} />
      {ticker && values.tickerStyle === "flugzeug" && (
        <div className="pl-plane"><span className="pl-banner">{ticker}</span><ShapeIcon shape={PLANE} /></div>
      )}
      {ticker && values.tickerStyle === "leiste" && <div className="pl-ticker pl-wood"><span>{ticker}</span></div>}
    </div>
  );
}
