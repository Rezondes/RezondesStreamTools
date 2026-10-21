// The palms of the realistic Urlaub beach (palm.ts): a curved, ringed trunk with a bark texture and a crown of pinnate
// fronds with an alpha texture that hang outward and sway with the clock, coconuts under the crown. Colors from the palm
// settings.
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { CatmullRomCurve3, DoubleSide, type Group, Mesh, MeshStandardMaterial, PlaneGeometry, SphereGeometry, TubeGeometry, Vector3 } from "three";
import { mixHex } from "../../../core/color.ts";
import { FROND, frondPoint, frondSway, palmLayout, trunkPoints } from "../palm.ts";
import type { BeachClock } from "./Sky.tsx";
import { canvasTexture, sequence } from "./textures.ts";

type Props = { clock: BeachClock; left: number; right: number; sway: number; leaf: string; trunk: string; seed: number };

// fixed: fronds per crown, their tilt, the trunk tube, the frond strip segments, the coconuts and their color
const FRONDS = 11;
const TILT = { from: -Math.PI / 2 + 0.25, by: 0.3 };
const TUBE = { segments: 40, radius: 0.32, sides: 10 };
const STRIP = { along: 24, across: 1 };
const NUTS = [[0.3, 0.1], [-0.2, 0.25], [0.05, -0.3]] as const;
const NUT = { radius: 0.28, color: "#5a3c1c" }; // fixed: brown coconuts

function textures(leaf: string, trunk: string, seed: number) {
  const random = sequence(seed + 3);
  const frond = canvasTexture(512, 128, (context, width, height) => {
    context.strokeStyle = mixHex(leaf, trunk, 0.4);
    context.lineWidth = 5;
    context.beginPath();
    context.moveTo(0, height / 2);
    context.lineTo(width, height / 2);
    context.stroke();
    for (let at = 4; at < width - 6; at += 7) {
      const reach = (1 - (at / width - 0.35) ** 2 * 1.6) * height * 0.48;
      for (const side of [-1, 1]) {
        const shade = context.createLinearGradient(at, height / 2, at + 30, height / 2 + side * reach);
        shade.addColorStop(0, mixHex(leaf, trunk, 0.35));
        shade.addColorStop(1, random() > 0.5 ? leaf : mixHex(leaf, trunk, 0.15));
        context.fillStyle = shade;
        context.beginPath();
        context.moveTo(at, height / 2);
        context.quadraticCurveTo(at + 8, height / 2 + side * reach * 0.5, at + 26, height / 2 + side * reach);
        context.lineTo(at + 30, height / 2 + side * reach * 0.96);
        context.quadraticCurveTo(at + 12, height / 2 + side * reach * 0.45, at + 6, height / 2);
        context.fill();
      }
    }
  });
  const bark = canvasTexture(128, 512, (context, width, height) => {
    context.fillStyle = trunk;
    context.fillRect(0, 0, width, height);
    for (let y = 0; y < height; y += 22) {
      context.fillStyle = mixHex(trunk, "#000000", 0.35); // fixed: the rings darker
      context.fillRect(0, y, width, 5);
      context.fillStyle = mixHex(trunk, "#ffffff", 0.3); // fixed: and lit below
      context.fillRect(0, y + 5, width, 3);
    }
  }, [1, 6]);
  return { frond, bark };
}

// A frond: the strip bent with frondPoint, its root at the crown
function frondGeometry() {
  const geometry = new PlaneGeometry(FROND.length, FROND.width, STRIP.along, STRIP.across);
  geometry.translate(FROND.length / 2, 0, 0);
  const position = geometry.attributes.position;
  for (let index = 0; index < position.count; index++) position.setXYZ(index, ...frondPoint(position.getX(index) / FROND.length, position.getY(index) / FROND.width));
  geometry.computeVertexNormals();
  return geometry;
}

export default function Palms({ clock, left, right, sway, leaf, trunk, seed }: Props) {
  const crowns = useRef<(Group | null)[]>([]);
  const built = useMemo(() => {
    const random = sequence(seed + 4);
    const { frond, bark } = textures(leaf, trunk, seed);
    const frondMaterial = new MeshStandardMaterial({ map: frond, alphaTest: 0.45, side: DoubleSide, roughness: 0.8 });
    const barkMaterial = new MeshStandardMaterial({ map: bark, roughness: 1 });
    const shape = frondGeometry();
    return palmLayout(left, right).map(palm => {
      const curve = new CatmullRomCurve3(trunkPoints(palm).map(point => new Vector3(...point)));
      const fronds = Array.from({ length: FRONDS }, (_, index) => {
        const mesh = new Mesh(shape, frondMaterial);
        mesh.rotation.order = "YXZ";
        mesh.rotation.y = (index / FRONDS) * Math.PI * 2 + palm.turn;
        mesh.rotation.x = TILT.from + random() * TILT.by;
        mesh.castShadow = true;
        mesh.userData = { tilt: mesh.rotation.x, phase: random() * 6 };
        return mesh;
      });
      return { trunk: new TubeGeometry(curve, TUBE.segments, TUBE.radius, TUBE.sides), crown: curve.getPoint(1), fronds, barkMaterial };
    });
  }, [left, right, leaf, trunk, seed]);
  useFrame(() => {
    crowns.current.forEach((crown, palm) => crown?.children.forEach(child => {
      if (typeof child.userData.tilt === "number") child.rotation.x = child.userData.tilt + frondSway(clock.time, child.userData.phase as number, palm, sway);
    }));
  });
  return (
    <>
      {built.map((palm, index) => (
        <group key={index}>
          <mesh geometry={palm.trunk} material={palm.barkMaterial} castShadow />
          <group ref={group => { crowns.current[index] = group; }} position={palm.crown}>
            {palm.fronds.map((frond, which) => <primitive key={which} object={frond} />)}
            {NUTS.map(([x, depth], which) => (
              <mesh key={`nut-${which}`} geometry={new SphereGeometry(NUT.radius, 12, 10)} position={[x, -0.35, depth]}>
                <meshStandardMaterial color={NUT.color} roughness={0.7} />
              </mesh>
            ))}
          </group>
        </group>
      ))}
    </>
  );
}
