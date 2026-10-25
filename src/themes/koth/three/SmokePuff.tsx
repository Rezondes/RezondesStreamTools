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
import { useKoth } from "../useKoth.ts";

type Props = { clock: KothClock; start: number; at: { x: number; y: number }; scale: number; seed: number; colors: readonly [string, string] };

// fixed: the burst flies out all around and brakes, a cloud starts at this share of its size, behind the tag; count,
// speed, rise, life, size and opacity come from the settings (stage px and s, a rise lets the smoke go up)
const BURST = { origin: { x: 0, y: 0 }, direction: -Math.PI / 2, spread: Math.PI * 2, drag: 1.5 };
const GROW = 0.4;
const BEHIND = -200;

export default function SmokePuff({ clock, start, at, scale, seed, colors }: Props) {
  const values = useKoth();
  const puffs = values.alertSmokePuffs;
  const burst = { ...BURST, speed: [values.alertSmokeSpeedMin, values.alertSmokeSpeedMax] as const, gravity: -values.alertSmokeRise, life: values.alertSmokeLife };
  const texture = useMemo(() => softTexture(), []);
  const looks = useMemo(() => Array.from({ length: puffs }, (_, puff) =>
    new SpriteMaterial({ map: texture, color: colors[puff % 2], transparent: true, opacity: 0, depthWrite: false })), [texture, colors, puffs]);
  useEffect(() => () => { texture.dispose(); looks.forEach(look => look.dispose()); }, [texture, looks]);
  const sprites = useRef<(Sprite | null)[]>([]);

  useFrame(() => {
    const age = clock.time - start;
    const grown = Math.min(1, Math.max(0, age / burst.life));
    burstAt(seed, puffs, age, burst).forEach((cloud, puff) => {
      looks[puff].opacity = cloud.opacity * values.alertSmokeOpacity * (1 - grown);
      const size = (values.alertSmokeSize + hash(seed * 17 + puff) * values.alertSmokeSizeRange) * (GROW + grown) * scale;
      sprites.current[puff]?.position.set(at.x - STAGE.width / 2 + cloud.x * scale, STAGE.height / 2 - at.y - cloud.y * scale, BEHIND);
      sprites.current[puff]?.scale.set(size, size, 1);
    });
  });

  return <>{looks.map((look, puff) => <sprite key={puff} ref={sprite => { sprites.current[puff] = sprite; }} material={look} />)}</>;
}
