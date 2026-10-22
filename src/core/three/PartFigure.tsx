// A minime figure in 3D (figure.ts): the parts of the theme as solid, lit bodies in the colors of its looks. Every frame
// it follows its anchor element (moved by the core with CSS: walking, hops, towers) and takes the pose of its animation.
// held hangs in the tool joint (a muzzle flash at the weapon), children follow the anchor without the pose (dust). The
// figure fades with its anchor: the opacity the core and the theme give the anchor and its boxes goes into its materials.
import { useFrame } from "@react-three/fiber";
import { type ReactNode, type RefObject, useEffect, useMemo, useRef } from "react";
import { BoxGeometry, type BufferGeometry, CapsuleGeometry, CylinderGeometry, DoubleSide, type Group, MeshLambertMaterial, SphereGeometry } from "three";
import type { FigurePart, Joint, Pose } from "./figure.ts";

// What the figure does right now: animation with start and duration in ms, facing of the core
export type FigureRun = { animation: string; startedAt: number; durationMs: number; facing: 1 | -1 };

type Box = RefObject<HTMLElement | null>;
type Props = {
  parts: readonly FigurePart[];
  looks: Readonly<Record<string, string>>;
  run: FigureRun;
  pose: (animation: string, part: number) => Pose;
  anchor: Box;
  stage: Box;
  turn?: number; // how far the figure turns towards where it looks, radians
  blinkEvery?: number; // ms, 0 = never
  lying?: readonly string[]; // animations in which the eyes stay shut
  held?: ReactNode;
  children?: ReactNode;
};
type Looks = Record<string, MeshLambertMaterial>;

// Segments of the round shapes
const SPHERE = [16, 12] as const;
const ROUND = 14;
const UPPER: Joint[] = ["torso", "armL", "armR", "head"];
const FEET = [0, 0, 0] as const;
// fixed: a blink lasts this share of the interval, the eyes shrink to this height
const BLINK = 0.05;
const SHUT = 0.1;

function geometryOf(part: FigurePart): BufferGeometry {
  const [first, second, third] = part.size;
  const [segments, rings] = SPHERE;
  switch (part.shape) {
    case "box": return new BoxGeometry(first, second, third);
    case "sphere": return new SphereGeometry(first, segments, rings);
    case "dome": return new SphereGeometry(first, segments, rings, 0, Math.PI * 2, 0, Math.PI / 2);
    case "capsule": return new CapsuleGeometry(first, second, 2, ROUND / 2 + 2);
    case "cylinder": return new CylinderGeometry(first, third, second, ROUND);
    case "gutter": return new CylinderGeometry(first, first, second, ROUND, 1, true, 0, Math.PI);
  }
}

// One lit material per tone; both sides, so open shapes show their inside
function useLooks(colors: Readonly<Record<string, string>>) {
  const key = JSON.stringify(colors);
  const looks = useMemo(() => {
    const tones = JSON.parse(key) as Record<string, string>;
    return Object.fromEntries(Object.entries(tones).map(([tone, color]) => [tone, new MeshLambertMaterial({ color, side: DoubleSide })]));
  }, [key]);
  useEffect(() => () => Object.values(looks).forEach(look => look.dispose()), [looks]);
  return looks;
}

function Part({ part, looks }: { part: FigurePart; looks: Looks }) {
  const body = useMemo(() => geometryOf(part), [part]);
  useEffect(() => () => body.dispose(), [body]);
  return <mesh geometry={body} material={looks[part.tone]} position={[...part.offset]} rotation={part.turn ? [...part.turn] : undefined} />;
}

type Joints = Partial<Record<Joint | "upper" | "helmet" | "eyes", Group | null>>;

// The opacity an element shows: its own times that of every box around it, up to the stage
function shownOpacity(element: HTMLElement, stage: HTMLElement | null): number {
  let opacity = 1;
  for (let box: HTMLElement | null = element; box && box !== stage; box = box.parentElement) opacity *= Number(getComputedStyle(box).opacity);
  return opacity;
}

// Every frame: the materials take the opacity of the anchor (fading in and out with it)
function useFade(looks: Looks, anchor: Box, stage: Box) {
  const shown = useRef(1);
  useFrame(() => {
    if (!anchor.current) return;
    const opacity = shownOpacity(anchor.current, stage.current);
    if (opacity === shown.current) return;
    shown.current = opacity;
    for (const look of Object.values(looks)) {
      look.transparent = opacity < 1;
      look.opacity = opacity;
    }
  });
}

