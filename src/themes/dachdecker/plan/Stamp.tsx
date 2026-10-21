// Stamp of the Dachdecker Ending (DESIGN-DACHDECKER.md "Szenen"): a terracotta frame with the text that comes down large
// and turned and hits the paper, then stays slightly tilted. share = progress of the stamp step from 0 to 1.
import type { CSSProperties } from "react";

// The stamp starts 3.2 times as large and turned by -28 degrees, it rests at -12 degrees
const FROM = { scale: 3.2, turn: -28 };
const REST = -12;

export default function Stamp({ text, share }: { text: string; share: number }) {
  // Hard landing like GSAP power4.in
  const fall = share ** 4;
  const style = {
    opacity: share > 0 ? 1 : 0,
    "--stamp-scale": FROM.scale + (1 - FROM.scale) * fall,
    "--stamp-turn": `${FROM.turn + (REST - FROM.turn) * fall}deg`,
  } as CSSProperties;
  return <p className="dd-stamp" style={style}>{text}</p>;
}
