// The finished house of the Dachdecker Ending in 3D (DESIGN-DACHDECKER.md "Abend"): plastered walls on a stone plinth
// with a dark timber frame, windows with crossbars and sills, a wooden door with its step, closed gables with a round
// window, and the chimney. The windows light up one after the other in terracotta. Positions come from house.ts, the
// light timing from the clock of the scene.
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import {
  BoxGeometry, type BufferGeometry, CircleGeometry, DoubleSide, EdgesGeometry, LineBasicMaterial, type Material, MeshBasicMaterial, MeshPhongMaterial,
  PlaneGeometry, Shape, ShapeGeometry,
} from "three";
import { beamTransform } from "../../../core/three/beam.ts";
import { type Gable as GableData, type House as HouseData, type HousePart, TIMBER, type Timber } from "../house.ts";
import { type BuildClock, reached, type Schedule } from "../schedule.ts";

type Props = {
  house: HouseData; clock: BuildClock; schedule: Schedule; lights: boolean;
  line: string; lineOpacity: number; wall: string; timber: string; stone: string; pane: string; glow: string; chimney: string;
};
type Looks = ReturnType<typeof useLooks>;
type Shape3 = { body: BufferGeometry; edges: BufferGeometry };

// Lights switch on in three steps; crossbars of the windows; glow and pane just in front of the wall
const STEPS = 3;
const BAR = 0.06;
const LAYER = 0.004;
const RING_SEGMENTS = 24;

function useLooks({ line, lineOpacity, wall, timber, stone, pane, glow, chimney, house }: Props) {
  const lightCount = house.windows.length + house.gables.length;
  const looks = useMemo(() => ({
    edge: new LineBasicMaterial({ color: line, transparent: true, opacity: lineOpacity }),
    wall: new MeshPhongMaterial({ color: wall, side: DoubleSide }),
    timber: new MeshPhongMaterial({ color: timber }),
    stone: new MeshPhongMaterial({ color: stone }),
    pane: new MeshPhongMaterial({ color: pane, side: DoubleSide }),
    chimney: new MeshPhongMaterial({ color: chimney }),
    lights: Array.from({ length: lightCount }, () => new MeshBasicMaterial({ color: glow, transparent: true, opacity: 0, side: DoubleSide })),
  }), [line, lineOpacity, wall, timber, stone, pane, glow, chimney, lightCount]);
  useEffect(() => () => Object.values(looks).flat().forEach(look => look.dispose()), [looks]);
  return looks;
}

const withEdges = (body: BufferGeometry): Shape3 => ({ body, edges: new EdgesGeometry(body) });
// Frees a shape again with the component
function useFreed(shape: Shape3) {
  useEffect(() => () => { shape.body.dispose(); shape.edges.dispose(); }, [shape]);
  return shape;
}

function Solid({ part, look, edge }: { part: HousePart; look: Material; edge: LineBasicMaterial }) {
  const shape = useFreed(useMemo(() => withEdges(new BoxGeometry(...part.size)), [part]));
  return (
    <group position={[...part.center]}>
      <mesh geometry={shape.body} material={look} />
      <lineSegments geometry={shape.edges} material={edge} />
    </group>
  );
}

// A timber as a square beam between its two points
function Beam({ timber, looks }: { timber: Timber; looks: Looks }) {
  const placed = useMemo(() => beamTransform(timber.from, timber.to), [timber]);
  const shape = useFreed(useMemo(() => withEdges(new BoxGeometry(TIMBER.width, TIMBER.width, placed.length).translate(0, 0, placed.length / 2)), [placed]));
  return (
    <group position={[...placed.position]} quaternion={placed.quaternion}>
      <mesh geometry={shape.body} material={looks.timber} />
      <lineSegments geometry={shape.edges} material={looks.edge} />
    </group>
  );
}

