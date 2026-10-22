// The PixiJS part of the Plantage alert (refs/alert.html): a glossy mango falls onto the medallion, squashes and springs
// back (mangoDrop.ts), juice drops and leaves burst out on the landing (burstAt of the core), and when the alert leaves
// the mango rolls away. A transparent canvas around the medallion; every frame from the time since the alert began.
import { type Application, Container, Graphics, Sprite, Texture } from "pixi.js";
import { type RefObject, useCallback } from "react";
import { burstAt } from "../../../core/motion/burst.ts";
import { seekFromQuery } from "../../../core/motion/seek.ts";
import PixiStage from "../../../core/pixi/PixiStage.tsx";
import { BURST_CANVAS, mangoDrop, mangoRoll } from "../mangoDrop.ts";
import type { PlantageValues } from "../settings.ts";

type Props = { values: PlantageValues; start: number; leavingAt: RefObject<number | null>; seed: number };

// fixed: the mango rests a little below the middle of the medallion
const REST = 6;
const MANGO = { land: 0.62, height: 430, scale: 0.82, size: [220, 240] as const };
const SHADOW = { y: 78, width: 80, height: 16, alpha: 0.3, from: 0.2 };
// fixed: the bursts of the prototype in px and s; drops leave from the top of the mango, leaves sail down slowly
const DROPS = { origin: { x: 0, y: 18 }, direction: -Math.PI / 2, spread: Math.PI, speed: [150, 530] as const, gravity: 1300, drag: 0, life: 1.1 };
const LEAVES = { origin: { x: 0, y: 8 }, direction: -Math.PI / 2, spread: Math.PI * 0.8, speed: [380, 900] as const, gravity: 180, drag: 2.4, life: 2.4 };
const DROP_SIZE = { min: 3, by: 6 };
const LEAF_SIZE = { length: 22, width: 10 };
const SEEK = seekFromQuery(location.search);

// The glossy mango drawn once on a canvas: light top left, blush towards the bottom right, stem and a leaf
function mangoTexture(values: PlantageValues): Texture {
  const canvas = document.createElement("canvas");
  [canvas.width, canvas.height] = MANGO.size;
  const context = canvas.getContext("2d");
  if (!context) return Texture.WHITE;
  context.save();
  context.translate(110, 132);
  context.rotate(-0.35);
  const body = context.createRadialGradient(-30, -40, 6, 0, 0, 110);
  body.addColorStop(0, values.paper);
  body.addColorStop(0.25, values.mango);
  body.addColorStop(0.62, values.accent);
  body.addColorStop(1, values.mangoBlush);
  context.fillStyle = body;
  context.beginPath();
  context.ellipse(0, 0, 78, 96, 0, 0, Math.PI * 2);
  context.fill();
  context.globalAlpha = 0.75;
  context.fillStyle = values.paper;
  context.beginPath();
  context.ellipse(-30, -48, 16, 24, -0.5, 0, Math.PI * 2);
  context.fill();
  context.restore();
  const leaf = context.createLinearGradient(110, 10, 190, 50);
  leaf.addColorStop(0, values.accent2);
  leaf.addColorStop(1, values.leafDark);
  context.fillStyle = values.trunk;
  context.fillRect(96, 22, 10, 22);
  context.fillStyle = leaf;
  context.beginPath();
  context.moveTo(104, 30);
  context.quadraticCurveTo(150, -6, 196, 30);
  context.quadraticCurveTo(150, 52, 104, 30);
  context.fill();
  return Texture.from(canvas);
}

export default function AlertBurst({ values, start, leavingAt, seed }: Props) {
  const onReady = useCallback((app: Application) => {
    const scene = new Container();
    const shadow = new Graphics().ellipse(0, 0, SHADOW.width, SHADOW.height).fill({ color: values.textOnWood, alpha: SHADOW.alpha });
    shadow.position.set(BURST_CANVAS.x, BURST_CANVAS.y + SHADOW.y);
    const mango = new Sprite(mangoTexture(values));
    mango.anchor.set(0.5, 0.55);
    mango.visible = values.alertMangoOn;
    const leaves = Array.from({ length: values.leafConfetti ? values.leafCount : 0 }, (_, index) =>
      new Graphics().ellipse(0, 0, LEAF_SIZE.length, LEAF_SIZE.width).fill(index % 2 ? values.leaf : values.accent2));
    const drops = new Graphics();
    scene.addChild(shadow, mango, drops, ...leaves);
    app.stage.addChild(scene);
    const dropCount = values.juice ? values.alertSplashDrops : 0;
    const place = () => {
      const seconds = SEEK ?? (performance.now() - start) / 1000;
      const gone = leavingAt.current === null ? -1 : (performance.now() - leavingAt.current) / 1000;
      const fall = mangoDrop(seconds, { land: MANGO.land, squash: values.alertSquash / 100, height: MANGO.height });
      const roll = mangoRoll(gone);
      mango.position.set(BURST_CANVAS.x + roll.x, BURST_CANVAS.y + REST + fall.y + roll.y);
      mango.rotation = fall.rotation + roll.rotation;
      mango.scale.set(MANGO.scale * fall.scaleX, MANGO.scale * fall.scaleY);
      shadow.visible = values.alertMangoOn && seconds > SHADOW.from && gone < 0;
      shadow.scale.set(Math.min(1, Math.max(0.2, 1 + fall.y / MANGO.height)));
      const since = seconds - MANGO.land;
      drops.clear();
      burstAt(seed, dropCount, since, DROPS).forEach((drop, index) => {
        const size = (DROP_SIZE.min + ((index * 37) % 10) / 10 * DROP_SIZE.by) * (1 - Math.min(1, Math.max(0, since) / DROPS.life));
        drops.circle(BURST_CANVAS.x + drop.x, BURST_CANVAS.y + drop.y, size).fill({ color: index % 3 ? values.mango : values.mangoBlush, alpha: drop.opacity });
      });
      burstAt(seed + 1, leaves.length, since, LEAVES).forEach((spot, index) => {
        leaves[index].position.set(BURST_CANVAS.x + spot.x, BURST_CANVAS.y + spot.y);
        leaves[index].rotation = spot.angle;
        leaves[index].alpha = spot.opacity;
      });
    };
    place();
    app.ticker.add(place);
    return () => app.ticker.remove(place);
  }, [values, start, leavingAt, seed]);
  return <PixiStage background={null} onReady={onReady} className="pl-alert-burst" size={BURST_CANVAS} />;
}
