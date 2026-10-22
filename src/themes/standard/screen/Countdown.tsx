// Countdown of the standard Starting screen (digits.ts): every digit sits in its own window; when it changes, the old
// digit rolls up and out while the new one rolls in from below, as a CSS animation over digitRollMs. A changed place
// gets a new key, so its animation starts again. Each place gets its own slice of the gradient.
import { type CSSProperties, useState } from "react";
import { rollDigits } from "../digits.ts";

// fixed: percent of the gradient each place moves on, like the prototype (refs/starting.html)
const SLICE = 25;

export default function Countdown({ text, rollMs }: { text: string; rollMs: number }) {
  const [shown, setShown] = useState({ from: text, to: text });
  if (shown.to !== text) setShown({ from: shown.to, to: text });
  const rolls = rollDigits(shown.from, shown.to, 0);
  return (
    <div className="standard-st-clock" style={{ "--roll-ms": `${rollMs}ms` } as CSSProperties}>
      {[...shown.to].map((to, index) => {
        const slice = { backgroundPosition: `${index * SLICE}% 0` };
        if (!/\d/.test(to)) return <span key={index} className="standard-st-colon" style={slice}>{to}</span>;
        const roll = rolls.find(place => place.index === index);
        return (
          <span key={roll ? `${index}-${shown.from}-${shown.to}` : index} className={`standard-st-digit${roll ? " rolling" : ""}`}>
            {roll && <b className="from" style={slice}>{roll.from}</b>}
            <b style={slice}>{to}</b>
          </span>
        );
      })}
    </div>
  );
}
