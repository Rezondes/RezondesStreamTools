// Hook for the decode effect: returns the text from decodeFrame about 30 times per second until it is complete.
// A fixed interval instead of requestAnimationFrame: also finishes safely in sources that are not being drawn.
import { useEffect, useState } from "react";
import { GLYPHS, glyph } from "../glyphs.ts";
import { decodeFrame } from "../overlayTiming.ts";

const FRAME_MS = 33;

// chars: character set of the random characters before the finished text
export function useDecode(text: string, delayMs = 0, msPerChar = 28, chars = GLYPHS) {
  const [shown, setShown] = useState("");
  useEffect(() => {
    const start = Date.now() + delayMs;
    const endMs = Array.from(text).length * msPerChar;
    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      setShown(decodeFrame(text, elapsed, msPerChar, () => glyph(chars)));
      if (elapsed >= endMs) clearInterval(timer);
    }, FRAME_MS);
    return () => clearInterval(timer);
  }, [text, delayMs, msPerChar, chars]);
  return shown;
}
