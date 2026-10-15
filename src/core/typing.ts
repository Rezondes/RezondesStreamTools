// Simuliertes Tippen fürs Terminal der Vollbild-Szenen. Eine Zeile ist entweder Text oder ein
// kleines Drehbuch aus Schritten: tippen, löschen, kurz stocken oder auf die Tastatur hauen.
// frames() macht daraus Einzelbilder (Text + Wartezeit danach); reine Funktion, getestet in typing.check.ts.

export type Step = string | { del: number } | { pause: number } | { smash: number };
export type Line = string | Step[];
export type Frame = { text: string; wait: number };

const SMASH = "asdfghjklöä#qwertzuiopü+yxcvbnm,.-1234567890ß!§$%&/()=?";

export function frames(line: Line, random: () => number = Math.random): Frame[] {
  const steps = typeof line === "string" ? [line] : line;
  const result: Frame[] = [];
  let text = "";
  for (const step of steps) {
    if (typeof step === "string") {
      for (const char of step) {
        text += char;
        // Menschliches Tempo, ab und zu ein kurzes Nachdenken mitten im Wort
        result.push({ text, wait: 55 + random() * 110 + (random() < 0.05 ? 400 : 0) });
      }
    } else if ("del" in step) {
      // Erst merken, dass es falsch ist, dann langsam zurück
      result.push({ text, wait: 700 });
      for (let count = 0; count < step.del && text; count++) {
        text = Array.from(text).slice(0, -1).join("");
        result.push({ text, wait: 90 + random() * 70 });
      }
    } else if ("pause" in step) {
      result.push({ text, wait: step.pause });
    } else {
      for (let count = 0; count < step.smash; count++) {
        text += SMASH[(random() * SMASH.length) | 0];
        result.push({ text, wait: 15 + random() * 30 });
      }
    }
  }
  return result;
}
