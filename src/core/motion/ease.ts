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
