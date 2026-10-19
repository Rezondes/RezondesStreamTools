// Character model of the bears of the Bärenbande theme as SVG paths (shapes only, no colors; the colors come from the
// settings via CSS classes). One model for all three bears and every scene: a body per stance (standing, on all fours)
// with face, legs and ears, plus arms as their own building blocks (near or far side, hanging, raised or holding). A pose
// is a body, its arms and props; a bear never has more than one near and one far arm (checked), so a broken arm is fixed
// in one place for every scene. Each bear gets its proportions by scaling around the bottom center (Eisbär tall and slim,
// Grizzly medium, Panda short and wide) and the panda its black patches (clipped to the body).
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

// The drawable result of a pose (Bear.tsx and paint.ts draw it)
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

// A body of the model: silhouette, shade, patches (without arms), ears and tail, legs and face lines
type Body = { width: number; height: number; silhouette: string; shade: readonly string[]; patches: readonly string[]; back: readonly ShapePart[]; parts: readonly ShapePart[] };
// An arm of the model: its side, the lines and fills drawn before props, the paw drawn after props, its panda patch
export type Arm = { name: string; side: "near" | "far"; parts: readonly ShapePart[]; paw: readonly ShapePart[]; patch: string };

// --- Standing body (box 200 x 332), the bear looks to the left ---------------------------------------------------
export const CLOSED_MOUTH: ShapePart = { kind: "line", d: "M44 136 C48 132 54 132 58 138" };
const STANDING: Body = {
  width: 200,
  height: 332,
  silhouette:
    "M30 70 C40 30 70 8 104 6 C150 4 170 30 178 60 C192 110 200 170 198 230 C196 270 186 290 172 300 L166 330 " +
    "L26 330 L26 292 C8 268 2 220 8 180 C12 164 18 154 24 148 C12 140 2 124 2 106 C2 84 14 72 30 70 Z",
  shade: ["M156 22 C176 44 194 110 198 230 C196 270 186 290 172 300 L166 330 L148 330 L152 298 C168 276 178 246 178 200 C178 136 172 70 156 22 Z"],
  patches: [
    "M-10 140 C60 162 140 152 210 112 L210 200 C140 214 60 214 -10 200 Z",
    "M-10 234 C60 254 140 252 210 228 L210 340 L-10 340 Z",
    oval(39, 73, 10, 12),
    oval(84, 80, 15, 17),
  ],
  back: [{ kind: "back", d: dot(76, 12, 12) }, { kind: "back", d: dot(146, 14, 11) }, { kind: "back", d: dot(190, 266, 12) }],
  parts: [
    { kind: "line", d: "M26 294 C50 306 70 310 84 312 L86 330 M40 320 L39 330 M56 320 L57 330 M104 320 L103 330 M122 320 L123 330" },
    { kind: "eye", d: dot(39, 73, 4.6) },
    { kind: "eye", d: dot(82, 79, 4.6) },
    { kind: "nose", d: oval(36, 98, 15, 9) },
    CLOSED_MOUTH,
  ],
};

// The same body asleep: the eyes are closed crescents
const SLEEPING: Body = {
  ...STANDING,
  parts: STANDING.parts.map(part =>
    part.kind !== "eye" ? part : { kind: "eye", d: part === STANDING.parts[1] ? "M33 74 C36 79 43 79 46 74 C43 77 36 77 33 74 Z" : "M76 80 C79 85 86 85 89 80 C86 83 79 83 76 80 Z" }),
};

