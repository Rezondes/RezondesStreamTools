// Looks of the Dogs theme from the resolved settings: the colors of the world and the props, and how a dog of a breed
// and coat looks (its coat colors, the shared colors, the spots of a spotted coat). One place, so every scene and
// clip reads the same keys. Check: looks.check.ts.
import type { BreedId } from "./breeds.ts";
import { coatOf, coatPalette } from "./coats.ts";
import type { DogLook } from "./dog.ts";
import type { PropColors } from "./props.ts";
import type { DogsValues } from "./settings.ts";
import type { WorldColors } from "./world.ts";

const PERCENT = 100;

export const worldColorsOf = (values: DogsValues): WorldColors => ({
  sky: values.sky, skyLow: values.skyLow, grass: values.grass, grassLight: values.grassLight,
  hills: [values.hillColor1, values.hillColor2, values.hillColor3], trunk: values.treeTrunk, leaf: values.treeLeaf,
  apple: values.appleColor, light: values.light, ink: values.ink,
  flowers: [values.flowerColor1, values.flowerColor2, values.flowerColor3, values.flowerColor4],
});

export const propColorsOf = (values: DogsValues): PropColors => ({
  ink: values.ink, accent: values.accent, light: values.light, ball: values.ball, cream: values.cream, edge: values.edge,
  brown: values.treeTrunk, pink: values.dogTongue,
});

// How a dog of breed and coat looks; a coat the breed does not have gives its default coat
export const dogLookOf = (values: DogsValues, breed: BreedId, coat: string): DogLook => ({
  breed,
  colors: coatPalette(values, breed, coatOf(breed, coat).id),
  shared: { ink: values.ink, eye: values.dogEye, tongue: values.dogTongue, collar: values.accent, tag: values.ball, light: values.light },
  spots: { share: values.dalmatinerSpots / PERCENT, seed: values.spotSeed },
});
