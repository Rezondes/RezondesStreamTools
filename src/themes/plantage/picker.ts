// The mango picker of the Plantage world as flat shapes (no outlines, light from the top left): straw hat with band,
// shirt with a shade side, head, legs, a woven basket and the arm with the bamboo pole on its own joint at the shoulder.
// reach gives the arm angle when the picker reaches up into the tree: from rest to the grasp, springing in without a
// jump (Starting); pickAt loops picking a mango that hangs in the crown, falls with a bounce into the basket and grows
// again (BRB); waveAt waves the pole with the full basket (Ending). aimAt turns the grasp towards a spot in the crown of
// the tree; graspInto finds the grasp that puts the tip into the crown, so the pole really reaches into it. Drawn by pixi/Picker.tsx. Check: picker.check.ts.
import { mixHex } from "../../core/color.ts";
import type { Shape } from "./tree.ts";

type PickerColors = { hat: string; band: string; shirt: string; skin: string; pants: string; eye: string; pole: string; basket: string; shadow: string };
type PickerParts = { body: Shape[]; arm: Shape[]; pole: Shape[]; knob: Shape[]; basket: Shape[]; shoulder: { x: number; y: number }; basketAt: { x: number; y: number } };

// fixed: shapes of the prototype (refs/starting.html), feet at y = 0; shades mix the color this far towards the shadow
const SHADE = 0.25;
const BASKET_STAVES = 6;
// fixed: the pole reaches this far above the shoulder and this far below it
export const POLE = 330;
const POLE_FOOT = 70;

export function picker(colors: PickerColors): PickerParts {
  const shade = (color: string) => mixHex(color, colors.shadow, SHADE);
  const body: Shape[] = [
    { kind: "ellipse", x: 0, y: 0, rx: 70, ry: 12, color: colors.shadow, alpha: 0.28 },
    { kind: "rect", x: -26, y: -120, w: 22, h: 120, radius: 8, color: colors.pants },
    { kind: "rect", x: 4, y: -120, w: 22, h: 120, radius: 8, color: shade(colors.pants) },
    { kind: "rect", x: -38, y: -250, w: 76, h: 140, radius: 26, color: colors.shirt },
    { kind: "rect", x: 6, y: -250, w: 32, h: 140, radius: 20, color: shade(colors.shirt) },
    { kind: "circle", x: 0, y: -290, r: 38, color: colors.skin },
    { kind: "circle", x: 12, y: -284, r: 30, color: shade(colors.skin), alpha: 0.5 },
    { kind: "circle", x: -12, y: -294, r: 4, color: colors.eye },
    { kind: "circle", x: 12, y: -294, r: 4, color: colors.eye },
    { kind: "ellipse", x: 0, y: -318, rx: 84, ry: 18, color: shade(colors.hat) },
    { kind: "ellipse", x: 0, y: -340, rx: 44, ry: 30, color: colors.hat },
    { kind: "rect", x: -44, y: -330, w: 88, h: 8, color: colors.band },
  ];
  const arm: Shape[] = [
    { kind: "rect", x: -10, y: -110, w: 20, h: 116, radius: 10, color: colors.shirt },
    { kind: "circle", x: 0, y: -112, r: 13, color: colors.skin },
  ];
  // The pole on the arm from its foot to its tip (POLE above the shoulder) and the knob at the tip, apart so a picker
  // close to the tree can hold it shorter
  const pole: Shape[] = [{ kind: "rect", x: -5, y: -POLE, w: 10, h: POLE + POLE_FOOT, radius: 5, color: colors.pole }];
  const knob: Shape[] = [{ kind: "circle", x: 0, y: 0, r: 9, color: shade(colors.pole) }];
  const basket: Shape[] = [
    { kind: "rect", x: -48, y: -46, w: 96, h: 64, radius: 16, color: shade(colors.basket) },
    { kind: "rect", x: -48, y: -46, w: 96, h: 14, radius: 6, color: colors.basket },
    ...Array.from({ length: BASKET_STAVES }, (_, index): Shape => ({ kind: "rect", x: -44 + index * 16, y: -30, w: 3, h: 46, color: colors.shadow, alpha: 0.35 })),
  ];
  return { body, arm, pole, knob, basket, shoulder: { x: -30, y: -235 }, basketAt: { x: 55, y: -120 } };
}

// Arm angles in radians: hanging with the pole and reaching up into the tree (the grasp when there is no tree to aim at)
export const ARM = { rest: -0.15, grasp: -0.45 } as const;
// fixed: the spring of the reach (damping, swing) and the small sway of the arm once it holds the pole up
const SPRING = { damping: 5, swing: 9 };
const WIGGLE = { speed: 2.2, size: 0.06 };

// Share of the way from 0 to 1 with a spring that swings past and settles exactly at the end
export function settle(part: number): number {
  if (part <= 0) return 0;
  if (part >= 1) return 1;
  return 1 - Math.exp(-SPRING.damping * part) * Math.cos(SPRING.swing * part) * (1 - part);
}

