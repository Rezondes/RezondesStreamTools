// The minimes of the Kebab theme (DESIGN-KEBAB.md "Figuren"): four dishes as small figures in the red line of the
// logo, with a face, feet and a waving arm, in a box from 0 to 100. dishParts gives the parts per type (Ink.tsx draws
// them like the chef), dishPose the pose of an animation as a pure function of its share (0 to 1): every pose starts
// and ends at rest. Each dish has its own move: the döner spins and sauce flies, the dürüm unrolls, the lahmacun folds,
// the fries throw a stick. Check: dishes.check.ts.
import type { MinimeVariantSet } from "../../core/theme.ts";
import type { InkDot, InkLine, InkPart } from "./chef.ts";

export const DISH_TYPES = ["doener", "duerum", "lahmacun", "pommes"] as const;
export type DishType = (typeof DISH_TYPES)[number];

export const DISH_SET: MinimeVariantSet = {
  command: "!typ",
  label: "Typ",
  variants: [
    { id: "doener", label: "Döner", names: ["doener", "döner", "kebab"] },
    { id: "duerum", label: "Dürüm", names: ["duerum", "dürüm", "wrap"] },
    { id: "lahmacun", label: "Lahmacun", names: ["lahmacun", "pizza"] },
    { id: "pommes", label: "Pommes", names: ["pommes", "fries"] },
  ],
};

// The own animations of the catalog (weight and duration are settings): the four moves of the dishes and waving; the
// reaction to chat is a jump with a puff of steam
export const OWN_MOVES = ["spin", "roll", "fold", "fries"] as const;
export const MINIME_REACTION = "jump";
// Every dish shows its own move when the catalog picks any of the four
export const MOVE_OF: Record<DishType, (typeof OWN_MOVES)[number]> = { doener: "spin", duerum: "roll", lahmacun: "fold", pommes: "fries" };

// body: outline and fill; face, feet, arm; move: the part of the own move (the dürüm's outer layer, the lahmacun's right
// half, the flying fries stick; the döner's sauce comes from sauceDrops)
type DishParts = { body: InkPart; face: InkPart; feet: InkPart; arm: InkPart; move: InkPart | null };
export type Point = { x: number; y: number };

const path = (outline: string, width = 3): InkLine => ({ shape: { kind: "path", d: outline }, width });
const part = (lines: InkLine[], fills: string[] = [], dots: InkDot[] = []): InkPart => ({ fills, lines, dots });

// Where the arm hangs (it turns around this point when waving) and the height of the face per dish
export const SHOULDER: Record<DishType, Point> = { doener: { x: 78, y: 60 }, duerum: { x: 70, y: 58 }, lahmacun: { x: 84, y: 54 }, pommes: { x: 68, y: 62 } };
const FACE_Y: Record<DishType, number> = { doener: 60, duerum: 58, lahmacun: 50, pommes: 66 };
// The pivot of the outer layer of the dürüm and the fold line of the lahmacun (x), where sauce leaves the döner
export const FLAP_X = 30;
export const FOLD_X = 50;
const SAUCE_FROM: Point = { x: 50, y: 24 };

function face(y: number): InkPart {
  return part(
    [path(`M38 ${y - 2} Q42 ${y - 6} 46 ${y - 2} M54 ${y - 2} Q58 ${y - 6} 62 ${y - 2}`, 2.4), path(`M43 ${y + 8} Q50 ${y + 14} 57 ${y + 8}`, 2.4)],
    [],
    [{ x: 42, y: y - 1, radius: 1.8, filled: true }, { x: 58, y: y - 1, radius: 1.8, filled: true }],
  );
}

const FEET = part([
  { shape: { kind: "ellipse", x: 40, y: 94, width: 14, height: 7 }, width: 2.6 },
  { shape: { kind: "ellipse", x: 60, y: 94, width: 14, height: 7 }, width: 2.6 },
]);

const arm = ({ x, y }: Point) => part([path(`M${x} ${y} Q${x + 8} ${y - 2} ${x + 11} ${y - 12}`, 2.6)]);

const DOENER_BREAD = "M20 38 C20 72 30 90 50 90 C70 90 80 72 80 38 Z";
const DOENER_FILLING = "M20 38 Q30 18 50 22 Q70 18 80 38 Z";
const DUERUM_WRAP = "M30 30 L70 18 L70 86 Q50 92 30 86 Z";
const DUERUM_LAYER = "M30 30 L46 25 L46 88 Q38 89 30 86 Z";
const LAHMACUN_LEFT = "M50 16 C30 16 14 32 14 52 C14 72 30 88 50 88 Z";
const LAHMACUN_RIGHT = "M50 16 C70 16 86 32 86 52 C86 72 70 88 50 88 Z";
const POMMES_BAG = "M28 44 L72 44 L66 90 L34 90 Z";
const POMMES_STICKS = "M33 44 L31 20 L37 19 L39 44 M41 44 L40 14 M57 44 L59 12 L64 13 L62 44 M65 44 L70 22 L75 24 L70 44";
const POMMES_FLYER = "M47 44 L46 14 L53 14 L54 44";

