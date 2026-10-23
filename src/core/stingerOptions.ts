// Stinger options for every theme (plans/PLAN-GRAFIK.md, package 6): frame rate, hold at the transition point, motion
// curve and output size. The core wraps the stinger clip of a theme: it maps the real time to the drawing time (hold
// and curve) and scales the context (size), so the drawing of the theme stays as it is. Pure; check:
// stingerOptions.check.ts.
import { choice, number } from "./fields.ts";
import { EASE_CHOICES, easeAt, type EaseChoice } from "./motion/ease.ts";
import type { RenderClip } from "./renderClip.ts";

const STINGER_SIZES = ["1080p", "720p"] as const;
type StingerSize = (typeof STINGER_SIZES)[number];
// Drawings are made for 1920x1080; 720p is the same drawing at two thirds
const SIZE_SCALE: Record<StingerSize, number> = { "1080p": 1, "720p": 2 / 3 };
const PERCENT = 100;

type StingerDefaults = Partial<{ stingerFps: number; stingerHold: number }>;

// The four fields in the stinger group of a theme; defaults per theme (e.g. the frame rate it rendered with so far)
export const stingerFields = (group: string, defaults: StingerDefaults = {}) => [
  number("stingerFps", "Bildrate (Bilder pro Sekunde)", group, defaults.stingerFps ?? 60, 10, 60),
  number("stingerHold", "Pause am Übergangspunkt (Anteil je Hälfte)", group, defaults.stingerHold ?? 0, 0, 80, "%"),
  choice("stingerEase", "Bewegungskurve", group, "linear", EASE_CHOICES),
  choice("stingerSize", "Ausgabegrösse", group, "1080p", STINGER_SIZES),
];

// The fields of a theme with the four stinger fields at the top of its stinger group (appended when it has none)
export function withStingerFields<T extends { group: string }>(fields: readonly T[], group: string, defaults: StingerDefaults = {}): (T | ReturnType<typeof stingerFields>[number])[] {
  const at = fields.findIndex(field => field.group === group);
  const own = stingerFields(group, defaults);
  return at < 0 ? [...fields, ...own] : [...fields.slice(0, at), ...own, ...fields.slice(at)];
}

export type StingerOptions = { fps: number; hold: number; ease: EaseChoice; size: StingerSize };

// Options from the resolved values of a theme (hold as a share 0..0.8)
export function readStingerOptions(values: Readonly<Record<string, unknown>>): StingerOptions {
  return {
    fps: values.stingerFps as number,
    hold: (values.stingerHold as number) / PERCENT,
    ease: values.stingerEase as EaseChoice,
    size: values.stingerSize as StingerSize,
  };
}

type StingerTiming = { duration: number; cut: number; hold: number; ease: EaseChoice };

// Drawing time for a real time: the first half reaches the transition point after cut * (1 - hold) and stands there,
// the second half starts after the same share of its length; the curve shapes each half. Hold 0 and linear give the
// real time back.
export function warpTime(time: number, timing: StingerTiming): number {
  const { duration, cut, hold, ease } = timing;
  if (time <= cut) {
    const end = cut * (1 - hold);
    return cut * easeAt(ease, end > 0 ? time / end : 1);
  }
  const start = cut + (duration - cut) * hold;
  const span = duration - start;
  return cut + (duration - cut) * easeAt(ease, span > 0 ? (time - start) / span : 1);
}

// The stinger clip of a theme with the options: frame rate, size and the drawing at the mapped time. ownHold: the
// theme draws the hold itself (e.g. the roll of Dachdecker), so the core does not map it again.
export function withStingerOptions(clip: RenderClip, options: StingerOptions & { ownHold?: boolean }): RenderClip {
  const scale = SIZE_SCALE[options.size];
  const cut = clip.cut ?? clip.duration / 2;
  const timing: StingerTiming = { duration: clip.duration, cut, hold: options.ownHold ? 0 : options.hold, ease: options.ease };
  return {
    ...clip,
    fps: options.fps,
    width: Math.round(clip.width * scale),
    height: Math.round(clip.height * scale),
    draw: (context, time) => {
      if (scale === 1) {
        clip.draw(context, warpTime(time, timing));
        return;
      }
      context.save();
      context.scale(scale, scale);
      clip.draw(context, warpTime(time, timing));
      context.restore();
    },
  };
}
