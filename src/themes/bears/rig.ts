// Rig of the Bärenbande bears in 2.5D: flat 2D parts placed in a 3D space. A skeleton with its bones (body with head,
// near and far arm, near and far leg; on all fours four legs), every attachment point with a depth z (toward the viewer
// positive), and one pose per name as the targets of the paws and feet. Every limb is built from its bones by a
// two-bone solver (shoulder or hip, elbow or knee, paw or foot) as one tube with a round end, so a pose can never show an
// arm twice or a paw without its arm; the body blob (bears.ts) has no limb in its silhouette. A turn around the upright
// axis moves every part by its depth (face and near limbs come forward when the bear turns to the camera) and orders the
// layers by their turned depth, so far parts disappear behind the body. Props hang on the anchor of their bone (paw or
// head). poseOf gives the layers in drawing order for one bear and turn; Bear.tsx (SVG) and paint.ts (canvas) both draw
// exactly these layers. Pure data, check: rig.check.ts.
import {
  BEARS, FOUR_BACK_LINE, FOUR_BODY, FOUR_BOX, FOUR_HEAD, OPEN_MOUTH, PROPS, SIGN_TEXT, STAND_BOX, STANDING_BODY, STANDING_HEAD, shift, oval,
  type BearId, type BodyShape, type HeadShape, type Point, type PropName, type ShapePart,
} from "./bears.ts";

// A limb: where it hangs on the body (x, y and depth z), the length of its two bones and its half width (the end is as
// round as it is wide)
type Point3 = readonly [number, number, number];
type Limb = { root: Point3; bones: readonly [number, number]; width: number };
type Stance = "stand" | "four";
const STAND_LIMBS = {
  farLeg: { root: [136, 282, -25], bones: [12, 10], width: 30 },
  farArm: { root: [158, 174, -30], bones: [52, 50], width: 24 },
  nearLeg: { root: [58, 282, 25], bones: [12, 10], width: 28 },
  nearArm: { root: [132, 172, 30], bones: [52, 50], width: 25 },
} as const satisfies Record<string, Limb>;
const FOUR_LIMBS = {
  farBack: { root: [196, 128, -20], bones: [38, 36], width: 16 },
  farFront: { root: [56, 124, -20], bones: [42, 40], width: 15 },
  nearBack: { root: [212, 128, 20], bones: [38, 36], width: 17 },
  nearFront: { root: [72, 124, 20], bones: [40, 38], width: 16 },
} as const satisfies Record<string, Limb>;
type StandLimb = keyof typeof STAND_LIMBS;
type FourLimb = keyof typeof FOUR_LIMBS;
// Where each paw and foot of a stance points at rest (feet: their round end touches the ground)
const STAND_REST: Record<StandLimb, Point> = { farLeg: [136, 299], farArm: [166, 256], nearLeg: [58, 302], nearArm: [140, 258] };
const FOUR_REST: Record<FourLimb, Point> = { farBack: [196, 174], farFront: [54, 175], nearBack: [214, 173], nearFront: [72, 174] };
// Depths of the head of a stance: the face (one anchor for eyes, nose, mouth and eye patches), each ear (far, near) and
// a worn prop (its parts behind the head, its parts in front)
type HeadDepth = { face: Point3; ears: readonly Point3[]; behind: Point3; worn: Point3 };
const STAND_DEPTH: HeadDepth = { face: [44, 96, 60], ears: [[76, 12, -40], [146, 14, 20]], behind: [112, 0, -20], worn: [146, 24, 30] };
const FOUR_DEPTH: HeadDepth = { face: [40, 100, 50], ears: [[50, 60, -30], [88, 58, 20]], behind: [70, 40, -20], worn: [88, 58, 25] };
// The middle of the back on all fours, where the feet of a bear above stand (on the top line of FOUR_BODY)
const BACK_TOP: Point = [140, 59];
// Depths in front of the body: the far paw gripping a prop from behind, the held prop, the near paw and the thumb
const DEPTH = { grip: 65, prop: 70, paw: 80, thumb: 81 } as const;

