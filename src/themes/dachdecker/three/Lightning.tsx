// Lightning of the Dachdecker BRB scene (DESIGN-DACHDECKER.md "Regen"): a jagged white line far behind the house, a
// flash light on the roof and a short brightening of the sky, all from the bolt timing in rain.ts. The sky moves at most
// a small share towards the line color times the strength, so a flash never turns the picture white.
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { BufferGeometry, Color, type DirectionalLight, Line, LineBasicMaterial, Vector3 } from "three";
import { boltAt, boltPoints, flashLevel } from "../rain.ts";
import type { BuildClock } from "../schedule.ts";

// flashLight: light of the flash on the roof, skyFlash: share of the sky that brightens at full strength (settings)
type Props = { clock: BuildClock; every: number; strength: number; seed: number; line: string; sky: string; flashLight: number; skyFlash: number };

const FLASH_AT = [8, 14, -10] as const;

export default function Lightning({ clock, every, strength, seed, line, sky, flashLight, skyFlash }: Props) {
  const geometry = useMemo(() => new BufferGeometry(), []);
  const material = useMemo(() => new LineBasicMaterial({ color: line, transparent: true, opacity: 0, fog: false }), [line]);
  useEffect(() => () => { geometry.dispose(); material.dispose(); }, [geometry, material]);
  // A Line object: in JSX <line> is the SVG element
  const bolt = useMemo(() => Object.assign(new Line(geometry, material), { frustumCulled: false }), [geometry, material]);
  const colors = useMemo(() => ({ sky: new Color(sky), line: new Color(line) }), [sky, line]);
  const flash = useRef<DirectionalLight>(null);
  const shown = useRef(-1);

  useFrame(({ scene }) => {
    const current = boltAt(clock.time, every);
    const level = current ? flashLevel(current.age) * strength : 0;
    if (current && current.index !== shown.current) {
      geometry.setFromPoints(boltPoints(seed, current.index).map(point => new Vector3(...point)));
      shown.current = current.index;
    }
    material.opacity = Math.min(1, level * 2);
    if (flash.current) flash.current.intensity = level * flashLight;
    if (scene.background instanceof Color) scene.background.copy(colors.sky).lerp(colors.line, level * skyFlash);
  });

  return (
    <>
      <primitive object={bolt} />
      <directionalLight ref={flash} position={FLASH_AT} intensity={0} color={line} />
    </>
  );
}
