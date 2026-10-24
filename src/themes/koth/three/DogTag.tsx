// Dog tag of the KOTH alert on a transparent orthographic stage (one unit is one stage pixel): a metal plate with a
// rolled rim and the stamped lines as a bump map, hanging from a ball chain; it drops in, swings like a pendulum and
// turns slowly in a moving light (pose from swingAt in dogtag.ts). The room light gives the metal its reflections.
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CanvasTexture, type DirectionalLight, ExtrudeGeometry, type Group, type Mesh, Path, PMREMGenerator, Shape, SRGBColorSpace, Vector2,
} from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { STAGE } from "../../../core/screens/screens.ts";
import type { KothClock } from "../build.ts";
import { DOGTAG, dogtagShape, stampRows } from "../dogtag.ts";

type Pose = { drop: number; angle: number };
type Props = { clock: KothClock; pose: (time: number) => Pose; at: { x: number; y: number }; scale: number; lines: readonly string[]; metal: string };

// fixed: plate, stamp and chain of the prototype (refs/alert.html), in stage px; room is the width inside the rim, a
// wider line goes onto two rows (stampRows in dogtag.ts)
const EXTRUDE = { depth: 8, bevelEnabled: true, bevelThickness: 4, bevelSize: 5, bevelSegments: 4, curveSegments: 18 };
const STAMP = { width: 300, height: 480, size: 40, family: '"Share Tech Mono"', first: 170, line: 54, shift: 2, bump: 4, room: 236 };
const fontOf = (size: number) => `400 ${size}px ${STAMP.family}`;
// fixed: the stamp is a gray card with light edges and dark letters, read as pressed into the metal
const STAMP_COLORS = { base: "#8a8f94", light: "#e6e9ec", dark: "#2a2d30" };
const CHAIN = { beads: 46, step: 13, radius: 5 };
// fixed: how far above the picture the tag waits, how it turns, the light that sweeps over it
const DROP = 720;
const TURN = { speed: 1.7, swing: 0.35, settle: 4, rest: 0.18 };
const KEY = { x: -400, sweep: 500, speed: 0.8, strength: 2, ambient: 0.4, room: 0.04 };
// fixed: warm white of the key light
const KEY_COLOR = "#fff0d8";

function plate() {
  const { outline, hole } = dogtagShape();
  const shape = new Shape(outline.map(([x, y]) => new Vector2(x, y)));
  shape.holes.push(new Path(hole.map(([x, y]) => new Vector2(x, y))));
  const geometry = new ExtrudeGeometry(shape, EXTRUDE);
  geometry.translate(0, 0, -EXTRUDE.depth);
  // planar UVs, so the stamp lies flat on the plate (the canvas runs down, the plate up)
  const uv = geometry.attributes.uv;
  const position = geometry.attributes.position;
  for (let index = 0; index < uv.count; index++) {
    uv.setXY(index, (position.getX(index) + DOGTAG.width / 2) / DOGTAG.width, (position.getY(index) + DOGTAG.height / 2) / DOGTAG.height);
  }
  return geometry;
}

function stamp(lines: readonly string[]) {
  const canvas = document.createElement("canvas");
  canvas.width = STAMP.width;
  canvas.height = STAMP.height;
  const paint = canvas.getContext("2d")!;
  paint.fillStyle = STAMP_COLORS.base;
  paint.fillRect(0, 0, STAMP.width, STAMP.height);
  paint.textAlign = "center";
  const widthOf = (text: string, size: number) => {
    paint.font = fontOf(size);
    return paint.measureText(text).width;
  };
  stampRows(lines, widthOf, STAMP.room, STAMP).forEach(({ text, size, y }) => {
    paint.font = fontOf(size);
    paint.fillStyle = STAMP_COLORS.light;
    paint.fillText(text, STAMP.width / 2 + STAMP.shift, y + STAMP.shift);
    paint.fillStyle = STAMP_COLORS.dark;
    paint.fillText(text, STAMP.width / 2, y);
  });
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

// Reflections of a soft room for the metal, freed with the stage
function Room() {
  const renderer = useThree(state => state.gl);
  const scene = useThree(state => state.scene);
  useEffect(() => {
    const generator = new PMREMGenerator(renderer);
    const room = generator.fromScene(new RoomEnvironment(), KEY.room).texture;
    scene.environment = room;
    return () => { scene.environment = null; room.dispose(); generator.dispose(); };
  }, [renderer, scene]);
  return null;
}

export default function DogTag({ clock, pose, at, scale, lines, metal }: Props) {
  const geometry = useMemo(() => plate(), []);
  const [texture, setTexture] = useState<CanvasTexture | null>(null);
  useEffect(() => {
    let made: CanvasTexture | null = null;
    // the stamp waits for its font, so the letters are not drawn in a fallback font
    void document.fonts.load(fontOf(STAMP.size)).then(() => { made = stamp(lines); setTexture(made); });
    return () => made?.dispose();
  }, [lines]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const rig = useRef<Group>(null);
  const tag = useRef<Mesh>(null);
  const key = useRef<DirectionalLight>(null);

  useFrame(() => {
    const time = clock.time;
    const { drop, angle } = pose(time);
    const holeY = at.y - DOGTAG.holeY * scale;
    rig.current?.position.set(at.x - STAGE.width / 2, STAGE.height / 2 - holeY + (1 - drop) * DROP, 0);
    rig.current?.rotation.set(0, 0, angle / 2);
    tag.current?.rotation.set(0, Math.sin(time * TURN.speed) * TURN.swing * (1 - Math.min(1, time / TURN.settle)) + TURN.rest, 0);
    key.current?.position.set(KEY.x + Math.sin(time * KEY.speed) * KEY.sweep, 300, 800);
  });

  return (
    <>
      <Room />
      <directionalLight ref={key} color={KEY_COLOR} intensity={KEY.strength} position={[KEY.x, 300, 800]} />
      <ambientLight intensity={KEY.ambient} />
      <group ref={rig} scale={scale}>
        <mesh ref={tag} geometry={geometry} position={[0, -DOGTAG.holeY, 0]}>
          {/* a new material once the stamp is drawn: three builds its shader with or without a map */}
          <meshStandardMaterial key={texture ? "stamped" : "plain"} color={metal} metalness={0.9} roughness={0.3} map={texture} bumpMap={texture} bumpScale={STAMP.bump} />
        </mesh>
        {Array.from({ length: CHAIN.beads }, (_, bead) => (
          <mesh key={bead} position={[0, bead * CHAIN.step, 0]}>
            <sphereGeometry args={[CHAIN.radius, 12, 10]} />
            <meshStandardMaterial color={metal} metalness={1} roughness={0.3} />
          </mesh>
        ))}
      </group>
    </>
  );
}
