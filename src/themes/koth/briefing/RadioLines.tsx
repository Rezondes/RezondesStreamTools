// Radio lines of the KOTH Starting: the lines type in one after another with static between them, from the radio step of
// the build on. Reads the clock itself and renders only when the shown text changes.
import { useCallback } from "react";
import type { KothClock, Step } from "../build.ts";
import { radioLine } from "../briefing.ts";
import { useClockValue } from "../useClock.ts";

type Props = { clock: KothClock; step: Step; lines: readonly string[]; every: number; staticMs: number };

// fixed: the static changes 20 times a second; a line types in over the radio step, the static lasts the setting
const TICKS = 20;
const MS = 1000;
// The clock value is one text: its first sign marks static, the rest is shown
const NOISE = "~";
const LINE = ">";

export default function RadioLines({ clock, step, lines, every, staticMs }: Props) {
  const read = useCallback((time: number) => {
    const line = radioLine(lines, time - step.start, { every, typing: step.duration, noise: staticMs / MS }, Math.floor(time * TICKS));
    return (line.noise ? NOISE : LINE) + line.text;
  }, [lines, step, every, staticMs]);
  const shown = useClockValue(clock, read);
  return <p className={`kh-radio-line${shown.startsWith(NOISE) ? " noise" : ""}`}>{shown.slice(1)}</p>;
}