// Arms of the standing body. The far arm is hidden behind the body unless both paws hold something in front.
const HANGING = "M99 170 C100 200 102 230 104 248 C108 278 124 288 140 286 C156 284 164 270 166 250 L166 176";
const RAISED = "M114 200 C126 150 148 104 168 66 C176 50 200 52 198 70 C190 108 178 156 170 204";
const NEAR_PAW = "M58 206 C50 210 50 224 60 226 C70 228 82 222 80 210 C78 202 66 200 58 206 Z";
const FAR_PAW = "M86 208 C80 214 84 226 94 226 C104 226 108 214 100 208 C96 204 90 204 86 208 Z";
const THUMB = "M64 206 C60 194 64 186 70 188 C74 190 74 198 72 206";
const pawOf = (path: string): readonly ShapePart[] => [{ kind: "limb", d: path }, { kind: "line", d: path }];

export const ARMS = {
  // Near arm hanging along the belly: front and back edge as one open line, two toe strokes on the paw
  nearHanging: { name: "nearHanging", side: "near", parts: [{ kind: "line", d: `${HANGING} M122 270 L120 286 M144 270 L146 286` }], paw: [], patch: `${HANGING} L166 170 Z` },
  // Near arm raised to wave (the hanging one is gone): filled, outlined on both edges, open at the shoulder
  nearRaised: {
    name: "nearRaised", side: "near",
    parts: [{ kind: "limb", d: `${RAISED} Z` }, { kind: "line", d: RAISED }, { kind: "pad", d: oval(186, 62, 5, 4) }],
    paw: [], patch: `${RAISED} Z`,
  },
  // Both arms forward holding something at the chest; the paws come after the prop
  nearHolding: { name: "nearHolding", side: "near", parts: [{ kind: "line", d: "M99 170 C96 186 90 200 78 208" }], paw: pawOf(NEAR_PAW), patch: "M99 166 C96 186 90 200 78 208 L100 210 L108 166 Z" },
  nearThumb: {
    name: "nearThumb", side: "near", parts: [{ kind: "line", d: "M99 170 C96 186 90 200 78 208" }],
    paw: [...pawOf(NEAR_PAW), { kind: "limb", d: `${THUMB} Z` }, { kind: "line", d: THUMB }], patch: "M99 166 C96 186 90 200 78 208 L100 210 L108 166 Z",
  },
  farHolding: { name: "farHolding", side: "far", parts: [{ kind: "line", d: "M150 180 C140 196 120 206 100 210" }], paw: pawOf(FAR_PAW), patch: "M100 210 C120 206 140 196 150 180 L150 166 L108 166 Z" },
} as const satisfies Record<string, Arm>;

