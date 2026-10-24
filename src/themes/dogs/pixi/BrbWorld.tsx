// The pixel world of the BRB scene on the PixiJS stage (useDogStage): the sky stands, the strips of the meadow scroll
// at their parallax with the way the dog walked (walk.ts), clouds drift, the dog walks or sniffs in the middle with
// the leash out of the picture at the top right and a butterfly circling its head; sounds of the stops and the steps.
import type { Application } from "pixi.js";
import { Graphics, Sprite } from "pixi.js";
import { useCallback } from "react";
import { hexNumber } from "../../../core/color.ts";
import { particleCount } from "../../../core/three/quality.ts";
import { BREEDS, type BreedId } from "../breeds.ts";
import { BRB, brbCloudsAt, brbRow, brbSky, brbStrips, shiftOf } from "../brbWorld.ts";
import type { DogCache } from "../dog.ts";
import { propColorsOf, worldColorsOf } from "../looks.ts";
import { poseAt } from "../poses.ts";
import { propPalette, spriteImage, SPRITES } from "../props.ts";
import type { DogsValues } from "../settings.ts";
import { playDogSound } from "../tones.ts";
import { SEEK } from "../useFrame.ts";
import { leashPoints, sniffing, walkDistance, walkSoundsBetween, type WalkTiming } from "../walk.ts";
import { cloudImage } from "../world.ts";
import { type DogStage, useDogStage } from "./useDogStage.ts";

// fixed: the dog of the prototype wags 12 times per s walking and 6 standing; the leash leaves the collar 2 left and 4
// above the tag; the butterfly circles 18 right of and above the head, 26 by 8 pixels, flapping 8 times per s
const WAG = { walking: 12, standing: 6 };
const COLLAR = [-2, -4];
const FLY = { x: 18, y: -18, reachX: 26, reachY: 8, rateX: 0.9, rateY: 1.7, flaps: 8 };
const CLOUD_DRIFT = 3;
const CLOUD_SCALE = { small: 0.8, big: 1 };
const WORLD_SEED = 1;

type Props = { app: Application; clock: () => number; values: DogsValues; dog: DogCache; breed: BreedId; timing: WalkTiming; size: { width: number; height: number } };

function drawLeash(graphics: Graphics, points: readonly (readonly [number, number])[], ink: number, color: number) {
  graphics.clear();
  for (const [x, y] of points) graphics.rect(x, y - 1, 1, 3);
  graphics.fill(ink);
  for (const [x, y] of points) graphics.rect(x, y, 1, 1);
  graphics.fill(color);
}

export default function BrbWorld({ app, clock, values, dog, breed, timing, size }: Props) {
  const setup = useCallback((stage: DogStage) => {
    const colors = worldColorsOf(values);
    const count = (wanted: number) => (wanted > 0 ? particleCount(wanted, values.quality) : 0);
    stage.world.addChild(new Sprite(stage.textures.of(brbSky(size.width, size.height, colors))));
    const cloudTextures = { small: stage.textures.of(cloudImage(colors, CLOUD_SCALE.small)), big: stage.textures.of(cloudImage(colors, CLOUD_SCALE.big)) };
    const clouds = Array.from({ length: count(values.clouds) }, () => stage.world.addChild(new Sprite()));
    const strips = brbStrips(size.width, size.height, { colors, path: values.pathColor, flowers: count(values.flowers), fence: values.fence, trees: values.trees, seed: WORLD_SEED })
      .map(strip => ({ strip: values.parallax ? strip : { ...strip, speed: 1 }, sprite: stage.world.addChild(new Sprite(stage.textures.of(strip.image))) }));
    const leash = stage.dogs.addChild(new Graphics());
    const sprite = stage.dogs.addChild(new Sprite());
    const palette = propPalette(propColorsOf(values));
    const flyColors = { ...palette, P: values.butterflyColor };
    const flies = [stage.textures.of(spriteImage(SPRITES.fly1, flyColors)), stage.textures.of(spriteImage(SPRITES.fly2, flyColors))];
    const butterfly = stage.effects.addChild(new Sprite(flies[0]));
    butterfly.visible = values.butterfly;
    const top = brbRow(size.height, BRB.ground) - dog.height + 5;
    const tag = BREEDS[breed].tag;
    let last = clock();
    return () => {
      const time = clock();
      const way = walkDistance(time, timing);
      const moving = !sniffing(time, timing);
      brbCloudsAt(time, way, clouds.length, CLOUD_DRIFT, size.width).forEach((place, index) => {
        clouds[index].texture = place.small ? cloudTextures.small : cloudTextures.big;
        clouds[index].position.set(place.x, place.y);
      });
      for (const { strip, sprite: layer } of strips) layer.x = shiftOf(strip, way);
      sprite.texture = stage.textures.of(dog.pose(poseAt({ time, mode: moving ? "walk" : "stand", fps: values.walkFps, wagSpeed: moving ? WAG.walking : WAG.standing, blinkEvery: values.blinkEvery, pant: values.pant })));
      sprite.position.set(BRB.dogX, top);
      leash.visible = values.leash;
      if (values.leash) {
        const end: [number, number] = [size.width + BRB.leashOut, brbRow(size.height, BRB.leashY) + Math.sin(time * BRB.leashRate) * BRB.leashSway];
        drawLeash(leash, leashPoints([BRB.dogX + tag[0] + COLLAR[0], top + tag[1] + COLLAR[1]], end, moving ? values.leashSag : 2 * values.leashSag), hexNumber(values.ink), hexNumber(values.leashColor));
      }
      const [headX, headY] = [BRB.dogX + dog.head[0], top + dog.head[1]];
      butterfly.texture = flies[Math.floor(time * FLY.flaps) % 2];
      butterfly.position.set(Math.round(headX + FLY.x + Math.sin(time * FLY.rateX) * FLY.reachX), Math.round(headY + FLY.y + Math.sin(time * FLY.rateY) * FLY.reachY));
      if (SEEK === null) for (const sound of walkSoundsBetween(timing, last, time)) playDogSound(sound.kind === "sniff" ? "brbSniff" : "brbSteps", values);
      last = time;
    };
  }, [clock, values, dog, breed, timing, size]);
  useDogStage(app, values.pixelScale, setup);
  return null;
}
