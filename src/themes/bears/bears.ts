// Shapes of the three bears of the Bärenbande theme as SVG paths (shapes only, no colors; the colors come from the
// settings via CSS classes). One rig per pose in its own box (ground at the bottom edge), shared by all bears; each bear
// gets its proportions by scaling around the bottom center (Eisbär tall and slim, Grizzly medium, Panda short and wide)
// and the panda its black patches (clipped to the body). Drawn parts: ears and tail behind the body, the body with the
// outline, one shade tone, open inner lines (arms, legs, toes), the small face far in front and props.
// Pure data and path builders, check: bears.check.ts.

export const BEAR_IDS = ["eisbaer", "grizzly", "panda"] as const;
export type BearId = (typeof BEAR_IDS)[number];
// The choice per scene: one bear or the tower of all three (bottom Eisbär, middle Panda, top Grizzly)
export const TOWER = "turm";
export const BEAR_CHOICES = [...BEAR_IDS, TOWER] as const;
export type BearChoice = (typeof BEAR_CHOICES)[number];

// back: behind the body (ears, tail); limb: filled in the limb color (fur, black on the panda); line: open line in the
// outline color; face parts; props
export type PartKind =
  | "back" | "limb" | "line" | "eye" | "nose" | "mouth" | "tongue" | "teeth" | "pad"
  | "prop" | "screen" | "paper" | "food" | "steam";
export type ShapePart = { kind: PartKind; d: string };

export type Pose = {
  width: number;
  height: number;
  body: string; // silhouette, filled with the fur and stroked with the outline
  shade: readonly string[]; // the one shade tone, clipped to the body
  patches: readonly string[]; // black fur of the panda, clipped to the body
  back: readonly ShapePart[];
  parts: readonly ShapePart[]; // in drawing order after the body
};

// Path of an ellipse and of a circle (two arcs)
export const oval = (cx: number, cy: number, rx: number, ry: number) =>
  `M${cx - rx} ${cy} A${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A${rx} ${ry} 0 1 0 ${cx - rx} ${cy} Z`;
export const dot = (cx: number, cy: number, radius: number) => oval(cx, cy, radius, radius);

// --- Standing (box 200 x 332), the bear looks to the left -------------------------------------------------------
const STAND_BODY =
  "M30 70 C40 30 70 8 104 6 C150 4 170 30 178 60 C192 110 200 170 198 230 C196 270 186 290 172 300 L166 330 " +
  "L26 330 L26 292 C8 268 2 220 8 180 C12 164 18 154 24 148 C12 140 2 124 2 106 C2 84 14 72 30 70 Z";
const STAND_SHADE = [
  "M156 22 C176 44 194 110 198 230 C196 270 186 290 172 300 L166 330 L148 330 L152 298 C168 276 178 246 178 200 C178 136 172 70 156 22 Z",
];
const STAND_BACK: readonly ShapePart[] = [
  { kind: "back", d: dot(76, 12, 12) },
  { kind: "back", d: dot(146, 14, 11) },
  { kind: "back", d: dot(190, 266, 12) },
];
const STAND_FACE: readonly ShapePart[] = [
  { kind: "eye", d: dot(39, 73, 4.6) },
  { kind: "eye", d: dot(82, 79, 4.6) },
  { kind: "nose", d: oval(36, 98, 15, 9) },
];
export const CLOSED_MOUTH: ShapePart = { kind: "line", d: "M44 136 C48 132 54 132 58 138" };
const LEGS: ShapePart = {
  kind: "line",
  d: "M26 294 C50 306 70 310 84 312 L86 330 M40 320 L39 330 M56 320 L57 330 M104 320 L103 330 M122 320 L123 330",
};
// The near arm hanging down along the belly, open at the shoulder, with two toe strokes on the paw
const HANGING_ARM: ShapePart = {
  kind: "line",
  d: "M99 170 C100 200 102 230 104 248 C108 278 124 288 140 286 C156 284 164 270 166 250 L166 176 M122 270 L120 286 M144 270 L146 286",
};
const STAND_PATCHES = [
  "M-10 140 C60 162 140 152 210 112 L210 200 C140 214 60 214 -10 200 Z",
  "M-10 234 C60 254 140 252 210 228 L210 340 L-10 340 Z",
  "M99 170 C100 200 102 230 104 248 C108 278 124 288 140 286 C156 284 164 270 166 250 L166 170 Z",
  oval(39, 73, 10, 12),
  oval(84, 80, 15, 17),
];

const stand: Pose = {
  width: 200,
  height: 332,
  body: STAND_BODY,
  shade: STAND_SHADE,
  patches: STAND_PATCHES,
  back: STAND_BACK,
  parts: [LEGS, HANGING_ARM, ...STAND_FACE, CLOSED_MOUTH],
};

