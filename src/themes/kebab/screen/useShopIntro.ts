// Hook of the Kebab full-screen scenes: the GSAP timeline of the entrance (intro.ts) inside the stage: the light
// flickers on, the arc letters spring in, the lines of chef, spit, arm, counter and plate draw themselves, fills and
// strokes of the meat fade in, the printer drops, the bon feeds out in steps, the ticker rises. Built once the letters
// stand (ready), rebuilt when the parts change. Without drawIn the shop stands from the start (Ending).
import type { RefObject } from "react";
import { useTimeline } from "../../../core/motion/useTimeline.ts";
import type { Intro } from "../intro.ts";

// fixed: flicker of the light (opacity, time in s), durations and staggers like the prototype
const FLICKER = [[0.55, 0.15], [1, 0.24], [0.25, 0.36], [0.8, 0.44], [0, 0.55]] as const;
const TIME = { flicker: 0.06, fade: 0.3, letter: 0.45, letterStagger: 0.06, body: 0.9, bodyStagger: 0.025, spit: 0.8, spitStagger: 0.05, arm: 0.7, armStagger: 0.04, fills: 0.4, hatch: 0.5, printer: 0.5, bon: 1.1, ticker: 0.5 };
const FROM = { letterY: -30, printerY: -200, tickerY: 80 };
const BON_STEPS = 14;

export type IntroParts = { intro: Intro; lights: boolean; ready: boolean; drawIn: boolean; bon: boolean; ticker: boolean };

export function useShopIntro(parts: IntroParts, stage: RefObject<HTMLDivElement | null>) {
  const { intro, lights, ready, drawIn, bon, ticker } = parts;
  useTimeline(timeline => {
    if (lights) {
      timeline.set(".kb-lights", { opacity: 1 }, 0);
      for (const [opacity, at] of FLICKER) timeline.to(".kb-lights", { opacity, duration: opacity === 0 ? TIME.fade : TIME.flicker }, intro.lights + at);
    } else timeline.set(".kb-lights", { opacity: 0 }, 0);
    if (!ready) return;
    if (drawIn) drawShop(timeline, intro);
    if (bon) {
      timeline.from(".kb-printer", { y: FROM.printerY, duration: TIME.printer, ease: "back.out(1.6)" }, intro.printer);
      timeline.from(".kb-bon", { clipPath: "inset(0% 0% 100% 0%)", duration: TIME.bon, ease: `steps(${BON_STEPS})` }, intro.bon);
    }
    if (ticker) timeline.from(".kb-ticker", { y: FROM.tickerY, duration: TIME.ticker, ease: "power3.out" }, intro.ticker);
  }, [intro, lights, ready, drawIn, bon, ticker], stage);
}

// The shop draws itself: letters spring in, lines draw, fills and the meat fade in
function drawShop(timeline: gsap.core.Timeline, intro: Intro) {
  timeline.from(".kb-shop .kb-arc-letter", { scale: 0, y: FROM.letterY, transformOrigin: "50% 70%", duration: TIME.letter, ease: "back.out(2.6)", stagger: TIME.letterStagger }, intro.letters);
  timeline.from(".kb-chef-body .kb-ink", { drawSVG: "0%", duration: TIME.body, ease: "power1.inOut", stagger: TIME.bodyStagger }, intro.body);
  timeline.from(".kb-chef-body .kb-dot", { opacity: 0, duration: TIME.fade }, intro.body + TIME.body);
  timeline.from(".kb-chef-spit .kb-ink:not(.kb-hatch)", { drawSVG: "0%", duration: TIME.spit, ease: "power1.inOut", stagger: TIME.spitStagger }, intro.spit);
  timeline.from(".kb-hatch", { opacity: 0, duration: TIME.hatch }, intro.hatch);
  timeline.from(".kb-chef-arm .kb-ink, .kb-chef-table .kb-ink", { drawSVG: "0%", duration: TIME.arm, ease: "power1.inOut", stagger: TIME.armStagger }, intro.arm);
  timeline.from(".kb-chef .kb-fill, .kb-sign-text", { opacity: 0, duration: TIME.fills }, intro.fills);
}
