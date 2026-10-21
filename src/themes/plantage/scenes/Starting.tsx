// Starting of the Plantage theme (PLAN-PLANTAGE.md package 2): the plantation as a PixiJS world in depth layers with
// sunrise, camera swing, swaying trees, falling leaves, light motes and the picker reaching into the tree; over it frosted
// cards fall in like ripe fruit and settle (GSAP): pill, title word by word, subtitle, countdown with mangos plopping into
// the basket, rotating sayings and the clock. Built for 1920x1080, scaled to any source size. ?t=<s> shows a still.
// Parameter per source: ?min=5, ?at=20:00, ?ticker=...
import { SplitText } from "gsap/SplitText";
import { type Application, Container } from "pixi.js";
import { type CSSProperties, useCallback, useRef, useState } from "react";
import { seekFromQuery } from "../../../core/motion/seek.ts";
import { useTimeline } from "../../../core/motion/useTimeline.ts";
import PixiStage from "../../../core/pixi/PixiStage.tsx";
import { rotating, shortClock } from "../../../core/screens/screens.ts";
import { useScreen } from "../../../core/screens/useScreen.ts";
import { useStage } from "../../../core/screens/useStage.ts";
import Basket from "../cards/Basket.tsx";
import FrostCard from "../cards/FrostCard.tsx";
import { ICONS, PLANE } from "../field.ts";
import Drift from "../pixi/Drift.tsx";
import Picker from "../pixi/Picker.tsx";
import WorldLayer from "../pixi/WorldLayer.tsx";
import ShapeIcon from "../ShapeIcon.tsx";
import { usePlantage } from "../usePlantage.ts";

// fixed: seconds in ms
const SECOND_MS = 1000;
// fixed: the order of the entrance in s, like the prototype (refs/starting.html)
const ENTER = { clock: 1.4, card: 1.2, count: 1.6, words: 1.9, pill: 2.0, reach: 2.2, note: 2.4, line: 2.6 };
// fixed: how far things come from in px and the tilt of the falling card in degrees, like the prototype
const FROM = { clock: 120, card: 520, tilt: 4, count: 520, word: 40, note: 14 };
const SEEK = seekFromQuery(location.search);

type Scene = { app: Application; world: Container };

export default function Starting() {
  const values = usePlantage();
  const stage = useStage();
  const { now, start, left, progress, ticker } = useScreen({ countdownSeconds: values.countdown, ticker: values.ticker, next: values.endingNext });
  const [scene, setScene] = useState<Scene | null>(null);
  const startedAt = useRef(performance.now());
  const clock = useCallback(() => SEEK ?? (performance.now() - startedAt.current) / SECOND_MS, []);
  const onReady = useCallback((app: Application) => {
    const world = new Container();
    app.stage.addChild(world);
    setScene({ app, world });
    return () => setScene(null);
  }, []);
  useTimeline(timeline => {
    const drop = values.cardDropMs / SECOND_MS;
    timeline.from(".pl-st-clock", { y: -FROM.clock, duration: 0.7, ease: "federnd" }, ENTER.clock);
    timeline.from(".pl-st-card", { y: -FROM.card, rotate: -FROM.tilt, duration: drop, ease: "federnd" }, ENTER.card);
    timeline.from(".pl-st-count", { y: FROM.count, duration: drop, ease: "federnd" }, ENTER.count);
    timeline.from(SplitText.create(".pl-st-title", { type: "words" }).words, { y: FROM.word, opacity: 0, duration: 0.5, stagger: 0.12, ease: "back.out(2)" }, ENTER.words);
    timeline.from(".pl-st-pill", { scale: 0, duration: 0.45, ease: "back.out(3)" }, ENTER.pill);
    timeline.from(".pl-st-note", { opacity: 0, y: FROM.note, duration: 0.4 }, ENTER.note);
    timeline.from(".pl-st-line", { scale: 0, duration: 0.5, ease: "back.out(2.4)" }, ENTER.line);
  }, [values.cardDropMs, values.startingTitle, values.startingNote], stage);
  const saying = rotating(values.startingLines, values.linesEvery * SECOND_MS, now - start);

  return (
    <div className="pl-screen pl-starting">
      <PixiStage background={values.skyMorningBottom} onReady={onReady} />
      {scene && (
        <>
          <WorldLayer app={scene.app} world={scene.world} clock={clock} values={values} />
          {values.picker && <Picker app={scene.app} world={scene.world} clock={clock} values={values} reachAt={ENTER.reach} />}
          <Drift app={scene.app} clock={clock} values={values} />
        </>
      )}
      <div className="pl-st-stage stage-box" ref={stage}>
        <FrostCard className="pl-st-clock">{new Date(now).toLocaleTimeString(values.locale)}</FrostCard>
        <FrostCard className="pl-st-card">
          <span className="pl-st-pill"><i />{values.startingEyebrow}</span>
          <h1 className="pl-st-title">{values.startingTitle}</h1>
          {values.startingNote && <p className="pl-st-note">{values.startingNote}</p>}
        </FrostCard>
        <FrostCard className="pl-st-count">
          <b>{left > 0 ? values.countdownPrefix + shortClock(left) : values.countdownDone}</b>
          {values.progressStyle === "korb" && <Basket part={progress} mangos={values.basketMangos} />}
          {values.progressStyle === "ast" && (
            <div className="pl-progress-ast" style={{ "--part": progress } as CSSProperties}><span><ShapeIcon shape={ICONS.mango} /></span></div>
          )}
        </FrostCard>
        <FrostCard className={`pl-st-line${saying ? "" : " empty"}`}>{saying}</FrostCard>
      </div>
      {ticker && values.tickerStyle === "flugzeug" && (
        <div className="pl-plane"><span className="pl-banner">{ticker}</span><ShapeIcon shape={PLANE} /></div>
      )}
      {ticker && values.tickerStyle === "leiste" && <div className="pl-ticker pl-wood"><span>{ticker}</span></div>}
    </div>
  );
}
