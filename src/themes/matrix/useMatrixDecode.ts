// Decoding in the matrix theme: start delay and ms per character per text spot, tuned to each other
// (first header, then name, then line). The speed from the settings divides all times, the random characters
// come from the theme's character set.
import { useDecode } from "../../core/hooks/useDecode.ts";
import { useMatrix } from "./useMatrix.ts";

const DECODE = {
  screenTitle: [2400, 45],
  logo: [1800, 2],
  alertHeader: [550, 18],
  alertName: [800, 55],
  alertLine: [1300, 22],
  alertQuote: [1900, 18],
  camLabel: [600, 40],
  chatUser: [0, 35],
  musicTitle: [350, 30],
  musicArtist: [650, 18],
} as const;

export function useMatrixDecode(text: string, part: keyof typeof DECODE) {
  const { decodeSpeed, glyphs } = useMatrix();
  const [delayMs, msPerChar] = DECODE[part];
  return useDecode(text, delayMs / decodeSpeed, msPerChar / decodeSpeed, glyphs);
}
