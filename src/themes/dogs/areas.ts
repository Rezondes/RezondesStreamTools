// OBS sources of the Dogs theme (ThemeModule.areas): the alert spans the whole width (the dog and the raid pack run
// through the picture) from above the card down to the bottom; the chat as wide as its setting, the music as high as
// its dog, its cover or its text, the stream numbers as high as their rows. The camera fills its source.
// Check: areas.check.ts.
import { alertArea, musicArea } from "../../core/sceneArea.ts";
import { STAGE } from "../../core/screens/screens.ts";
import { parseStatLines } from "../../core/stats/stats.ts";
import { SCENE_SIZES, type SceneArea, type SceneName, type SettingValues } from "../../core/theme.ts";
import { BREEDS } from "./breeds.ts";
import type { DogsValues } from "./settings.ts";

// fixed: room above the card for its pixel edge and the bubble of the dog
const ABOVE_CARD = 40;
// fixed: the music sign as measured in the browser (px): padding around the cover, text height per px of font size
// plus label and paws; the dog at 0.6 of the pixel size with 6 rows for legs and headphones, plus the padding below
const MUSIC = { cover: 56, perFont: 3.4, text: 96, dogScale: 0.6, dogRows: 6, below: 32 };
// fixed: the stream numbers as measured: caption and padding, one row per px of font size, the width
const STATS = { head: 110, perFont: 3.4, width: 420 };
const tallestDog = Math.max(...Object.values(BREEDS).map(breed => breed.height));

export function dogsAreas(values: SettingValues): Partial<Record<SceneName, SceneArea>> {
  const dogs = values as unknown as DogsValues;
  const top = Math.max(0, dogs.cardTop - ABOVE_CARD);
  const dog = dogs.musicStyle === "hund" ? (tallestDog + MUSIC.dogRows) * dogs.pixelScale * MUSIC.dogScale + MUSIC.below : 0;
  const rows = parseStatLines(dogs.endingStats.join("\n")).length;
  return {
    alerts: alertArea({ top, width: STAGE.width, height: STAGE.height - top, room: 0 }),
    chat: { width: dogs.chatWidth, height: SCENE_SIZES.chat.height },
    music: musicArea(dog, dogs.musicCover ? dogs.coverSize + MUSIC.cover : 0, dogs.fontSize * MUSIC.perFont + MUSIC.text),
    stats: { width: STATS.width, height: Math.ceil(STATS.head + rows * dogs.fontSize * STATS.perFont) },
  };
}
