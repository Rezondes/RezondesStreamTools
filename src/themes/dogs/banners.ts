// The banners of the Dogs theme (DESIGN-DOGS.md "Banner"), both still pictures drawn from the kit: the profile banner
// is the meadow with all six dogs standing in a row under the title, the offline banner the room of the Ending at night
// with the dog asleep in its basket, the "Z" rising and the lamp dimmed, under the title and the line.
// Pure apart from the context; check: banners.check.ts.
import { STAGE } from "../../core/screens/screens.ts";
import { drawPixels } from "./canvasImage.ts";
import { BREED_IDS, isBreed } from "./breeds.ts";
import { dogCache, type DogCache } from "./dog.ts";
import { endingDogAt, endingTimingOf, lightAt, zzzAt, type EndingTiming } from "./ending.ts";
import { dogLookOf, roomColorsOf, worldColorsOf } from "./looks.ts";
import { blankImage, blendImage, pasteImage, type PixelImage } from "./pixels.ts";
import { poseAt } from "./poses.ts";
import { basketImages, darknessOf, glowImages, ROOM, roomImage, type RoomColors, shadeImage, starsOf, twinkleImage, twinkles, zImage } from "./room.ts";
import type { DogsValues } from "./settings.ts";
import { fence, hill, meadow, skyBands, type WorldColors } from "./world.ts";

export const PROFILE_SIZE = { width: 1200, height: 480 };

export type BannerTexts = { title: string; line: string };
export type BannerLook = {
  world: WorldColors; room: RoomColors; dogs: readonly DogCache[]; sleeper: DogCache; timing: EndingTiming;
  pixelScale: number; stars: number; moon: boolean; pant: boolean;
  text: { titleSize: number; fontSize: number; profile: BannerTextLook; offline: BannerTextLook };
  offline: { time: number; lit: number };
};
// The texts of one banner (settings): font, title color and outline, line color, where title and line sit (canvas
// pixels), the line size as a factor of the font size, the title size as a share of the title size of the theme
export type BannerTextLook = { font: string; title: string; outline: string; line: string; titleY: number; lineY: number; lineScale: number; titleShare: number };


// The look of both banners from the settings: the six dogs in their default coats, the streamer's dog as the sleeper
// with the timing of the Ending
export function bannerLookOf(values: DogsValues): BannerLook {
  const breed = isBreed(values.dog) ? values.dog : BREED_IDS[0];
  const sleeper = dogCache(dogLookOf(values, breed, values.coat));
  const timing: EndingTiming = endingTimingOf(values, Math.ceil(STAGE.width / values.pixelScale), sleeper.width, ROOM.basketX);
  return {
    world: worldColorsOf(values), room: roomColorsOf(values), dogs: BREED_IDS.map(id => dogCache(dogLookOf(values, id, id === breed ? values.coat : ""))), sleeper, timing,
    pixelScale: values.pixelScale, stars: values.stars, moon: values.moon, pant: values.pant,
    text: {
      titleSize: values.titleSize, fontSize: values.fontSize,
      profile: {
        font: values.profileFont, title: values.profileTitleColor, outline: values.profileOutlineColor, line: values.profileLineColor, titleY: values.profileTitleY,
        lineY: values.profileLineY, lineScale: values.profileLineScale, titleShare: values.profileTitleShare,
      },
      offline: {
        font: values.offlineFont, title: values.offlineTitleColor, outline: values.offlineOutlineColor, line: values.offlineLineColor, titleY: values.offlineTitleY,
        lineY: values.offlineLineY, lineScale: values.offlineLineScale, titleShare: 1,
      },
    },
    offline: { time: values.offlineTime, lit: values.offlineLit },
  };
}

// fixed: the profile at 3 canvas pixels per pixel so all six dogs fit in a row: horizon at row 100, fence at 92, the
// dogs stand on row 150 with even gaps, five sky bands, three hills (x, radius x, radius y), 40 flowers
const PROFILE = { scale: 3, horizon: 100, fence: 92, ground: 150, bands: 5, flowers: 40, seed: 2, feet: 5 };
const PROFILE_HILLS = [[70, 90, 20], [330, 110, 26], [200, 60, 14]] as const;
// fixed: the offline still has its stars from seed 1 and the "Z" start 8 pixels below the head; the moment it shows and
// when the lamp shade looks lit are settings; the outline of the titles is one world pixel wide like the scenes
const OFFLINE = { starSeed: 1, zzzBelow: 8, dogTop: 3 };
const OUTLINE = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]] as const;

type Draw = (context: CanvasRenderingContext2D) => void;

