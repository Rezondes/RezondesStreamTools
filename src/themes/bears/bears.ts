// The bears of the Bärenbande theme and the shapes of their parts as SVG paths (shapes only, no colors; the colors come
// from the settings via CSS classes). One model for all three bears: a body blob per stance (standing, on all fours)
// without any limb in its silhouette, the head parts that move with the head bone (ears, face, panda eye patches) and
// the props. Limbs are not drawn here: the rig (rig.ts) builds them from its bones. Each bear gets its proportions by
// scaling around the bottom center (Eisbär tall and slim, Grizzly medium, Panda short and wide) and the panda its black
// patches. Pure data and path helpers, check: bears.check.ts.

export const BEAR_IDS = ["eisbaer", "grizzly", "panda"] as const;
export type BearId = (typeof BEAR_IDS)[number];
// The choice per scene: one bear or the tower of all three (bottom Eisbär, middle Panda, top Grizzly)
export const TOWER = "turm";
export const BEAR_CHOICES = [...BEAR_IDS, TOWER] as const;
type BearChoice = (typeof BEAR_CHOICES)[number];

// back: behind the body (ears, tail); limb: filled in the limb color (fur, black on the panda); line: open line in the
// outline color; patch: black fur of the panda outside the body clip (eye patches); face parts; props
export type PartKind =
  | "back" | "limb" | "line" | "patch" | "eye" | "nose" | "mouth" | "tongue" | "teeth" | "pad"
  | "prop" | "screen" | "paper" | "food" | "steam";
export type ShapePart = { kind: PartKind; d: string };
export type Point = readonly [number, number];

// Path of an ellipse and of a circle (two arcs)
export const oval = (cx: number, cy: number, rx: number, ry: number) =>
  `M${cx - rx} ${cy} A${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A${rx} ${ry} 0 1 0 ${cx - rx} ${cy} Z`;
export const dot = (cx: number, cy: number, radius: number) => oval(cx, cy, radius, radius);

// Moves a path of absolute commands (M, L, C, Q, A, Z) by (dx, dy); in arcs only the end point moves
export function shift(path: string, dx: number, dy: number): string {
  if (!dx && !dy) return path;
  const round = (value: number) => Math.round(value * 10) / 10;
  return path.replace(/([MLCQAZ])([^MLCQAZ]*)/g, (_, command: string, rest: string) => {
    const numbers = rest.trim() ? rest.trim().split(/[\s,]+/).map(Number) : [];
    const moved = numbers.map((value, index) => {
      if (command === "A") return index % 7 === 5 ? round(value + dx) : index % 7 === 6 ? round(value + dy) : value;
      return round(value + (index % 2 === 0 ? dx : dy));
    });
    return `${command}${moved.join(" ")}${moved.length ? " " : ""}`;
  }).trim();
}

// A body blob of a stance: silhouette (filled with the fur, stroked with the outline), the one shade tone and the black
// patches of the panda (both clipped to the silhouette), the tail behind it
export type BodyShape = { silhouette: string; shade: readonly string[]; patches: readonly string[]; back: readonly ShapePart[] };
// The head parts of a stance: ears behind the body, eyes, nose and mouth on it, panda eye patches; the head bone turns
// them around the neck
export type HeadShape = {
  neck: Point;
  ears: readonly ShapePart[];
  eyes: readonly ShapePart[];
  sleepyEyes: readonly ShapePart[];
  nose: ShapePart;
  mouth: ShapePart;
  patches: readonly ShapePart[];
};

