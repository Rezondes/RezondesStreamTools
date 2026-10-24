// A dog of the Dogs theme as pixel images (DESIGN-DOGS.md "Hunde", prototype refs/pixeldogs.js): paintDog paints one
// pose (tail, far legs, body with eye and mouth, near legs; lying with the front paws in front), dogCache paints every
// pose once and hands it out again (pose cache; a new look builds a new cache). The image is 4 pixels taller than the
// breed grid: the feet stand on row height - 2 of the grid, a lying body sinks below it.
// Check: dog.check.ts.
import { buildBreed, type BreedBuild, type BreedId } from "./breeds.ts";
import { dogPalette, markedBody, markings, type CoatColors, type DogColors, type SpotOptions } from "./coats.ts";
import { blankImage, finish, OUTLINE, paintGrid, pixelGrid, RIM, setKey, setPixel, toneOf, type Palette, type PixelGrid, type PixelImage, type Point } from "./pixels.ts";
import { LEG_CYCLE, poseKey, type PoseState } from "./poses.ts";

// fixed: room below the grid for a lying body, legs reach two rows into it; far legs start a half cycle later
const EXTRA_ROWS = 4;
const LEG_ROWS = 2;
const HALF_CYCLE = 3;
// fixed: a leg is coat-colored for its upper third (at least 2 rows), the paw is one pixel wider on each side
const UPPER_SHARE = 0.35;
const UPPER_MIN = 2;
// fixed: the head point above the eye (marker, speech bubble), the gap of the two front paws of a lying dog
const HEAD_ABOVE_EYE = 6;
const PAW_GAP = 4;

type Leg = { hip: number; phase: number; far: boolean };

function drawLeg(grid: PixelGrid, build: BreedBuild, leg: Leg, offset: number, lift: number) {
  const { breed, foot } = build;
  const top = breed.legTop;
  const bottom = foot - lift;
  const rim = leg.far ? RIM.far : 0;
  for (let y = top; y <= bottom; y++) {
    const middle = Math.round(leg.hip + (offset * (y - top)) / Math.max(1, bottom - top));
    const key = y - top < Math.max(UPPER_MIN, (bottom - top) * UPPER_SHARE) ? breed.legs.upper : breed.legs.lower;
    if (y === bottom) {
      for (let x = middle - 2; x <= middle + 3; x++) setKey(grid, x, y, x === middle - 2 || x === middle + 3 ? OUTLINE : breed.legs.lower, rim);
      for (let x = middle - 1; x <= middle + 2; x++) setKey(grid, x, y + 1, OUTLINE);
    } else {
      setKey(grid, middle - 2, y, OUTLINE);
      setKey(grid, middle + 2, y, OUTLINE);
      for (let x = middle - 1; x <= middle + 1; x++) setKey(grid, x, y, key, x === middle + 1 ? rim + 1 : rim);
    }
  }
}

function drawFace(image: PixelImage, build: BreedBuild, palette: Palette, state: PoseState, top: number) {
  const [eyeX, eyeY] = build.breed.eye;
  const [mouthX, mouthY] = build.breed.mouth;
  const at = (x: number, y: number, key: string) => setPixel(image, x, y + top, palette[key]);
  if (state.blink) {
    at(eyeX, eyeY, "o");
    at(eyeX + 1, eyeY, "o");
  } else {
    at(eyeX, eyeY, "E");
    for (const [x, y] of [[1, 0], [0, 1], [1, 1]]) at(eyeX + x, eyeY + y, "k");
  }
  if (state.mouth === "open") {
    for (let x = mouthX - 2; x <= mouthX + 2; x++) at(x, mouthY, "o");
    for (const [x, key] of [[-2, "o"], [-1, "P"], [0, "P"], [1, "o"]] as const) at(mouthX + x, mouthY + 1, key);
    for (let x = mouthX - 1; x <= mouthX; x++) at(x, mouthY + 2, "o");
  } else if (state.mouth === "pant") {
    for (const [x, y] of [[0, 0], [1, 0], [0, 1], [1, 1]]) at(mouthX + x, mouthY + y, "P");
    for (const [x, y] of [[-1, 1], [2, 1], [0, 2], [1, 2]]) at(mouthX + x, mouthY + y, "o");
  }
}

