// The sand of the realistic Urlaub beach: a field rising out of the sea toward the camera (shore.ts), grain and ripples
// in a canvas texture in the sand color, darker where it is wet; rocks along the water line, seeded. buildBeach is plain
// three.js, so the banners (bannerWorld.ts) build the same sand.
import { useMemo } from "react";
import { BufferAttribute, Color, DodecahedronGeometry, Group, Mesh, MeshStandardMaterial, PlaneGeometry } from "three";
import { SHORE, shoreHeight, wetness } from "../shore.ts";
import { canvasTexture, sequence } from "./textures.ts";

type Props = { sand: string; rocks: number; seed: number };

// fixed: the sand field (width, depth, segments, how far it reaches toward the camera), the texture (px, grains,
// repeats, ripple rows), the rock color, how flat rocks are and how far they spread
const FIELD = { width: 260, depth: 80, across: 200, along: 80, toward: 30 };
const TEXTURE = { size: 1024, grains: 90000, repeat: [18, 9] as [number, number], ripple: 9 };
// fixed: how much darker wet sand is (a factor on the texture, per channel)
const WET = [0.62, 0.55, 0.46] as const;
const ROCK = { color: "#6b6258", flat: 0.6, spread: 70 }; // fixed: grey rocks
const LIGHT_GRAIN = "rgba(255, 245, 220, 0.35)"; // fixed: light sand grain
const DARK_GRAIN = "rgba(120, 90, 50, 0.25)"; // fixed: dark sand grain
const RIPPLE_LINE = "rgba(150, 115, 70, 0.12)"; // fixed: wind ripples

export function buildBeach({ sand, rocks, seed }: Props): Group {
  const beach = new Group();
  {
    const random = sequence(seed);
    const map = canvasTexture(TEXTURE.size, TEXTURE.size, (context, width, height) => {
      context.fillStyle = sand;
      context.fillRect(0, 0, width, height);
      for (let grain = 0; grain < TEXTURE.grains; grain++) {
        context.globalAlpha = random();
        context.fillStyle = random() > 0.5 ? LIGHT_GRAIN : DARK_GRAIN;
        context.fillRect(random() * width, random() * height, 1.5, 1.5);
      }
      context.globalAlpha = 1;
      context.strokeStyle = RIPPLE_LINE;
      context.lineWidth = 3;
      for (let y = 0; y < height; y += TEXTURE.ripple) {
        context.beginPath();
        for (let x = 0; x <= width; x += 16) context.lineTo(x, y + Math.sin(x * 0.02 + y * 0.3) * 4);
        context.stroke();
      }
    }, TEXTURE.repeat);
    const geometry = new PlaneGeometry(FIELD.width, FIELD.depth, FIELD.across, FIELD.along);
    geometry.rotateX(-Math.PI / 2);
    geometry.translate(0, 0, FIELD.toward);
    const position = geometry.attributes.position;
    const [dry, wet] = [new Color(1, 1, 1), new Color(...WET)];
    const colors = new Float32Array(position.count * 3);
    for (let index = 0; index < position.count; index++) {
      const height = shoreHeight(position.getX(index), position.getZ(index));
      position.setY(index, height);
      dry.clone().lerp(wet, wetness(height)).toArray(colors, index * 3);
    }
    geometry.setAttribute("color", new BufferAttribute(colors, 3));
    geometry.computeVertexNormals();
    const ground = new Mesh(geometry, new MeshStandardMaterial({ map, vertexColors: true, roughness: 0.95 }));
    ground.receiveShadow = true;
    beach.add(ground);
  }
  const random = sequence(seed + 1);
  const stone = new MeshStandardMaterial({ color: ROCK.color, roughness: 0.9 });
  for (let index = 0; index < rocks; index++) {
    const [x, depth, size] = [(random() - 0.5) * ROCK.spread, SHORE + random() * 3 - 2, 0.4 + random() * 0.9];
    const rock = new Mesh(new DodecahedronGeometry(size, 1), stone);
    rock.position.set(x, shoreHeight(x, depth) - 0.1, depth);
    rock.scale.set(1, ROCK.flat, 1);
    rock.castShadow = true;
    beach.add(rock);
  }
  return beach;
}

export default function Beach({ sand, rocks, seed }: Props) {
  const beach = useMemo(() => buildBeach({ sand, rocks, seed }), [sand, rocks, seed]);
  return <primitive object={beach} />;
}
