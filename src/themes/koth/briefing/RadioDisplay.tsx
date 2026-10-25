// Radio display of the KOTH screens: a steel device with rivets slides in, its screen flashes on in three steps and the
// countdown decodes from random signs, then counts down.
import type { CSSProperties } from "react";
import { outCubic, type Steps, stepShare } from "../build.ts";
import { scrambled } from "../briefing.ts";
import { useKoth } from "../useKoth.ts";

type Props = { time: number; steps: Steps; count: string };

// The screen switches on in steps, the signs change some times a second, the device rises; longer texts (break time,
// next mission) get the smaller type (settings)
const RIVETS = ["top-left", "top-right", "bottom-left", "bottom-right"];

export default function RadioDisplay({ time, steps, count }: Props) {
  const values = useKoth();
  const shown = outCubic(stepShare(steps.display, time));
  const flash = 1 - Math.floor(stepShare(steps.screen, time) * values.displayFlashSteps) / values.displayFlashSteps;
  const style = { opacity: shown, transform: `translateY(${(1 - shown) * values.displayRise}px)`, "--flash": flash } as CSSProperties;
  return (
    <div className="kh-radio-display" style={style}>
      {RIVETS.map(place => <i key={place} className={`kh-rivet ${place}`} />)}
      <div className="kh-radio-screen">
        <b className={`kh-radio-count${count.length > values.countLongFrom ? " long" : ""}`}>{scrambled(count, stepShare(steps.count, time), Math.floor(time * values.displayTicks))}</b>
      </div>
    </div>
  );
}
