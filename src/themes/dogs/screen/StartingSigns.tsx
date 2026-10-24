// The sign layer of the Starting scene of the Dogs theme (DESIGN-DOGS.md "Schild-Ebene"): pill, title and subtitle at
// the top, labels under the cushions (they fade and grow while the marker is close), the countdown box at the bottom
// left, the card of the streamer's dog at the bottom right and the speech bubble next to its head. Entrances run on a
// GSAP timeline (useTimeline) snapped to whole world pixels; labels and bubble follow the scene clock (useFrame).
import { useRef } from "react";
import { useTimeline } from "../../../core/motion/useTimeline.ts";
import Marquee from "../../../core/music/Marquee.tsx";
import { shortClock } from "../../../core/screens/screens.ts";
import { useScreen } from "../../../core/screens/useScreen.ts";
import { useStage } from "../../../core/screens/useStage.ts";
import { fillTemplate } from "../../../core/template.ts";
import { BREED_IDS, BREEDS, type BreedId } from "../breeds.ts";
import { coatOf } from "../coats.ts";
import type { DogsValues } from "../settings.ts";
import { bubbleAt, bubblePlace, CARD_AFTER_BARK, INTRO, labelAt, labelPlace, type StartingPlan } from "../starting.ts";
import Bubble from "../ui/Bubble.tsx";
import Pill from "../ui/Pill.tsx";
import PixelBox from "../ui/PixelBox.tsx";
import { dogsNames } from "../useDogs.ts";
import { useFrame } from "../useFrame.ts";

type Props = { values: DogsValues; plan: StartingPlan; clock: () => number; breed: BreedId };

const px = (value: number) => `${value}px`;

function useEntrance(plan: StartingPlan, scale: number) {
  const stage = useStage();
  useTimeline(timeline => {
    const snap = { y: scale };
    const { pill, title, subtitle, countdown, card } = INTRO;
    timeline.from(".dg-start-pill", { y: pill.y, duration: pill.duration, ease: pill.ease, snap }, pill.at);
    timeline.from(".dg-title", { y: title.y, scale: title.scale, duration: title.duration, ease: title.ease, snap }, title.at);
    timeline.from(".dg-title", { opacity: 0, duration: title.fade }, title.at);
    timeline.from(".dg-subtitle", { opacity: 0, duration: subtitle.duration }, subtitle.at);
    timeline.from(".dg-countdown", { y: countdown.y, duration: countdown.duration, ease: countdown.ease, snap }, countdown.at);
    timeline.from(".dg-card", { y: card.y, duration: card.duration, ease: card.ease, snap }, plan.bark + CARD_AFTER_BARK);
  }, [plan.bark, scale], stage);
  return stage;
}

export default function StartingSigns({ values, plan, clock, breed }: Props) {
  const scale = values.pixelScale;
  const stage = useEntrance(plan, scale);
  const screen = useScreen({ countdownSeconds: values.countdown, countdownAt: values.countdownAt, ticker: values.ticker, next: "" });
  const labels = useRef<(HTMLDivElement | null)[]>([]);
  const bubble = useRef<HTMLDivElement>(null);
  useFrame(clock, time => {
    labels.current.forEach((label, index) => {
      if (!label) return;
      const look = labelAt(plan, index, time);
      label.style.opacity = String(values.labels ? look.opacity : 0);
      label.style.transform = `translateX(-50%) scale(${look.scale})`;
      label.classList.toggle("dg-near", look.highlight);
    });
    const [x, y] = bubblePlace(plan, time);
    if (bubble.current) Object.assign(bubble.current.style, { left: px(x * scale), top: px(y * scale), transform: `translateY(-100%) scale(${bubbleAt(plan, time)})` });
  });
  const names = dogsNames(values);
  return (
    <div className="dg-stage stage-box" ref={stage}>
      <Pill className="dg-start-pill" text={fillTemplate(values.startingPill, names)} />
      <div className="dg-title">{fillTemplate(values.startingTitle, names)}</div>
      <div className="dg-subtitle">{fillTemplate(values.startingSubtitle, names)}</div>
      {BREED_IDS.map((id, index) => {
        const [x, y] = labelPlace(plan, index);
        return (
          <PixelBox key={id} className="dg-label" boxRef={element => { labels.current[index] = element; }} style={{ left: px(x * scale), top: px(y * scale) }}>
            {BREEDS[id].name}
            <small>{coatOf(id, id === breed ? values.coat : "").name}</small>
          </PixelBox>
        );
      })}
      <PixelBox className="dg-countdown">
        <div className="dg-caption">{values.countdownLabel}</div>
        <PixelBox red className="dg-clock">{shortClock(screen.left)}</PixelBox>
      </PixelBox>
      <DogCard values={values} breed={breed} />
      <Bubble text={values.bark} boxRef={bubble} />
      {screen.ticker && <PixelBox className="dg-ticker"><Marquee text={fillTemplate(screen.ticker, names)} speed={values.tickerSpeed} /></PixelBox>}
    </div>
  );
}

function DogCard({ values, breed }: { values: DogsValues; breed: BreedId }) {
  return (
    <PixelBox className="dg-card">
      <PixelBox className="dg-badge"><i className="dg-paw" aria-hidden /></PixelBox>
      <div>
        <div className="dg-caption">{values.cardLabel}</div>
        <div className="dg-card-name">{values.dogName}</div>
        <div className="dg-card-breed">{fillTemplate(values.cardBreed, { breed: BREEDS[breed].name, coat: coatOf(breed, values.coat).name })}</div>
      </div>
    </PixelBox>
  );
}
