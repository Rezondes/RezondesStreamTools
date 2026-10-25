// The entrance of the full-screen scenes as data (DESIGN-KEBAB.md "Bewegung", prototype refs/starting.html): when each
// part starts in seconds, divided by the speed of the settings, so the scene builds its GSAP timeline from it and the
// chef, the shavings and the steam know when they begin. Check: intro.check.ts.

import type { KebabValues } from "./settings.ts";

type IntroStep = "lights" | "letters" | "body" | "fills" | "spit" | "arm" | "hatch" | "steam" | "printer" | "idle" | "bon" | "ticker" | "shavings";
export type Intro = Record<IntroStep, number>;

// The order of the settings in seconds (the prototype as default)
export const introOf = (values: KebabValues): Intro => ({
  lights: values.introLights, letters: values.introLetters, body: values.introBody, fills: values.introFills, spit: values.introSpit,
  arm: values.introArm, hatch: values.introHatch, steam: values.introSteam, printer: values.introPrinter, idle: values.introIdle,
  bon: values.introBon, ticker: values.introTicker, shavings: values.introShavings,
});

export function introAt(speed: number, base: Intro): Intro {
  const factor = speed > 0 ? 1 / speed : 1;
  return Object.fromEntries(Object.entries(base).map(([step, at]) => [step, at * factor])) as Intro;
}