// A pose: its stance, targets of paws and feet that differ from rest, the near paw in front of the chest (drawn over a
// prop), the far paw gripping a prop from behind, a thumb up on the near paw, closed eyes, an excited face (the loud bear
// opens its mouth) and a prop
type PoseSpec = {
  stance: Stance;
  targets?: Partial<Record<StandLimb | FourLimb, Point>>;
  front?: boolean;
  grip?: boolean;
  thumb?: boolean;
  sleepy?: boolean;
  excited?: boolean;
  prop?: PropName;
};

// fixed: how far a joint may stand out from the line between root and end, as a share of that line
const MAX_BEND = 0.25;
const HOLD_NEAR: Point = [68, 212];
const HOLD_FAR: Point = [94, 214];
const RAISED: Point = [186, 64];
// Both paws on a prop: the near one in front, the far one grips it from behind
const GRIPPING = { targets: { nearArm: HOLD_NEAR, farArm: HOLD_FAR }, front: true, grip: true } as const;
// One paw holds the prop, the far arm hangs
const HOLDING = { targets: { nearArm: HOLD_NEAR }, front: true } as const;
const SPECS = {
  stand: { stance: "stand" },
  wave: { stance: "stand", targets: { nearArm: RAISED }, excited: true },
  selfie: { stance: "stand", targets: { nearArm: RAISED }, excited: true, prop: "phoneHigh" },
  cook: { stance: "stand", ...HOLDING, prop: "pan" },
  sign: { stance: "stand", ...HOLDING, prop: "sign" },
  phone: { stance: "stand", ...GRIPPING, prop: "phone" },
  // Cheering: both arms up, the far one behind the head
  cheer: { stance: "stand", targets: { nearArm: RAISED, farArm: [204, 40] }, excited: true },
  snack: { stance: "stand", ...GRIPPING, prop: "snack" },
  // Thumb up: only the near paw in front of the chest, the far arm hangs
  thumbs: { stance: "stand", targets: { nearArm: [72, 200] }, front: true, thumb: true },
  headphones: { stance: "stand", prop: "headset" },
  sleep: { stance: "stand", sleepy: true },
  // Walking: two steps, legs and arms swing opposite
  walkA: { stance: "stand", targets: { nearLeg: [48, 302], farLeg: [146, 299], nearArm: [154, 254], farArm: [150, 256] } },
  walkB: { stance: "stand", targets: { nearLeg: [68, 302], farLeg: [126, 299], nearArm: [126, 256], farArm: [178, 252] } },
  four: { stance: "four" },
  // On all fours with the near front leg raised high (top of the tower) or reaching up for the back above (climbing)
  fourWave: { stance: "four", targets: { nearFront: [108, 16] }, excited: true },
  climb: { stance: "four", targets: { nearFront: [92, 24] } },
  // On the back of another bear: all fours with the legs tucked together, so the feet fit on the back below; on top of
  // the tower with the near front leg raised
  perch: { stance: "four", targets: { farBack: [180, 174], nearBack: [194, 173], farFront: [74, 175], nearFront: [88, 174] } },
  perchWave: { stance: "four", targets: { farBack: [180, 174], nearBack: [194, 173], farFront: [74, 175], nearFront: [108, 16] }, excited: true },
} as const satisfies Record<string, PoseSpec>;
export type PoseName = keyof typeof SPECS;
export const POSE_NAMES = Object.keys(SPECS) as PoseName[];

// One drawing layer: a bone with its pivot, its turned depth and its parts; the body layer also carries the body blob
export type RigLayer = { bone: string; pivot: Point; depth: number; parts: readonly ShapePart[]; body?: BodyShape };
// Anchors of a pose: the ground points of the feet on the ground, the paws, the top of the head and of the back, where the
// sign text sits
export type Anchors = { feet: readonly Point[]; footKeys: readonly string[]; nearPaw: Point; farPaw: Point; top: Point; back: Point; signText: Point };
export type Pose = { name: PoseName; stance: Stance; turn: number; width: number; height: number; layers: readonly RigLayer[]; anchors: Anchors };

