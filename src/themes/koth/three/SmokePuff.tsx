// Smoke burst behind the KOTH dog tag when the radio opens: soft clouds fly out, rise a little, grow and fade, every one
// placed from the time since the burst (burstAt of the core).
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { type Sprite, SpriteMaterial } from "three";
import { hash } from "../../../core/hash.ts";
import { burstAt } from "../../../core/motion/burst.ts";
import { STAGE } from "../../../core/screens/screens.ts";
import { softTexture } from "../../../core/three/softTexture.ts";
import type { KothClock } from "../build.ts";

type Props = { clock: KothClock; start: number; at: { x: number; y: number }; scale: number; seed: number; colors: readonly [string, string] };

// fixed: the burst of the prototype (refs/alert.html) in stage px and s; gravity below 0 lets the smoke rise
const PUFFS = 26;
const BURST = { origin: { x: 0, y: 0 }, direction: -Math.PI / 2, spread: Math.PI * 2, speed: [120, 380] as const, gravity: -60, drag: 1.5, life: 1.8 };
const SIZE = { from: 70, by: 120, grow: 0.4 };
const OPACITY = 0.7;
const BEHIND = -200;

export default function SmokePuff({ clock, start, at, scale, seed, colors }: Props) {
  const texture = useMemo(() => softTexture(), []);
  const looks = useMemo(() => Array.from({ length: PUFFS }, (_, puff) =>
    new SpriteMaterial({ map: texture, color: colors[puff % 2], transparent: true, opacity: 0, depthWrite: false })), [texture, colors]);
  useEffect(() => () => { texture.dispose(); looks.forEach(look => look.dispose()); }, [texture, looks]);
  const sprites = useRef<(Sprite | null)[]>([]);

  useFrame(() => {
    const age = clock.time - start;
    const grown = Math.min(1, Math.max(0, age / BURST.life));
    burstAt(seed, PUFFS, age, BURST).forEach((cloud, puff) => {
      looks[puff].opacity = cloud.opacity * OPACITY * (1 - grown);
      const size = (SIZE.from + hash(seed * 17 + puff) * SIZE.by) * (SIZE.grow + grown) * scale;
      sprites.current[puff]?.position.set(at.x - STAGE.width / 2 + cloud.x * scale, STAGE.height / 2 - at.y - cloud.y * scale, BEHIND);
      sprites.current[puff]?.scale.set(size, size, 1);
    });
  });

  return <>{looks.map((look, puff) => <sprite key={puff} ref={sprite => { sprites.current[puff] = sprite; }} material={look} />)}</>;
}