function drawRestingPaws(image: PixelImage, build: BreedBuild, palette: Palette) {
  const nearFront = build.breed.legs.hips[2];
  for (const gap of [0, PAW_GAP]) {
    const middle = nearFront + 1 + gap;
    for (let x = middle - 2; x <= middle + 2; x++) {
      setPixel(image, x, build.foot, palette.o);
      setPixel(image, x, build.foot - 2, palette.o);
      const side = x === middle - 2 || x === middle + 2;
      setPixel(image, x, build.foot - 1, side ? palette.o : toneOf(palette[build.breed.legs.lower], gap ? 0 : RIM.shadow));
    }
  }
}

// One pose of a dog: body is the marked and finished body grid of its breed
export function paintDog(build: BreedBuild, body: PixelGrid, palette: Palette, state: PoseState): PixelImage {
  const { breed, foot } = build;
  const image = blankImage(breed.width, breed.height + EXTRA_ROWS);
  const lying = state.mode === "lie";
  const drop = lying ? foot - breed.legTop - 1 : 0;
  const bob = state.mode === "walk" && state.frame % HALF_CYCLE === 2 ? 1 : 0;
  paintGrid(image, build.tails[state.tail], palette, 0, drop + bob);
  if (lying) {
    paintGrid(image, body, palette, 0, drop);
    drawFace(image, build, palette, state, drop);
    drawRestingPaws(image, build, palette);
    return image;
  }
  const [nearRear, farRear, nearFront, farFront] = breed.legs.hips;
  const legs: Leg[] = [{ hip: farRear, phase: 0, far: true }, { hip: farFront, phase: HALF_CYCLE, far: true }, { hip: nearRear, phase: HALF_CYCLE, far: false }, { hip: nearFront, phase: 0, far: false }];
  const back = pixelGrid(breed.width, breed.height + LEG_ROWS);
  const front = pixelGrid(breed.width, breed.height + LEG_ROWS);
  for (const leg of legs) {
    const [offset, lift] = state.mode === "walk" ? LEG_CYCLE[(state.frame + leg.phase) % LEG_CYCLE.length] : [0, 0];
    drawLeg(leg.far ? back : front, build, leg, offset, lift);
  }
  paintGrid(image, back, palette);
  paintGrid(image, body, palette, 0, bob);
  drawFace(image, build, palette, state, bob);
  paintGrid(image, front, palette);
  return image;
}

// How a dog looks: breed, coat colors and pattern, the shared colors, the spots of a spotted coat
export type DogLook = { breed: BreedId; colors: CoatColors; shared: DogColors; spots: SpotOptions };
// width, height: of every pose image; head: above the eye, in image pixels facing right; painted: poses painted so far
export type DogCache = { width: number; height: number; head: Point; pose: (state: PoseState) => PixelImage; painted: () => number };

export function dogCache(look: DogLook): DogCache {
  const build = buildBreed(look.breed);
  const body = finish(markedBody(build.body, markings(build, look.colors.pattern, look.spots)));
  const palette = dogPalette(look.colors, look.shared);
  const poses = new Map<string, PixelImage>();
  const [eyeX, eyeY] = build.breed.eye;
  return {
    width: build.breed.width,
    height: build.breed.height + EXTRA_ROWS,
    head: [eyeX, eyeY - HEAD_ABOVE_EYE],
    pose: state => {
      const key = poseKey(state);
      let image = poses.get(key);
      if (!image) {
        image = paintDog(build, body, palette, state);
        poses.set(key, image);
      }
      return image;
    },
    painted: () => poses.size,
  };
}