const round = (value: number) => Math.round(value * 10) / 10;
const point = ([x, y]: Point) => `${round(x)} ${round(y)}`;
const unit = ([x, y]: Point): Point => { const length = Math.hypot(x, y) || 1; return [x / length, y / length]; };
const add = (base: Point, step: Point, scale = 1): Point => [base[0] + step[0] * scale, base[1] + step[1] * scale];
const normal = (from: Point, to: Point): Point => { const [dx, dy] = unit([to[0] - from[0], to[1] - from[1]]); return [-dy, dx]; };

// Two-bone solver: the joint and the end for a target from the root; out of reach the limb points straight at it.
// The joint bends to the counterclockwise side of the line from root to target, at most a quarter of the reach away
// from that line, so a limb with a near target stays a soft curve instead of folding into a loop.
export function solve(root: Point, target: Point, [upper, lower]: readonly [number, number]): [Point, Point] {
  const dx = target[0] - root[0], dy = target[1] - root[1];
  const reach = Math.min(upper + lower - 0.01, Math.max(Math.abs(upper - lower) + 0.01, Math.hypot(dx, dy)));
  const base = Math.atan2(dy, dx);
  const cos = (upper * upper + reach * reach - lower * lower) / (2 * upper * reach);
  const angle = Math.acos(Math.min(1, Math.max(-1, cos)));
  // Along the line and away from it as the full solution would put the joint, the distance away capped
  const along = upper * Math.cos(angle), away = Math.min(upper * Math.sin(angle), reach * MAX_BEND);
  const end: Point = [root[0] + reach * Math.cos(base), root[1] + reach * Math.sin(base)];
  return [[root[0] + along * Math.cos(base) + away * Math.sin(base), root[1] + along * Math.sin(base) - away * Math.cos(base)], end];
}

// A limb as one tube from root over the joint to the end, half width half, with a round end; open at the root (it starts
// inside the body), so its outline joins the body without a seam
export function tube(root: Point, joint: Point, end: Point, half: number): { fill: string; line: string } {
  const first = normal(root, joint), second = normal(joint, end);
  const middle = unit(add(first, second));
  const along = unit([end[0] - joint[0], end[1] - joint[1]]);
  const [a0, a1, a2] = [add(root, first, half), add(joint, middle, half), add(end, second, half)];
  const [b0, b1, b2] = [add(root, first, -half), add(joint, middle, -half), add(end, second, -half)];
  // Half circle around the end as one cubic (control points 4/3 of the radius ahead)
  const [c1, c2] = [add(a2, along, (half * 4) / 3), add(b2, along, (half * 4) / 3)];
  const line = `M${point(a0)} Q${point(a1)} ${point(a2)} C${point(c1)} ${point(c2)} ${point(b2)} Q${point(b1)} ${point(b0)}`;
  return { fill: `${line} Z`, line };
}

// The view: a turn around the upright axis through the middle of the box (radians; 0 = the three-quarter view of the
// shapes, positive turns toward the camera)
type View = { center: number; cos: number; sin: number };
const project = (view: View, [x, y, deep]: Point3): Point => [view.center + (x - view.center) * view.cos + deep * view.sin, y];
const depthOf = (view: View, [x, , deep]: Point3): number => deep * view.cos - (x - view.center) * view.sin;
// How far a flat part at a 3D anchor moves on screen with the turn
const moveOf = (view: View, anchor: Point3): Point => [project(view, anchor)[0] - anchor[0], 0];
const moved = (parts: readonly ShapePart[], [dx, dy]: Point): ShapePart[] => parts.map(part => ({ ...part, d: shift(part.d, dx, dy) }));

