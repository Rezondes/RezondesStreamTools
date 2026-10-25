// The tube of the Matrix theme on a GSAP timeline (PLAN-MATRIX.md packages 1 and 3): switching on (a bright thin line
// opens with a flash, the brightness settles) and the glitch in slices; the screens and the alert box use the same.
// Check: crtMotion.check.ts.
import type { MatrixValues } from "./settings.ts";

// The tube (settings): the power on (the share of its time for the line and for opening, the line height, how bright
// the tube starts and how strong the flash is), the glitch (length in s, the slices it jumps in with shift px and the
// insets of the clip, the bright edge) and the typing of a terminal line (s per character, divided by the decode speed,
// and the longest a line may take in s)
export type TubeLook = {
  power: { line: number; open: number; thin: number; bright: number; flash: number };
  glitch: { length: number; slices: readonly { x: number; clip: string }[]; bright: number };
  typing: { perChar: number; longest: number };
};

export const tubeLookOf = (values: MatrixValues): TubeLook => ({
  power: { line: values.crtPowerLine, open: values.crtPowerOpen, thin: values.crtPowerThin, bright: values.crtPowerBright, flash: values.crtPowerFlash },
  glitch: {
    length: values.crtGlitchLength,
    slices: [
      { x: values.crtGlitchShift, clip: `inset(${values.crtGlitchTop}% 0 ${values.crtGlitchBottom}% 0)` },
      { x: values.crtGlitchShift2, clip: `inset(${values.crtGlitchTop2}% 0 ${values.crtGlitchBottom2}% 0)` },
    ],
    bright: values.crtGlitchBright,
  },
  typing: { perChar: values.typePerChar, longest: values.typeLongest },
});

// The keyframes of one glitch: the slices, then back to the whole picture
export const glitchKeys = (look: TubeLook) => [
  ...look.glitch.slices.map(slice => ({ x: slice.x, clipPath: slice.clip, filter: `brightness(${look.glitch.bright})` })),
  { x: 0, clipPath: "inset(0% 0% 0% 0%)", filter: "brightness(1)" },
];

// A line types itself at (s) and glitches once as it starts; speed is the decode speed of the settings
export function typeIn(timeline: gsap.core.Timeline, line: Element, at: number, speed: number, look: TubeLook): void {
  const text = line.textContent ?? "";
  const seconds = Math.min(look.typing.longest, (Array.from(text).length * look.typing.perChar) / speed);
  timeline.fromTo(line, { text: "" }, { text, duration: seconds, ease: "none" }, at)
    .to(line, { keyframes: glitchKeys(look), duration: look.glitch.length }, at);
}

// Switch the tube on at (s) over seconds; flash is the bright layer over it (optional)
export function powerOn(timeline: gsap.core.Timeline, tube: Element, at: number, seconds: number, look: TubeLook, flash?: Element | null): void {
  const power = look.power;
  timeline.fromTo(tube, { scaleX: 0, scaleY: power.thin, filter: `brightness(${power.bright})` }, { scaleX: 1, duration: seconds * power.line, ease: "power3.out" }, at)
    .to(tube, { scaleY: 1, duration: seconds * power.open, ease: "expo.out" }, at + seconds * power.line)
    .to(tube, { filter: "brightness(1)", duration: seconds }, at + seconds);
  if (flash) timeline.fromTo(flash, { opacity: power.flash }, { opacity: 0, duration: seconds, ease: "power2.out" }, at + seconds * power.line);
}
