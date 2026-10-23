// Text reveals of the KOTH briefing (PLAN-KOTH.md package 2): typed text, a countdown that decodes from random signs and
// the radio lines that type one after another with static between them. Pure functions of the time, so a still image
// with ?t shows the same text. Check: briefing.check.ts.
import { hash } from "../../core/hash.ts";

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

// The first share of the text
export const typed = (text: string, share: number) => text.slice(0, Math.round(text.length * clamp01(share)));

// fixed: signs of the decoding countdown and of the static
const SCRAMBLE_SIGNS = "0123456789#/";
const STATIC_SIGNS = "░▒▓";
const STATIC_LENGTH = 9;

// Revealed from the left by share, the rest random signs that change with tick (a frame counter)
export function scrambled(text: string, share: number, tick: number): string {
  const shown = Math.round(text.length * clamp01(share));
  const rest = Array.from(text.slice(shown), (_, index) => SCRAMBLE_SIGNS[Math.floor(hash(tick * 101 + index) * SCRAMBLE_SIGNS.length)]);
  return text.slice(0, shown) + rest.join("");
}

type RadioTiming = { every: number; typing: number; noise: number };
type RadioLine = { text: string; noise: boolean };

// Line at a time since the radio started: each line types in, stays, then static fills the end of its turn
export function radioLine(lines: readonly string[], since: number, timing: RadioTiming, tick: number): RadioLine {
  if (since < 0 || lines.length === 0) return { text: "", noise: false };
  const turn = Math.floor(since / timing.every);
  const inTurn = since - turn * timing.every;
  if (inTurn >= timing.every - timing.noise) {
    const text = Array.from({ length: STATIC_LENGTH }, (_, index) => STATIC_SIGNS[Math.floor(hash(tick * 37 + index) * STATIC_SIGNS.length)]).join("");
    return { text, noise: true };
  }
  return { text: typed(lines[turn % lines.length], timing.typing > 0 ? inTurn / timing.typing : 1), noise: false };
}
