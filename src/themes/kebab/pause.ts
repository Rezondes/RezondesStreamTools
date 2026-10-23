// Shapes of the tea break in BRB (DESIGN-KEBAB.md "Figuren"): the arm of the chef holds a tulip glass of tea on its
// hand instead of the knife, the knife lies on the counter, a paper sign hangs from the end of the spit bar. Same grid and
// part format as chef.ts. Check: pause.check.ts.
import { chefParts, type InkLine, type InkPart } from "./chef.ts";

const path = (outline: string, width = 3): InkLine => ({ shape: { kind: "path", d: outline }, width });

const GLASS = "M220 341 C218 351 225 359 223 367 C221 375 225 380 232 380 C239 380 243 375 241 367 C239 359 246 351 244 341 Z";
const BLADE = "M300 425 L422 425 L426 428 L300 431 Z";
// Sign: the corners of the paper and where its strings hang from the spit bar
export const SIGN = { x: 366, y: 244, width: 140, height: 52, hook: { x: 342, y: 164 } };
// Top of the tea, where its steam rises
export const GLASS_TOP = { x: 232, y: 337 };
// Height of the counter line (chef.ts), the knife lies on it
export const COUNTER_Y = 432;

export function pauseParts(): { arm: InkPart; glass: InkPart; knife: InkPart; sign: InkPart } {
  const sign = SIGN;
  const paper = `M${sign.x} ${sign.y} L${sign.x + sign.width} ${sign.y} L${sign.x + sign.width} ${sign.y + sign.height} L${sign.x} ${sign.y + sign.height} Z`;
  return {
    arm: chefParts().arm,
    glass: { fills: [GLASS], lines: [path(GLASS, 2.6), path("M222 355 L242 355", 2), path("M214 382 L250 382", 2.6)], dots: [] },
    knife: { fills: [BLADE], lines: [path("M276 425 L300 425 L300 431 L276 431 Z", 2.8), path("M300 425 L422 425 L426 428 L300 431", 2.8)], dots: [] },
    sign: {
      fills: [paper],
      lines: [path(paper, 2.8), path(`M${sign.hook.x} ${sign.hook.y} L${sign.x + 10} ${sign.y} M${sign.hook.x} ${sign.hook.y} L${sign.x + sign.width - 10} ${sign.y}`, 2)],
      dots: [{ x: sign.hook.x, y: sign.hook.y, radius: 2.4, filled: true }],
    },
  };
}
