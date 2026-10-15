// Hook für den Entschlüsselungs-Effekt: liefert etwa 30-mal pro Sekunde den Text aus decodeFrame, bis er komplett steht.
// Festes Intervall statt requestAnimationFrame: läuft auch in Quellen, die gerade nicht gezeichnet werden, sicher zu Ende.
import { useEffect, useState } from "react";
import { glyph } from "../glyphs.ts";
import { decodeFrame } from "../overlayTiming.ts";

const FRAME_MS = 33;

export function useDecode(text: string, delayMs = 0, msPerChar = 28) {
  const [shown, setShown] = useState("");
  useEffect(() => {
    const start = Date.now() + delayMs;
    const endMs = Array.from(text).length * msPerChar;
    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      setShown(decodeFrame(text, elapsed, msPerChar, glyph));
      if (elapsed >= endMs) clearInterval(timer);
    }, FRAME_MS);
    return () => clearInterval(timer);
  }, [text, delayMs, msPerChar]);
  return shown;
}
