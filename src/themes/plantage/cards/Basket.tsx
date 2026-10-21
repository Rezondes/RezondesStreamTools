// Countdown progress of the Plantage Starting as a woven basket: one more glossy mango plops in with a bounce for every
// part of the waiting time (styles and the drop in theme.css, .pl-basket).
import type { CSSProperties } from "react";

export default function Basket({ part, mangos }: { part: number; mangos: number }) {
  const filled = Math.round(Math.min(1, Math.max(0, part)) * mangos);
  return (
    <div className="pl-basket" style={{ "--mangos": mangos } as CSSProperties}>
      {Array.from({ length: mangos }, (_, index) => (
        <i key={index} className={index < filled ? "full" : ""} style={{ "--slot": index } as CSSProperties} />
      ))}
    </div>
  );
}
