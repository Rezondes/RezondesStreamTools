// Radio display of the KOTH Starting: a steel device with rivets slides in, its screen flashes on in three steps and the
// countdown decodes from random signs, then counts down.
import type { CSSProperties } from "react";
import { outCubic, type Steps, stepShare } from "../build.ts";
import { scrambled } from "../briefing.ts";

type Props = { time: number; steps: Steps; count: string };

// fixed: the screen switches on in three steps, the signs change 20 times a second, the device rises from 30 px
const FLASH_STEPS = 3;
const TICKS = 20;
const RISE = 30;
const RIVETS = ["top-left", "top-right", "bottom-left", "bottom-right"];

export default function RadioDisplay({ time, steps, count }: Props) {
  const shown = outCubic(stepShare(steps.display, time));
  const flash = 1 - Math.floor(stepShare(steps.screen, time) * FLASH_STEPS) / FLASH_STEPS;
  const style = { opacity: shown, transform: `translateY(${(1 - shown) * RISE}px)`, "--flash": flash } as CSSProperties;
  return (
    <div className="kh-radio-display" style={style}>
      {RIVETS.map(place => <i key={place} className={`kh-rivet ${place}`} />)}
      <div className="kh-radio-screen">
        <b className="kh-radio-count">{scrambled(count, stepShare(steps.count, time), Math.floor(time * TICKS))}</b>
      </div>
    </div>
  );
}
