// The physical sky of the realistic Urlaub beach (three.js Sky): the sun at its height for the clock (heightAt, sun.ts) and the
// azimuth; the sun lights the scene with soft shadows, the sky lights it from above and the sand from below, and the
// sky is the environment for reflections (made again when the sun has moved noticeably). direction is shared with the
// sea, which mirrors the sun. The exposure follows the height of the sun (sun.ts). buildSky is plain three.js, so the
// banners (bannerWorld.ts) build the same sky and light.
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { DirectionalLight, HemisphereLight, PMREMGenerator, Scene, type Texture, type Vector3 } from "three";
import { Sky as SkyShader } from "three/examples/jsm/objects/Sky.js";
import { exposureFactor, skyLight, sunDirection, sunLight } from "../sun.ts";

export type BeachClock = { time: number };
type Props = { clock: BeachClock; heightAt: (seconds: number) => number; azimuth: number; turbidity: number; exposure: number; shadows: boolean; direction: Vector3 };

// fixed: the sky of the prototype: size, air and haze scattering
const SKY = { scale: 10000, rayleigh: 2.2, mie: 0.006, mieDirection: 0.86 };
// fixed: the sunlight: warm color, strength, distance, shadow map and the box it covers
const LIGHT = { color: "#ffd2a0", strength: 2.6, distance: 120, map: 2048, reach: 40, far: 300 };
// fixed: the sky light from above (blue) and the sand light from below (warm)
const HEMI = { sky: "#bfd8ff", ground: "#d9b98a" };
// fixed: the environment is made again when the sun moved this far (degrees)
const ENV_STEP = 0.6;

// The sky dome, the sunlight and the sky light; aim(height, azimuth, direction) puts the sun at its height
export function buildSky(turbidity: number, shadows: boolean) {
  const sky = new SkyShader();
  sky.scale.setScalar(SKY.scale);
  const uniforms = sky.material.uniforms;
  uniforms.rayleigh.value = SKY.rayleigh;
  uniforms.mieCoefficient.value = SKY.mie;
  uniforms.mieDirectionalG.value = SKY.mieDirection;
  uniforms.turbidity.value = turbidity;
  const sun = new DirectionalLight(LIGHT.color);
  sun.castShadow = shadows;
  sun.shadow.mapSize.set(LIGHT.map, LIGHT.map);
  Object.assign(sun.shadow.camera, { left: -LIGHT.reach, right: LIGHT.reach, top: LIGHT.reach, bottom: -LIGHT.reach, far: LIGHT.far });
  const hemi = new HemisphereLight(HEMI.sky, HEMI.ground);
  return {
    sky, sun, hemi,
    aim: (height: number, azimuth: number, direction: Vector3) => {
      direction.set(...sunDirection(height, azimuth));
      (uniforms.sunPosition.value as Vector3).copy(direction);
      sun.position.copy(direction).multiplyScalar(LIGHT.distance);
      sun.intensity = sunLight(height) * LIGHT.strength;
      hemi.intensity = skyLight(height);
    },
  };
}

export default function Sky({ clock, heightAt, azimuth, turbidity, exposure, shadows, direction }: Props) {
  const gl = useThree(state => state.gl);
  const scene = useThree(state => state.scene);
  const built = useMemo(() => buildSky(turbidity, shadows), [turbidity, shadows]);
  const pmrem = useMemo(() => new PMREMGenerator(gl), [gl]);
  const environment = useRef<{ height: number; texture: Texture | null }>({ height: Number.NaN, texture: null });
  useEffect(() => () => {
    environment.current.texture?.dispose();
    pmrem.dispose();
  }, [pmrem]);
  useFrame(() => {
    const height = heightAt(clock.time);
    // The exposure follows the sun, so noon is not blown out and the dusk not black
    gl.toneMappingExposure = exposure * exposureFactor(height);
    built.aim(height, azimuth, direction);
    if (!(Math.abs(height - environment.current.height) <= ENV_STEP)) {
      environment.current.texture?.dispose();
      const holder = new Scene();
      holder.add(built.sky.clone());
      environment.current = { height, texture: pmrem.fromScene(holder).texture };
      scene.environment = environment.current.texture;
    }
  });
  return (
    <>
      <primitive object={built.sky} />
      <primitive object={built.sun} />
      <primitive object={built.hemi} />
    </>
  );
}
