// The card of a Dogs alert (DESIGN-DOGS.md "Alerts"): a pixel box above the running track with the red pill of the
// kind, the name in red and the line (or the viewer's message), and the "Wuff!" bubble next to the dog's head. Both
// follow the clock of the alert (cardAt, alertBubbleAt), so stills with ?t= match.
import { useRef } from "react";
import { ALERT_GROUND, alertBubbleAt, cardAt, type AlertSchedule } from "../alert.ts";
import type { DogCache } from "../dog.ts";
import { ALERT_STOP } from "../pixi/AlertWorld.tsx";
import type { DogsValues } from "../settings.ts";
import Bubble from "../ui/Bubble.tsx";
import Pill from "../ui/Pill.tsx";
import PixelBox from "../ui/PixelBox.tsx";
import { useFrame } from "../useFrame.ts";

// fixed: the card comes up 30 pixels and leaves 40 pixels down; the bubble starts 6 right of and 6 above the head
const CARD = { come: 30, leave: 40 };
const BUBBLE = { right: 6, up: 6 };

type Props = { values: DogsValues; clock: () => number; schedule: AlertSchedule; dog: DogCache; tag: string; user: string; line: string };

export default function AlertCard({ values, clock, schedule, dog, tag, user, line }: Props) {
  const card = useRef<HTMLDivElement>(null);
  const bubble = useRef<HTMLDivElement>(null);
  const scale = values.pixelScale;
  const head = { x: ALERT_STOP + dog.head[0] + BUBBLE.right, y: ALERT_GROUND - dog.height + 5 + dog.head[1] - BUBBLE.up };
  useFrame(clock, time => {
    const { come, leave } = cardAt(schedule, time);
    if (card.current) Object.assign(card.current.style, { transform: `translateY(${Math.round((1 - come) * CARD.come + leave * CARD.leave) * scale}px)`, opacity: String(Math.min(1, come * 2) * (1 - leave)) });
    if (bubble.current) Object.assign(bubble.current.style, { left: `${head.x * scale}px`, top: `${head.y * scale}px`, transform: `translateY(-100%) scale(${alertBubbleAt(schedule, time)})` });
  });
  return (
    <>
      <PixelBox className="dg-alert-card" boxRef={card}>
        <Pill text={tag} />
        <div className="dg-alert-name">{user}</div>
        {line && <div className="dg-alert-line">{line}</div>}
      </PixelBox>
      <Bubble text={values.alertBark} boxRef={bubble} />
    </>
  );
}
