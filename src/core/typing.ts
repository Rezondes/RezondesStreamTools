// Simuliertes Tippen fürs Terminal der Vollbild-Szenen. Eine Zeile ist entweder Text oder ein
// kleines Drehbuch aus Schritten: tippen, löschen, kurz stocken oder auf die Tastatur hauen.
// frames() macht daraus Einzelbilder (Text + Wartezeit danach), parseLine() ein Drehbuch aus einer Textzeile der
// Einstellungen. Reine Funktionen, getestet in typing.check.ts.

export type Step = string | { del: number } | { pause: number } | { smash: number };
export type Line = string | Step[];
export type Frame = { text: string; wait: number };

const SMASH = "asdfghjklöä#qwertzuiopü+yxcvbnm,.-1234567890ß!§$%&/()=?";

// speed: 2 tippt doppelt so schnell (gilt für Tippen, Löschen und Tastatur-Hauen, nicht für feste Pausen)
export function frames(line: Line, random: () => number = Math.random, speed = 1): Frame[] {
  const steps = typeof line === "string" ? [line] : line;
  const result: Frame[] = [];
  let text = "";
  for (const step of steps) {
    if (typeof step === "string") {
      for (const char of step) {
        text += char;
        // Menschliches Tempo, ab und zu ein kurzes Nachdenken mitten im Wort
        result.push({ text, wait: (55 + random() * 110 + (random() < 0.05 ? 400 : 0)) / speed });
      }
    } else if ("del" in step) {
      // Erst merken, dass es falsch ist, dann langsam zurück
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

// Drehbuch aus Text: {del 4} löscht 4 Zeichen, {pause 900} wartet 900 ms, {smash 18} haut 18-mal auf die Tastatur.
// Ohne solche Befehle bleibt die Zeile einfacher Text.
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
