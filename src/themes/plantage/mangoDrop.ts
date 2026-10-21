// The mango of the Plantage alert as values of the time (DESIGN-PLANTAGE.md "Modernisierung", refs/alert.html): it falls
// onto the paper medallion, squashes on impact and springs back to its shape without a jump; when the alert leaves it
// rolls away. alertLayout places the frosted card so the text keeps its gap to the medallion. Check: mangoDrop.check.ts.

export type DropOptions = { land: number; squash: number; height: number }; // land in s, squash 0 to 1, fall height in px
export type DropState = { y: number; rotation: number; scaleX: number; scaleY: number };

// fixed: the motion of the prototype: start tilt and stretch, squash time, spring time and its swing
const START = { tilt: -1.6, stretchX: 0.9, stretchY: 1.15 };
const SQUASH_TIME = 0.08;
const SPRING = { time: 0.9, damping: 6, swing: 14 };
// fixed: rolling away: duration in s, distance in px, turns
const ROLL = { time: 0.8, x: 270, y: 970, turn: 6 };

// Share of the spring back (0 = fully squashed, 1 = round again), settles exactly at its end
function springBack(after: number): number {
  if (after >= SPRING.time) return 1;
  return 1 - Math.exp(-SPRING.damping * after) * Math.cos(SPRING.swing * after) * (1 - after / SPRING.time);
}

// Where the mango is at seconds since the alert began: y = 0 is resting on the medallion, negative above it
export function mangoDrop(seconds: number, { land, squash, height }: DropOptions): DropState {
  if (seconds < land) {
    const fall = Math.max(0, seconds) / land;
    return {
      y: -height * (1 - fall * fall),
      rotation: START.tilt * (1 - fall),
      scaleX: START.stretchX + (1 - START.stretchX) * fall,
      scaleY: START.stretchY + (1 - START.stretchY) * fall,
    };
  }
  const after = seconds - land;
  if (after < SQUASH_TIME) {
    const press = after / SQUASH_TIME;
    return { y: 0, rotation: 0, scaleX: 1 + squash * press, scaleY: 1 - squash * press };
  }
  const left = 1 - springBack(after - SQUASH_TIME);
  return { y: 0, rotation: 0, scaleX: 1 + squash * left, scaleY: 1 - squash * left };
}

// The mango rolling away, seconds after the alert began to leave
export function mangoRoll(seconds: number): { x: number; y: number; rotation: number } {
  const part = Math.min(1, Math.max(0, seconds) / ROLL.time) ** 2;
  return { x: ROLL.x * part, y: ROLL.y * part, rotation: ROLL.turn * part };
}

// fixed: the text never comes closer than this to the medallion, for legibility
export const MIN_GAP = 24;

// The card starts behind the medallion (overlap px left of its middle); the text starts gap px right of the outer ring
export function alertLayout({ medal, ring, overlap, gap }: { medal: number; ring: number; overlap: number; gap: number }) {
  const cardLeft = medal / 2 - overlap;
  const textStart = medal + ring + Math.max(MIN_GAP, gap);
  return { cardLeft, textPadding: textStart - cardLeft, textStart };
}
