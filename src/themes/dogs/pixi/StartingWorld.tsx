// The pixel world of the Starting scene on the PixiJS stage (useDogStage): the meadow as one sprite, drifting clouds,
// the six dogs (the chosen one drawn last, so it walks in front), the paw marker and the hearts; every frame places
// them from the scene clock (starting.ts) and plays the sounds that came due (not in stills). The performance level
// lowers flowers, clouds and hearts.
import type { Application, Texture } from "pixi.js";
import { Sprite } from "pixi.js";
import { useCallback } from "react";
import { particleCount } from "../../../core/three/quality.ts";
import { BREED_IDS } from "../breeds.ts";
import { CLOUD_SCALE, cloudsAt, startingBackdrop } from "../backdrop.ts";
import type { DogCache } from "../dog.ts";
import { propColorsOf, worldColorsOf } from "../looks.ts";
import { heartsAt } from "../particles.ts";
import { poseAt } from "../poses.ts";
import { MARKER, MARKER_CENTER, markerImage, propPalette, spriteImage, SPRITES } from "../props.ts";
import type { DogsValues } from "../settings.ts";
import type { DogSound } from "../sounds.ts";
import { dogAt, headAt, markerAt, soundsBetween, type StartingPlan, type StartingSound } from "../starting.ts";
import { playDogSound } from "../tones.ts";
import { SEEK } from "../useFrame.ts";
import { cloudImage } from "../world.ts";
import { type DogStage, useDogStage } from "./useDogStage.ts";

// fixed: every dog runs its poses a bit later than the one before (0.77 s), so the row does not wag in step
const PHASE = 0.77;
const SOUND_OF: Record<StartingSound["kind"], DogSound> = { land: "startingLand", hop: "startingHop", chosen: "startingChosen", card: "startingCard", bark: "bark" };

type Props = { app: Application; clock: () => number; values: DogsValues; plan: StartingPlan; dogs: readonly DogCache[] };

const countOf = (wanted: number, level: string) => (wanted > 0 ? particleCount(wanted, level) : 0);

function placeDogs(sprites: readonly Sprite[], { values, plan, dogs }: Omit<Props, "app" | "clock">, stage: DogStage, time: number) {
  sprites.forEach((sprite, index) => {
    const place = dogAt(plan, index, time);
    const state = poseAt({ time: time + index * PHASE, mode: place.mode, fps: values.walkFps, wagSpeed: place.wagSpeed, blinkEvery: values.blinkEvery, pant: values.pant });
    sprite.texture = stage.textures.of(dogs[index].pose(state));
    sprite.scale.x = place.flip ? -1 : 1;
    sprite.position.set(place.flip ? place.x + dogs[index].width : place.x, place.y);
  });
}

// The marker in a few sizes while it pops in and out, each texture made once
function markerTextures(stage: DogStage, values: DogsValues) {
  const markers = new Map<number, Texture>();
  return (share: number) => {
    const step = Math.round(share * MARKER.radius);
    let texture = markers.get(step);
    if (!texture) {
      texture = stage.textures.of(markerImage(propColorsOf(values), step / MARKER.radius));
      markers.set(step, texture);
    }
    return texture;
  };
}

function playDue(plan: StartingPlan, values: DogsValues, from: number, to: number) {
  if (SEEK !== null) return;
  for (const sound of soundsBetween(plan, from, to)) {
    if (sound.kind === "bark" && !values.startingBarkSound) continue;
    playDogSound(SOUND_OF[sound.kind], values, BREED_IDS[sound.dog]);
  }
}

export default function StartingWorld({ app, clock, values, plan, dogs }: Props) {
  const setup = useCallback((stage: DogStage) => {
    const colors = worldColorsOf(values);
    const cushions = [values.cushionColor1, values.cushionColor2, values.cushionColor3, values.cushionColor4, values.cushionColor5, values.cushionColor6];
    const backdrop = startingBackdrop(plan, { colors, cushions, rug: values.rugColor, flowers: countOf(values.flowers, values.quality), fence: values.fence, trees: values.trees });
    stage.world.addChild(new Sprite(stage.textures.of(backdrop)));
    const cloudTextures = { small: stage.textures.of(cloudImage(colors, CLOUD_SCALE.small)), big: stage.textures.of(cloudImage(colors, CLOUD_SCALE.big)) };
    const clouds = Array.from({ length: countOf(values.clouds, values.quality) }, () => stage.world.addChild(new Sprite()));
    const chosen = plan.timing.chosen;
    const sprites = dogs.map(() => new Sprite());
    for (const index of [...dogs.keys()].filter(index => index !== chosen).concat(chosen)) stage.dogs.addChild(sprites[index]);
    const heart = stage.textures.of(spriteImage(SPRITES.heart, propPalette(propColorsOf(values))));
    const hearts = Array.from({ length: countOf(values.hearts, values.quality) }, () => stage.effects.addChild(new Sprite(heart)));
    const marker = stage.effects.addChild(new Sprite());
    const markerOf = markerTextures(stage, values);
    let last = clock();
    return () => {
      const time = clock();
      cloudsAt(time, clouds.length, values.cloudSpeed, plan.sizes.width).forEach((place, index) => {
        clouds[index].texture = place.small ? cloudTextures.small : cloudTextures.big;
        clouds[index].position.set(place.x, place.y);
      });
      placeDogs(sprites, { values, plan, dogs }, stage, time);
      const spot = markerAt(plan, time);
      marker.visible = spot !== null;
      if (spot) {
        marker.texture = markerOf(spot.share);
        marker.position.set(spot.x - MARKER_CENTER, spot.y - MARKER_CENTER);
      }
      const flying = heartsAt(time, plan.land, hearts.length, headAt(plan, chosen, time));
      hearts.forEach((sprite, index) => {
        sprite.visible = index < flying.length;
        if (sprite.visible) sprite.position.set(...flying[index]);
      });
      playDue(plan, values, last, time);
      last = time;
    };
  }, [clock, values, plan, dogs]);
  useDogStage(app, values.pixelScale, setup);
  return null;
}
