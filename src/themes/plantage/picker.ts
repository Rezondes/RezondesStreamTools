// The mango picker of the Plantage world as flat shapes (no outlines, light from the top left): straw hat with band,
// shirt with a shade side, head, legs, a woven basket and the arm with the bamboo pole on its own joint at the shoulder.
// reach gives the arm angle when the picker reaches up into the tree: from rest to the grasp, springing in without a
// jump. Drawn by pixi/Picker.tsx. Check: picker.check.ts.
import { mixHex } from "../../core/color.ts";
import type { Shape } from "./tree.ts";

export type PickerColors = { hat: string; band: string; shirt: string; skin: string; pants: string; eye: string; pole: string; basket: string; shadow: string };
export type PickerParts = { body: Shape[]; arm: Shape[]; basket: Shape[]; shoulder: { x: number; y: number }; basketAt: { x: number; y: number } };

// fixed: shapes of the prototype (refs/starting.html), feet at y = 0; shades mix the color this far towards the shadow
const SHADE = 0.25;
const BASKET_STAVES = 6;

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
    { kind: "rect", x: -5, y: -330, w: 10, h: 400, radius: 5, color: colors.pole },
    { kind: "circle", x: 0, y: -330, r: 9, color: shade(colors.pole) },
  ];
  const basket: Shape[] = [
    { kind: "rect", x: -48, y: -46, w: 96, h: 64, radius: 16, color: shade(colors.basket) },
    { kind: "rect", x: -48, y: -46, w: 96, h: 14, radius: 6, color: colors.basket },
    ...Array.from({ length: BASKET_STAVES }, (_, index): Shape => ({ kind: "rect", x: -44 + index * 16, y: -30, w: 3, h: 46, color: colors.shadow, alpha: 0.35 })),
  ];
  return { body, arm, basket, shoulder: { x: -30, y: -235 }, basketAt: { x: 55, y: -120 } };
}

// Arm angles in radians: hanging with the pole and reaching up into the tree
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

// Arm angle of the reach at part (0 to 1 of its run)
export const reach = (part: number) => ARM.rest + (ARM.grasp - ARM.rest) * settle(part);

// Arm angle at a time in s: the reach starts at start and lasts duration s, then the arm sways a little; off = at rest
export function armAt(seconds: number, start: number, duration: number, on: boolean): number {
  if (!on) return ARM.rest;
  const part = duration > 0 ? (seconds - start) / duration : 1;
  return reach(part) - Math.sin(seconds * WIGGLE.speed) * WIGGLE.size * settle(part);
}
