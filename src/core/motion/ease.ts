// Named easing curves for GSAP (plans/PLAN-GRAFIK.md, package 2) as CustomEase paths. Themes offer the names as a choice
// setting; useTimeline registers every curve under its name, so a timeline can say ease: "nagel".
export const EASES = {
  // hammered nail: overshoots, bounces back once, settles
  nagel: "M0,0 C0.14,0 0.24,1.12 0.42,1.12 0.56,1.12 0.6,0.96 0.72,0.96 0.82,0.96 0.86,1 1,1",
  // springy arrival with two small swings
  federnd: "M0,0 C0.2,0 0.3,1.2 0.5,1.2 0.62,1.2 0.68,0.94 0.8,0.94 0.88,0.94 0.92,1.02 1,1",
  // soft start and end, slower in the middle than sine
  weich: "M0,0 C0.4,0 0.3,1 1,1",
  // sudden start, long settling, like a stamp hitting paper
  stempel: "M0,0 C0.05,0.9 0.1,1.08 0.2,1.04 0.4,0.98 0.6,1 1,1",
} as const;

export type EaseName = keyof typeof EASES;

export const EASE_NAMES = Object.keys(EASES) as EaseName[];

// Choices for a setting: no curve or one of the named curves
export const EASE_CHOICES = ["linear", ...EASE_NAMES] as const;
export type EaseChoice = (typeof EASE_CHOICES)[number];

type Point = [number, number];
type Segment = [Point, Point, Point, Point];

// The cubic segments of a curve path ("M0,0 C x,y x,y x,y ..."), read once per name
function segmentsOf(path: string): Segment[] {
  const points = path.replace("M", "").replace("C", "").trim().split(/\s+/).map(pair => pair.split(",").map(Number) as Point);
  const segments: Segment[] = [];
  for (let index = 1; index + 2 < points.length; index += 3) segments.push([points[index - 1], points[index], points[index + 1], points[index + 2]]);
  return segments;
}
const SEGMENTS = Object.fromEntries(EASE_NAMES.map(name => [name, segmentsOf(EASES[name])])) as Record<EaseName, Segment[]>;

const bezier = (start: number, first: number, second: number, end: number, at: number) => {
  const rest = 1 - at;
  return rest * rest * rest * start + 3 * rest * rest * at * first + 3 * rest * at * at * second + at * at * at * end;
};
const BISECTION_STEPS = 40;

// Value of a named curve at progress (0..1) without GSAP, for renderers that draw a frame from the time alone
// (stinger, banners). The x of each segment grows, so the t of a given x is found by bisection.
export function easeAt(name: EaseChoice, progress: number): number {
  const x = Math.min(1, Math.max(0, progress));
  if (name === "linear") return x;
  const segments = SEGMENTS[name];
  const [p0, p1, p2, p3] = segments.find(([, , , end]) => x <= end[0]) ?? segments[segments.length - 1];
  let low = 0;
  let high = 1;
  for (let step = 0; step < BISECTION_STEPS; step++) {
    const mid = (low + high) / 2;
    if (bezier(p0[0], p1[0], p2[0], p3[0], mid) < x) low = mid;
    else high = mid;
  }
  return bezier(p0[1], p1[1], p2[1], p3[1], (low + high) / 2);
}
