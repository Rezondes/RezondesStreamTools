// Check of breeds.ts (PLAN-DOGS.md package 1, AC4): every breed fits its grid, stands with all paws on the foot row,
// has one eye 2 x 2 inside the head and one nose 2 x 2; corgi ears are at least 8 pixels high.
// Run: node src/themes/dogs/breeds.check.ts
import assert from "node:assert/strict";
import { BREED_IDS, BREEDS, buildBreed, isBreed } from "./breeds.ts";
import { dogCache } from "./dog.ts";
import { keyAt, type Shape } from "./pixels.ts";
import { poseAt } from "./poses.ts";

const SIZES = { corgi: [52, 34], shiba: [50, 39], labrador: [60, 46], dalmatiner: [60, 50], dackel: [64, 30], mops: [44, 36] };
const colors = { base: "#808080", mark: "#ffffff", dark: "#202020", nose: "#101010", pattern: "solid" as const };
const shared = { ink: "#000000", eye: "#111111", tongue: "#ff0000", collar: "#cc0000", tag: "#ffff00", light: "#fefefe" };
const height = (shape: Shape) => (shape.kind === "polygon" ? Math.max(...shape.points.map(point => point[1])) - Math.min(...shape.points.map(point => point[1])) : 0);

// Rassen: grid sizes, nose, eye, paws on the foot row
for (const id of BREED_IDS) {
  const build = buildBreed(id);
  const { breed, body } = build;
  assert.deepEqual([breed.width, breed.height], SIZES[id], `${id}: grid`);
  assert.equal(body.keys.length, breed.width * breed.height);
  const noses = [...body.keys.keys()].filter(index => body.keys[index] === "N").map(index => [index % breed.width, Math.floor(index / breed.width)]);
  assert.equal(noses.length, 4, `${id}: one nose 2 x 2`);
  const [noseX, noseY] = noses[0];
  assert.deepEqual(noses, [[noseX, noseY], [noseX + 1, noseY], [noseX, noseY + 1], [noseX + 1, noseY + 1]], `${id}: nose is a square`);
  const [eyeX, eyeY] = breed.eye;
  for (const [x, y] of [[0, 0], [1, 0], [0, 1], [1, 1]]) assert.ok(!".o".includes(keyAt(body, eyeX + x, eyeY + y)), `${id}: eye on the head`);
  const standing = dogCache({ breed: id, colors, shared, spots: { share: 0, seed: 1 } }).pose(poseAt({ time: 0, mode: "stand", fps: 9, wagSpeed: 10, blinkEvery: 0, pant: false }));
  const eyePixels = standing.colors.filter(color => color === shared.eye).length + standing.colors.filter(color => color === shared.light).length;
  assert.equal(eyePixels, 4, `${id}: exactly one eye 2 x 2`);
  for (const hip of breed.legs.hips) {
    const pawRow = build.foot * standing.width;
    assert.ok(standing.colors[pawRow + hip] !== null && standing.colors[pawRow + standing.width + hip] === shared.ink, `${id}: paw at ${hip} on the foot row`);
  }
  assert.ok(standing.colors.slice((build.foot + 2) * standing.width).every(color => color === null), `${id}: nothing below the ground outline`);
  assert.equal(build.tails.length, 5, `${id}: five wag stages`);
  assert.equal(buildBreed(id), build, `${id}: built once`);
}

// The corgi has big ears: each at least 8 pixels from tip to base
const corgiEars = BREEDS.corgi.body.filter(part => part.part === "ear");
assert.equal(corgiEars.length, 2);
assert.ok(corgiEars.every(part => height(part.shape) >= 8));

assert.equal(isBreed("mops"), true);
assert.equal(isBreed("pudel"), false);

console.log("dogs breeds ok");
