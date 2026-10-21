// Decoding texts of the Dachdecker theme (DESIGN-DACHDECKER.md "Bewegung"): characters swirl and settle from the left.
// Pure, so a still image with ?t shows the same frame; tick changes the swirling characters. Check: scramble.check.ts.
import { hash } from "../../../core/hash.ts";

export const LETTERS = "01ABCDEFGHIJKLMNOPQRSTUVWXYZ/";
export const DIGITS = "0123456789";
// Swirl changes per second
export const SCRAMBLE_RATE = 20;

// share: 0 = all swirling, 1 = the text; characters that are no letter or digit stay
export function scrambled(text: string, share: number, tick: number, chars = LETTERS): string {
  if (share >= 1) return text;
  const shown = Math.floor(Math.max(0, share) * text.length);
  return [...text].map((char, index) => {
    if (index < shown || !/[\p{L}\p{N}]/u.test(char)) return char;
    return chars[Math.floor(hash(tick * 131 + index) * chars.length)];
  }).join("");
}