// --- Body on all fours (box 240 x 190, the space above the head for a raised front leg) -----------------------------
const FOUR_FACE: readonly ShapePart[] = [
  { kind: "eye", d: dot(32, 88, 4.6) },
  { kind: "eye", d: dot(64, 92, 4.6) },
  { kind: "nose", d: oval(14, 104, 10, 6.5) },
  { kind: "line", d: "M22 126 C26 123 30 123 34 127" },
];
const FOUR_BACK: readonly ShapePart[] = [{ kind: "back", d: dot(50, 60, 11) }, { kind: "back", d: dot(88, 58, 10) }, { kind: "back", d: dot(234, 100, 9) }];
const FOUR_SHADE = [
  "M200 72 C228 84 240 110 234 136 L230 190 L214 190 L216 140 C220 112 214 90 200 72 Z",
  "M86 164 C120 168 160 168 188 164 L188 156 C160 160 120 160 86 156 Z",
];
const FOUR_PATCHES = [
  "M40 120 C60 112 80 70 96 50 L140 50 C128 100 124 140 128 200 L10 200 Z",
  "M176 50 L260 50 L260 200 L168 200 C172 160 170 110 176 50 Z",
  oval(32, 88, 9, 11),
  oval(65, 92, 12, 14),
];
// Both front legs on the ground (the second one as a line inside the front leg block)
const ON_ALL_FOURS: Body = {
  width: 240,
  height: 190,
  silhouette:
    "M22 92 C30 66 52 54 78 56 C120 58 180 62 216 76 C234 84 240 110 234 136 L230 190 L190 190 L188 164 " +
    "C160 168 120 168 86 164 L84 190 L44 190 L42 156 C32 150 24 144 20 138 C10 136 2 128 2 114 C2 102 10 94 22 92 Z",
  shade: FOUR_SHADE,
  patches: FOUR_PATCHES,
  back: FOUR_BACK,
  parts: [{ kind: "line", d: "M210 150 L212 190 M64 156 L64 190 M56 182 L55 190 M74 182 L75 190 M200 182 L199 190 M222 182 L223 190" }, ...FOUR_FACE],
};
// One front leg on the ground, the other one is the raised arm
const ON_THREE_LEGS: Body = {
  ...ON_ALL_FOURS,
  silhouette:
    "M22 92 C30 66 52 54 78 56 C120 58 180 62 216 76 C234 84 240 110 234 136 L230 190 L190 190 L188 164 " +
    "C160 168 120 168 86 164 L84 190 L60 190 L58 160 C44 156 30 148 20 138 C10 136 2 128 2 114 C2 102 10 94 22 92 Z",
  parts: [{ kind: "line", d: "M210 150 L212 190 M74 182 L75 190 M200 182 L199 190 M222 182 L223 190" }, ...FOUR_FACE],
};
const FRONT_RAISED = "M70 96 C64 70 62 40 68 18 C72 6 88 8 88 20 C86 46 88 72 96 94";
const FRONT_LEG_RAISED: Arm = {
  name: "frontRaised", side: "near",
  parts: [{ kind: "limb", d: `${FRONT_RAISED} Z` }, { kind: "line", d: FRONT_RAISED }, { kind: "pad", d: oval(78, 16, 6, 5) }],
  paw: [], patch: `${FRONT_RAISED} Z`,
};

// Open mouth of the loud bear (Grizzly) when it is excited, in place of the closed mouth (standing body only)
export const OPEN_MOUTH: readonly ShapePart[] = [
  { kind: "mouth", d: "M36 128 C40 148 62 152 70 132 C60 128 46 126 36 128 Z" },
  { kind: "tongue", d: "M44 142 C50 150 60 150 64 140 C58 138 50 138 44 142 Z" },
  { kind: "teeth", d: "M46 129 L48 135 L52 129 Z M58 129 L60 134 L63 130 Z" },
  { kind: "line", d: "M36 128 C40 148 62 152 70 132 C60 128 46 126 36 128 Z" },
];

// --- Props (between the arms and the paws) ------------------------------------------------------------------------
const PHONE = "M58 182 C58 178 61 175 65 175 L86 175 C90 175 93 178 93 182 L93 218 C93 222 90 225 86 225 L65 225 C61 225 58 222 58 218 Z";
const SIGN_PAPER = "M22 112 L118 108 L120 170 L24 172 Z";
const PHONE_HIGH = "M174 28 L196 24 L202 58 L180 62 Z";
const PROPS = {
  none: [],
  phone: [{ kind: "prop", d: PHONE }, { kind: "line", d: PHONE }, { kind: "screen", d: "M63 181 L88 181 L88 216 L63 216 Z" }],
  pan: [
    { kind: "steam", d: "M30 196 C26 186 34 180 30 170 M46 194 C42 184 50 178 46 168" },
    { kind: "line", d: "M64 214 L98 206" },
    { kind: "prop", d: oval(38, 214, 27, 9) },
    { kind: "line", d: oval(38, 214, 27, 9) },
    { kind: "food", d: oval(38, 211, 12, 4) },
  ],
  snack: [{ kind: "food", d: oval(74, 204, 18, 13) }, { kind: "line", d: oval(74, 204, 18, 13) }, { kind: "line", d: "M64 200 L68 198 M78 208 L82 206" }],
  sign: [{ kind: "line", d: "M70 170 L72 222" }, { kind: "paper", d: SIGN_PAPER }, { kind: "line", d: SIGN_PAPER }],
  phoneHigh: [{ kind: "prop", d: PHONE_HIGH }, { kind: "line", d: PHONE_HIGH }, { kind: "screen", d: "M178 32 L194 29 L198 54 L182 57 Z" }],
  headphones: [
    { kind: "line", d: "M62 34 C70 -10 150 -10 158 36" },
    { kind: "prop", d: oval(66, 34, 13, 17) },
    { kind: "line", d: oval(66, 34, 13, 17) },
    { kind: "prop", d: oval(156, 36, 12, 16) },
    { kind: "line", d: oval(156, 36, 12, 16) },
  ],
} as const satisfies Record<string, readonly ShapePart[]>;

