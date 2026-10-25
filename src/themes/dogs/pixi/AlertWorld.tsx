// The pixel world of a Dogs alert on the PixiJS stage (useDogStage): the streamer's dog runs in with the toy of the
// kind, drops it with hops, barks and runs out again (alert.ts, toy.ts); with a raid the pack runs behind it, the far
// lanes first, only the runners on the way (runnersAt), with one pose cache per breed and coat. Built-in sounds at
// their times unless the streamer chose an own file for the kind (that one plays once from the scene).
import type { Application, Texture } from "pixi.js";
import { Sprite } from "pixi.js";
import { useCallback, useMemo } from "react";
import { type RaidPack, runnersAt } from "../../../core/alerts/raidPack.ts";
import { hash } from "../../../core/hash.ts";
import { ALERT_GROUND, alertDogAt, alertScaleOf, alertSoundsBetween, toyAt, type AlertSchedule } from "../alert.ts";
import { BREEDS, type BreedId } from "../breeds.ts";
import { dogCache, type DogCache } from "../dog.ts";
import { dogLookOf, propColorsOf } from "../looks.ts";
import { poseAt } from "../poses.ts";
import { propPalette, spriteImage, SPRITES } from "../props.ts";
import { raidBreeds, raidLookOf } from "../raidLooks.ts";
import type { DogsValues } from "../settings.ts";
import type { DogSound } from "../sounds.ts";
import { playDogSound } from "../tones.ts";
import { toyHeight } from "../toy.ts";
import { SEEK } from "../useFrame.ts";
import { type DogStage, useDogStage } from "./useDogStage.ts";

// fixed: the stop at x 92; the dog runs at 13 frames and wags 15 times per s,
// runners at 14 and 16, each a bit later than the one before (0.37 s); the toy sits 4 pixels before the mouth
const STOP = 92;
const POSE = { fps: 13, standFps: 9, wag: 15, runnerFps: 14, runnerWag: 16, runnerPhase: 0.37, outside: 4, beyond: 10 };
const TOY = { before: 2, dropAhead: 4 };
const PERCENT = 100;
const SPRITE_OF = { ball: SPRITES.ball, knochen: SPRITES.bone, frisbee: SPRITES.frisbee, leckerli: SPRITES.treat } as const;
export type Toy = keyof typeof SPRITE_OF;
const SOUND_OF = { run: "alertRun", card: "alertCard", leave: "alertLeave", bark: "bark" } as const;

type Props = { app: Application; clock: () => number; values: DogsValues; breed: BreedId; dog: DogCache; toy: Toy; schedule: AlertSchedule; pack: RaidPack | null; builtIn: boolean; width: number };

function toyTexture(stage: DogStage, values: DogsValues, toy: Toy): { texture: Texture; rows: number } {
  const palette = { ...propPalette(propColorsOf(values)), C: values.toyBoneColor, R: values.toyFrisbeeColor, B: values.toyTreatColor };
  const rows = SPRITE_OF[toy];
  return { texture: stage.textures.of(spriteImage(rows, palette)), rows: rows.length };
}

function usePackCaches(values: DogsValues) {
  return useMemo(() => {
    const caches = new Map<string, DogCache>();
    return (breed: BreedId, coat: string) => {
      const key = `${breed}/${coat}`;
      let cache = caches.get(key);
      if (!cache) {
        cache = dogCache(dogLookOf(values, breed, coat));
        caches.set(key, cache);
      }
      return cache;
    };
  }, [values]);
}

export default function AlertWorld({ app, clock, values, breed, dog, toy, schedule, pack, builtIn, width }: Props) {
  const lookOf = usePackCaches(values);
  const setup = useCallback((stage: DogStage) => {
    const runners = Array.from({ length: values.raidMaxOnScreen + 2 }, () => stage.dogs.addChild(new Sprite()));
    const sprite = stage.dogs.addChild(new Sprite());
    const { texture, rows } = toyTexture(stage, values, toy);
    const toySprite = stage.dogs.addChild(new Sprite(texture));
    const top = ALERT_GROUND - dog.height + 5;
    const track = { start: -dog.width - POSE.outside, stop: STOP, out: width + POSE.beyond };
    const [mouthX, mouthY] = BREEDS[breed].mouth;
    const dropX = STOP + mouthX + 1 + TOY.dropAhead;
    const breeds = raidBreeds(values);
    const barking = new Set<number>();
    let last = clock();
    return () => {
      const time = clock();
      const place = alertDogAt(schedule, track, time);
      sprite.texture = stage.textures.of(dog.pose(poseAt({ time, mode: place.mode, fps: place.mode === "walk" ? POSE.fps : POSE.standFps, wagSpeed: POSE.wag, blinkEvery: values.blinkEvery, pant: values.pant })));
      sprite.position.set(place.x, top);
      const held = [place.x + mouthX + 1 - TOY.before, top + mouthY - 1 - Math.floor(rows / 2)];
      const lying = toyAt(schedule, time);
      toySprite.visible = !lying.gone;
      if (lying.held) toySprite.position.set(held[0], held[1]);
      else {
        const ground = [dropX + lying.slide, ALERT_GROUND - rows + 1 - toyHeight(lying.since, values.dropBounce)];
        toySprite.position.set(Math.round(ground[0] + (held[0] - ground[0]) * lying.back), Math.round(ground[1] + (held[1] - ground[1]) * lying.back));
      }
      const running = pack ? runnersAt(pack, (time - schedule.packStart) * 1000).sort((first, second) => second.runner.lane - first.runner.lane) : [];
      runners.forEach((runnerSprite, index) => {
        const entry = running[index];
        runnerSprite.visible = Boolean(entry);
        if (!entry) return;
        const look = raidLookOf(entry.runner.pick, breeds);
        const cache = lookOf(look.breed, look.coat);
        runnerSprite.texture = stage.textures.of(cache.pose(poseAt({ time: time + entry.runner.index * POSE.runnerPhase, mode: "walk", fps: POSE.runnerFps, wagSpeed: POSE.runnerWag, blinkEvery: values.blinkEvery, pant: values.pant })));
        runnerSprite.position.set(Math.round(-cache.width + (width + cache.width) * entry.progress), ALERT_GROUND - entry.runner.lane * values.raidLaneGap - cache.height + 5);
        if (builtIn && SEEK === null && !barking.has(entry.runner.index) && hash(values.raidSeed + entry.runner.index) < values.raidBarkShare / PERCENT) {
          barking.add(entry.runner.index);
          playDogSound("bark", values, look.breed);
        }
      });
      if (builtIn && SEEK === null) {
        for (const sound of alertSoundsBetween(schedule, last, time)) {
          const event: DogSound = sound.kind === "toy" ? `toy${toy.charAt(0).toUpperCase()}${toy.slice(1)}` as DogSound : SOUND_OF[sound.kind];
          playDogSound(event, values, breed);
        }
        if (pack && last < schedule.packStart && time >= schedule.packStart) playDogSound("alertRaid", values);
      }
      last = time;
    };
  }, [clock, values, breed, dog, toy, schedule, pack, builtIn, width, lookOf]);
  const { pixel, lift } = alertScaleOf(values.pixelScale, values.alertSize);
  useDogStage(app, pixel, setup, lift);
  return null;
}

export const ALERT_STOP = STOP;
