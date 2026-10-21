// Check for textures.ts: the seeded sequence repeats for the same seed, and a canvas texture draws once into a canvas of
// its size and repeats when asked. A stand-in document gives the canvas. Runs with npm test.
import assert from "node:assert/strict";
import { RepeatWrapping } from "three";
import { canvasTexture, sequence } from "./textures.ts";

const [first, second] = [sequence(5), sequence(5)];
const values = Array.from({ length: 5 }, () => first());
assert.deepEqual(values, Array.from({ length: 5 }, () => second()));
assert.ok(values.every(value => value >= 0 && value < 1) && new Set(values).size === 5);

const drawn: number[][] = [];
const canvas = { width: 0, height: 0, getContext: () => ({}) };
Object.assign(globalThis, { document: { createElement: () => canvas } });
const texture = canvasTexture(64, 32, (_, width, height) => drawn.push([width, height]), [3, 2]);
assert.deepEqual(drawn, [[64, 32]]);
assert.deepEqual([canvas.width, canvas.height], [64, 32]);
assert.deepEqual([texture.wrapS, texture.repeat.x, texture.repeat.y], [RepeatWrapping, 3, 2]);

console.log("urlaub textures ok");
