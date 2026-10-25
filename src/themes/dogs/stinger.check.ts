// Check of stinger.ts (PLAN-DOGS.md package 5, AC1 and AC2): the same time draws the same calls; at the cut every row of
// the stage lies under the surface, at 0 and at the end none; the badge only shows around the cut and not when it is
// switched off. Run: node src/themes/dogs/stinger.check.ts
import assert from "node:assert/strict";
import { recorder } from "./canvasImage.check.ts";
import { dogCache } from "./dog.ts";
import { dogLookOf } from "./looks.ts";
import { resolveSettings } from "../../core/settings.ts";
import { dogsSettings, type DogsValues } from "./settings.ts";
import { badgeAt, makeStinger, stingerImage, stingerPaws, type StingerLook } from "./stinger.ts";

const values = resolveSettings(dogsSettings, {}) as unknown as DogsValues;
const look: StingerLook = {
  duration: 2.4, cut: 1.2, sweep: 0.82, spacing: 30, slant: 0.45, step: 6, pixelScale: 5, dog: dogCache(dogLookOf(values, "corgi", "rotweiss")),
  badge: true, text: "Bello", font: "Pixelify Sans",
  colors: { cover: "#fff6e6", edge: "#e9d2bd", ink: "#2e1d14", accent: "#c24535", ball: "#ffd23f", muted: "#7a5a46", base: "#cc7633", dark: "#a85a22" },
};

// deterministisch
const calls = (time: number) => {
  const canvas = recorder();
  makeStinger(look)(canvas.context, time);
  return canvas.calls;
};
for (const time of [0.5, 1.1, 1.7]) assert.deepEqual(calls(time), calls(time));
assert.ok(calls(look.cut).includes("fillText(Bello,0.000,80.000)"));

// deckt am Schnitt: every pixel of the stage is painted; at 0 and at the end no pixel has the surface color
const paws = stingerPaws(look);
const atCut = stingerImage(look, paws, look.cut);
assert.ok(atCut.colors.every(color => color !== null), "the surface covers the stage at the cut");
for (const time of [0, look.duration]) assert.ok(!stingerImage(look, paws, time).colors.includes(look.colors.cover), `no surface at ${time}`);
// The first frame is empty (no paw, no snout of the dog); the dog comes in from the left out of the picture
assert.ok(stingerImage(look, paws, 0).colors.every(color => color === null), "nothing at 0");
const leftmost = (time: number) => {
  const image = stingerImage({ ...look, colors: { ...look.colors, cover: "#000001" } }, [], time);
  const xs = image.colors.flatMap((color, index) => (color && color !== "#000001" && color !== look.colors.ink && color !== look.colors.edge ? [index % image.width] : []));
  return xs.length ? Math.min(...xs) : null;
};
assert.equal(leftmost(0.1), null, "the dog is still outside at 0.1 s");
assert.ok((leftmost(0.5) ?? 0) > 0, "the dog runs in later");

// The badge: hidden before, full around the cut, hidden after; off when switched off
assert.equal(badgeAt(look, 0.5), 0);
assert.ok(badgeAt(look, look.cut) > 0.9);
assert.equal(badgeAt(look, 1.7), 0);
assert.equal(badgeAt({ ...look, badge: false }, look.cut), 0);
// Paws never take a color brighter than the surface
assert.ok(paws.every(print => print.color !== look.colors.cover));

console.log("dogs stinger ok");