function body(type: DishType): { body: InkPart; move: InkPart | null } {
  switch (type) {
    case "doener": return {
      body: part([
        path(DOENER_BREAD),
        path(DOENER_FILLING, 2.6),
        path("M20 38 Q25 30 30 38 T40 38 T50 38 T60 38 T70 38 T80 38", 2.4),
        path("M30 32 Q35 26 40 32 M56 30 Q61 24 66 30", 2.2),
      ], [DOENER_BREAD, DOENER_FILLING]),
      move: null,
    };
    case "duerum": return {
      body: part([path(DUERUM_WRAP), path("M30 30 Q50 34 70 18", 2.4), path("M44 25 Q50 20 56 22 Q52 27 47 26", 2.2), path("M48 52 L70 46 M48 74 L70 68", 2)], [DUERUM_WRAP]),
      move: part([path(DUERUM_LAYER, 2.8)], [DUERUM_LAYER]),
    };
    case "lahmacun": return {
      body: part([path(LAHMACUN_LEFT), path("M28 34 L32 36 M22 60 L26 58 M36 76 L39 73 M40 26 L43 29", 2.2)], [LAHMACUN_LEFT]),
      move: part([path(LAHMACUN_RIGHT), path("M64 30 L67 33 M74 58 L70 60 M62 74 L65 77 M70 42 L73 40", 2.2)], [LAHMACUN_RIGHT]),
    };
    case "pommes": return {
      body: part([path(POMMES_STICKS, 2.4), path(POMMES_BAG), path("M30 56 L70 56 M32 66 L68 66", 2.2)], [POMMES_BAG]),
      move: part([path(POMMES_FLYER, 2.4)], [POMMES_FLYER]),
    };
  }
}

export function dishParts(type: DishType): DishParts {
  return { ...body(type), face: face(FACE_Y[type]), feet: FEET, arm: arm(SHOULDER[type]) };
}

// turn: horizontal scale of the whole dish (1 = front, -1 = back); lift: share of the jump height; flap: share the dürüm
// has unrolled; fold: share the lahmacun has folded; stick: share of the flight of the fries stick; wiggle: shaking of
// the fries (-1 to 1); wave: arm angle as a share (-1 to 1); sauce: progress of the flying sauce (0 = none); steam:
// progress of the puff of steam (0 = none)
type DishPose = { turn: number; lift: number; flap: number; fold: number; stick: number; wiggle: number; wave: number; sauce: number; steam: number };
export const REST: DishPose = { turn: 1, lift: 0, flap: 0, fold: 0, stick: 0, wiggle: 0, wave: 0, sauce: 0, steam: 0 };

// fixed: the döner turns twice, sauce flies in the middle half, the fries shake four times, the arm waves three times
const SPIN_TURNS = 2;
const SAUCE = { from: 0.25, length: 0.5 };
const SHAKES = 4;
const WAVES = 3;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const arch = (share: number) => Math.sin(Math.PI * share);

export function dishPose(animation: string, share: number): DishPose {
  const at = clamp01(share);
  switch (animation) {
    case "spin": {
      const sauce = (at - SAUCE.from) / SAUCE.length;
      return { ...REST, turn: Math.cos(2 * Math.PI * SPIN_TURNS * at), sauce: sauce > 0 && sauce < 1 ? sauce : 0 };
    }
    case "roll": return { ...REST, flap: arch(at) };
    case "fold": return { ...REST, fold: arch(at) };
    case "fries": return { ...REST, stick: arch(at), wiggle: Math.sin(2 * Math.PI * SHAKES * at) * (1 - at) };
    case "wave": return { ...REST, wave: Math.sin(2 * Math.PI * WAVES * at) * arch(at) };
    case MINIME_REACTION: return { ...REST, lift: arch(at), steam: at < 1 ? at : 0 };
    default: return REST;
  }
}

// fixed: five drops of sauce fly up and out from the top of the döner and fall back
const DROPS = [{ x: -26, y: -18 }, { x: -12, y: -26 }, { x: 4, y: -30 }, { x: 16, y: -24 }, { x: 28, y: -16 }];
const SAUCE_FALL = 40;

// The drops at a progress of the sauce (none at 0)
export function sauceDrops(progress: number): Point[] {
  if (progress <= 0) return [];
  return DROPS.map(drop => ({ x: SAUCE_FROM.x + drop.x * progress, y: SAUCE_FROM.y + drop.y * progress + SAUCE_FALL * progress * progress }));
}
