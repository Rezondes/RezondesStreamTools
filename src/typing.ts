// Simuliertes Tippen fürs Terminal der Vollbild-Szenen. Eine Zeile ist entweder Text oder ein
// kleines Drehbuch aus Schritten: tippen, löschen, kurz stocken oder auf die Tastatur hauen.
// frames() macht daraus Einzelbilder (Text + Wartezeit danach); reine Funktion, getestet in typing.check.ts.

export type Step = string | { del: number } | { pause: number } | { smash: number };
export type Line = string | Step[];
export type Frame = { text: string; wait: number };

const SMASH = "asdfghjklöä#qwertzuiopü+yxcvbnm,.-1234567890ß!§$%&/()=?";

export function frames(line: Line, rnd: () => number = Math.random): Frame[] {
  const steps = typeof line === "string" ? [line] : line;
  const out: Frame[] = [];
  let text = "";
  for (const s of steps) {
    if (typeof s === "string") {
      for (const ch of s) {
        text += ch;
        // Menschliches Tempo, ab und zu ein kurzes Nachdenken mitten im Wort
        out.push({ text, wait: 55 + rnd() * 110 + (rnd() < 0.05 ? 400 : 0) });
      }
    } else if ("del" in s) {
      // Erst merken, dass es falsch ist, dann langsam zurück
      out.push({ text, wait: 700 });
      for (let i = 0; i < s.del && text; i++) {
        text = Array.from(text).slice(0, -1).join("");
        out.push({ text, wait: 90 + rnd() * 70 });
      }
    } else if ("pause" in s) {
      out.push({ text, wait: s.pause });
    } else {
      for (let i = 0; i < s.smash; i++) {
        text += SMASH[(rnd() * SMASH.length) | 0];
        out.push({ text, wait: 15 + rnd() * 30 });
      }
    }
  }
  return out;
}
