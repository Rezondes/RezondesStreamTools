// Camp on the KOTH hill from campLayout (camp.ts): sandbags that drop and bounce in the bags step, bunker, tents, crate
// stacks with light edges, the barbed wire fence on its posts, pines, rocks, the jeep and the marker flags of the other
// factions that pop on and wave. Low-poly parts with flat shading; shapes are fixed, colors come from the settings.
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  BoxGeometry, BufferGeometry, CapsuleGeometry, Color, ConeGeometry, CylinderGeometry, DodecahedronGeometry, DoubleSide, EdgesGeometry,
  Float32BufferAttribute, type Group, type Mesh, MeshStandardMaterial,
} from "three";
import { type KothClock, nail, outBounce, type Steps, stepShare } from "../build.ts";
import type { CampItem } from "../camp.ts";

export type CampColors = {
  bag: string; concrete: string; tent: string; crate: string; crateLight: string; edge: string; wood: string; pine: string; rock: string;
  jeep: string; jeepCab: string; steel: string; dark: string;
};
type Props = { items: readonly CampItem[]; clock: KothClock; steps: Steps; colors: CampColors; markers: readonly string[] };

// fixed: shapes of the prototype (refs/starting.html)
const BAG_LIFT = 0.2;
const BAG_DROP = 6;
const PINE_SHADES = [0.8, 0.95, 1.1];
const FENCE_WIRES = [0.45, 0.8];
const MARKER_WAVE = { speed: 3, swing: 0.35 };
const HIDDEN = 1e-4;
const WHEELS = [[0.8, 0.65], [0.8, -0.65], [-0.8, 0.65], [-0.8, -0.65]] as const;
// fixed: windscreen of the jeep
const GLASS = "#9fb3b8";

const flat = (color: string) => new MeshStandardMaterial({ color, roughness: 1, flatShading: true });

function shapes() {
  const bag = new CapsuleGeometry(0.24, 0.5, 4, 8);
  bag.rotateZ(Math.PI / 2);
  bag.scale(1, 0.6, 0.8);
  const crate = new BoxGeometry(0.9, 0.5, 0.6);
  return {
    bag, crate, crateEdges: new EdgesGeometry(crate), post: new CylinderGeometry(0.05, 0.06, 1, 5), rock: new DodecahedronGeometry(1, 0),
    trunk: new CylinderGeometry(0.04, 0.05, 0.25, 5), cones: [0, 1, 2].map(level => new ConeGeometry(0.5 - level * 0.12, 0.5, 6)),
  };
}
type Shapes = ReturnType<typeof shapes>;

function materials(colors: CampColors) {
  return {
    bag: flat(colors.bag), concrete: flat(colors.concrete), tent: flat(colors.tent), crate: flat(colors.crate), crateLight: flat(colors.crateLight),
    wood: flat(colors.wood), rock: flat(colors.rock), jeep: flat(colors.jeep), jeepCab: flat(colors.jeepCab), steel: flat(colors.steel), dark: flat(colors.dark),
    pines: PINE_SHADES.map(shade => flat(`#${new Color(colors.pine).multiplyScalar(shade).getHexString()}`)),
  };
}
type Looks = ReturnType<typeof materials>;

function fenceGeometry(posts: readonly CampItem[]) {
  const points = posts.flatMap((post, index) => {
    const next = posts[(index + 1) % posts.length];
    return FENCE_WIRES.flatMap(lift => [post.x, post.y + lift, post.z, next.x, next.y + lift, next.z]);
  });
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(points, 3));
  return geometry;
}

type PartProps = { item: CampItem; looks: Looks };
const placed = (item: CampItem) => ({ position: [item.x, item.y + item.lift, item.z] as const, rotation: [0, item.turn, 0] as const });

function Bunker({ item, looks }: PartProps) {
  return (
    <group position={[item.x, item.y + BAG_LIFT, item.z]} rotation={[0, item.turn, 0]}>
      <mesh material={looks.concrete} castShadow receiveShadow><boxGeometry args={[3.4, 1.4, 2.4]} /></mesh>
      <mesh material={looks.concrete} position={[0, 0.85, 0]} castShadow receiveShadow><boxGeometry args={[3.8, 0.3, 2.8]} /></mesh>
      <mesh material={looks.dark} position={[0, 0.25, 1.22]}><boxGeometry args={[2.2, 0.22, 0.1]} /></mesh>
    </group>
  );
}

function Tent({ item, looks }: PartProps) {
  return (
    <group {...placed(item)}>
      <mesh material={looks.tent} position={[0, 0.7, 0]} rotation={[Math.PI / 6, 0, Math.PI / 2]} castShadow receiveShadow><cylinderGeometry args={[1.4, 1.4, 3.2, 3, 1]} /></mesh>
      <mesh material={looks.dark} position={[1.62, 0.55, 0]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[0.9, 1]} /></mesh>
    </group>
  );
}

