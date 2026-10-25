// Radio mast on the KOTH summit: the lattice builds itself segment by segment from the bottom (mastSegments), the guy
// wires run out to their anchors, dish and platform pop on, and the beacon on top blinks once the mast stands.
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { BufferGeometry, Color, DoubleSide, Float32BufferAttribute, type Mesh, type MeshBasicMaterial, type PointLight } from "three";
import { type KothClock, nail, outCubic, type Steps, stepShare } from "../build.ts";
import { DISH_HEIGHT, mastSegments, mastWires, PLATFORM_HEIGHT, type Segment } from "../mast.ts";
import { useKoth } from "../useKoth.ts";

type Props = {
  clock: KothClock;
  steps: Steps;
  base: number;
  height: number;
  wires: boolean;
  dish: boolean;
  beacon: { color: string; every: number };
  steel: string;
  ground: (x: number, depth: number) => number;
};

// fixed: the beacon blinks once the mast is built this far; blink, light and darkness come from the settings
const BUILT = 0.98;
// fixed: a tiny scale instead of 0 for parts that pop on
const HIDDEN = 1e-4;

function lines(segments: readonly Segment[]) {
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(segments.flatMap(segment => [...segment.from, ...segment.to]), 3));
  return geometry;
}

export default function Mast({ clock, steps, base, height, wires, dish, beacon, steel, ground }: Props) {
  const lattice = useMemo(() => mastSegments(base, height), [base, height]);
  const guys = useMemo(() => (wires ? mastWires(base, height, ground) : []), [wires, base, height, ground]);
  const latticeGeometry = useMemo(() => lines(lattice), [lattice]);
  const wireGeometry = useMemo(() => lines(guys), [guys]);
  useEffect(() => () => { latticeGeometry.dispose(); wireGeometry.dispose(); }, [latticeGeometry, wireGeometry]);
  const { beaconBlink, beaconLight, beaconDark, mastDishColor } = useKoth();
  const [lit, dark] = useMemo(() => [new Color(beacon.color), new Color(beacon.color).multiplyScalar(beaconDark)], [beacon.color, beaconDark]);
  const lamp = useRef<Mesh>(null);
  const light = useRef<PointLight>(null);
  const dishMesh = useRef<Mesh>(null);
  const platform = useRef<Mesh>(null);

  useFrame(() => {
    const time = clock.time;
    const built = stepShare(steps.mast, time);
    latticeGeometry.setDrawRange(0, Math.floor(lattice.length * built) * 2);
    wireGeometry.setDrawRange(0, Math.floor(guys.length * outCubic(stepShare(steps.wires, time))) * 2);
    dishMesh.current?.scale.setScalar(Math.max(HIDDEN, nail(stepShare(steps.dish, time, 0))));
    platform.current?.scale.setScalar(Math.max(HIDDEN, nail(stepShare(steps.dish, time, 1))));
    const blink = built > BUILT && time % beacon.every < beaconBlink;
    (lamp.current?.material as MeshBasicMaterial | undefined)?.color.copy(blink ? lit : dark);
    if (light.current) light.current.intensity = blink ? beaconLight : 0;
  });

  const top = base + height;
  return (
    <group>
      <lineSegments geometry={latticeGeometry}>
        <lineBasicMaterial color={steel} />
      </lineSegments>
      {wires && (
        <lineSegments geometry={wireGeometry}>
          <lineBasicMaterial color={steel} transparent opacity={0.6} />
        </lineSegments>
      )}
      {dish && (
        <>
          <mesh ref={dishMesh} position={[1.1, base + height * DISH_HEIGHT, 0.3]} rotation={[0, 0, -Math.PI / 2.4]} castShadow>
            <cylinderGeometry args={[0.85, 0.12, 0.35, 18, 1, true]} />
            <meshStandardMaterial color={mastDishColor} side={DoubleSide} roughness={0.6} />
          </mesh>
          <mesh ref={platform} position={[0, base + height * PLATFORM_HEIGHT, 0]} castShadow>
            <cylinderGeometry args={[1.05, 1.05, 0.08, 3]} />
            <meshStandardMaterial color={steel} flatShading roughness={1} />
          </mesh>
        </>
      )}
      <mesh ref={lamp} position={[0, top + 0.15, 0]}>
        <sphereGeometry args={[0.22, 16, 12]} />
        <meshBasicMaterial color={beacon.color} />
      </mesh>
      <pointLight ref={light} position={[0, top + 0.15, 0]} color={beacon.color} intensity={0} distance={12} decay={1.6} />
    </group>
  );
}