// Where the sign shows its text (center of the paper in the box of the standing body)
export const SIGN_TEXT = { x: 71, y: 146 };

// A pose of the model: body, arms (at most one per side, checked) and a prop
export type PoseModel = { body: Body; arms: readonly Arm[]; prop: readonly ShapePart[] };
const holding = [ARMS.nearHolding, ARMS.farHolding];
export const POSE_MODELS = {
  stand: { body: STANDING, arms: [ARMS.nearHanging], prop: PROPS.none },
  wave: { body: STANDING, arms: [ARMS.nearRaised], prop: PROPS.none },
  selfie: { body: STANDING, arms: [ARMS.nearRaised], prop: PROPS.phoneHigh },
  cook: { body: STANDING, arms: holding, prop: PROPS.pan },
  sign: { body: STANDING, arms: holding, prop: PROPS.sign },
  phone: { body: STANDING, arms: holding, prop: PROPS.phone },
  cheer: { body: STANDING, arms: holding, prop: PROPS.none },
  snack: { body: STANDING, arms: holding, prop: PROPS.snack },
  thumbs: { body: STANDING, arms: [ARMS.nearThumb, ARMS.farHolding], prop: PROPS.none },
  headphones: { body: STANDING, arms: [ARMS.nearHanging], prop: PROPS.headphones },
  sleep: { body: SLEEPING, arms: [ARMS.nearHanging], prop: PROPS.none },
  four: { body: ON_ALL_FOURS, arms: [], prop: PROPS.none },
  fourWave: { body: ON_THREE_LEGS, arms: [FRONT_LEG_RAISED], prop: PROPS.none },
} satisfies Record<string, PoseModel>;
export type PoseName = keyof typeof POSE_MODELS;

// The drawable pose: body parts, arm lines, the prop, then the paws in front of it; patches of the body and the arms
export function buildPose(model: PoseModel): Pose {
  const { body, arms, prop } = model;
  return {
    width: body.width,
    height: body.height,
    body: body.silhouette,
    shade: body.shade,
    patches: [...body.patches, ...arms.map(arm => arm.patch)],
    back: body.back,
    parts: [...body.parts, ...arms.flatMap(arm => arm.parts), ...prop, ...arms.flatMap(arm => arm.paw)],
  };
}

export const POSES = Object.fromEntries(Object.entries(POSE_MODELS).map(([name, model]) => [name, buildPose(model)])) as Record<PoseName, Pose>;
// Poses with the open mouth for the loud bear (standing body: the open mouth replaces CLOSED_MOUTH)
export const EXCITED: readonly PoseName[] = ["wave", "selfie", "cheer"];

// The bears: proportions (scale around the bottom center), black patches, loud (open mouth when excited)
export const BEARS: Record<BearId, { scaleX: number; scaleY: number; patched: boolean; loud: boolean }> = {
  eisbaer: { scaleX: 0.92, scaleY: 1, patched: false, loud: false },
  grizzly: { scaleX: 1, scaleY: 0.88, patched: false, loud: true },
  panda: { scaleX: 1.06, scaleY: 0.8, patched: true, loud: false },
};

// Tower from bottom to top, each bear on all fours; every level stands on the back of the one below, shifted by
// TOWER_STEP in the box of the four-legged body
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
