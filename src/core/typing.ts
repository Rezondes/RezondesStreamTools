// Simulated typing for the terminal of the full-screen scenes. A line is either text or a
// small script of steps: type, delete, hesitate briefly or smash the keyboard.
// frames() turns it into frames (text + wait afterwards), parseLine() a script from a text line of the
// settings. Pure functions, tested in typing.check.ts.

type Step = string | { del: number } | { pause: number } | { smash: number };
export type Line = string | Step[];
export type Frame = { text: string; wait: number };

const SMASH = "asdfghjklöä#qwertzuiopü+yxcvbnm,.-1234567890ß!§$%&/()=?";

// speed: 2 types twice as fast (applies to typing, deleting and keyboard smashing, not to fixed pauses)
export function frames(line: Line, random: () => number = Math.random, speed = 1): Frame[] {
  const steps = typeof line === "string" ? [line] : line;
  const result: Frame[] = [];
  let text = "";
  for (const step of steps) {
    if (typeof step === "string") {
      for (const char of step) {
        text += char;
        // Human speed, now and then a short pause to think in the middle of a word
        result.push({ text, wait: (55 + random() * 110 + (random() < 0.05 ? 400 : 0)) / speed });
      }
    } else if ("del" in step) {
      // First notice that it is wrong, then go back slowly
      result.push({ text, wait: 700 / speed });
      for (let count = 0; count < step.del && text; count++) {
        text = Array.from(text).slice(0, -1).join("");
        result.push({ text, wait: (90 + random() * 70) / speed });
      }
    } else if ("pause" in step) {
      result.push({ text, wait: step.pause });
    } else {
      for (let count = 0; count < step.smash; count++) {
        text += SMASH[(random() * SMASH.length) | 0];
        result.push({ text, wait: (15 + random() * 30) / speed });
      }
    }
  }
  return result;
}

// Script from text: {del 4} deletes 4 characters, {pause 900} waits 900 ms, {smash 18} smashes the keyboard 18 times.
// Without such commands the line stays plain text.
const COMMAND = /\{(del|pause|smash) (\d+)\}/g;

export function parseLine(text: string): Line {
  const steps: Step[] = [];
  let rest = 0;
  for (const match of text.matchAll(COMMAND)) {
    if (match.index > rest) steps.push(text.slice(rest, match.index));
    const count = Number(match[2]);
    steps.push(match[1] === "del" ? { del: count } : match[1] === "pause" ? { pause: count } : { smash: count });
    rest = match.index + match[0].length;
  }
  if (steps.length === 0) return text;
  if (rest < text.length) steps.push(text.slice(rest));
  return steps;
}
