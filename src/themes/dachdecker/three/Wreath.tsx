// Topping-out wreath of the Dachdecker Ending (DESIGN-DACHDECKER.md "Szenen"): a green ring on a pole of the set height above
// the front gable with six ribbons in the colors of the settings. It springs up at the start, the ribbons wave in the wind
// by moving their vertices with the clock of the scene.
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { CylinderGeometry, DoubleSide, type Group, MeshBasicMaterial, MeshPhongMaterial, PlaneGeometry, TorusGeometry } from "three";
import type { Point3 } from "../../../core/three/beam.ts";
import { landing, type BuildClock, type Schedule } from "../schedule.ts";

// wave: how the ribbons wave (settings): speed, wave along the ribbon, sway and the lean in the wind
type Props = {
  at: Point3; height: number; clock: BuildClock; schedule: Schedule; green: string; pole: string; ribbons: readonly string[]; wind: number;
  wave: { speed: number; along: number; sway: number; lean: number };
};

// The ring sits this far below the top of the pole, the ribbons hang from just below it
const POLE = { top: 0.04, bottom: 0.05, sides: 8 };
const RING = { radius: 0.42, tube: 0.11, below: 0.25, rings: 10, segments: 32, shine: 10 };
const RIBBON = { width: 0.09, length: 1.5, segments: 14, below: 0.3, around: 0.4, depth: 0.12 };
const HIDDEN = 1e-4;

export default function Wreath({ at, height, clock, schedule, green, pole, ribbons, wind, wave }: Props) {
  const shapes = useMemo(() => {
    const ribbon = () => {
      const plane = new PlaneGeometry(RIBBON.width, RIBBON.length, 1, RIBBON.segments);
      plane.translate(0, -RIBBON.length / 2, 0);
      return plane;
    };
    return {
      pole: new CylinderGeometry(POLE.top, POLE.bottom, height, POLE.sides),
      ring: new TorusGeometry(RING.radius, RING.tube, RING.rings, RING.segments),
      ribbons: ribbons.map(ribbon),
    };
  }, [ribbons, height]);
  const bases = useMemo(() => shapes.ribbons.map(ribbon => Float32Array.from(ribbon.getAttribute("position").array)), [shapes]);
  const looks = useMemo(() => ({
    pole: new MeshPhongMaterial({ color: pole }),
    ring: new MeshPhongMaterial({ color: green, shininess: RING.shine }),
    ribbons: ribbons.map(color => new MeshBasicMaterial({ color, side: DoubleSide })),
  }), [pole, green, ribbons]);
  useEffect(() => () => {
    shapes.pole.dispose(); shapes.ring.dispose(); shapes.ribbons.forEach(ribbon => ribbon.dispose());
    looks.pole.dispose(); looks.ring.dispose(); looks.ribbons.forEach(look => look.dispose());
  }, [shapes, looks]);
  const group = useRef<Group>(null);

  useFrame(() => {
    const time = clock.time;
    if (group.current) group.current.scale.y = Math.max(HIDDEN, landing(schedule.wreath, 0, time));
    shapes.ribbons.forEach((ribbon, index) => {
      const points = ribbon.getAttribute("position");
      const base = bases[index];
      for (let offset = 0; offset < base.length; offset += 3) {
        const down = -base[offset + 1];
        points.array[offset] = base[offset] + down * wave.lean * wind;
        points.array[offset + 2] = base[offset + 2] + Math.sin(time * wave.speed + down * wave.along + index) * down * wave.sway * wind;
      }
      points.needsUpdate = true;
    });
  });

  return (
    <group ref={group} position={at} scale={[1, HIDDEN, 1]}>
      <mesh geometry={shapes.pole} material={looks.pole} position={[0, height / 2, 0]} />
      <mesh geometry={shapes.ring} material={looks.ring} position={[0, height - RING.below, 0]} />
      {shapes.ribbons.map((ribbon, index) => {
        const angle = (index / shapes.ribbons.length) * Math.PI * 2;
        return <mesh key={index} geometry={ribbon} material={looks.ribbons[index]} position={[Math.cos(angle) * RIBBON.around, height - RIBBON.below, Math.sin(angle) * RIBBON.depth]} />;
      })}
    </group>
  );
}
