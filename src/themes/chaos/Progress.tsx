// Progress of the Chaos theme: a zigzag marker line that draws itself up to the share done, or a rough marker bar.
// share from 0 to 1; colors and sizes from theme.css.
import type { CSSProperties } from "react";

type Props = { share: number; look: "zickzack" | "balken" };

// The zigzag in a box 100 wide and 10 high, stretched to the width of the element
const TEETH = 24;
const ZIGZAG = `M0 5 ${Array.from({ length: TEETH }, (_, tooth) => `L${((tooth + 1) * 100) / TEETH} ${tooth % 2 ? 8 : 2}`).join(" ")}`;

export default function Progress({ share, look }: Props) {
  if (look === "balken") return <div className="ch-progress-bar" style={{ "--part": share } as CSSProperties}><span /></div>;
  return (
    <svg className="ch-progress-zigzag" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true">
      <path className="ch-progress-track" d={ZIGZAG} pathLength={1} />
      <path className="ch-progress-done" d={ZIGZAG} pathLength={1} style={{ strokeDashoffset: 1 - share }} />
    </svg>
  );
}
