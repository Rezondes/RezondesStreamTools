// Rain of the Dachdecker BRB scene in 3D (DESIGN-DACHDECKER.md "Regen"): thousands of short cyan streaks in one line
// buffer and their splashes as points, stepped every frame by the time that passed on the clock of the scene (rain.ts),
// with the wind of the gusts. The streak of a drop points along its speed, bounced drops leave short ones.
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { BufferAttribute, BufferGeometry } from "three";
import { chance } from "../../../core/three/chance.ts";
import { createRain, FALL, gust, type Roof, stepRain } from "../rain.ts";
import type { BuildClock } from "../schedule.ts";

type Props = {
  clock: BuildClock; roof: Roof; count: number; speed: number; length: number; opacity: number; color: string; splashColor: string;
  splashes: boolean; splashAmount: number; ground: boolean; windMax: number; windEvery: number; seed: number;
};

// A frame never steps more than this (after a hidden tab), splashes as small dots
const MAX_STEP = 0.05;
const SPLASH_SIZE = 0.06;
const SPLASH_OPACITY = 0.95;
// Splash buffer per drop
const SPLASH_SHARE = 0.9;

export default function Rain(props: Props) {
  const { clock, roof, count, speed, length, opacity, color, splashColor, splashes, splashAmount, ground, windMax, windEvery, seed } = props;
  const random = useMemo(() => chance(seed).next, [seed]);
  const rain = useMemo(() => createRain(count, splashes ? Math.round(count * SPLASH_SHARE) : 0, random, speed), [count, splashes, random, speed]);
  const streaks = useMemo(() => {
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(new Float32Array(count * 6), 3));
    return geometry;
  }, [count]);
  const dots = useMemo(() => {
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(new Float32Array(rain.splash.life.length * 3), 3));
    return geometry;
  }, [rain]);
  useEffect(() => () => { streaks.dispose(); dots.dispose(); }, [streaks, dots]);
  const last = useRef<number | null>(null);

  useFrame(() => {
    const time = clock.time;
    const dt = last.current === null ? 0 : Math.min(MAX_STEP, Math.max(0, time - last.current));
    last.current = time;
    stepRain(rain, dt, { roof, speed, wind: gust(time, windEvery, windMax, seed), splashes: splashAmount, ground }, random);
    const lines = streaks.getAttribute("position").array as Float32Array;
    const stretch = length / ((FALL.min + FALL.max) / 2);
    for (let index = 0; index < count; index++) {
      const offset = index * 6;
      lines[offset] = rain.x[index];
      lines[offset + 1] = rain.y[index];
      lines[offset + 2] = rain.z[index];
      lines[offset + 3] = rain.x[index] - rain.vx[index] * stretch;
      lines[offset + 4] = rain.y[index] - rain.vy[index] * stretch;
      lines[offset + 5] = rain.z[index] - rain.vz[index] * stretch;
    }
    streaks.getAttribute("position").needsUpdate = true;
    const points = dots.getAttribute("position").array as Float32Array;
    for (let index = 0; index < rain.splash.life.length; index++) {
      points[index * 3] = rain.splash.x[index];
      points[index * 3 + 1] = rain.splash.y[index];
      points[index * 3 + 2] = rain.splash.z[index];
    }
    dots.getAttribute("position").needsUpdate = true;
  });

  return (
    <>
      <lineSegments geometry={streaks} frustumCulled={false}>
        <lineBasicMaterial color={color} transparent opacity={opacity} />
      </lineSegments>
      {splashes && (
        <points geometry={dots} frustumCulled={false}>
          <pointsMaterial color={splashColor} size={SPLASH_SIZE} transparent opacity={SPLASH_OPACITY} />
        </points>
      )}
    </>
  );
}