type Built = { end: Point; width: number; depth: number; parts: ShapePart[] };
// The limb solved in its plane (x, y at the depth of its root), then turned onto the screen
function buildLimb(limb: Limb, target: Point, view: View): Built {
  const [x, y, deep] = limb.root;
  const [joint, end] = solve([x, y], target, limb.bones);
  const [root2, joint2, end2] = [project(view, limb.root), project(view, [joint[0], joint[1], deep]), project(view, [end[0], end[1], deep])];
  const shape = tube(root2, joint2, end2, limb.width);
  return { end: end2, width: limb.width, depth: depthOf(view, limb.root), parts: [{ kind: "limb", d: shape.fill }, { kind: "line", d: shape.line }] };
}

// Toe strokes under a foot
const toes = ([x, y]: Point, half: number): ShapePart => ({
  kind: "line",
  d: `M${round(x - half * 0.5)} ${round(y + half * 0.6)} L${round(x - half * 0.55)} ${round(y + half)} M${round(x + half * 0.05)} ${round(y + half * 0.6)} L${round(x + half * 0.1)} ${round(y + half)}`,
});
// A paw in front of the chest (over a held prop)
const paw = ([x, y]: Point, half: number): ShapePart[] => {
  const outline = oval(round(x), round(y), round(half * 0.8), round(half * 0.72));
  return [{ kind: "limb", d: outline }, { kind: "line", d: outline }];
};
// The thumb up on a paw of half width half: it starts on the upper rim of the paw and stands above it
const thumb = ([x, y]: Point, half: number): ShapePart[] => {
  const rim = y - half * 0.55;
  const edge = `M${round(x - 5)} ${round(rim)} C${round(x - 9)} ${round(rim - 14)} ${round(x - 5)} ${round(rim - 24)} ${round(x + 1)} ${round(rim - 22)} C${round(x + 6)} ${round(rim - 20)} ${round(x + 6)} ${round(rim - 10)} ${round(x + 5)} ${round(rim)}`;
  return [{ kind: "limb", d: `${edge} Z` }, { kind: "line", d: edge }];
};

function faceParts(head: HeadShape, spec: PoseSpec, loud: boolean): ShapePart[] {
  const mouth = loud && spec.excited && spec.stance === "stand" ? OPEN_MOUTH : [head.mouth];
  return [...head.patches, ...(spec.sleepy ? head.sleepyEyes : head.eyes), head.nose, ...mouth];
}