// Waving: the far arm raised behind the head (filled, outlined only on its outer edge), the near arm hangs
const RAISED_ARM = "M140 150 C150 120 165 85 178 62 C186 50 202 56 198 70 C190 100 176 130 168 160";
const wave: Pose = {
  ...stand,
  patches: [...STAND_PATCHES, `${RAISED_ARM} Z`],
  parts: [
    LEGS, HANGING_ARM,
    { kind: "limb", d: `${RAISED_ARM} Z` },
    { kind: "line", d: RAISED_ARM },
    { kind: "pad", d: oval(188, 63, 5, 4) },
    ...STAND_FACE, CLOSED_MOUTH,
  ],
};

// Holding something in front of the chest with both paws (props are drawn between the arms and the paws)
const HOLD_ARMS: ShapePart = { kind: "line", d: "M99 170 C96 186 90 200 78 208 M150 180 C140 196 120 206 100 210" };
const HOLD_PATCH = "M99 166 C96 186 90 200 78 208 L100 210 C120 206 140 196 150 180 L150 166 Z";
const NEAR_PAW = "M58 206 C50 210 50 224 60 226 C70 228 82 222 80 210 C78 202 66 200 58 206 Z";
const FAR_PAW = "M86 208 C80 214 84 226 94 226 C104 226 108 214 100 208 C96 204 90 204 86 208 Z";
const hold: Pose = {
  ...stand,
  patches: [...STAND_PATCHES.slice(0, 2), ...STAND_PATCHES.slice(3), HOLD_PATCH],
  parts: [LEGS, HOLD_ARMS, ...STAND_FACE, CLOSED_MOUTH],
};
// The paws in front of a held prop
const HOLD_PAWS: readonly ShapePart[] = [
  { kind: "limb", d: FAR_PAW },
  { kind: "line", d: FAR_PAW },
  { kind: "limb", d: NEAR_PAW },
  { kind: "line", d: NEAR_PAW },
];

// --- On all fours (box 240 x 190), for the tower; the raised arm needs the space above the head -----------------
const FOUR_BODY =
  "M22 92 C30 66 52 54 78 56 C120 58 180 62 216 76 C234 84 240 110 234 136 L230 190 L190 190 L188 164 " +
  "C160 168 120 168 86 164 L84 190 L44 190 L42 156 C32 150 24 144 20 138 C10 136 2 128 2 114 C2 102 10 94 22 92 Z";
const four: Pose = {
  width: 240,
  height: 190,
  body: FOUR_BODY,
  shade: [
    "M200 72 C228 84 240 110 234 136 L230 190 L214 190 L216 140 C220 112 214 90 200 72 Z",
    "M86 164 C120 168 160 168 188 164 L188 156 C160 160 120 160 86 156 Z",
  ],
  patches: [
    "M40 120 C60 112 80 70 96 50 L140 50 C128 100 124 140 128 200 L10 200 Z",
    "M176 50 L260 50 L260 200 L168 200 C172 160 170 110 176 50 Z",
    oval(32, 88, 9, 11),
    oval(65, 92, 12, 14),
  ],
  back: [
    { kind: "back", d: dot(50, 60, 11) },
    { kind: "back", d: dot(88, 58, 10) },
    { kind: "back", d: dot(234, 100, 9) },
  ],
  parts: [
    { kind: "line", d: "M210 150 L212 190 M64 156 L64 190 M56 182 L55 190 M74 182 L75 190 M200 182 L199 190 M222 182 L223 190" },
    { kind: "eye", d: dot(32, 88, 4.6) },
    { kind: "eye", d: dot(64, 92, 4.6) },
    { kind: "nose", d: oval(14, 104, 10, 6.5) },
    { kind: "line", d: "M22 126 C26 123 30 123 34 127" },
  ],
};
const FOUR_ARM = "M70 96 C64 70 62 40 68 18 C72 6 88 8 88 20 C86 46 88 72 96 94";
const fourWave: Pose = {
  ...four,
  patches: [...four.patches, `${FOUR_ARM} Z`],
  parts: [
    ...four.parts,
    { kind: "limb", d: `${FOUR_ARM} Z` },
    { kind: "line", d: FOUR_ARM },
    { kind: "pad", d: oval(78, 16, 6, 5) },
  ],
};

// Open mouth of the loud bear (Grizzly) when it is excited, in place of the closed mouth (standing rigs only)
export const OPEN_MOUTH: readonly ShapePart[] = [
  { kind: "mouth", d: "M36 128 C40 148 62 152 70 132 C60 128 46 126 36 128 Z" },
  { kind: "tongue", d: "M44 142 C50 150 60 150 64 140 C58 138 50 138 44 142 Z" },
  { kind: "teeth", d: "M46 129 L48 135 L52 129 Z M58 129 L60 134 L63 130 Z" },
  { kind: "line", d: "M36 128 C40 148 62 152 70 132 C60 128 46 126 36 128 Z" },
];