// --- Standing (box 200 x 332, the bear looks to the left, the feet on y 330) ---------------------------------------
export const STAND_BOX = { width: 200, height: 332 };
export const STANDING_BODY: BodyShape = {
  silhouette:
    "M30 70 C40 30 70 8 104 6 C150 4 170 30 178 60 C192 110 200 170 198 230 C196 270 186 290 172 300 " +
    "C140 316 56 316 26 294 C8 268 2 220 8 180 C12 164 18 154 24 148 C12 140 2 124 2 106 C2 84 14 72 30 70 Z",
  shade: ["M156 22 C176 44 194 110 198 230 C196 270 186 290 172 300 L166 330 L148 330 L152 298 C168 276 178 246 178 200 C178 136 172 70 156 22 Z"],
  patches: [
    "M-10 140 C60 162 140 152 210 112 L210 200 C140 214 60 214 -10 200 Z",
    "M-10 234 C60 254 140 252 210 228 L210 340 L-10 340 Z",
  ],
  back: [{ kind: "back", d: dot(190, 266, 12) }],
};
export const CLOSED_MOUTH: ShapePart = { kind: "line", d: "M44 136 C48 132 54 132 58 138" };
export const STANDING_HEAD: HeadShape = {
  neck: [100, 150],
  ears: [{ kind: "back", d: dot(76, 12, 12) }, { kind: "back", d: dot(146, 14, 11) }],
  eyes: [{ kind: "eye", d: dot(39, 73, 4.6) }, { kind: "eye", d: dot(82, 79, 4.6) }],
  sleepyEyes: [{ kind: "eye", d: "M33 74 C36 79 43 79 46 74 C43 77 36 77 33 74 Z" }, { kind: "eye", d: "M76 80 C79 85 86 85 89 80 C86 83 79 83 76 80 Z" }],
  nose: { kind: "nose", d: oval(36, 98, 15, 9) },
  mouth: CLOSED_MOUTH,
  patches: [{ kind: "patch", d: oval(39, 73, 10, 12) }, { kind: "patch", d: oval(84, 80, 15, 17) }],
};
// Open mouth of the loud bear (Grizzly) when it is excited, in place of the closed mouth (standing only)
export const OPEN_MOUTH: readonly ShapePart[] = [
  { kind: "mouth", d: "M36 128 C40 148 62 152 70 132 C60 128 46 126 36 128 Z" },
  { kind: "tongue", d: "M44 142 C50 150 60 150 64 140 C58 138 50 138 44 142 Z" },
  { kind: "teeth", d: "M46 129 L48 135 L52 129 Z M58 129 L60 134 L63 130 Z" },
  { kind: "line", d: "M36 128 C40 148 62 152 70 132 C60 128 46 126 36 128 Z" },
];

// --- On all fours (box 240 x 190, the space above the head for a raised front leg) ----------------------------------
export const FOUR_BOX = { width: 240, height: 190 };
export const FOUR_BODY: BodyShape = {
  silhouette:
    "M22 92 C30 66 52 54 78 56 C120 58 180 62 216 76 C234 84 240 110 234 136 C232 156 222 166 204 168 " +
    "C160 172 120 172 86 168 C66 166 50 160 42 156 C32 150 24 144 20 138 C10 136 2 128 2 114 C2 102 10 94 22 92 Z",
  shade: [
    "M200 72 C228 84 240 110 234 136 L230 190 L214 190 L216 140 C220 112 214 90 200 72 Z",
    "M86 164 C120 168 160 168 188 164 L188 156 C160 160 120 160 86 156 Z",
  ],
  patches: [
    "M40 120 C60 112 80 70 96 50 L140 50 C128 100 124 140 128 200 L10 200 Z",
    "M176 50 L260 50 L260 200 L168 200 C172 160 170 110 176 50 Z",
  ],
  back: [{ kind: "back", d: dot(234, 100, 9) }],
};
// The top line of the back on all fours (points along the top of FOUR_BODY from the neck to the rump), where the feet
// of a bear above stand
export const FOUR_BACK_LINE: readonly Point[] = [[40, 64], [60, 57], [78, 56], [100, 57], [120, 58], [150, 60], [180, 63], [200, 68], [216, 76], [228, 84]];
export const FOUR_HEAD: HeadShape = {
  neck: [80, 110],
  ears: [{ kind: "back", d: dot(50, 60, 11) }, { kind: "back", d: dot(88, 58, 10) }],
  eyes: [{ kind: "eye", d: dot(32, 88, 4.6) }, { kind: "eye", d: dot(64, 92, 4.6) }],
  sleepyEyes: [{ kind: "eye", d: "M27 89 C30 93 35 93 38 89 C35 91 30 91 27 89 Z" }, { kind: "eye", d: "M59 93 C62 97 67 97 70 93 C67 95 62 95 59 93 Z" }],
  nose: { kind: "nose", d: oval(14, 104, 10, 6.5) },
  mouth: { kind: "line", d: "M22 126 C26 123 30 123 34 127" },
  patches: [{ kind: "patch", d: oval(32, 88, 9, 11) }, { kind: "patch", d: oval(65, 92, 12, 14) }],
};

