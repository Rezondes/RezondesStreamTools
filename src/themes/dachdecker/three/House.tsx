// Walls of the Dachdecker Ending house in 3D (DESIGN-DACHDECKER.md "Abend"): a lightly filled wall body with plan edges,
// timber posts, windows and the door that light up one after the other in terracotta, and the chimney. Positions come
// from house.ts, the light timing from the clock of the scene.
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { BoxGeometry, EdgesGeometry, LineBasicMaterial, MeshBasicMaterial, MeshPhongMaterial, PlaneGeometry } from "three";
import type { House as HouseData, HousePart } from "../house.ts";
import { type BuildClock, reached, type Schedule } from "../schedule.ts";

type Props = {
  house: HouseData; clock: BuildClock; schedule: Schedule; lights: boolean;
  line: string; lineOpacity: number; wall: string; glow: string; chimney: string;
};

// Wall body lightly filled, posts as timbers, lights switch on in three steps
const WALL_OPACITY = 0.55;
const POST = [0.14, 0.31] as const;
const STEPS = 3;

function useLooks({ line, lineOpacity, wall, glow, chimney }: Props) {
  const looks = useMemo(() => ({
    edge: new LineBasicMaterial({ color: line, transparent: true, opacity: lineOpacity }),
    wall: new MeshPhongMaterial({ color: wall, transparent: true, opacity: WALL_OPACITY, depthWrite: false }),
    chimney: new MeshPhongMaterial({ color: chimney }),
    lights: Array.from({ length: 5 }, () => new MeshBasicMaterial({ color: glow, transparent: true, opacity: 0 })),
  }), [line, lineOpacity, wall, glow, chimney]);
  useEffect(() => () => { looks.edge.dispose(); looks.wall.dispose(); looks.chimney.dispose(); looks.lights.forEach(look => look.dispose()); }, [looks]);
  return looks;
}

function Boxed({ part, fill, edge }: { part: HousePart; fill: MeshPhongMaterial; edge: LineBasicMaterial }) {
  const shapes = useMemo(() => {
    const box = new BoxGeometry(...part.size);
    return { box, edges: new EdgesGeometry(box) };
  }, [part]);
  useEffect(() => () => { shapes.box.dispose(); shapes.edges.dispose(); }, [shapes]);
  return (
    <group position={part.center}>
      <mesh geometry={shapes.box} material={fill} />
      <lineSegments geometry={shapes.edges} material={edge} />
    </group>
  );
}

export default function House(props: Props) {
  const { house, clock, schedule, lights } = props;
  const looks = useLooks(props);
  const shapes = useMemo(() => {
    const panes = [...house.windows, house.door].map(part => new PlaneGeometry(part.size[0], part.size[1]));
    const posts = house.posts.map(post => new BoxGeometry(POST[0], post.to[1] - post.from[1], POST[1]));
    return { panes, frames: panes.map(pane => new EdgesGeometry(pane)), posts, postEdges: posts.map(post => new EdgesGeometry(post)) };
  }, [house]);
  useEffect(() => () => Object.values(shapes).flat().forEach(shape => shape.dispose()), [shapes]);

  useFrame(() => {
    const step = schedule.windows;
    looks.lights.forEach((look, index) => {
      const part = lights ? reached({ ...step, start: step.start + index * step.stagger }, clock.time) : 1;
      look.opacity = Math.floor(part * STEPS) / STEPS;
    });
  });

  return (
    <>
      <Boxed part={house.wall} fill={looks.wall} edge={looks.edge} />
      <Boxed part={house.chimney} fill={looks.chimney} edge={looks.edge} />
      {house.posts.map((post, index) => (
        <group key={`post ${index}`} position={[post.from[0], (post.from[1] + post.to[1]) / 2, post.from[2]]}>
          <mesh geometry={shapes.posts[index]} material={looks.wall} />
          <lineSegments geometry={shapes.postEdges[index]} material={looks.edge} />
        </group>
      ))}
      {[...house.windows, house.door].map((part, index) => (
        <group key={`light ${index}`} position={part.center}>
          <mesh geometry={shapes.panes[index]} material={looks.lights[index]} />
          <lineSegments geometry={shapes.frames[index]} material={looks.edge} />
        </group>
      ))}
    </>
  );
}