// A text centered at (x, y) in the cream with an ink outline of width pixels, like the titles of the scenes
function outlinedText(context: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, own: BannerTextLook, width: number) {
  context.font = `700 ${size}px "${own.font}"`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = own.outline;
  for (const [across, down] of OUTLINE) context.fillText(text, x + across * width, y + down * width);
  context.fillStyle = own.title;
  context.fillText(text, x, y);
}

function line(context: CanvasRenderingContext2D, text: string, own: BannerTextLook, look: BannerLook, width: number) {
  context.font = `600 ${Math.round(look.text.fontSize * own.lineScale)}px "${own.font}"`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = own.line;
  context.fillText(text, width / 2, own.lineY);
}

// The meadow with the six dogs in a row
export function profileImage(look: BannerLook): PixelImage {
  const width = PROFILE_SIZE.width / PROFILE.scale;
  const image = blankImage(width, PROFILE_SIZE.height / PROFILE.scale);
  skyBands(image, look.world, PROFILE.horizon, PROFILE.bands);
  PROFILE_HILLS.forEach(([x, radiusX, radiusY], index) => hill(image, x, PROFILE.horizon + 1, radiusX, radiusY, look.world.hills[index % look.world.hills.length]));
  fence(image, PROFILE.fence, look.world);
  meadow(image, PROFILE.horizon, look.world, PROFILE.flowers, PROFILE.seed);
  const poses = look.dogs.map(dog => dog.pose(poseAt({ time: 0, mode: "stand", fps: 1, wagSpeed: 0, blinkEvery: 0, pant: look.pant })));
  const gap = (width - poses.reduce((sum, pose) => sum + pose.width, 0)) / (poses.length + 1);
  let x = gap;
  for (const pose of poses) {
    pasteImage(image, pose, Math.round(x), PROFILE.ground - pose.height + PROFILE.feet);
    x += pose.width + gap;
  }
  return image;
}

// The room at night with the dog asleep in its basket
export function offlineImage(look: BannerLook): PixelImage {
  const width = Math.ceil(STAGE.width / look.pixelScale);
  const height = Math.ceil(STAGE.height / look.pixelScale);
  const { room, timing, sleeper } = look;
  const time = look.offline.time;
  const stars = starsOf(look.stars, OFFLINE.starSeed);
  const image = roomImage(width, height, room, stars, look.moon);
  const twinkle = twinkleImage(room);
  stars.forEach((star, index) => { if (twinkles(star, index, time)) pasteImage(image, twinkle, star.x - 1, star.y - 1); });
  const light = lightAt(timing, time);
  const shade = shadeImage(room, light > look.offline.lit);
  pasteImage(image, shade.image, ...shade.at);
  for (const glow of glowImages(room)) blendImage(image, glow.image, ...glow.at, glow.alpha * light);
  const basket = basketImages(room, height);
  pasteImage(image, basket.back, basket.left, basket.backTop);
  const place = endingDogAt(timing, time);
  const top = basket.frontTop + 1 - sleeper.height + OFFLINE.dogTop + place.sink;
  pasteImage(image, sleeper.pose(poseAt({ time, mode: place.mode, fps: 1, wagSpeed: place.wagSpeed, blinkEvery: 0, pant: false })), place.x, top, true);
  pasteImage(image, basket.front, basket.left, basket.frontTop);
  const head: [number, number] = [place.x + sleeper.width - 1 - sleeper.head[0], top + sleeper.head[1] + OFFLINE.zzzBelow];
  const letter = zImage(room);
  for (const rising of zzzAt(timing, time, head)) blendImage(image, letter, rising.x, rising.y, rising.alpha);
  const dark = blankImage(width, height);
  dark.colors.fill(darknessOf(room));
  blendImage(image, dark, 0, 0, timing.darkness * (1 - light));
  return image;
}

export function makeProfile(look: BannerLook, texts: BannerTexts): Draw {
  const image = profileImage(look);
  return context => {
    drawPixels(context, image, PROFILE.scale);
    const own = look.text.profile;
    outlinedText(context, texts.title, PROFILE_SIZE.width / 2, own.titleY, Math.round(look.text.titleSize * own.titleShare), own, PROFILE.scale);
    line(context, texts.line, own, look, PROFILE_SIZE.width);
  };
}

export function makeOffline(look: BannerLook, texts: BannerTexts): Draw {
  const image = offlineImage(look);
  return context => {
    drawPixels(context, image, look.pixelScale);
    const own = look.text.offline;
    outlinedText(context, texts.title, STAGE.width / 2, own.titleY, Math.round(look.text.titleSize * own.titleShare), own, look.pixelScale);
    line(context, texts.line, own, look, STAGE.width);
  };
}