function buildPose(name: PoseName, spec: PoseSpec, loud: boolean, turn: number): Pose {
  const four = spec.stance === "four";
  const box = four ? FOUR_BOX : STAND_BOX;
  const body = four ? FOUR_BODY : STANDING_BODY;
  const head = four ? FOUR_HEAD : STANDING_HEAD;
  const depth = four ? FOUR_DEPTH : STAND_DEPTH;
  const view: View = { center: box.width / 2, cos: Math.cos(turn), sin: Math.sin(turn) };
  const limbs: Record<string, Limb> = four ? FOUR_LIMBS : STAND_LIMBS;
  const rest: Record<string, Point> = four ? FOUR_REST : STAND_REST;
  const targets: Record<string, Point | undefined> = spec.targets ?? {};
  const built = Object.fromEntries(Object.entries(limbs).map(([key, limb]) => [key, buildLimb(limb, targets[key] ?? rest[key], view)])) as Record<string, Built>;
  const layer = (bone: string, parts: readonly ShapePart[], pivot: Point, at: number): RigLayer => ({ bone, pivot, depth: at, parts });
  const nearKey = four ? "nearFront" : "nearArm";
  const farKey = four ? "farFront" : "farArm";
  const near = built[nearKey];
  const nearPaw = near.end;
  const prop = spec.prop ? PROPS[spec.prop] : null;
  const offset: Point = prop ? [nearPaw[0] - prop.ref[0], nearPaw[1] - prop.ref[1]] : [0, 0];
  const held = prop?.at === "nearPaw" ? moved(prop.parts, offset) : [];
  const worn = prop?.at === "head" ? prop : null;
  // A raised near paw shows its pad
  const raised = near.end[1] < limbs[nearKey].root[1] - near.width;
  const pad: ShapePart[] = raised ? [{ kind: "pad", d: oval(round(near.end[0]), round(near.end[1] - near.width * 0.45), 5, 4) }] : [];
  // Legs (four: every limb is a leg) whose round end touches the ground stand on it and get toe strokes
  const ground = four ? box.height : box.height - 2;
  const onGround = (key: string) => !key.endsWith("Arm") && built[key].end[1] + built[key].width >= ground - 1.5;
  const limbParts = (key: string) => (onGround(key) ? [...built[key].parts, toes(built[key].end, built[key].width)] : built[key].parts);
  // Behind the body in any turn: the tail, the ears and what a worn prop has behind the head
  const back: RigLayer[] = [
    layer("tail", body.back, [box.width / 2, box.height], -100),
    layer("ears", head.ears.flatMap((ear, index) => moved([ear], moveOf(view, depth.ears[index]))), head.neck, -99),
    layer("worn", worn ? moved(worn.behind ?? [], moveOf(view, depth.behind)) : [], head.neck, -98),
  ];
  // A near limb raised above its root comes forward in front of the face (a raised arm or front leg covers the eye behind it)
  const faceDepth = depthOf(view, depth.face);
  const limbDepth = (key: string) => (built[key].depth > 0 && built[key].end[1] < limbs[key].root[1] - built[key].width ? faceDepth + 1 : built[key].depth);
  // Everything else in the order of its turned depth; the body has depth 0
  const sorted: RigLayer[] = [
    ...Object.keys(limbs).map(key => layer(key, key === nearKey ? [...limbParts(key), ...pad] : limbParts(key), project(view, limbs[key].root), limbDepth(key))),
    { ...layer("body", [], [box.width / 2, box.height], 0), body },
    layer("head", moved(faceParts(head, spec, loud), moveOf(view, depth.face)), head.neck, faceDepth),
    layer("headset", worn ? moved(worn.parts, moveOf(view, depth.worn)) : [], head.neck, depthOf(view, depth.worn)),
    layer("prop", held, nearPaw, DEPTH.prop),
    layer(`${farKey}Paw`, spec.grip ? paw(built[farKey].end, built[farKey].width) : [], built[farKey].end, DEPTH.grip),
    layer(`${nearKey}Paw`, spec.front ? paw(nearPaw, near.width) : [], nearPaw, DEPTH.paw),
    layer("thumb", spec.thumb ? thumb(nearPaw, near.width) : [], nearPaw, DEPTH.thumb),
  ].sort((first, second) => first.depth - second.depth);
  const layers = [...back, ...sorted].filter(entry => entry.body || entry.parts.length);
  const standing = Object.entries(built).filter(([key]) => onGround(key));
  const feet = standing.map(([, limb]) => [round(limb.end[0]), round(limb.end[1] + limb.width)] as Point);
  return {
    name,
    stance: spec.stance,
    turn,
    width: box.width,
    height: box.height,
    layers,
    anchors: { feet, footKeys: standing.map(([key]) => key), nearPaw, farPaw: built[farKey].end, top: four ? [78, 56] : [104, 6], back: four ? BACK_TOP : [104, 6], signText: add(SIGN_TEXT, offset) },
  };
}

// The spec with legs reaching further down by their drops (units of the box)
function withDrops(spec: PoseSpec, reach: readonly (readonly [string, number])[]): PoseSpec {
  if (!reach.length) return spec;
  const rest: Record<string, Point> = spec.stance === "four" ? FOUR_REST : STAND_REST;
  const targets: Record<string, Point> = { ...spec.targets };
  for (const [leg, drop] of reach) {
    const [x, y] = targets[leg] ?? rest[leg];
    targets[leg] = [x, y + drop];
  }
  return { ...spec, targets };
}

export const POSES = Object.fromEntries(POSE_NAMES.map(name => [name, buildPose(name, SPECS[name], false, 0)])) as Record<PoseName, Pose>;

