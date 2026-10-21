// The tube of the Matrix theme on a GSAP timeline (PLAN-MATRIX.md packages 1 and 3): switching on (a bright thin line
// opens with a flash, the brightness settles) and the glitch in slices; the screens and the alert box use the same.
// Check: crtMotion.check.ts.

// The power on: the share of its time for the line and for opening, the line height, how bright the tube starts and
// how strong the flash is
export const POWER = { line: 0.47, open: 0.53, thin: 0.004, bright: 4, flash: 0.9 }; // fixed: the tube of the prototype
// The glitch: length (s), the slices it jumps in (shift px, inset of the clip) and the bright edge
// fixed: the glitch of the prototype
export const GLITCH = { length: 0.2, slices: [{ x: -12, clip: "inset(10% 0 60% 0)" }, { x: 9, clip: "inset(45% 0 20% 0)" }], bright: 1.6 };

// The keyframes of one glitch: the slices, then back to the whole picture
export const glitchKeys = () => [
  ...GLITCH.slices.map(slice => ({ x: slice.x, clipPath: slice.clip, filter: `brightness(${GLITCH.bright})` })),
  { x: 0, clipPath: "inset(0% 0% 0% 0%)", filter: "brightness(1)" },
];

// Switch the tube on at (s) over seconds; flash is the bright layer over it (optional)
export function powerOn(timeline: gsap.core.Timeline, tube: Element, at: number, seconds: number, flash?: Element | null): void {
  timeline.fromTo(tube, { scaleX: 0, scaleY: POWER.thin, filter: `brightness(${POWER.bright})` }, { scaleX: 1, duration: seconds * POWER.line, ease: "power3.out" }, at)
    .to(tube, { scaleY: 1, duration: seconds * POWER.open, ease: "expo.out" }, at + seconds * POWER.line)
    .to(tube, { filter: "brightness(1)", duration: seconds }, at + seconds);
  if (flash) timeline.fromTo(flash, { opacity: POWER.flash }, { opacity: 0, duration: seconds, ease: "power2.out" }, at + seconds * POWER.line);
}
