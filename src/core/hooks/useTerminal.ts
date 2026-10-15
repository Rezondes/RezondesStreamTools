// Hook: tippt Zeilen nacheinander ab (inklusive Vertipper aus typing.ts), endlos im Kreis.
// shown = die letzten visible fertigen Zeilen, typing = die Zeile, die gerade entsteht.
import { useEffect, useState } from "react";
import { frames, type Line } from "../typing.ts";

export type TerminalTiming = { visible: number; startDelayMs: number; pauseMinMs: number; pauseMaxMs: number };

export function useTerminal(lines: Line[], timing: TerminalTiming) {
  const [shown, setShown] = useState<string[]>([]);
  const [typing, setTyping] = useState("");
  const { visible, startDelayMs, pauseMinMs, pauseMaxMs } = timing;

  useEffect(() => {
    if (lines.length === 0) return;
    let lineIndex = 0;
    let frameIndex = 0;
    let current = frames(lines[0]);
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
      current = frames(lines[++lineIndex % lines.length]);
      frameIndex = 0;
      timer = setTimeout(step, pauseMinMs + Math.random() * (pauseMaxMs - pauseMinMs));
    };
    timer = setTimeout(step, startDelayMs);
    return () => clearTimeout(timer);
  }, [lines, visible, startDelayMs, pauseMinMs, pauseMaxMs]);

  return { shown, typing };
}
