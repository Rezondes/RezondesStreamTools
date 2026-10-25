// Slate and copper tiles of the Dachdecker theme in 3D (DESIGN-DACHDECKER.md "Ziegel"): two instanced meshes (slate
// slightly clear, copper shining) and the plan edges of all tiles in one line buffer (mergedEdges). Tiles land one after
// the other like a hammered nail as the clock of the scene says; once all have landed nothing is computed any more.
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  BoxGeometry, BufferAttribute, BufferGeometry, Color, CylinderGeometry, Euler, type InstancedMesh, LineBasicMaterial, Matrix4, type Mesh, MeshBasicMaterial, MeshPhongMaterial,
  Quaternion, Vector3,
} from "three";
import { mergedEdges } from "../../../core/three/edges.ts";
import { type BuildClock, type BuildStep, landing, stepEnd } from "../schedule.ts";
import { type Ridge, TILE, type Tile } from "../tiles.ts";
import type { DachdeckerValues } from "../settings.ts";

// lit: shining in the light (BRB, Ending), otherwise flat colors like a drawing (Starting)
type Colors = { slate: string; copper: string; brick: string; edge: string; lit: boolean } & TileLook;
// Shine, opacity and highlights of slate and copper, the copper warmed with brick and darkened (settings)
export type TileLook = {
  slateShine: number; copperShine: number; slateOpacity: number; edgeOpacity: number; slateHighlight: number; copperHighlight: number;
  copperWarm: number; copperDark: number;
};
export const tileLookOf = (values: DachdeckerValues): TileLook => ({
  slateShine: values.tileSlateShine, copperShine: values.tileCopperShine, slateOpacity: values.tileSlateOpacity, edgeOpacity: values.tileEdgeOpacity,
  slateHighlight: values.tileSlateHighlight, copperHighlight: values.tileCopperHighlight, copperWarm: values.tileCopperWarm, copperDark: values.tileCopperDark,
});
// ridge: copper pipe along the ridge, shown once every tile has landed, null without; land: own landing of tile index
// at time (default: one after the other in the step) with doneAt, the time when the last one is done
type Props = Colors & {
  tiles: readonly Tile[]; clock: BuildClock; step: BuildStep; ridge?: Ridge | null;
  land?: (index: number, time: number) => number; doneAt?: number;
};
const RIDGE = { radius: 0.16, sides: 16 };

const UNLANDED = 1e-4;

function useLooks({ slate, copper, brick, edge, lit, slateShine, copperShine, slateOpacity, edgeOpacity, slateHighlight, copperHighlight, copperWarm, copperDark }: Colors) {
  const looks = useMemo(() => {
    const metal = new Color(copper).lerp(new Color(brick), copperWarm).multiplyScalar(copperDark);
    return {
      slate: lit
        ? new MeshPhongMaterial({ color: slate, shininess: slateShine, specular: new Color(edge).multiplyScalar(slateHighlight), transparent: true, opacity: slateOpacity })
        : new MeshBasicMaterial({ color: slate }),
      copper: lit
        ? new MeshPhongMaterial({ color: metal, shininess: copperShine, specular: new Color(copper).lerp(new Color(edge), copperHighlight) })
        : new MeshBasicMaterial({ color: metal }),
      edge: new LineBasicMaterial({ color: edge, transparent: true, opacity: edgeOpacity }),
    };
  }, [slate, copper, brick, edge, lit, slateShine, copperShine, slateOpacity, edgeOpacity, slateHighlight, copperHighlight, copperWarm, copperDark]);
  useEffect(() => () => Object.values(looks).forEach(look => look.dispose()), [looks]);
  return looks;
}

export default function Tiles({ tiles, clock, step, ridge = null, land, doneAt, ...colors }: Props) {
  const looks = useLooks(colors);
  const pipe = useMemo(() => (ridge ? new CylinderGeometry(RIDGE.radius, RIDGE.radius, ridge.length, RIDGE.sides) : null), [ridge]);
  useEffect(() => () => pipe?.dispose(), [pipe]);
  const box = useMemo(() => new BoxGeometry(TILE.width, TILE.height, TILE.depth), []);
  const lines = useMemo(() => new BufferGeometry(), []);
  useEffect(() => () => { box.dispose(); lines.dispose(); }, [box, lines]);
  // Pose of every tile when landed, and which mesh and slot it has
  const poses = useMemo(() => {
    const counts = { slate: 0, copper: 0 };
    return tiles.map(tile => {
      const matrix = new Matrix4().compose(new Vector3(...tile.position), new Quaternion().setFromEuler(new Euler(...tile.rotation)), new Vector3(1, 1, 1));
      const mesh: "slate" | "copper" = tile.copper ? "copper" : "slate";
      return { matrix, mesh, slot: counts[mesh]++ };
    });
  }, [tiles]);
  const counts = { slate: poses.filter(pose => pose.mesh === "slate").length, copper: poses.filter(pose => pose.mesh === "copper").length };
  const slateMesh = useRef<InstancedMesh | null>(null);
  const copperMesh = useRef<InstancedMesh | null>(null);
  const meshes = { slate: slateMesh, copper: copperMesh };
  const pipeMesh = useRef<Mesh | null>(null);
  const settled = useRef(false);
  useEffect(() => { settled.current = false; }, [poses, step, land, doneAt]);
  const end = doneAt ?? stepEnd(step, poses.length);

  useFrame(() => {
    if (settled.current) return;
    const time = clock.time;
    const placed = poses.map((pose, index) => {
      const size = Math.max(UNLANDED, land ? land(index, time) : landing(step, index, time));
      const matrix = pose.matrix.clone().multiply(new Matrix4().makeScale(size, size, size));
      meshes[pose.mesh].current?.setMatrixAt(pose.slot, matrix);
      return matrix;
    });
    for (const mesh of [meshes.slate.current, meshes.copper.current]) if (mesh) mesh.instanceMatrix.needsUpdate = true;
    lines.setAttribute("position", new BufferAttribute(mergedEdges(placed, box), 3));
    settled.current = time >= end;
    if (pipeMesh.current) pipeMesh.current.visible = settled.current;
  });

  return (
    <>
      {/* Instances lie far from the origin: culling by the box at the origin would hide them */}
      <instancedMesh key={`slate ${counts.slate}`} ref={meshes.slate} args={[box, looks.slate, counts.slate]} frustumCulled={false} />
      <instancedMesh key={`copper ${counts.copper}`} ref={meshes.copper} args={[box, looks.copper, counts.copper]} frustumCulled={false} />
      <lineSegments geometry={lines} material={looks.edge} frustumCulled={false} />
      {ridge && pipe && <mesh ref={pipeMesh} geometry={pipe} material={looks.copper} position={ridge.center} rotation={[Math.PI / 2, 0, 0]} visible={false} />}
    </>
  );
}
