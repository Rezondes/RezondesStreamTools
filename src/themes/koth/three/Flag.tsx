// Flag pole beside the KOTH mast and the flag of the holding faction: color with a star, hoisted in the flag step of the
// build, the cloth waves along its length every frame (flagOffset in flag.ts).
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { CanvasTexture, DoubleSide, type Mesh, PlaneGeometry, SRGBColorSpace } from "three";
import { inOutQuad, type KothClock, type Step, stepShare } from "../build.ts";
import { FLAG_POLE } from "../camp.ts";
import { flagOffset } from "../flag.ts";

type Props = { clock: KothClock; step: Step; base: number; size: number; wind: number; color: string; symbol: string; steel: string };

// fixed: pole and cloth from the prototype (refs/starting.html): height of the pole, where the flag starts, side ratio
const POLE = { height: 6.2, from: 1.9, gap: 0.06 };
const RATIO = 0.625;
const SEGMENTS = [24, 10] as const;
const TEXTURE = { width: 256, height: 160, band: 18, outer: 52, inner: 22, points: 5 };
// fixed: a darker band at the top and bottom edge of the cloth
const BAND = "rgba(0, 0, 0, 0.18)";

function flagTexture(color: string, symbol: string) {
  const canvas = document.createElement("canvas");
  canvas.width = TEXTURE.width;
  canvas.height = TEXTURE.height;
  const paint = canvas.getContext("2d")!;
  paint.fillStyle = color;
  paint.fillRect(0, 0, TEXTURE.width, TEXTURE.height);
  paint.fillStyle = BAND;
  paint.fillRect(0, 0, TEXTURE.width, TEXTURE.band);
  paint.fillRect(0, TEXTURE.height - TEXTURE.band, TEXTURE.width, TEXTURE.band);
  paint.fillStyle = symbol;
  paint.beginPath();
  for (let corner = 0; corner < TEXTURE.points * 2; corner++) {
    const radius = corner % 2 ? TEXTURE.inner : TEXTURE.outer;
    const angle = -Math.PI / 2 + (corner * Math.PI) / TEXTURE.points;
    paint.lineTo(TEXTURE.width / 2 + Math.cos(angle) * radius, TEXTURE.height / 2 + Math.sin(angle) * radius);
  }
  paint.fill();
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

export default function Flag({ clock, step, base, size, wind, color, symbol, steel }: Props) {
  const texture = useMemo(() => flagTexture(color, symbol), [color, symbol]);
  const geometry = useMemo(() => {
    const cloth = new PlaneGeometry(size, size * RATIO, ...SEGMENTS);
    cloth.translate(size / 2, (-size * RATIO) / 2, 0);
    return cloth;
  }, [size]);
  const rest = useMemo(() => Float32Array.from(geometry.attributes.position.array), [geometry]);
  useEffect(() => () => { texture.dispose(); geometry.dispose(); }, [texture, geometry]);
  const cloth = useRef<Mesh>(null);

  useFrame(() => {
    const time = clock.time;
    const position = geometry.attributes.position;
    for (let index = 0; index < position.count; index++) {
      const along = rest[index * 3];
      const across = rest[index * 3 + 1];
      const offset = flagOffset(along, across, time, size, wind);
      position.setY(index, across + offset.sag);
      position.setZ(index, offset.depth);
    }
    position.needsUpdate = true;
    geometry.computeVertexNormals();
    const hoist = inOutQuad(stepShare(step, time));
    cloth.current?.position.set(FLAG_POLE.x + POLE.gap, base + POLE.from + (POLE.height - POLE.from) * hoist, FLAG_POLE.z);
  });

  return (
    <group>
      <mesh position={[FLAG_POLE.x, base + POLE.height / 2, FLAG_POLE.z]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, POLE.height, 8]} />
        <meshStandardMaterial color={steel} metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh ref={cloth} geometry={geometry} castShadow>
        <meshStandardMaterial map={texture} side={DoubleSide} roughness={0.9} />
      </mesh>
    </group>
  );
}