// Arm angle of the reach at part (0 to 1 of its run) up to the grasp
export const reach = (part: number, grasp: number = ARM.grasp) => ARM.rest + (grasp - ARM.rest) * settle(part);

// Arm angle at a time in s: the reach starts at start and lasts duration s, then the arm sways a little; off = at rest
export function armAt(seconds: number, start: number, duration: number, on: boolean, grasp: number = ARM.grasp): number {
  if (!on) return ARM.rest;
  const part = duration > 0 ? (seconds - start) / duration : 1;
  return reach(part, grasp) - Math.sin(seconds * WIGGLE.speed) * WIGGLE.size * settle(part);
}

// fixed: the picked mango comes off at the top of the swing and lands in the basket at the share land of the loop, then
// hops a few times lower and lower; the next one grows on the tree in the first share grow of the loop
const PICK = { off: 0.45, land: 0.8, hops: 3, hop: 34, fall: 26, grow: 0.2 };
const WAVE = { lift: -0.9, size: 0.3, speed: 4 };

// Where the top of the pole is (picker coordinates) for an arm angle and how far the pole reaches above the shoulder
export function poleTip(parts: Pick<PickerParts, "shoulder">, angle: number, length = POLE): { x: number; y: number } {
  return { x: parts.shoulder.x + Math.sin(angle) * length, y: parts.shoulder.y - Math.cos(angle) * length };
}

// The grasp: the arm angle at the top of the reach and how far the pole reaches above the shoulder
type Grasp = { angle: number; length: number };
const FREE_GRASP: Grasp = { angle: ARM.grasp, length: POLE };

// The grasp that points the pole from the shoulder at a spot (picker coordinates)
export const aimAt = (parts: Pick<PickerParts, "shoulder">, spot: { x: number; y: number }) => Math.atan2(spot.x - parts.shoulder.x, parts.shoulder.y - spot.y);

// The grasp that puts the tip of the pole into a crown (circle, picker coordinates): where the circle the tip can reach
// crosses the crown, the higher crossing; a crown out of reach gets aimed at its middle; a crown so close the pole would
// poke through it gets the pole held shorter, its tip in the middle of the crown
export function graspInto(parts: Pick<PickerParts, "shoulder">, crown: { x: number; y: number; r: number }): Grasp {
  const { shoulder } = parts;
  const [dx, dy] = [crown.x - shoulder.x, crown.y - shoulder.y];
  const distance = Math.hypot(dx, dy);
  if (distance >= POLE + crown.r || distance === 0) return { angle: aimAt(parts, crown), length: POLE };
  if (distance <= POLE - crown.r) return { angle: aimAt(parts, crown), length: distance };
  const along = (POLE * POLE - crown.r * crown.r + distance * distance) / (2 * distance);
  const side = Math.sqrt(POLE * POLE - along * along);
  const [baseX, baseY] = [shoulder.x + (dx * along) / distance, shoulder.y + (dy * along) / distance];
  const crossings = [{ x: baseX - (dy * side) / distance, y: baseY + (dx * side) / distance }, { x: baseX + (dy * side) / distance, y: baseY - (dx * side) / distance }];
  return { angle: aimAt(parts, crossings[0].y < crossings[1].y ? crossings[0] : crossings[1]), length: POLE };
}

// One loop of picking every `every` s: the arm goes up to the grasp and back to rest; the mango hangs in the tree where
// the pole tip takes it at the top of the swing (growing at the start of the loop, size is its share), falls into the
// basket and hops (bounce); off (every 0) no mango
type Picked = { x: number; y: number; size: number };
export function pickAt(seconds: number, every: number, parts: Pick<PickerParts, "shoulder" | "basketAt">, bounce: boolean, grasp: Grasp = FREE_GRASP): { arm: number; mango: Picked | null } {
  if (every <= 0) return { arm: ARM.rest, mango: null };
  const part = (((seconds % every) + every) % every) / every;
  const arm = ARM.rest + (grasp.angle - ARM.rest) * Math.sin(Math.PI * part);
  const from = poleTip(parts, ARM.rest + (grasp.angle - ARM.rest) * Math.sin(Math.PI * PICK.off), grasp.length);
  if (part < PICK.off) return { arm, mango: { ...from, size: Math.min(1, part / PICK.grow) } };
  const to = { x: parts.basketAt.x, y: parts.basketAt.y - PICK.fall };
  if (part < PICK.land) {
    const fall = (part - PICK.off) / (PICK.land - PICK.off);
    return { arm, mango: { x: from.x + (to.x - from.x) * fall, y: from.y + (to.y - from.y) * fall * fall, size: 1 } };
  }
  const after = (part - PICK.land) / (1 - PICK.land);
  const hop = bounce ? Math.abs(Math.sin(after * Math.PI * PICK.hops)) * PICK.hop * (1 - after) : 0;
  return { arm, mango: { x: to.x, y: to.y - hop, size: 1 } };
}

// Waving with the pole: the arm lifts and swings, a loop around a raised arm
export const waveAt = (seconds: number) => WAVE.lift + Math.sin(seconds * WAVE.speed) * WAVE.size;
