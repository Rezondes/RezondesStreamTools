// Radio lines of the KOTH Starting: the lines type in one after another with static between them, from the radio step of
// the build on. Reads the clock itself and renders only when the shown text changes.
import { useCallback } from "react";
import type { KothClock, Step } from "../build.ts";
import { radioLine } from "../briefing.ts";
import { useClockValue } from "../useClock.ts";
import { useKoth } from "../useKoth.ts";

type Props = { clock: KothClock; step: Step; lines: readonly string[]; every: number; staticMs: number };

// A line types in over the radio step, the static lasts the setting and changes some times a second (settings)
const MS = 1000;
// The clock value is one text: its first sign marks static, the rest is shown
const NOISE = "~";
const LINE = ">";

export default function RadioLines({ clock, step, lines, every, staticMs }: Props) {
  const ticks = useKoth().radioLineTicks;
  const read = useCallback((time: number) => {
    const line = radioLine(lines, time - step.start, { every, typing: step.duration, noise: staticMs / MS }, Math.floor(time * ticks));
    return (line.noise ? NOISE : LINE) + line.text;
  }, [lines, step, every, staticMs, ticks]);
  const shown = useClockValue(clock, read);
  return <p className={`kh-radio-line${shown.startsWith(NOISE) ? " noise" : ""}`}>{shown.slice(1)}</p>;
}
