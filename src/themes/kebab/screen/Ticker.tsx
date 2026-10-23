// The ticker at the bottom of the full-screen scenes: the text runs from right to left in a band of the red for text,
// as often repeated as the band needs; the shift follows the clock (useFrame), so ?t= stills match.
import { useRef } from "react";
import { useFrame } from "../useFrame.ts";

// fixed: the text is repeated this often so the band is always full while it runs
const COPIES = 6;

export default function Ticker({ text, speed, clock }: { text: string; speed: number; clock: () => number }) {
  const run = useRef<HTMLDivElement>(null);
  useFrame(clock, time => {
    const element = run.current;
    if (!element) return;
    const copy = element.scrollWidth / COPIES;
    element.style.transform = `translateX(${copy > 0 ? -((time * speed) % copy) : 0}px)`;
  });
  return (
    <div className="kb-ticker">
      <div className="kb-ticker-run" ref={run}>{Array.from({ length: COPIES }, (_, index) => <span key={index}>{text}</span>)}</div>
    </div>
  );
}
