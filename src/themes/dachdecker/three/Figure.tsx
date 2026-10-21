// A minime figure of the Dachdecker theme in 3D (DESIGN-DACHDECKER.md "Figuren"): the parts of figures.ts as solid,
// lit bodies in the colors of the settings (skin, shirt, pants, boots, helmet of the type, tool). Every frame it follows
// its anchor element (moved by the core with CSS: walking, hops, towers) and takes the pose of its animation.
import { useFrame } from "@react-three/fiber";
import { type ReactNode, type RefObject, useEffect, useMemo, useRef } from "react";
import { BoxGeometry, type BufferGeometry, CapsuleGeometry, CylinderGeometry, DoubleSide, type Group, MeshLambertMaterial, SphereGeometry } from "three";
import { type FigurePart, type FigureTone, type FigureType, type Joint, figure, pose } from "../figures.ts";

export type FigureLooks = Record<FigureTone, string>;
// What the figure does right now: animation of figures.ts with start and duration in ms, facing of the core
export type FigureRun = { animation: string; startedAt: number; durationMs: number; facing: 1 | -1 };

type Box = RefObject<HTMLElement | null>;
type Props = { type: FigureType; looks: FigureLooks; run: FigureRun; anchor: Box; stage: Box };
type Looks = ReturnType<typeof useLooks>;

// Segments of the round shapes; the figure turns a little towards where it looks
const SPHERE = [16, 12] as const;
const ROUND = 14;
const TURN = 0.55;
const UPPER: Joint[] = ["torso", "armL", "armR", "head"];
// The upper body bends at the hip; arms, head and tool hang at their joints inside it
const HIP = [0, 0.36, 0] as const;
const FEET = [0, 0, 0] as const;

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

// One lit material per tone; both sides, so the open gutter shows its inside
function useLooks(colors: FigureLooks) {
  const key = JSON.stringify(colors);
  const looks = useMemo(() => {
    const tones = JSON.parse(key) as FigureLooks;
    return Object.fromEntries(Object.entries(tones).map(([tone, color]) => [tone, new MeshLambertMaterial({ color, side: DoubleSide })])) as Record<FigureTone, MeshLambertMaterial>;
  }, [key]);
  useEffect(() => () => Object.values(looks).forEach(look => look.dispose()), [looks]);
  return looks;
}

function Part({ part, looks }: { part: FigurePart; looks: Looks }) {
  const body = useMemo(() => geometryOf(part), [part]);
  useEffect(() => () => body.dispose(), [body]);
  return <mesh geometry={body} material={looks[part.tone]} position={[...part.offset]} rotation={part.turn ? [...part.turn] : undefined} />;
}

export default function Figure({ type, looks: colors, run, anchor, stage }: Props) {
  const looks = useLooks(colors);
  const parts = useMemo(() => figure(type), [type]);
  const root = useRef<Group>(null);
  const joints = useRef<Partial<Record<Joint | "upper" | "helmet", Group | null>>>({});
  const current = useRef(run);
  useEffect(() => { current.current = run; }, [run]);

  useFrame(() => {
    const box = anchor.current?.getBoundingClientRect();
    const frame = stage.current?.getBoundingClientRect();
    const body = root.current;
    if (!box || !frame || !body || box.height <= 0) return;
    const { animation, startedAt, durationMs, facing } = current.current;
    const angles = pose(animation, durationMs > 0 ? (Date.now() - startedAt) / durationMs : 0);
    // Orthographic camera in px around the middle of the stage, y up: the anchor box gives foot point and height
    body.position.set(box.left + box.width / 2 - (frame.left + frame.width / 2), frame.top + frame.height / 2 - box.bottom + angles.bob * box.height, 0);
    body.scale.setScalar(box.height);
    body.rotation.y = facing * TURN;
    const set = joints.current;
    for (const joint of ["legL", "legR", "armL", "armR", "head", "tool"] as const) set[joint]?.rotation.set(angles[joint], 0, 0);
    set.upper?.rotation.set(angles.torso, 0, 0);
    set.helmet?.position.set(0, angles.lift, 0);
  });

  const pivotOf = (joint: Joint) => parts.find(part => part.joint === joint)!.pivot;
  const partsOf = (joint: Joint, lifts = false) => parts.filter(part => part.joint === joint && Boolean(part.lifts) === lifts).map((part, index) => <Part key={index} part={part} looks={looks} />);
  // A joint as a group at its pivot, relative to the pivot of the group it hangs in
  const jointGroup = (joint: Joint, base: readonly number[], children: ReactNode) => {
    const pivot = pivotOf(joint);
    return (
      <group key={joint} ref={group => { joints.current[joint] = group; }} position={[pivot[0] - base[0], pivot[1] - base[1], pivot[2] - base[2]]}>
        {children}
      </group>
    );
  };
  return (
    <group ref={root}>
      {jointGroup("legL", FEET, partsOf("legL"))}
      {jointGroup("legR", FEET, partsOf("legR"))}
      <group ref={group => { joints.current.upper = group; }} position={[...HIP]}>
        {UPPER.map(joint => jointGroup(joint, HIP, (
          <>
            {partsOf(joint)}
            {joint === "head" && <group ref={group => { joints.current.helmet = group; }}>{partsOf("head", true)}</group>}
            {joint === "armR" && jointGroup("tool", pivotOf("armR"), partsOf("tool"))}
          </>
        )))}
      </group>
    </group>
  );
}
