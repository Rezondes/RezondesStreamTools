// The entrance of the full-screen scenes as data (DESIGN-KEBAB.md "Bewegung", prototype refs/starting.html): when each
// part starts in seconds, divided by the speed of the settings, so the scene builds its GSAP timeline from it and the
// chef, the shavings and the steam know when they begin. Check: intro.check.ts.

// fixed: the order of the prototype in seconds
const BASE = {
  lights: 0, letters: 0.6, body: 1, fills: 1.4, spit: 1.5, arm: 2, hatch: 2.1, steam: 2.4, printer: 2.4, idle: 2.6, bon: 2.8, ticker: 3.2, shavings: 3.2,
};
export type IntroStep = keyof typeof BASE;
export type Intro = Record<IntroStep, number>;

export function introAt(speed: number): Intro {
  const factor = speed > 0 ? 1 / speed : 1;
  return Object.fromEntries(Object.entries(BASE).map(([step, at]) => [step, at * factor])) as Intro;
}