function Jeep({ item, looks }: PartProps) {
  return (
    <group {...placed(item)}>
      <mesh material={looks.jeep} position={[0, 0.75, 0]} castShadow receiveShadow><boxGeometry args={[2.4, 0.7, 1.3]} /></mesh>
      <mesh material={looks.jeepCab} position={[-0.4, 1.35, 0]} castShadow><boxGeometry args={[1.1, 0.5, 1.25]} /></mesh>
      <mesh position={[0.16, 1.35, 0]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[1.1, 0.45]} /><meshStandardMaterial color={GLASS} roughness={0.2} metalness={0.3} /></mesh>
      {WHEELS.map(([x, side]) => (
        <mesh key={`${x}${side}`} material={looks.dark} position={[x, 0.36, side]} rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[0.36, 0.36, 0.28, 12]} /></mesh>
      ))}
    </group>
  );
}

function Tree({ item, looks, parts }: PartProps & { parts: Shapes }) {
  return (
    <group {...placed(item)} scale={item.size}>
      <mesh geometry={parts.trunk} material={looks.wood} position={[0, 0.125, 0]} castShadow />
      {parts.cones.map((cone, level) => <mesh key={level} geometry={cone} material={looks.pines[level]} position={[0, 0.5 + level * 0.26, 0]} castShadow receiveShadow />)}
    </group>
  );
}

type ItemProps = PartProps & { parts: Shapes; colors: CampColors; markers: readonly string[]; bagRef: (bag: Mesh | null) => void; flagRef: (flag: Group | null) => void };

// One item of the layout; the flag pole is drawn by Flag.tsx
function Item({ item, looks, parts, colors, markers, bagRef, flagRef }: ItemProps) {
  const at = placed(item);
  switch (item.kind) {
    case "sandbag":
      return <mesh ref={bagRef} geometry={parts.bag} material={looks.bag} position={[item.x, item.y + BAG_LIFT + item.lift + BAG_DROP, item.z]} rotation={at.rotation} castShadow receiveShadow />;
    case "crate":
      return (
        <mesh geometry={parts.crate} material={item.index % 2 ? looks.crateLight : looks.crate} position={[item.x, item.y + item.lift + 0.25, item.z]} rotation={at.rotation} castShadow receiveShadow>
          <lineSegments geometry={parts.crateEdges}><lineBasicMaterial color={colors.edge} transparent opacity={0.5} /></lineSegments>
        </mesh>
      );
    case "post":
      return <mesh geometry={parts.post} material={looks.wood} position={[item.x, item.y + 0.5, item.z]} castShadow />;
    case "rock":
      return <mesh geometry={parts.rock} material={looks.rock} position={[item.x, item.y + 0.05, item.z]} rotation={at.rotation} scale={[item.size, item.size * 0.6, item.size]} castShadow receiveShadow />;
    case "marker":
      return (
        <group ref={flagRef} position={at.position} scale={HIDDEN}>
          <mesh material={looks.steel} position={[0, 1.2, 0]} castShadow><cylinderGeometry args={[0.04, 0.04, 2.4, 6]} /></mesh>
          <mesh position={[0.55, 2.05, 0]} castShadow><planeGeometry args={[1.1, 0.7]} /><meshStandardMaterial color={markers[item.index % markers.length]} side={DoubleSide} /></mesh>
        </group>
      );
    case "bunker": return <Bunker item={item} looks={looks} />;
    case "tent": return <Tent item={item} looks={looks} />;
    case "jeep": return <Jeep item={item} looks={looks} />;
    case "tree": return <Tree item={item} looks={looks} parts={parts} />;
    default: return null;
  }
}

export default function Camp({ items, clock, steps, colors, markers }: Props) {
  const parts = useMemo(() => shapes(), []);
  const looks = useMemo(() => materials(colors), [colors]);
  const fence = useMemo(() => {
    const posts = items.filter(item => item.kind === "post");
    return posts.length > 1 ? fenceGeometry(posts) : null;
  }, [items]);
  useEffect(() => () => [parts.bag, parts.crate, parts.crateEdges, parts.post, parts.rock, parts.trunk, ...parts.cones].forEach(part => part.dispose()), [parts]);
  useEffect(() => () => fence?.dispose(), [fence]);
  useEffect(() => () => Object.values(looks).flat().forEach(look => look.dispose()), [looks]);
  const bags = useRef<(Mesh | null)[]>([]);
  const flags = useRef<(Group | null)[]>([]);

  useFrame(() => {
    const time = clock.time;
    items.forEach((item, index) => {
      if (item.kind === "sandbag") {
        const fall = 1 - outBounce(stepShare(steps.bags, time, item.index));
        bags.current[index]?.position.setY(item.y + BAG_LIFT + item.lift + fall * BAG_DROP);
      }
      if (item.kind !== "marker") return;
      const flag = flags.current[index];
      flag?.scale.setScalar(Math.max(HIDDEN, nail(stepShare(steps.markers, time, item.index))));
      flag?.children[1]?.rotation.set(0, Math.sin(time * MARKER_WAVE.speed + item.index) * MARKER_WAVE.swing, 0);
    });
  });

  return (
    <group>
      {items.map((item, index) => (
        <Item
          key={index} item={item} looks={looks} parts={parts} colors={colors} markers={markers}
          bagRef={bag => { bags.current[index] = bag; }} flagRef={flag => { flags.current[index] = flag; }}
        />
      ))}
      {fence && <lineSegments geometry={fence}><lineBasicMaterial color={colors.dark} /></lineSegments>}
    </group>
  );
}
