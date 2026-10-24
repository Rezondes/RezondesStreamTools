// Check of world.ts: sky bands from sky to skyLow, discs and the fence on whole pixels, clouds as their own image,
// meadow and trees from fixed seeds (the same twice), cushions outlined. Run: node src/themes/dogs/world.check.ts
import assert from "node:assert/strict";
import { blankImage } from "./pixels.ts";
import { chanceOf, cloudImage, cushion, disc, fence, fillRect, hill, meadow, outlinedDisc, skyBands, tree, type WorldColors } from "./world.ts";

const colors: WorldColors = {
  sky: "#9fd6ff", skyLow: "#e3f5ff", grass: "#86c45f", grassLight: "#a3d97a", hills: ["#93d26e", "#86c862", "#7cbf5a"],
  trunk: "#a8754a", leaf: "#6fbf5a", apple: "#f25c54", light: "#ffffff", ink: "#2e1d14", flowers: ["#ffffff", "#ffd23f", "#f7a6c1", "#c9b6ff"],
};
const at = (image: { width: number; colors: (string | null)[] }, x: number, y: number) => image.colors[y * image.width + x];

// Sky: the first band is sky, the last skyLow, nothing below the horizon
const sky = blankImage(40, 30);
skyBands(sky, colors, 21, 7);
assert.equal(at(sky, 0, 0), "#9fd6ff");
assert.equal(at(sky, 0, 20), "#e3f5ff");
assert.equal(at(sky, 0, 25), null);

// Discs and rects stay on whole pixels inside the image; an outlined disc has ink around its fill
const shapes = blankImage(20, 20);
fillRect(shapes, -5, -5, 8, 8, "#000001");
assert.equal(at(shapes, 2, 2), "#000001");
disc(shapes, 10, 10, 3, 3, "#000002");
assert.equal(at(shapes, 10, 10), "#000002");
hill(shapes, 10, 18, 4, 3, "#000003");
assert.equal(at(shapes, 10, 19), null, "a hill is only the upper half");
outlinedDisc(shapes, 10, 10, 2, 2, "#000004", colors.ink);
assert.equal(at(shapes, 10, 7), colors.ink);
assert.equal(at(shapes, 10, 10), "#000004");

// Cloud: an image of its own with light pixels; a smaller scale gives a smaller image
const cloud = cloudImage(colors, 1);
assert.ok(cloud.colors.includes(colors.light));
assert.ok(cloudImage(colors, 0.8).width < cloud.width);

// Meadow and trees from fixed seeds: the same twice, flowers in their colors, the top edge light
const paint = () => {
  const image = blankImage(120, 60);
  meadow(image, 30, colors, 40, 1);
  tree(image, 30, 30, 1, 3, colors);
  tree(image, 90, 30, 1, 4, colors);
  fence(image, 20, colors, 5);
  return image;
};
assert.deepEqual(paint().colors, paint().colors);
const scene = paint();
const grass = blankImage(60, 40);
meadow(grass, 20, colors, 0, 1);
assert.deepEqual([at(grass, 5, 20), at(grass, 5, 30), at(grass, 5, 10)], ["#a3d97a", "#86c45f", null], "light top edge, grass below, nothing above");
assert.ok(colors.flowers.slice(1).some(color => scene.colors.includes(color)));
assert.ok(scene.colors.includes(colors.trunk) && scene.colors.includes(colors.leaf));
assert.ok(chanceOf(1, 2) >= 0 && chanceOf(1, 2) < 1 && chanceOf(1, 2) === chanceOf(1, 2));

// Cushion: outlined, piping in the light color
const pillow = blankImage(40, 12);
cushion(pillow, 20, 5, 12, "#bfe8d4", colors);
assert.ok(pillow.colors.includes(colors.ink) && pillow.colors.includes(colors.light) && pillow.colors.includes("#bfe8d4"));

console.log("dogs world ok");
