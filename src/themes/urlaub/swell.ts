// The swell of the Urlaub alert (PLAN-URLAUB.md package 7, refs/alert.html): a wave travels across the overlay; coming
// in it runs from left to right and carries the postcard to its place, going out a second one runs from right to left
// and sweeps the card away. A steep front, a long back, no wave between the two; its height is 0 at both ends of the
// stretch. Everything from the time. Check: swell.check.ts.

// in: the swell coming in from the start; out: the one going out from leave; each over its seconds
export type SwellTiming = { inSeconds: number; leave: number; outSeconds: number; height: number };
export type Swell = { crest: number; height: number; direction: 1 | -1; share: number };

// fixed: the stretch the swell runs over (px of the overlay), its water line, how far the swell rises above it, the
// width of the steep front and of the long back
export const STRETCH = { from: 380, to: 1540, base: 600, rest: 40 };
const FRONT = 120;
const BACK = 300;
// fixed: how round the rise and fall of a swell is
const SWELL_SHAPE = 0.7;

export function swellAt(seconds: number, timing: SwellTiming): Swell | null {
  const coming = seconds / timing.inSeconds;
  const going = (seconds - timing.leave) / timing.outSeconds;
  const lift = (share: number) => timing.height * Math.sin(share * Math.PI) ** SWELL_SHAPE;
  if (coming > 0 && coming < 1) return { crest: STRETCH.from + coming * (STRETCH.to - STRETCH.from), height: lift(coming), direction: 1, share: coming };
  if (going > 0 && going < 1) return { crest: STRETCH.to - going * (STRETCH.to - STRETCH.from), height: lift(going), direction: -1, share: going };
  return null;
}

// How high the water stands over the base line at x (0 at both ends of the stretch)
export function waterHeight(x: number, swell: Swell): number {
  const along = (x - STRETCH.from) / (STRETCH.to - STRETCH.from);
  if (along <= 0 || along >= 1) return 0;
  const edge = Math.sin(along * Math.PI);
  const ahead = (x - swell.crest) * swell.direction;
  const width = ahead > 0 ? FRONT : BACK;
  return edge * (swell.height * Math.exp(-((ahead / width) ** 2)) + STRETCH.rest);
}

// The share of the ride of the card: it reaches its place (1) when the incoming crest reaches the middle of the stretch
export const MIDDLE = (STRETCH.from + STRETCH.to) / 2;
export function cardRide(seconds: number, timing: SwellTiming): number {
  const reach = timing.inSeconds * ((MIDDLE - STRETCH.from) / (STRETCH.to - STRETCH.from));
  return Math.min(1, Math.max(0, seconds / reach));
}
