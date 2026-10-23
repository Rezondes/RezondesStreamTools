// Shapes of the tea break in BRB (DESIGN-KEBAB.md "Figuren"): the arm of the chef holds a tulip glass of tea on its
// hand instead of the knife, the knife lies on the counter. Same grid and part format as chef.ts. Check: pause.check.ts.
import { chefParts, type InkLine, type InkPart } from "./chef.ts";

const path = (outline: string, width = 3): InkLine => ({ shape: { kind: "path", d: outline }, width });

const GLASS = "M220 341 C218 351 225 359 223 367 C221 375 225 380 232 380 C239 380 243 375 241 367 C239 359 246 351 244 341 Z";
const BLADE = "M300 425 L422 425 L426 428 L300 431 Z";
// Top of the tea, where its steam rises
export const GLASS_TOP = { x: 232, y: 337 };
// Height of the counter line (chef.ts), the knife lies on it
export const COUNTER_Y = 432;

export function pauseParts(): { arm: InkPart; glass: InkPart; knife: InkPart } {
  return {
    arm: chefParts().arm,
    glass: { fills: [GLASS], lines: [path(GLASS, 2.6), path("M222 355 L242 355", 2), path("M214 382 L250 382", 2.6)], dots: [] },
    knife: { fills: [BLADE], lines: [path("M276 425 L300 425 L300 431 L276 431 Z", 2.8), path("M300 425 L422 425 L426 428 L300 431", 2.8)], dots: [] },
  };
}
