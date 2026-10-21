// The remaining time of the Plantage alert as a branch under the card: it grows out, shrinks over the alert and loses
// its leaves one by one (CSS animations in theme.css, .pl-twig, over --life).
import type { CSSProperties } from "react";

// fixed: four leaves on the branch, like the prototype
const LEAVES = 4;

export default function Branch({ lifeMs }: { lifeMs: number }) {
  return (
    <div className="pl-twig" style={{ "--life": `${lifeMs}ms`, "--leaves": LEAVES } as CSSProperties} aria-hidden="true">
      {Array.from({ length: LEAVES }, (_, index) => <i key={index} style={{ "--leaf": index } as CSSProperties} />)}
    </div>
  );
}
