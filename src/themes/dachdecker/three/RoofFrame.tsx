// Roof frame of the Dachdecker theme in 3D (DESIGN-DACHDECKER.md "Balken"): every beam from frame.ts as a slim box with
// white plan edges and an almost clear fill, the front truss in terracotta with glow, side parts fainter. A beam grows
// from its start along its length (scale.z) as far as the clock of the scene says (schedule.ts).
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { BoxGeometry, EdgesGeometry, type Group, LineBasicMaterial, MeshBasicMaterial, Object3D } from "three";
import { type BeamKind, type FrameDims, roofFrame } from "../frame.ts";
import { type BuildClock, growth, type Schedule, type StepName } from "../schedule.ts";

type Props = {
  dims: FrameDims; clock: BuildClock; schedule: Schedule;
  accent: string; line: string; fill: string; lineOpacity: number; fillOpacity: number;
};

const STEP_OF: Record<BeamKind, StepName> = { plate: "walls", front: "front", truss: "trusses", purlin: "purlins", batten: "battens" };
// A beam is 2.2 times as high as wide; not yet grown beams keep a tiny length (a zero scale breaks the matrix)
const HEIGHT = 2.2;
const UNGROWN = 1e-4;
// Front truss fill; side parts (battens, wall plates) with fainter edges and fill
const FRONT_FILL = 0.22;
const FAINT_EDGE = 0.72;
const FAINT_FILL = 0.5;

function useLooks({ accent, line, fill, lineOpacity, fillOpacity }: Props) {
  const looks = useMemo(() => {
    const look = (edge: string, edgeOpacity: number, body: string, bodyOpacity: number) => ({
      edge: new LineBasicMaterial({ color: edge, transparent: edgeOpacity < 1, opacity: edgeOpacity }),
      fill: new MeshBasicMaterial({ color: body, transparent: true, opacity: bodyOpacity, depthWrite: false }),
    });
    return {
      front: look(accent, 1, accent, FRONT_FILL),
      main: look(line, lineOpacity, fill, fillOpacity),
      faint: look(line, lineOpacity * FAINT_EDGE, fill, fillOpacity * FAINT_FILL),
    };
  }, [accent, line, fill, lineOpacity, fillOpacity]);
  useEffect(() => () => Object.values(looks).forEach(look => { look.edge.dispose(); look.fill.dispose(); }), [looks]);
  return looks;
}

// Beams with their box, edges, pose and place in the build (index within its group, truss behind the front one)
function useParts(dims: FrameDims) {
  const parts = useMemo(() => {
    const seen = new Map<string, number>();
    const pivot = new Object3D();
    return roofFrame(dims).map(beam => {
      pivot.position.set(...beam.from);
      pivot.lookAt(...beam.to);
      const length = Math.hypot(beam.to[0] - beam.from[0], beam.to[1] - beam.from[1], beam.to[2] - beam.from[2]);
      const box = new BoxGeometry(beam.size, beam.size * HEIGHT, length);
      box.translate(0, 0, length / 2);
      const key = `${beam.kind} ${beam.order}`;
      const index = seen.get(key) ?? 0;
      seen.set(key, index + 1);
      const look: "front" | "main" | "faint" = beam.kind === "front" ? "front" : beam.kind === "plate" || beam.kind === "batten" ? "faint" : "main";
      return { beam, box, edges: new EdgesGeometry(box), quaternion: pivot.quaternion.clone(), index, group: beam.kind === "truss" ? beam.order - 2 : 0, look };
    });
  }, [dims]);
  useEffect(() => () => parts.forEach(part => { part.box.dispose(); part.edges.dispose(); }), [parts]);
  return parts;
}

export default function RoofFrame(props: Props) {
  const { dims, clock, schedule } = props;
  const looks = useLooks(props);
  const parts = useParts(dims);
  const nodes = useRef<(Group | null)[]>([]);
  useFrame(() => {
    parts.forEach((part, index) => {
      const node = nodes.current[index];
      if (!node) return;
      const grown = growth(schedule[STEP_OF[part.beam.kind]], part.index, clock.time, part.group);
      // Before its start a beam would show its cross-section as a tiny box
      node.visible = grown > 0;
      node.scale.z = Math.max(UNGROWN, grown);
    });
  });
  return (
    <>
      {parts.map((part, index) => (
        <group key={index} ref={node => { nodes.current[index] = node; }} position={part.beam.from} quaternion={part.quaternion} scale={[1, 1, UNGROWN]} visible={false}>
          <mesh geometry={part.box} material={looks[part.look].fill} />
          <lineSegments geometry={part.edges} material={looks[part.look].edge} />
        </group>
      ))}
    </>
  );
}