// A window: dark pane, its light, the frame and a cross of bars
function Window({ part, light, looks }: { part: HousePart; light: MeshBasicMaterial; looks: Looks }) {
  const [width, height] = part.size;
  const shape = useFreed(useMemo(() => withEdges(new PlaneGeometry(width, height)), [width, height]));
  const bars = useMemo<Record<"frame" | "upright" | "across", HousePart>>(() => ({
    frame: { center: [0, 0, 0], size: [width + BAR * 2, height + BAR * 2, BAR / 2] },
    upright: { center: [0, 0, LAYER * 2], size: [BAR, height, BAR] },
    across: { center: [0, 0, LAYER * 2], size: [width, BAR, BAR] },
  }), [width, height]);
  return (
    <group position={[...part.center]}>
      <Solid part={bars.frame} look={looks.timber} edge={looks.edge} />
      <mesh geometry={shape.body} material={looks.pane} position={[0, 0, BAR / 4 + LAYER]} />
      <mesh geometry={shape.body} material={light} position={[0, 0, BAR / 4 + LAYER * 2]} />
      <Solid part={bars.upright} look={looks.timber} edge={looks.edge} />
      <Solid part={bars.across} look={looks.timber} edge={looks.edge} />
    </group>
  );
}

// A closed gable triangle with its round window, the window on the outer side (out = 1 front, -1 back)
function Gable({ gable, light, looks, out }: { gable: GableData; light: MeshBasicMaterial; looks: Looks; out: 1 | -1 }) {
  const shape = useFreed(useMemo(() => {
    const outline = new Shape();
    outline.moveTo(-gable.half, 0);
    outline.lineTo(gable.half, 0);
    outline.lineTo(0, gable.rise);
    outline.closePath();
    return withEdges(new ShapeGeometry(outline));
  }, [gable]));
  const ring = useFreed(useMemo(() => withEdges(new CircleGeometry(gable.window.radius, RING_SEGMENTS)), [gable]));
  return (
    <group position={[0, gable.base, gable.z]}>
      <mesh geometry={shape.body} material={looks.wall} />
      <lineSegments geometry={shape.edges} material={looks.edge} />
      <group position={[0, gable.window.center[1] - gable.base, out * LAYER]}>
        <mesh geometry={ring.body} material={looks.pane} />
        <mesh geometry={ring.body} material={light} position={[0, 0, out * LAYER]} />
        <lineSegments geometry={ring.edges} material={looks.edge} position={[0, 0, out * LAYER * 2]} />
      </group>
    </group>
  );
}

export default function House(props: Props) {
  const { house, clock, schedule, lights } = props;
  const looks = useLooks(props);
  const door = useMemo<HousePart>(() => ({ center: house.door.center, size: [house.door.size[0], house.door.size[1], BAR] }), [house]);

  useFrame(() => {
    const step = schedule.windows;
    looks.lights.forEach((look, index) => {
      const part = lights ? reached({ ...step, start: step.start + index * step.stagger }, clock.time) : 1;
      look.opacity = Math.floor(part * STEPS) / STEPS;
    });
  });

  return (
    <>
      <Solid part={house.wall} look={looks.wall} edge={looks.edge} />
      <Solid part={house.plinth} look={looks.stone} edge={looks.edge} />
      <Solid part={house.chimney} look={looks.chimney} edge={looks.edge} />
      {house.timbers.map((timber, index) => <Beam key={`timber ${index}`} timber={timber} looks={looks} />)}
      {house.windows.map((part, index) => <Window key={`window ${index}`} part={part} light={looks.lights[index]} looks={looks} />)}
      {house.sills.map((part, index) => <Solid key={`sill ${index}`} part={part} look={looks.stone} edge={looks.edge} />)}
      <Solid part={door} look={looks.timber} edge={looks.edge} />
      <Solid part={house.step} look={looks.stone} edge={looks.edge} />
      {house.gables.map((gable, index) => (
        <Gable key={`gable ${index}`} gable={gable} light={looks.lights[house.windows.length + index]} looks={looks} out={index === 0 ? 1 : -1} />
      ))}
    </>
  );
}
