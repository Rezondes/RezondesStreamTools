// Check of brbWorld.ts: the sky stands above the horizon, every strip repeats after its period (a column looks like the
// column one period later), shiftOf stays within one period and moves with the parallax, the switches leave out fence
// and trees, clouds drift. Run: node src/themes/dogs/brbWorld.check.ts
import assert from "node:assert/strict";
import { BRB, brbCloudsAt, brbRow, brbSky, brbStrips, shiftOf } from "./brbWorld.ts";
import type { WorldColors } from "./world.ts";

const colors: WorldColors = {
  sky: "#9fd6ff", skyLow: "#e3f5ff", grass: "#86c45f", grassLight: "#a3d97a", hills: ["#93d26e", "#86c862", "#8fcf6a"],
  trunk: "#a8754a", leaf: "#6fbf5a", apple: "#f25c54", light: "#ffffff", ink: "#2e1d14", flowers: ["#ffffff", "#ffd23f", "#f7a6c1", "#c9b6ff"],
};
const options = { colors, path: "#e3c49a", flowers: 50, fence: true, trees: true, seed: 1 };

const sky = brbSky(384, 216, colors);
assert.deepEqual([sky.width, sky.height], [384, 151]);
assert.equal(sky.colors[0], colors.sky);

// Strips repeat after their period: a pixel and the one a period to the right are the same
const strips = brbStrips(384, 216, options);
assert.equal(strips.length, 5);
strips.forEach((strip, index) => {
  assert.equal(strip.image.width, 384 + strip.period);
  for (let y = 0; y < 216; y += 7) {
    for (let x = 0; x + strip.period < strip.image.width; x += 11) {
      assert.equal(strip.image.colors[y * strip.image.width + x], strip.image.colors[y * strip.image.width + x + strip.period], `strip ${index} at ${x},${y}`);
    }
  }
});
const path = strips[4];
assert.equal(path.image.colors[brbRow(216, BRB.pathTop + 5) * path.image.width + 3], "#e3c49a", "the path");
assert.equal(path.image.colors[215 * path.image.width], colors.grass, "grass below the path");

// Shift: within one period, faster for nearer strips
for (const way of [0, 10, 999, 12_345]) for (const strip of strips) assert.ok(shiftOf(strip, way) <= 0 && shiftOf(strip, way) > -strip.period);
assert.equal(shiftOf(path, 10), -10);
assert.equal(shiftOf(strips[0], 20), -3);

// Switches: no fence and no trees leave their strips empty
const bare = brbStrips(384, 216, { ...options, fence: false, trees: false });
assert.ok(bare[1].image.colors.every(color => color === null) && bare[3].image.colors.every(color => color === null));

// Clouds: as many as asked, drifting with time and falling behind with the way
assert.equal(brbCloudsAt(0, 0, 6, 3, 384).length, 6);
assert.equal(brbCloudsAt(10, 0, 6, 3, 384)[0].x, brbCloudsAt(0, 0, 6, 3, 384)[0].x + 30);
assert.equal(brbCloudsAt(0, 200, 6, 3, 384)[1].x, brbCloudsAt(0, 0, 6, 3, 384)[1].x - 10);

console.log("dogs brbWorld ok");
