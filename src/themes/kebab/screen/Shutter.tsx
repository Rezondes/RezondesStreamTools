// The roller shutter of the Ending (shutter.ts): a brown shutter with slat lines comes down over the shop, the arc
// title stands on it in paper where the logo was, the title of the scene below it. Its way down follows the clock
// (useFrame), so ?t= stills match.
import { useRef } from "react";
import { VIEW } from "../chef.ts";
import ArcTitle from "../ink/ArcTitle.tsx";
import type { KebabValues } from "../settings.ts";
import { shutterAt } from "../shutter.ts";
import { useFrame } from "../useFrame.ts";

const PERCENT = 100;
const noop = () => {};

export default function Shutter({ values, clock, title }: { values: KebabValues; clock: () => number; title: string }) {
  const box = useRef<HTMLDivElement>(null);
  useFrame(clock, time => {
    const share = shutterAt(time, values.shutterStart, values.shutterMs);
    if (box.current) box.current.style.transform = `translateY(${(share - 1) * PERCENT}%)`;
  });
  return (
    <div className="kb-shutter" ref={box}>
      <div className="kb-shutter-box" />
      <svg className="kb-logo kb-shutter-arc" viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.width} ${VIEW.height}`}>
        <ArcTitle text={values.shutterText} size={values.arcSize} span={values.arcSpan} stroke={values.arcStroke} onReady={noop} />
      </svg>
      {title && <div className="kb-shutter-title">{title}</div>}
    </div>
  );
}
