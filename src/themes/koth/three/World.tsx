// 3D world of the KOTH Starting (DESIGN-KOTH.md "Modernisierung"): evening sky as a gradient, fog in the horizon color
// for the air perspective, a low sun with its disc, soft shadows, the far mountains and dust in the light; on the ground
// the hill with camp, mast and flag, smoke columns at its foot, a helicopter far off and the camera ride. Memoized, so
// the 2D layer can render often without touching the canvas.
import { useFrame, useThree } from "@react-three/fiber";
import { memo, useEffect, useMemo, useRef } from "react";
import { BufferGeometry, CanvasTexture, Color, Float32BufferAttribute, type Mesh, SRGBColorSpace } from "three";
import { chance } from "../../../core/three/chance.ts";
import { particleCount } from "../../../core/three/quality.ts";
import Stage3D from "../../../core/three/Stage3D.tsx";
import type { KothClock, Steps } from "../build.ts";
import { campLayout } from "../camp.ts";
import type { KothValues } from "../settings.ts";
import { TEAM_SET } from "../settings.ts";
import { hillHeight, mountainRing } from "../terrain.ts";
import { teamColor } from "../useKoth.ts";
import Camp, { type CampColors } from "./Camp.tsx";
import Flag from "./Flag.tsx";
import Helicopter from "./Helicopter.tsx";
import HillCamera from "./HillCamera.tsx";
import Mast from "./Mast.tsx";
import Smoke from "./Smoke.tsx";
import Terrain from "./Terrain.tsx";

type Props = { values: KothValues; clock: KothClock; steps: Steps };

// fixed: look of the prototype (refs/starting.html): field of view, far plane, sun, light strengths, bloom shape
const FOV = 34;
const FAR = 400;
const SUN = { position: [-30, 22, 18] as const, strength: 2.6, disc: [-150, 9, -190] as const, discSize: 9, map: { hoch: 2048, other: 1024 }, reach: 26, far: 120 };
const HEMISPHERE = 1.1;
const BLOOM = { radius: 0.5, threshold: 0.82 };
// Sky gradient: share of the horizon color at the stops from the top; fog and light mixes
const SKY_STOPS = [[0, 0], [0.45, 0.6], [0.72, 0.85], [1, 1]] as const;
const FOG_MIX = 0.8;
const DUST = { spread: 40, height: 10, rise: 0.15, sway: 0.4, swaySpeed: 0.3, size: 0.08, opacity: 0.7 };
// fixed: white to brighten the sun disc and the dust
const WHITE = "#ffffff";

const mix = (one: string, two: string, share: number) => `#${new Color(one).lerp(new Color(two), share).getHexString()}`;
const darker = (color: string, share: number) => `#${new Color(color).multiplyScalar(share).getHexString()}`;

// The evening sky as the background of the scene
function Sky({ top, horizon }: { top: string; horizon: string }) {
  const scene = useThree(state => state.scene);
  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 4;
    canvas.height = 512;
    const paint = canvas.getContext("2d")!;
    const fade = paint.createLinearGradient(0, 0, 0, canvas.height);
    for (const [stop, share] of SKY_STOPS) fade.addColorStop(stop, mix(top, horizon, share));
    paint.fillStyle = fade;
    paint.fillRect(0, 0, canvas.width, canvas.height);
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    scene.background = texture;
    return () => texture.dispose();
  }, [scene, top, horizon]);
  return null;
}