// Every frame: follow the anchor and set the joints to the pose of the running animation
function usePose({ run, pose, anchor, stage, turn = 0.55, blinkEvery = 0, lying = [] }: Omit<Props, "parts" | "looks" | "held" | "children">) {
  const root = useRef<Group>(null);
  const body = useRef<Group>(null);
  const joints = useRef<Joints>({});
  const current = useRef(run);
  useEffect(() => { current.current = run; }, [run]);

  useFrame(() => {
    const box = anchor.current?.getBoundingClientRect();
    const frame = stage.current?.getBoundingClientRect();
    const figure = root.current;
    if (!box || !frame || !figure || !body.current || box.height <= 0) return;
    const now = Date.now();
    const { animation, startedAt, durationMs, facing } = current.current;
    const angles = pose(animation, durationMs > 0 ? (now - startedAt) / durationMs : 0);
    // Orthographic camera in px around the middle of the stage, y up: the anchor box gives foot point and height
    figure.position.set(box.left + box.width / 2 - (frame.left + frame.width / 2), frame.top + frame.height / 2 - box.bottom + angles.bob * box.height, 0);
    figure.scale.setScalar(box.height);
    body.current.rotation.set(0, facing * turn + angles.turn, -facing * angles.fall * Math.PI / 2);
    const set = joints.current;
    for (const joint of ["legL", "legR", "armL", "armR", "head", "tool"] as const) set[joint]?.rotation.set(angles[joint], 0, 0);
    set.upper?.rotation.set(angles.torso, 0, 0);
    set.helmet?.position.set(0, angles.lift, 0);
    const blinking = blinkEvery > 0 && now % blinkEvery > blinkEvery * (1 - BLINK);
    set.eyes?.scale.set(1, blinking || lying.includes(animation) ? SHUT : 1, 1);
  });
  return { root, body, joints };
}

export default function PartFigure({ parts, looks: colors, held, children, ...motion }: Props) {
  const looks = useLooks(colors);
  useFade(looks, motion.anchor, motion.stage);
  const { root, body, joints } = usePose(motion);
  const pivotOf = (joint: Joint) => parts.find(part => part.joint === joint)?.pivot ?? FEET;
  const hip = pivotOf("torso");
  const partsOf = (joint: Joint, kind: "plain" | "lifts" | "blinks" = "plain") => parts
    .filter(part => part.joint === joint && (kind === "lifts" ? part.lifts : kind === "blinks" ? part.blinks && !part.lifts : !part.lifts && !part.blinks))
    .map((part, index) => <Part key={index} part={part} looks={looks} />);
  // A joint as a group at its pivot, relative to the pivot of the group it hangs in
  const jointGroup = (joint: Joint, base: readonly number[], inner: ReactNode) => {
    const pivot = pivotOf(joint);
    return (
      <group key={joint} ref={group => { joints.current[joint] = group; }} position={[pivot[0] - base[0], pivot[1] - base[1], pivot[2] - base[2]]}>
        {inner}
      </group>
    );
  };
  // The eyes close around their own height, so they shrink in place
  const eyeHeight = parts.find(part => part.blinks)?.offset[1] ?? 0;
  return (
    <group ref={root}>
      <group ref={body}>
        {jointGroup("legL", FEET, partsOf("legL"))}
        {jointGroup("legR", FEET, partsOf("legR"))}
        <group ref={group => { joints.current.upper = group; }} position={[...hip]}>
          {UPPER.map(joint => jointGroup(joint, hip, (
            <>
              {partsOf(joint)}
              {joint === "head" && (
                <>
                  <group position={[0, eyeHeight, 0]}>
                    <group ref={group => { joints.current.eyes = group; }}><group position={[0, -eyeHeight, 0]}>{partsOf("head", "blinks")}</group></group>
                  </group>
                  <group ref={group => { joints.current.helmet = group; }}>{partsOf("head", "lifts")}</group>
                </>
              )}
              {joint === "armR" && jointGroup("tool", pivotOf("armR"), <>{partsOf("tool")}{held}</>)}
            </>
          )))}
        </group>
      </group>
      {children}
    </group>
  );
}
