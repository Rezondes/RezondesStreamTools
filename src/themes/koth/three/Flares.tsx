// Flares over the KOTH hill in the Ending: rockets and their sparks in the faction colors from flaresAt (flares.ts), one
// point cloud of soft round dots with additive light, brightened so the bloom catches them; a spark fades by darkening
// its color. Optional hiss at every launch.
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { AdditiveBlending, BufferGeometry, Color, Float32BufferAttribute } from "three";
import { softTexture } from "../../../core/three/softTexture.ts";
import type { KothClock } from "../build.ts";
import { FLARE_LIFE, flaresAt } from "../flares.ts";
import { playFlare } from "../tones.ts";
import { useKoth } from "../useKoth.ts";

type Props = { clock: KothClock; start: number; seed: number; every: number; sparks: number; colors: readonly string[]; sound: boolean };

// fixed: white that brightens the sparks
const WHITE = "#ffffff";

export default function Flares({ clock, start, seed, every, sparks, colors, sound }: Props) {
  // size of a spark and of a rocket in m, how much white brightens the faction colors (settings)
  const { flareSize, flareGlow } = useKoth();
  const alive = Math.ceil(FLARE_LIFE / every) + 1;
  const points = alive * (sparks + 1);
  const tints = useMemo(() => colors.map(color => new Color(color).lerp(new Color(WHITE), flareGlow)), [colors, flareGlow]);
  const texture = useMemo(() => softTexture(), []);
  useEffect(() => () => texture.dispose(), [texture]);
  const geometry = useMemo(() => new BufferGeometry()
    .setAttribute("position", new Float32BufferAttribute(new Float32Array(points * 3), 3))
    .setAttribute("color", new Float32BufferAttribute(new Float32Array(points * 3), 3)), [points]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const launched = useRef(-1);

  useFrame(() => {
    const flares = flaresAt(seed, clock.time - start, { every, sparks, colors: tints.length });
    const position = geometry.attributes.position;
    const color = geometry.attributes.color;
    let point = 0;
    const put = (at: readonly number[], tint: Color, light: number) => {
      position.setXYZ(point, at[0], at[1], at[2]);
      color.setXYZ(point, tint.r * light, tint.g * light, tint.b * light);
      point++;
    };
    for (const flare of flares) {
      if (flare.rocket) put(flare.rocket, tints[flare.color], 1);
      for (const spark of flare.sparks) put(spark.position, tints[flare.color], spark.opacity);
    }
    for (; point < points; point++) color.setXYZ(point, 0, 0, 0);
    position.needsUpdate = true;
    color.needsUpdate = true;
    const newest = flares.at(-1)?.index ?? -1;
    if (sound && newest > launched.current) playFlare();
    launched.current = Math.max(launched.current, newest);
  });

  return <points geometry={geometry}><pointsMaterial map={texture} vertexColors size={flareSize} transparent blending={AdditiveBlending} depthWrite={false} /></points>;
}