function Dust({ clock, count, seed, color }: { clock: KothClock; count: number; seed: number; color: string }) {
  const base = useMemo(() => {
    const random = chance(seed);
    return Array.from({ length: count * 3 }, (_, index) => (index % 3 === 1 ? random.between(0, DUST.height) : random.between(-DUST.spread / 2, DUST.spread / 2)));
  }, [count, seed]);
  const geometry = useMemo(() => new BufferGeometry().setAttribute("position", new Float32BufferAttribute(base, 3)), [base]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame(() => {
    const position = geometry.attributes.position;
    for (let grain = 0; grain < count; grain++) {
      position.setX(grain, base[grain * 3] + Math.sin(clock.time * DUST.swaySpeed + grain) * DUST.sway);
      position.setY(grain, (base[grain * 3 + 1] + clock.time * DUST.rise) % DUST.height);
    }
    position.needsUpdate = true;
  });
  return <points geometry={geometry}><pointsMaterial color={color} size={DUST.size} transparent opacity={DUST.opacity} /></points>;
}

function Lights({ values }: { values: KothValues }) {
  const disc = useRef<Mesh>(null);
  useEffect(() => disc.current?.lookAt(0, 0, 0), []);
  const map = values.quality === "hoch" ? SUN.map.hoch : SUN.map.other;
  return (
    <>
      <hemisphereLight args={[mix(values.skyHorizon, values.sunColor, 0.5), darker(values.hillDark, 0.6), HEMISPHERE]} />
      <directionalLight
        position={SUN.position} color={values.sunColor} intensity={SUN.strength} castShadow
        shadow-mapSize={[map, map]} shadow-camera-left={-SUN.reach} shadow-camera-right={SUN.reach} shadow-camera-top={SUN.reach} shadow-camera-bottom={-SUN.reach} shadow-camera-far={SUN.far}
      />
      <mesh ref={disc} position={SUN.disc}>
        <circleGeometry args={[SUN.discSize, 40]} />
        <meshBasicMaterial color={mix(values.sunColor, WHITE, 0.25)} fog={false} />
      </mesh>
    </>
  );
}

function Mountains({ seed, color }: { seed: number; color: string }) {
  const ring = useMemo(() => mountainRing(seed), [seed]);
  return (
    <>
      {ring.map((mountain, index) => (
        <mesh key={index} position={[mountain.x, mountain.height / 2 - 2, mountain.z]} rotation={[0, mountain.turn, 0]}>
          <coneGeometry args={[mountain.radius, mountain.height, mountain.sides]} />
          <meshStandardMaterial color={color} flatShading roughness={1} />
        </mesh>
      ))}
    </>
  );
}

const campColors = (values: KothValues): CampColors => ({
  bag: values.sand, concrete: values.sandDark, tent: values.olive, crate: values.olive, crateLight: values.hillColor, edge: values.sand,
  wood: darker(values.sandDark, 0.5), pine: values.hillDark, rock: values.mountainColor, jeep: values.olive, jeepCab: values.oliveDark,
  steel: values.steel, dark: darker(values.oliveDark, 0.6),
});

export default memo(function World({ values, clock, steps }: Props) {
  const ground = useMemo(() => (x: number, depth: number) => hillHeight(x, depth, values.hillHeight), [values.hillHeight]);
  const items = useMemo(() => campLayout({
    seed: values.worldSeed, hillHeight: values.hillHeight, sandbags: values.sandbags, bunker: values.bunkerOn, tents: values.tents, crateStacks: values.crateStacks,
    fence: values.fenceOn, trees: values.trees, rocks: values.rocks, jeep: values.jeepOn, markerFlags: values.markerFlagsOn,
  }), [values]);
  const colors = useMemo(() => campColors(values), [values]);
  const groundColors = useMemo(() => ({ sand: values.sandColor, hill: values.hillColor, shade: values.hillDark }), [values.sandColor, values.hillColor, values.hillDark]);
  const markers = TEAM_SET.variants.filter(team => team.id !== values.flagFaction).map(team => teamColor(values, team.id));
  const camera = useMemo(() => ({ intro: values.cameraIntro, radius: values.cameraRadius, height: values.cameraHeight, speed: values.cameraSpeed, top: values.hillHeight }), [values]);
  const pole = items.find(item => item.kind === "pole")!;
  return (
    <Stage3D
      background={values.skyHorizon} fog={{ color: mix(values.skyTop, values.skyHorizon, FOG_MIX), near: values.fogNear, far: values.fogFar }}
      bloom={{ strength: values.bloomStrength, ...BLOOM }} level={values.quality} fov={FOV} far={FAR} shadows={values.shadows}
    >
      <Sky top={values.skyTop} horizon={values.skyHorizon} />
      <Lights values={values} />
      {values.mountains && <Mountains seed={values.worldSeed} color={values.mountainColor} />}
      <Terrain clock={clock} step={steps.ground} height={values.hillHeight} seed={values.worldSeed} colors={groundColors}>
        <Camp items={items} clock={clock} steps={steps} colors={colors} markers={markers} />
        {values.tower && (
          <Mast
            clock={clock} steps={steps} base={values.hillHeight} height={values.mastHeight} wires={values.mastWires} dish={values.mastDish}
            beacon={{ color: values.towerBlink, every: values.beaconEvery }} steel={values.steel} ground={ground}
          />
        )}
        <Flag clock={clock} step={steps.flag} base={pole.y} size={values.flagSize} wind={values.flagWind} color={teamColor(values, values.flagFaction)} symbol={values.textColor} steel={values.steel} />
      </Terrain>
      {values.smoke && (
        <Smoke clock={clock} step={steps.smoke} columns={values.smokeColumns} amount={particleCount(values.smokeAmount, values.quality)} color={values.smokeColor} seed={values.worldSeed} ground={ground} />
      )}
      {values.dust && values.dustAmount > 0 && <Dust clock={clock} count={particleCount(values.dustAmount, values.quality)} seed={values.worldSeed + 1} color={mix(values.sunColor, WHITE, 0.3)} />}
      {values.helicopterOn && <Helicopter clock={clock} color={values.oliveDark} />}
      <HillCamera clock={clock} options={camera} />
    </Stage3D>
  );
});
