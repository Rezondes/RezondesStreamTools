// Hook: types lines one after another (including typos from typing.ts), endlessly in a loop.
// shown = the last visible finished lines, typing = the line being written right now.
import { useEffect, useState } from "react";
import { frames, type Line } from "../typing.ts";

// speed: Tipp-Tempo (2 = doppelt so schnell), siehe frames in typing.ts
type TerminalTiming = { visible: number; startDelayMs: number; pauseMinMs: number; pauseMaxMs: number; speed: number };

export function useTerminal(lines: Line[], timing: TerminalTiming) {
  const [shown, setShown] = useState<string[]>([]);
  const [typing, setTyping] = useState("");
  const { visible, startDelayMs, pauseMinMs, pauseMaxMs, speed } = timing;

  useEffect(() => {
    if (lines.length === 0) return;
    let lineIndex = 0;
    let frameIndex = 0;
    let current = frames(lines[0], Math.random, speed);
    let timer: ReturnType<typeof setTimeout>;
    const step = () => {
      if (frameIndex < current.length) {
        setTyping(current[frameIndex].text);
        timer = setTimeout(step, current[frameIndex++].wait);
        return;
      }
      const done = current.at(-1)?.text ?? "";
      setShown(list => [...list, done].slice(-visible));
      setTyping("");
      current = frames(lines[++lineIndex % lines.length], Math.random, speed);
      frameIndex = 0;
      timer = setTimeout(step, pauseMinMs + Math.random() * (pauseMaxMs - pauseMinMs));
    };
    timer = setTimeout(step, startDelayMs);
    return () => clearTimeout(timer);
  }, [lines, visible, startDelayMs, pauseMinMs, pauseMaxMs, speed]);

  return { shown, typing };
}
