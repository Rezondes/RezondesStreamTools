// The physical sky of the realistic Urlaub beach (three.js Sky): the sun at its height for the clock (sun.ts) and the
// azimuth; the sun lights the scene with soft shadows, the sky lights it from above and the sand from below, and the
// sky is the environment for reflections (made again when the sun has moved noticeably). direction is shared with the
// sea, which mirrors the sun.
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { type DirectionalLight, type HemisphereLight, PMREMGenerator, Scene, type Texture, type Vector3 } from "three";
import { Sky as SkyShader } from "three/examples/jsm/objects/Sky.js";
import { skyLight, sunDirection, sunHeight, sunLight, type SunOptions } from "../sun.ts";

export type BeachClock = { time: number };
type Props = { clock: BeachClock; sun: SunOptions; azimuth: number; turbidity: number; shadows: boolean; direction: Vector3 };

// fixed: the sky of the prototype: size, air and haze scattering
const SKY = { scale: 10000, rayleigh: 2.2, mie: 0.006, mieDirection: 0.86 };
// fixed: the sunlight: warm color, strength, distance, shadow map and the box it covers
const LIGHT = { color: "#ffd2a0", strength: 2.6, distance: 120, map: 2048, reach: 40, far: 300 };
// fixed: the sky light from above (blue) and the sand light from below (warm)
const HEMI = { sky: "#bfd8ff", ground: "#d9b98a" };
// fixed: the environment is made again when the sun moved this far (degrees)
const ENV_STEP = 0.6;

export default function Sky({ clock, sun, azimuth, turbidity, shadows, direction }: Props) {
  const gl = useThree(state => state.gl);
  const scene = useThree(state => state.scene);
  const sky = useMemo(() => {
    const shader = new SkyShader();
    shader.scale.setScalar(SKY.scale);
    const uniforms = shader.material.uniforms;
    uniforms.rayleigh.value = SKY.rayleigh;
    uniforms.mieCoefficient.value = SKY.mie;
    uniforms.mieDirectionalG.value = SKY.mieDirection;
    return shader;
  }, []);
  useEffect(() => { sky.material.uniforms.turbidity.value = turbidity; }, [sky, turbidity]);
  const pmrem = useMemo(() => new PMREMGenerator(gl), [gl]);
  const environment = useRef<{ height: number; texture: Texture | null }>({ height: Number.NaN, texture: null });
  useEffect(() => () => {
    environment.current.texture?.dispose();
    pmrem.dispose();
  }, [pmrem]);
  const light = useRef<DirectionalLight>(null);
  const hemi = useRef<HemisphereLight>(null);
  useFrame(() => {
    const height = sunHeight(clock.time, sun);
    direction.set(...sunDirection(height, azimuth));
    (sky.material.uniforms.sunPosition.value as Vector3).copy(direction);
    if (light.current) {
      light.current.position.copy(direction).multiplyScalar(LIGHT.distance);
      light.current.intensity = sunLight(height) * LIGHT.strength;
    }
    if (hemi.current) hemi.current.intensity = skyLight(height);
    if (!(Math.abs(height - environment.current.height) <= ENV_STEP)) {
      environment.current.texture?.dispose();
      const holder = new Scene();
      holder.add(sky.clone());
      environment.current = { height, texture: pmrem.fromScene(holder).texture };
      scene.environment = environment.current.texture;
    }
  });
  return (
    <>
      <primitive object={sky} />
      <directionalLight
        ref={light} color={LIGHT.color} castShadow={shadows} shadow-mapSize={[LIGHT.map, LIGHT.map]}
        shadow-camera-left={-LIGHT.reach} shadow-camera-right={LIGHT.reach} shadow-camera-top={LIGHT.reach} shadow-camera-bottom={-LIGHT.reach} shadow-camera-far={LIGHT.far}
      />
      <hemisphereLight ref={hemi} args={[HEMI.sky, HEMI.ground]} />
    </>
  );
}
