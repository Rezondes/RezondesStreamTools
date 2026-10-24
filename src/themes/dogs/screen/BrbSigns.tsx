// The sign layer of the BRB scene of the Dogs theme (DESIGN-DOGS.md "BRB"): the card at the top left with the pill, the
// title and the subtitle, the break time and the steps at the top right, the "Schnüff!" bubble next to the head while
// the dog sniffs. The steps and the bubble follow the scene clock (useFrame), the break time comes from useScreen.
import { useRef } from "react";
import { shortClock } from "../../../core/screens/screens.ts";
import { useScreen } from "../../../core/screens/useScreen.ts";
import { useStage } from "../../../core/screens/useStage.ts";
import { fillTemplate } from "../../../core/template.ts";
import { BRB, brbRow } from "../brbWorld.ts";
import type { DogCache } from "../dog.ts";
import type { DogsValues } from "../settings.ts";
import Bubble from "../ui/Bubble.tsx";
import Pill from "../ui/Pill.tsx";
import PixelBox from "../ui/PixelBox.tsx";
import { dogsNames } from "../useDogs.ts";
import { useFrame } from "../useFrame.ts";
import { sniffBubbleAt, stepsAt, type WalkTiming } from "../walk.ts";

// fixed: the bubble starts 10 pixels right of and 2 above the head
const BUBBLE = { right: 10, up: 2 };

type Props = { values: DogsValues; clock: () => number; dog: DogCache; timing: WalkTiming; height: number };

export default function BrbSigns({ values, clock, dog, timing, height }: Props) {
  const stage = useStage();
  const screen = useScreen({ countdownSeconds: 0, countdownAt: "", ticker: "", next: "" });
  const steps = useRef<HTMLDivElement>(null);
  const bubble = useRef<HTMLDivElement>(null);
  const scale = values.pixelScale;
  const head = { x: BRB.dogX + dog.head[0] + BUBBLE.right, y: brbRow(height, BRB.ground) - dog.height + 5 + dog.head[1] - BUBBLE.up };
  useFrame(clock, time => {
    if (steps.current) steps.current.textContent = String(stepsAt(time, timing, values.stepPx));
    if (bubble.current) Object.assign(bubble.current.style, { left: `${head.x * scale}px`, top: `${head.y * scale}px`, transform: `translateY(-100%) scale(${sniffBubbleAt(time, timing)})` });
  });
  const names = dogsNames(values);
  return (
    <div className="dg-stage stage-box" ref={stage}>
      <PixelBox className="dg-brb-card">
        <Pill text={fillTemplate(values.brbPill, names)} />
        <div className="dg-brb-title">{fillTemplate(values.brbTitle, names)}</div>
        <div className="dg-brb-sub">{fillTemplate(values.brbSubtitle, names)}</div>
      </PixelBox>
      <div className="dg-brb-stats">
        {screen.showAway && (
          <PixelBox className="dg-stat">
            <div className="dg-caption">{values.brbPauseLabel}</div>
            <div className="dg-stat-value">{shortClock(screen.away)}</div>
          </PixelBox>
        )}
        <PixelBox className="dg-stat">
          <div className="dg-caption">{values.brbStepsLabel}</div>
          <div className="dg-stat-value" ref={steps} />
        </PixelBox>
      </div>
      <Bubble text={values.brbSniff} boxRef={bubble} />
    </div>
  );
}
