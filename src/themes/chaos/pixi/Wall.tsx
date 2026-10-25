// The wall of the Chaos screens in PixiJS (PLAN-CHAOS.md package 6): radial light in the middle fading into the ground,
// soft violet blotches and fine grain, painted once on a canvas texture from the seed (wall.ts); it does not move.
import { type Container, Sprite, Texture } from "pixi.js";
import { useEffect } from "react";
import { STAGE } from "../../../core/screens/screens.ts";
import { chance } from "../chance.ts";
import type { ChaosValues } from "../settings.ts";
import { blotches } from "../wall.ts";

type Props = { world: Container; values: ChaosValues; seed: number };

function paint(values: ChaosValues, seed: number, grain: boolean): Texture {
  const canvas = document.createElement("canvas");
  [canvas.width, canvas.height] = [STAGE.width, STAGE.height];
  const context = canvas.getContext("2d");
  if (!context) return Texture.EMPTY;
  if (grain) {
    const random = chance(seed);
    const image = context.createImageData(STAGE.width, STAGE.height);
    for (let index = 0; index < image.data.length; index += 4) {
      const value = random() * 255;
      image.data.set([value, value, value, values.wallGrain], index);
    }
    context.putImageData(image, 0, 0);
    return Texture.from(canvas);
  }
  const light = context.createRadialGradient(STAGE.width / 2, STAGE.height / 2, 60, STAGE.width / 2, STAGE.height / 2, STAGE.width * 0.57);
  light.addColorStop(0, values.wall);
  light.addColorStop(1, values.ground);
  context.fillStyle = light;
  context.fillRect(0, 0, STAGE.width, STAGE.height);
  for (const stain of blotches(seed, values.wallBlotches)) {
    const radius = Math.max(stain.radiusX, stain.radiusY);
    const fill = context.createRadialGradient(stain.x, stain.y, 0, stain.x, stain.y, radius);
    fill.addColorStop(0, values.violet);
    fill.addColorStop(1, `${values.violet}00`);
    context.globalAlpha = stain.opacity;
    context.fillStyle = fill;
    context.fillRect(stain.x - radius, stain.y - radius, radius * 2, radius * 2);
  }
  return Texture.from(canvas);
}

// The grain lies over everything else of the world (zIndex)
const GRAIN_Z = 50;

export default function Wall({ world, values, seed }: Props) {
  useEffect(() => {
    const ground = new Sprite(paint(values, seed, false));
    const grain = new Sprite(paint(values, seed + 1, true));
    ground.zIndex = -10;
    grain.zIndex = GRAIN_Z;
    world.sortableChildren = true;
    world.addChild(ground, grain);
    return () => {
      for (const sprite of [ground, grain]) {
        world.removeChild(sprite);
        sprite.destroy({ texture: true, textureSource: true });
      }
    };
  }, [world, values, seed]);
  return null;
}