// --- Props: drawn at the anchor they belong to (the paw for held things, the head for the headset) ------------------
// Each prop is given at its place for a reference anchor; the rig moves it with the anchor of the pose.
// behind: parts of a worn prop behind the head (drawn behind the body, only their edge above the head shows)
type Prop = { at: "nearPaw" | "head"; ref: Point; parts: readonly ShapePart[]; behind?: readonly ShapePart[] };
const PHONE = "M58 182 C58 178 61 175 65 175 L86 175 C90 175 93 178 93 182 L93 218 C93 222 90 225 86 225 L65 225 C61 225 58 222 58 218 Z";
const SIGN_PAPER = "M22 112 L118 108 L120 170 L24 172 Z";
const PHONE_HIGH = "M174 28 L196 24 L202 58 L180 62 Z";
// The bear looks to the left in three-quarter view: the near ear is the one at the back of the head (x 146), the far ear
// (x 76) peeks over the head. The near cup sits on the side of the head over the near ear, the far cup and most of the
// band are behind the head.
const CUP_NEAR = oval(146, 24, 20, 24);
const CUP_FAR = oval(78, 18, 15, 19);
// The band over the head as a filled strip between an outer and an inner arc
const BAND = "M70 16 C74 -30 150 -30 156 4 L146 6 C142 -18 84 -18 80 16 Z";
export const PROPS = {
  phone: { at: "nearPaw", ref: [68, 212], parts: [{ kind: "prop", d: PHONE }, { kind: "line", d: PHONE }, { kind: "screen", d: "M63 181 L88 181 L88 216 L63 216 Z" }] },
  pan: {
    at: "nearPaw", ref: [68, 212],
    parts: [
      { kind: "steam", d: "M30 196 C26 186 34 180 30 170 M46 194 C42 184 50 178 46 168" },
      { kind: "line", d: "M64 214 L98 206" },
      { kind: "prop", d: oval(38, 214, 27, 9) },
      { kind: "line", d: oval(38, 214, 27, 9) },
      { kind: "food", d: oval(38, 211, 12, 4) },
    ],
  },
  snack: { at: "nearPaw", ref: [68, 212], parts: [{ kind: "food", d: oval(80, 200, 18, 13) }, { kind: "line", d: oval(80, 200, 18, 13) }, { kind: "line", d: "M70 196 L74 194 M84 204 L88 202" }] },
  sign: { at: "nearPaw", ref: [68, 212], parts: [{ kind: "line", d: "M70 170 L70 222" }, { kind: "paper", d: SIGN_PAPER }, { kind: "line", d: SIGN_PAPER }] },
  phoneHigh: { at: "nearPaw", ref: [186, 64], parts: [{ kind: "prop", d: PHONE_HIGH }, { kind: "line", d: PHONE_HIGH }, { kind: "screen", d: "M178 32 L194 29 L198 54 L182 57 Z" }] },
  // A real headset: the band over the head and the far cup behind it, the near cup over the near ear with its cushion
  headset: {
    at: "head", ref: [0, 0],
    behind: [{ kind: "prop", d: BAND }, { kind: "line", d: BAND }, { kind: "prop", d: CUP_FAR }, { kind: "line", d: CUP_FAR }],
    parts: [{ kind: "prop", d: CUP_NEAR }, { kind: "line", d: CUP_NEAR }, { kind: "line", d: "M134 8 C128 18 128 32 134 44" }],
  },
} as const satisfies Record<string, Prop>;
export type PropName = keyof typeof PROPS;
// Where the sign shows its text, for the reference anchor of the sign
export const SIGN_TEXT: Point = [71, 146];
// The ear centers of the standing head: far ear, near ear (the headset covers them; checked)
export const EAR_CENTERS: readonly Point[] = [[76, 12], [146, 14]];

// The bears: proportions (scale around the bottom center), black patches, loud (open mouth when excited)
export const BEARS: Record<BearId, { scaleX: number; scaleY: number; patched: boolean; loud: boolean }> = {
  eisbaer: { scaleX: 0.92, scaleY: 1, patched: false, loud: false },
  grizzly: { scaleX: 1, scaleY: 0.88, patched: false, loud: true },
  panda: { scaleX: 1.06, scaleY: 0.8, patched: true, loud: false },
};

// Tower from bottom to top, each bear on all fours (the upper ones with tucked legs); every level stands on the back of
// the one below (rig.ts towerLayout)
export const TOWER_LEVELS = [
  { bear: "eisbaer", pose: "four" },
  { bear: "panda", pose: "perch" },
  { bear: "grizzly", pose: "perchWave" },
] as const;

export const isBearChoice = (value: string): value is BearChoice => (BEAR_CHOICES as readonly string[]).includes(value);
