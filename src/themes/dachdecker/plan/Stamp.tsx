// Stamp of the Dachdecker Ending (DESIGN-DACHDECKER.md "Szenen"): a terracotta frame with the text that comes down large
// and turned and hits the paper, then stays slightly tilted. share = progress of the stamp step from 0 to 1.
import type { CSSProperties } from "react";

// look: how large and turned (degrees) the stamp starts and how far turned it rests (settings)
type Look = { fromScale: number; fromTurn: number; rest: number };

export default function Stamp({ text, share, look }: { text: string; share: number; look: Look }) {
  // Hard landing like GSAP power4.in
  const fall = share ** 4;
  const style = {
    opacity: share > 0 ? 1 : 0,
    "--stamp-scale": look.fromScale + (1 - look.fromScale) * fall,
    "--stamp-turn": `${look.fromTurn + (look.rest - look.fromTurn) * fall}deg`,
  } as CSSProperties;
  return <p className="dd-stamp" style={style}>{text}</p>;
}
