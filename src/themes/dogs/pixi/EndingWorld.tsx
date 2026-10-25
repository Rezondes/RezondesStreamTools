// The pixel world of the Ending on the PixiJS stage (useDogStage): the room as one sprite, the lamp shade lit or dimmed,
// its glow fading with the light, twinkling stars, the basket around the dog (back rim behind, front rim in front), the
// "Z" of the sleeping dog and the darkness over the room; sounds of lying down, the lamp and the snoring (ending.ts).
import type { Application } from "pixi.js";
import { Graphics, Sprite } from "pixi.js";
import { useCallback } from "react";
import { hexNumber } from "../../../core/color.ts";
import type { DogCache } from "../dog.ts";
import { endingDogAt, endingSoundsBetween, lightAt, zzzAt, type EndingTiming } from "../ending.ts";
import { poseAt } from "../poses.ts";
import { basketImages, darknessOf, glowImages, roomImage, type RoomColors, shadeImage, starsOf, twinkleImage, twinkles, zImage } from "../room.ts";
import type { DogsValues } from "../settings.ts";
import { playDogSound } from "../tones.ts";
import { SEEK } from "../useFrame.ts";
import { type DogStage, useDogStage } from "./useDogStage.ts";

// fixed: the lamp shade looks lit above half the light; stars from a fixed seed; the "Z" start 8 pixels below the head
const LIT = 0.5;
const STAR_SEED = 1;
const ZZZ_BELOW = 8;
const SOUND_OF = { lie: "endingLie", lamp: "endingLamp", snore: "endingSnore" } as const;

type Props = { app: Application; clock: () => number; values: DogsValues; colors: RoomColors; dog: DogCache; timing: EndingTiming; size: { width: number; height: number } };

function lampParts(stage: DogStage, colors: RoomColors) {
  const shades = [true, false].map(lit => {
    const { image, at } = shadeImage(colors, lit);
    const sprite = stage.world.addChild(new Sprite(stage.textures.of(image)));
    sprite.position.set(...at);
    return sprite;
  });
  const glows = glowImages(colors).map(({ image, at, alpha }) => {
    const sprite = stage.world.addChild(new Sprite(stage.textures.of(image)));
    sprite.position.set(...at);
    return { sprite, alpha };
  });
  return (light: number) => {
    shades[0].visible = light > LIT;
    shades[1].visible = light <= LIT;
    for (const glow of glows) glow.sprite.alpha = glow.alpha * light;
  };
}

export default function EndingWorld({ app, clock, values, colors, dog, timing, size }: Props) {
  const setup = useCallback((stage: DogStage) => {
    const stars = starsOf(values.stars, STAR_SEED);
    stage.world.addChild(new Sprite(stage.textures.of(roomImage(size.width, size.height, colors, stars, values.moon))));
    const twinkle = stage.textures.of(twinkleImage(colors));
    const sparks = stars.map(star => {
      const sprite = stage.world.addChild(new Sprite(twinkle));
      sprite.position.set(star.x - 1, star.y - 1);
      return sprite;
    });
    const lamp = lampParts(stage, colors);
    const basket = basketImages(colors, size.height);
    stage.dogs.addChild(new Sprite(stage.textures.of(basket.back))).position.set(basket.left, basket.backTop);
    const sprite = stage.dogs.addChild(new Sprite());
    stage.dogs.addChild(new Sprite(stage.textures.of(basket.front))).position.set(basket.left, basket.frontTop);
    const letter = stage.textures.of(zImage(colors));
    const letters = Array.from({ length: 3 }, () => stage.effects.addChild(new Sprite(letter)));
    const darkness = stage.effects.addChild(new Graphics().rect(0, 0, size.width, size.height).fill(hexNumber(darknessOf(colors))));
    const top = basket.frontTop + 1 - dog.height + 3;
    let last = clock();
    return () => {
      const time = clock();
      const light = lightAt(timing, time);
      lamp(light);
      darkness.alpha = timing.darkness * (1 - light);
      stars.forEach((star, index) => { sparks[index].visible = twinkles(star, index, time); });
      const place = endingDogAt(timing, time);
      sprite.texture = stage.textures.of(dog.pose(poseAt({ time, mode: place.mode, fps: values.walkFps, wagSpeed: place.wagSpeed, blinkEvery: values.blinkEvery, pant: values.pant })));
      sprite.scale.x = -1;
      sprite.position.set(place.x + dog.width, top + place.sink);
      const head: [number, number] = [place.x + dog.width - 1 - dog.head[0], top + dog.head[1] + ZZZ_BELOW];
      const rising = values.zzz ? zzzAt(timing, time, head) : [];
      letters.forEach((sign, index) => {
        sign.visible = index < rising.length;
        if (!sign.visible) return;
        sign.position.set(rising[index].x, rising[index].y);
        sign.alpha = rising[index].alpha;
      });
      if (SEEK === null) for (const sound of endingSoundsBetween(timing, last, time)) playDogSound(SOUND_OF[sound.kind], values);
      last = time;
    };
  }, [clock, values, colors, dog, timing, size]);
  useDogStage(app, values.pixelScale, setup);
  return null;
}