// --- Props --------------------------------------------------------------------------------------------------------
const PHONE = "M58 182 C58 178 61 175 65 175 L86 175 C90 175 93 178 93 182 L93 218 C93 222 90 225 86 225 L65 225 C61 225 58 222 58 218 Z";
const SIGN_PAPER = "M22 112 L118 108 L120 170 L24 172 Z";
const PROPS = {
  phone: [
    { kind: "prop", d: PHONE },
    { kind: "line", d: PHONE },
    { kind: "screen", d: "M63 181 L88 181 L88 216 L63 216 Z" },
  ],
  pan: [
    { kind: "steam", d: "M30 196 C26 186 34 180 30 170 M46 194 C42 184 50 178 46 168" },
    { kind: "line", d: "M64 214 L98 206" },
    { kind: "prop", d: oval(38, 214, 27, 9) },
    { kind: "line", d: oval(38, 214, 27, 9) },
    { kind: "food", d: oval(38, 211, 12, 4) },
  ],
  sign: [
    { kind: "line", d: "M70 170 L72 222" },
    { kind: "paper", d: SIGN_PAPER },
    { kind: "line", d: SIGN_PAPER },
  ],
  phoneHigh: [
    { kind: "prop", d: "M176 26 L198 22 L204 56 L182 60 Z" },
    { kind: "line", d: "M176 26 L198 22 L204 56 L182 60 Z" },
    { kind: "screen", d: "M180 30 L196 27 L200 52 L184 55 Z" },
  ],
} as const satisfies Record<string, readonly ShapePart[]>;

// Thumb raised on the near paw (thumbs up)
const THUMB = "M64 206 C60 194 64 186 70 188 C74 190 74 198 72 206";
// Headphones: band over the head, cups over the ears
const HEADPHONES: readonly ShapePart[] = [
  { kind: "line", d: "M62 34 C70 -10 150 -10 158 36" },
  { kind: "prop", d: oval(66, 34, 13, 17) },
  { kind: "line", d: oval(66, 34, 13, 17) },
  { kind: "prop", d: oval(156, 36, 12, 16) },
  { kind: "line", d: oval(156, 36, 12, 16) },
];

// Where the sign shows its text (center of the paper in the box of the standing rig)
export const SIGN_TEXT = { x: 71, y: 146 };

// The poses a scene can ask for: the rig plus props, the paws in front of what they hold
export const POSES = {
  stand,
  wave,
  four,
  fourWave,
  cook: { ...hold, parts: [...hold.parts, ...PROPS.pan, ...HOLD_PAWS] },
  sign: { ...hold, parts: [...hold.parts, ...PROPS.sign, ...HOLD_PAWS] },
  phone: { ...hold, parts: [...hold.parts, ...PROPS.phone, ...HOLD_PAWS] },
  selfie: { ...wave, parts: [...wave.parts, ...PROPS.phoneHigh] },
  cheer: { ...hold, parts: [...hold.parts, ...HOLD_PAWS] },
  thumbs: { ...hold, parts: [...hold.parts, ...HOLD_PAWS, { kind: "limb", d: `${THUMB} Z` }, { kind: "line", d: THUMB }] },
  headphones: { ...stand, parts: [...stand.parts, ...HEADPHONES] },
} satisfies Record<string, Pose>;
export type PoseName = keyof typeof POSES;
// Poses with the open mouth for the loud bear (standing rigs: the open mouth replaces CLOSED_MOUTH)
export const EXCITED: readonly PoseName[] = ["wave", "selfie", "cheer"];

// The bears: proportions (scale around the bottom center), black patches, loud (open mouth when excited)
export const BEARS: Record<BearId, { scaleX: number; scaleY: number; patched: boolean; loud: boolean }> = {
  eisbaer: { scaleX: 0.92, scaleY: 1, patched: false, loud: false },
  grizzly: { scaleX: 1, scaleY: 0.88, patched: false, loud: true },
  panda: { scaleX: 1.06, scaleY: 0.8, patched: true, loud: false },
};

// Tower from bottom to top, each bear on all fours; every level stands on the back of the one below, shifted by
// TOWER_STEP in the box of the four-legged rig
export const TOWER_LEVELS: readonly { bear: BearId; pose: PoseName }[] = [
  { bear: "eisbaer", pose: "four" },
  { bear: "panda", pose: "four" },
  { bear: "grizzly", pose: "fourWave" },
];
export const TOWER_STEP = { x: 14, y: -96 };

// Parts of a pose for a bear: the loud bear opens its mouth in excited poses
export function partsFor(bear: BearId, pose: PoseName): readonly ShapePart[] {
  const parts = POSES[pose].parts;
  if (!BEARS[bear].loud || !EXCITED.includes(pose)) return parts;
  return [...parts.filter(part => part !== CLOSED_MOUTH), ...OPEN_MOUTH];
}

export const isBearChoice = (value: string): value is BearChoice => (BEAR_CHOICES as readonly string[]).includes(value);
