// Dog tag alert of the KOTH theme (PLAN-KOTH.md package 4, refs/alert.html): the outline of the tag with the hole for the
// chain, the stamped lines from the settings, the timing of the alert and the pendulum of the tag on its chain. The tag
// drops in and swings out, the radio opens from the tag, static, then head line, name and line; leaving runs back. Pure;
// check: dogtag.check.ts.
import { STAGE } from "../../core/screens/screens.ts";
import { fillTemplate } from "../../core/template.ts";
import { type Step, stepShare } from "./build.ts";

type Point2 = readonly [number, number];

// fixed: size of the tag in stage px, its rounded corners and the hole for the chain (from the prototype)
export const DOGTAG = { width: 150, height: 240, corner: 46, holeY: 94, holeRadius: 10 };
const CORNER_STEPS = 8;
const HOLE_STEPS = 24;

// Quarter of a rounded corner around its center, from angle on for a quarter turn
function corner(centerX: number, centerY: number, radius: number, from: number): Point2[] {
  return Array.from({ length: CORNER_STEPS + 1 }, (_, step) => {
    const angle = from + (step / CORNER_STEPS) * (Math.PI / 2);
    return [centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius] as Point2;
  });
}

// Closed outline (the last point is the first) around the middle, y up, and the hole near the top
export function dogtagShape(): { outline: Point2[]; hole: Point2[] } {
  const { width, height, corner: radius } = DOGTAG;
  const [right, top] = [width / 2 - radius, height / 2 - radius];
  const outline = [
    ...corner(right, -top, radius, -Math.PI / 2), ...corner(right, top, radius, 0),
    ...corner(-right, top, radius, Math.PI / 2), ...corner(-right, -top, radius, Math.PI),
  ];
  const hole = Array.from({ length: HOLE_STEPS + 1 }, (_, step) => {
    const angle = (step / HOLE_STEPS) * Math.PI * 2;
    return [Math.cos(angle) * DOGTAG.holeRadius, DOGTAG.holeY + Math.sin(angle) * DOGTAG.holeRadius] as Point2;
  });
  return { outline: [...outline, outline[0]], hole };
}

// The stamped lines: placeholders filled, upper case like a stamping machine, empty lines left out
export const dogtagLines = (templates: readonly string[], names: Readonly<Record<string, string>>) =>
  templates.map(line => fillTemplate(line, names).trim().toUpperCase()).filter(line => line.length > 0);

// The rows stamped on the plate: a line at full size, or a line too wide for room split in two at the separator nearest
// its middle (a space, _, - or .) and made only as small as both halves need, like a long name on a real tag. widthOf
// measures a text at a size; rows follow each other at line apart, scaled with their size.
type StampRow = { text: string; size: number; y: number };
export function stampRows(lines: readonly string[], widthOf: (text: string, size: number) => number, room: number, stamp: { size: number; first: number; line: number }): StampRow[] {
  const rows: StampRow[] = [];
  let y = stamp.first;
  for (const text of lines) {
    const parts = widthOf(text, stamp.size) <= room ? [text] : splitInHalf(text);
    const size = Math.min(stamp.size, ...parts.map(part => Math.floor((stamp.size * room) / Math.max(1, widthOf(part, stamp.size)))));
    for (const part of parts) {
      rows.push({ text: part, size, y });
      y += (stamp.line * size) / stamp.size;
    }
  }
  return rows;
}

function splitInHalf(text: string): [string, string] {
  const middle = text.length / 2;
  const breaks = [...text].flatMap((char, index) => (/[\s_.-]/.test(char) && index > 0 && index < text.length - 1 ? [index + 1] : []));
  const at = breaks.length ? breaks.reduce((best, index) => (Math.abs(index - middle) < Math.abs(best - middle) ? index : best)) : Math.ceil(middle);
  return [text.slice(0, at).trim(), text.slice(at).trim()];
}

const MS = 1000;
const step = (start: number, duration: number): Step => ({ start, duration, stagger: 0 });

// Steps of an alert in s since it appeared; openMs: the radio slams open, staticMs: the static before the call
export function alertSteps(openMs: number, staticMs: number) {
  const open = 0.55;
  const call = open + openMs / MS + staticMs / MS;
  return {
    drop: step(0.05, 0.5), swing: step(open, 2.6), radio: step(open, openMs / MS), noise: step(open + openMs / MS, staticMs / MS),
    tag: step(call, 0.7), name: step(call + 0.3, 1), line: step(call + 1.1, 1.1), led: step(call, 1.2),
  };
}
export type AlertSteps = ReturnType<typeof alertSteps>;

// Leaving: static, the radio closes, the tag is pulled up; in s since leaving began
export const leaveSteps = (closeMs: number) => ({ noise: step(0, 0.25), radio: step(0.2, closeMs / MS), pull: step(0.3, 0.5) });

// easeOutElastic: overshoots and settles in shrinking swings
export function elasticOut(share: number): number {
  if (share <= 0) return 0;
  if (share >= 1) return 1;
  return 2 ** (-10 * share) * Math.sin((share * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
}

// fixed: start angle of the swing and the angle when it is pulled away
const SWING_FROM = 0.9;
const PULL_ANGLE = -0.4;

// Pendulum of the tag: drop 0 (above the picture) to 1 (hanging), angle in radians; swing scales the angle;
// leftFor: seconds since leaving began, null while it stays
export function swingAt(time: number, steps: AlertSteps, swing: number, leftFor: number | null, closeMs: number) {
  const drop = stepShare(steps.drop, time) ** 3;
  const angle = SWING_FROM * (1 - elasticOut(stepShare(steps.swing, time))) * swing;
  if (leftFor === null) return { drop, angle };
  const pulled = stepShare(leaveSteps(closeMs).pull, leftFor);
  return { drop: drop * (1 - pulled), angle: angle + (PULL_ANGLE - angle) * pulled };
}

// fixed: the radio starts this far right of the tag center, the tag hangs this far below the top of the radio, the edge
// of the stage for left and right alignment (stage px, from the prototype)
const RADIO_GAP = 140;
const HANG = 354;
const EDGE = 72;
// fixed: top of the radio on the stage (px); the OBS source shows only the part of tag and radio, the streamer places it
// in OBS (same value as --alert-top in theme.css for the card styles)
export const ALERT_TOP = 80;

// Where tag and radio sit: the pair is aligned left, in the middle or right; top of the radio, its width and the scale
// from the settings. tag: center of the hanging tag, radio: its top left corner.
export function alertLayout(align: string, top: number, width: number, scale: number) {
  const half = DOGTAG.width / 2;
  const total = (half + RADIO_GAP + width) * scale;
  const left = align === "left" ? EDGE : align === "right" ? STAGE.width - EDGE - total : (STAGE.width - total) / 2;
  return { tag: { x: left + half * scale, y: top + HANG * scale }, radio: { left: left + (half + RADIO_GAP) * scale, top } };
}
