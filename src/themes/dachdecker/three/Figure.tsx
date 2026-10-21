// A minime figure of the Dachdecker theme in 3D (DESIGN-DACHDECKER.md "Figuren"): the parts of figures.ts as nearly
// transparent bodies with plan edges, the helmet filled in the color of the type, the tool in copper. Every frame it
// follows its anchor element (moved by the core with CSS: walking, hops, towers) and takes the pose of its animation.
import { useFrame } from "@react-three/fiber";
import { type ReactNode, type RefObject, useEffect, useMemo, useRef } from "react";
import { BoxGeometry, type BufferGeometry, EdgesGeometry, type Group, LineBasicMaterial, MeshBasicMaterial, SphereGeometry } from "three";
import { type FigurePart, type FigureType, type Joint, figure, pose } from "../figures.ts";

export type FigureLooks = { line: string; fill: number; helmet: string; tool: string };
// What the figure does right now: animation of figures.ts with start and duration in ms, facing of the core
export type FigureRun = { animation: string; startedAt: number; durationMs: number; facing: 1 | -1 };

type Box = RefObject<HTMLElement | null>;
type Props = { type: FigureType; looks: FigureLooks; run: FigureRun; anchor: Box; stage: Box };
type Looks = ReturnType<typeof useLooks>;

// Low-poly spheres, so their edges read as plan lines; the figure turns a little towards where it looks
const SPHERE = [10, 6] as const;
const TURN = 0.55;
const UPPER: Joint[] = ["torso", "armL", "armR", "head"];
// The upper body bends at the hip; arms, head and tool hang at their joints inside it
const HIP = [0, 0.36, 0] as const;
const FEET = [0, 0, 0] as const;

function geometryOf(part: FigurePart): BufferGeometry {
  const [width, height, depth] = part.size;
  if (part.shape === "box") return new BoxGeometry(width, height, depth);
  const [segments, rings] = SPHERE;
  return part.shape === "dome" ? new SphereGeometry(width, segments, rings, 0, Math.PI * 2, 0, Math.PI / 2) : new SphereGeometry(width, segments, rings);
}

function useLooks({ line, fill, helmet, tool }: FigureLooks) {
  const looks = useMemo(() => ({
    edge: new LineBasicMaterial({ color: line }),
    line: new MeshBasicMaterial({ color: line, transparent: true, opacity: fill, depthWrite: false }),
    helmet: new MeshBasicMaterial({ color: helmet }),
    tool: new MeshBasicMaterial({ color: tool }),
  }), [line, fill, helmet, tool]);
  useEffect(() => () => Object.values(looks).forEach(look => look.dispose()), [looks]);
  return looks;
}

function Part({ part, looks }: { part: FigurePart; looks: Looks }) {
  const shapes = useMemo(() => {
    const body = geometryOf(part);
    return { body, edges: new EdgesGeometry(body) };
  }, [part]);
  useEffect(() => () => { shapes.body.dispose(); shapes.edges.dispose(); }, [shapes]);
  return (
    <group position={[...part.offset]}>
      <mesh geometry={shapes.body} material={looks[part.tone]} />
      {part.tone === "line" && <lineSegments geometry={shapes.edges} material={looks.edge} />}
    </group>
  );
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
  const partsOf = (joint: Joint) => parts.filter(part => part.joint === joint && part.tone !== "helmet").map((part, index) => <Part key={index} part={part} looks={looks} />);
  // A joint as a group at its pivot, relative to the pivot of the group it hangs in
  const jointGroup = (joint: Joint, base: readonly number[], children: ReactNode) => {
    const pivot = pivotOf(joint);
    return (
      <group key={joint} ref={group => { joints.current[joint] = group; }} position={[pivot[0] - base[0], pivot[1] - base[1], pivot[2] - base[2]]}>
        {children}
      </group>
    );
  };
  const helmet = parts.find(part => part.tone === "helmet")!;
  return (
    <group ref={root}>
      {jointGroup("legL", FEET, partsOf("legL"))}
      {jointGroup("legR", FEET, partsOf("legR"))}
      <group ref={group => { joints.current.upper = group; }} position={[...HIP]}>
        {UPPER.map(joint => jointGroup(joint, HIP, (
          <>
            {partsOf(joint)}
            {joint === "head" && <group ref={group => { joints.current.helmet = group; }}><Part part={helmet} looks={looks} /></group>}
            {joint === "armR" && jointGroup("tool", pivotOf("armR"), partsOf("tool"))}
          </>
        )))}
      </group>
    </group>
  );
}
