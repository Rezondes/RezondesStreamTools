// Slate and copper tiles of the Dachdecker theme in 3D (DESIGN-DACHDECKER.md "Ziegel"): two instanced meshes (slate
// slightly clear, copper shining) and the plan edges of all tiles in one line buffer (mergedEdges). Tiles land one after
// the other like a hammered nail as the clock of the scene says; once all have landed nothing is computed any more.
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  BoxGeometry, BufferAttribute, BufferGeometry, Color, Euler, type InstancedMesh, LineBasicMaterial, Matrix4, MeshBasicMaterial, MeshPhongMaterial,
  Quaternion, Vector3,
} from "three";
import { mergedEdges } from "../../../core/three/edges.ts";
import { type BuildClock, type BuildStep, landing, stepEnd } from "../schedule.ts";
import { TILE, type Tile } from "../tiles.ts";

// lit: shining in the light (BRB, Ending), otherwise flat colors like a drawing (Starting)
type Colors = { slate: string; copper: string; brick: string; edge: string; lit: boolean };
type Props = Colors & { tiles: readonly Tile[]; clock: BuildClock; step: BuildStep };

// Shine of slate and copper, slate a little clear, edges at 55 %
const SLATE_SHINE = 40;
const COPPER_SHINE = 90;
const SLATE_OPACITY = 0.92;
const EDGE_OPACITY = 0.55;
// Highlights: a dim copy of the edge color on slate, a light copper on copper
const SLATE_HIGHLIGHT = 0.2;
const COPPER_HIGHLIGHT = 0.5;
// Copper of the tiles: the copper of the settings warmed with brick and darkened, so it reads as metal, not as sand
const COPPER_WARM = 0.5;
const COPPER_DARK = 0.75;
const UNLANDED = 1e-4;

function useLooks({ slate, copper, brick, edge, lit }: Colors) {
  const looks = useMemo(() => {
    const metal = new Color(copper).lerp(new Color(brick), COPPER_WARM).multiplyScalar(COPPER_DARK);
    return {
      slate: lit
        ? new MeshPhongMaterial({ color: slate, shininess: SLATE_SHINE, specular: new Color(edge).multiplyScalar(SLATE_HIGHLIGHT), transparent: true, opacity: SLATE_OPACITY })
        : new MeshBasicMaterial({ color: slate }),
      copper: lit
        ? new MeshPhongMaterial({ color: metal, shininess: COPPER_SHINE, specular: new Color(copper).lerp(new Color(edge), COPPER_HIGHLIGHT) })
        : new MeshBasicMaterial({ color: metal }),
      edge: new LineBasicMaterial({ color: edge, transparent: true, opacity: EDGE_OPACITY }),
    };
  }, [slate, copper, brick, edge, lit]);
  useEffect(() => () => Object.values(looks).forEach(look => look.dispose()), [looks]);
  return looks;
}

export default function Tiles({ tiles, clock, step, ...colors }: Props) {
  const looks = useLooks(colors);
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
  const settled = useRef(false);
  useEffect(() => { settled.current = false; }, [poses, step]);

  useFrame(() => {
    if (settled.current) return;
    const time = clock.time;
    const placed = poses.map((pose, index) => {
      const size = Math.max(UNLANDED, landing(step, index, time));
      const matrix = pose.matrix.clone().multiply(new Matrix4().makeScale(size, size, size));
      meshes[pose.mesh].current?.setMatrixAt(pose.slot, matrix);
      return matrix;
    });
    for (const mesh of [meshes.slate.current, meshes.copper.current]) if (mesh) mesh.instanceMatrix.needsUpdate = true;
    lines.setAttribute("position", new BufferAttribute(mergedEdges(placed, box), 3));
    settled.current = time >= stepEnd(step, poses.length);
  });

  return (
    <>
      {/* Instances lie far from the origin: culling by the box at the origin would hide them */}
      <instancedMesh key={`slate ${counts.slate}`} ref={meshes.slate} args={[box, looks.slate, counts.slate]} frustumCulled={false} />
      <instancedMesh key={`copper ${counts.copper}`} ref={meshes.copper} args={[box, looks.copper, counts.copper]} frustumCulled={false} />
      <lineSegments geometry={lines} material={looks.edge} frustumCulled={false} />
    </>
  );
}
