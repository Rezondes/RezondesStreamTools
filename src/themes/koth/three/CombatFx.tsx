// Fight effects of a KOTH soldier in 3D, in units of the figure height: the muzzle flash at the front of the weapon while
// it fires (the grenadier: a growing blast), and the dust cloud when the soldier is hit (from an explosion with a fire
// ball), every puff placed from the time since the hit (burstAt of the core).
import { useFrame } from "@react-three/fiber";
import { type RefObject, useEffect, useMemo, useRef } from "react";
import { type Mesh, MeshBasicMaterial, type Sprite, SpriteMaterial } from "three";
import { hash } from "../../../core/hash.ts";
import { burstAt } from "../../../core/motion/burst.ts";
import type { Point3 } from "../../../core/three/beam.ts";
import type { FigureRun } from "../../../core/three/PartFigure.tsx";
import { softTexture } from "../../../core/three/softTexture.ts";
import { useKoth } from "../useKoth.ts";

type Run = RefObject<FigureRun>;

// Flash size, its flicker in ms and how many times its size the blast grows to come from the settings, like the number of
// dust puffs. fixed: the dust burst of the prototype in figure heights and s; puffs grow from 0.15 to 0.4
const DUST = { origin: { x: 0, y: 0 }, direction: -Math.PI / 2, spread: Math.PI, speed: [0.4, 1.1] as const, gravity: 1.2, drag: 2.5, life: 0.9 };
const PUFF = { from: 0.15, by: 0.25 };
const FIRE_BALL = 0.5;
const elapsed = (run: FigureRun) => (Date.now() - run.startedAt) / Math.max(1, run.durationMs);

export function MuzzleFlash({ run, at, color, blast }: { run: Run; at: Point3; color: string; blast: boolean }) {
  const look = useMemo(() => new MeshBasicMaterial({ color, transparent: true }), [color]);
  useEffect(() => () => look.dispose(), [look]);
  const flash = useRef<Mesh>(null);
  const { muzzleSize, muzzleFlicker, blastGrow } = useKoth();
  useFrame(() => {
    const mesh = flash.current;
    if (!mesh) return;
    const firing = run.current.animation === "fire";
    const part = Math.min(1, elapsed(run.current));
    mesh.visible = firing && (blast || Math.floor(Date.now() / muzzleFlicker) % 2 === 0);
    mesh.scale.setScalar(blast ? 1 + (blastGrow - 1) * part : 1);
    look.opacity = blast ? 1 - part : 1;
  });
  return <mesh ref={flash} position={[...at]} material={look}><sphereGeometry args={[muzzleSize, 12, 8]} /></mesh>;
}

export function HitDust({ run, seed, colors, blast }: { run: Run; seed: number; colors: { dust: string; fire: string }; blast: boolean }) {
  const texture = useMemo(() => softTexture(), []);
  const dust = useMemo(() => new SpriteMaterial({ map: texture, color: colors.dust, transparent: true, depthWrite: false }), [texture, colors.dust]);
  const fire = useMemo(() => new SpriteMaterial({ map: texture, color: colors.fire, transparent: true, depthWrite: false }), [texture, colors.fire]);
  useEffect(() => () => { texture.dispose(); dust.dispose(); fire.dispose(); }, [texture, dust, fire]);
  const puffs = useRef<(Sprite | null)[]>([]);
  const ball = useRef<Sprite>(null);
  const count = useKoth().blastPuffs;
  useFrame(() => {
    const down = run.current.animation === "down";
    const age = (Date.now() - run.current.startedAt) / 1000;
    const cloud = burstAt(seed, count, down ? age : -1, DUST);
    dust.opacity = cloud[0]?.opacity ?? 0;
    cloud.forEach((puff, index) => {
      const size = (PUFF.from + hash(seed * 31 + index) * PUFF.by) * (1 + age);
      puffs.current[index]?.position.set(puff.x, -puff.y + PUFF.from, 0.2);
      puffs.current[index]?.scale.set(size, size, 1);
    });
    const grown = Math.min(1, age / DUST.life);
    if (ball.current) {
      ball.current.visible = down && blast && grown < 1;
      ball.current.scale.setScalar(FIRE_BALL * (0.3 + grown));
    }
    fire.opacity = 1 - grown;
  });
  return (
    <>
      {Array.from({ length: count }, (_, index) => <sprite key={index} ref={sprite => { puffs.current[index] = sprite; }} material={dust} />)}
      <sprite ref={ball} position={[0, FIRE_BALL / 2, 0.3]} material={fire} />
    </>
  );
}