// A tower level as drawn: the bear in its pose, its box placed at (x, y) in the units of the box of the bottom level
// (y up is negative), how far each leg reaches down to the back below (units of its own box) and where its feet stand
export type TowerLevel = { bear: BearId; pose: PoseName };
export type Drops = Readonly<Record<string, number>>;
export type PlacedLevel = TowerLevel & { x: number; y: number; drops: Drops; feet: readonly Point[] };

// Height of the back line at x (bears.ts FOUR_BACK_LINE, straight between its points, flat past its ends)
export function backAt(x: number): number {
  const line = FOUR_BACK_LINE;
  if (x <= line[0][0]) return line[0][1];
  const after = line.findIndex(([px]) => px >= x);
  if (after < 0) return line[line.length - 1][1];
  const [[x0, y0], [x1, y1]] = [line[after - 1], line[after]];
  return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
}

// The point of a pose in the box of a bear with its proportions (the box scales around its bottom center)
function scaled(bear: BearId, pose: Pose, [x, y]: Point): Point {
  const { scaleX, scaleY } = BEARS[bear];
  return [pose.width / 2 + (x - pose.width / 2) * scaleX, pose.height - (pose.height - y) * scaleY];
}

// Stacks levels from the bottom: every level stands with the middle of its feet over the back anchor of the level below,
// as low as it can without a foot sinking into that back; every other leg reaches down until its foot stands on the back
// line where it is (the back falls toward the rump). Proportions of both bears included; drawn bottom first.
export function towerLayout(levels: readonly TowerLevel[]): PlacedLevel[] {
  const placed: PlacedLevel[] = [];
  for (const level of levels) {
    const pose = POSES[level.pose];
    const feet = pose.anchors.feet.map(foot => scaled(level.bear, pose, foot));
    const below = placed.at(-1);
    if (!below) {
      placed.push({ ...level, x: 0, y: 0, drops: {}, feet });
      continue;
    }
    const lower = POSES[below.pose];
    const { scaleX, scaleY } = BEARS[below.bear];
    const [backX] = scaled(below.bear, lower, lower.anchors.back);
    const middle = feet.reduce((sum, [x]) => sum + x, 0) / feet.length;
    const x = below.x + backX - middle;
    // The back below under each foot, in the units of the bottom box
    const surface = feet.map(([fx]) => {
      const local = (fx + x - below.x - lower.width / 2) / scaleX + lower.width / 2;
      return below.y + lower.height - (lower.height - backAt(local)) * scaleY;
    });
    const y = Math.min(...feet.map(([, fy], index) => surface[index] - fy));
    const ownScale = BEARS[level.bear].scaleY;
    const drops = Object.fromEntries(pose.anchors.footKeys.map((key, index) => [key, (surface[index] - feet[index][1] - y) / ownScale]));
    placed.push({ ...level, x, y, drops, feet: feet.map(([fx], index) => [fx + x, surface[index]]) });
  }
  return placed;
}

// fixed: how far a bear may turn from the three-quarter view (radians): toward the camera and away from it
export const TURN_LIMITS = { toward: 0.5, away: -0.4 } as const;
const cache = new Map<string, Pose>();
// The pose as one bear shows it in a turn (radians, clamped to TURN_LIMITS), with legs reaching down by drops (units of
// the box, e.g. onto the back below in a tower): the loud bear opens its mouth in excited poses
export function poseOf(bear: BearId, pose: PoseName, turn = 0, drops: Drops = {}): Pose {
  const loud = BEARS[bear].loud;
  const angle = Math.round(Math.min(TURN_LIMITS.toward, Math.max(TURN_LIMITS.away, turn)) * 100) / 100;
  const reach = Object.entries(drops).filter(([, drop]) => Math.abs(drop) > 0.05).map(([leg, drop]) => [leg, Math.round(drop * 10) / 10] as const);
  if (!loud && angle === 0 && !reach.length) return POSES[pose];
  const key = `${loud}:${pose}:${angle}:${reach.join(";")}`;
  let shape = cache.get(key);
  if (!shape) {
    shape = buildPose(pose, withDrops(SPECS[pose], reach), loud, angle);
    cache.set(key, shape);
  }
  return shape;
}
