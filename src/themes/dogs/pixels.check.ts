// Check of pixels.ts (PLAN-DOGS.md package 1, AC3): outline around every filled pixel, never into one; light only at
// the top and right, shadow only at the bottom and left, only on coat areas; painting with a palette.
// Run: node src/themes/dogs/pixels.check.ts
import assert from "node:assert/strict";
import { blankImage, blendImage, covers, drawLine, EMPTY, fillShape, finish, keyAt, OUTLINE, paintGrid, paintImage, pasteImage, pixelGrid, RIM, rowRuns, setPixel, toneOf } from "./pixels.ts";

// Kontur und Schattierung: an ellipse in an 8 x 8 grid gets a closed outline and rims only where they belong
const grid = pixelGrid(8, 8);
fillShape(grid, { kind: "ellipse", center: [4, 4], radius: [2.6, 2.6] }, "O");
const filled = [...grid.keys.keys()].filter(index => grid.keys[index] === "O");
finish(grid);
assert.ok(filled.every(index => grid.keys[index] === "O"), "the outline never goes into a filled pixel");
for (let y = 0; y < 8; y++) {
  for (let x = 0; x < 8; x++) {
    if (keyAt(grid, x, y) !== "O") continue;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) assert.notEqual(keyAt(grid, x + dx, y + dy), EMPTY, `no gap next to ${x},${y}`);
  }
}
assert.ok(grid.keys.some(key => key === OUTLINE));
const rimAt = (x: number, y: number) => grid.rims[y * 8 + x];
const column = (x: number) => [...Array(8).keys()].filter(y => keyAt(grid, x, y) === "O");
assert.equal(rimAt(4, column(4)[0]), RIM.light, "light at the top");
assert.equal(rimAt(4, column(4).at(-1)!), RIM.shadow, "shadow at the bottom");
assert.equal(rimAt(4, 4), 0, "the middle keeps its tone");
// Straight sides: light on the right, shadow on the left (rows 1 to 6 of a block)
const block = pixelGrid(8, 8);
fillShape(block, { kind: "rect", from: [1, 1], to: [5, 5] }, "O");
finish(block);
assert.equal(block.rims[2 * 8 + 5], RIM.light, "light at the right");
assert.equal(block.rims[3 * 8 + 1], RIM.shadow, "shadow at the left");

// Rims only on coat keys: an eye or a collar stays flat
const flat = pixelGrid(4, 4);
fillShape(flat, { kind: "rect", from: [1, 1], to: [1, 1] }, "k");
finish(flat);
assert.ok([...flat.rims].every(rim => rim === 0));

// Shapes: polygon and rect cover what they span, only paints over the given keys
assert.equal(covers({ kind: "polygon", points: [[0, 0], [4, 0], [0, 4]] }, 1, 1), true);
assert.equal(covers({ kind: "polygon", points: [[0, 0], [4, 0], [0, 4]] }, 3.5, 3.5), false);
const masked = pixelGrid(4, 1);
fillShape(masked, { kind: "rect", from: [0, 0], to: [1, 0] }, "O");
fillShape(masked, { kind: "rect", from: [0, 0], to: [3, 0] }, "W", "O");
assert.deepEqual(masked.keys, ["W", "W", ".", "."]);
const line = pixelGrid(4, 4);
drawLine(line, [0, 0], [0, 3], "R", 2);
assert.equal(line.keys.filter(key => key === "R").length, 8);

// Painting: keys to colors with their rims, unknown keys stay empty, pixels outside the image are ignored
const image = paintImage(grid, { O: "#808080", o: "#000000" });
assert.equal(image.colors[4 * 8 + 4], "#808080");
assert.equal(image.colors[0], null);
assert.equal(toneOf("#808080", RIM.light), "#949494");
assert.equal(toneOf("#808080", RIM.shadow), "#6c6c6c");
assert.equal(toneOf("#808080", RIM.far), "#616161");
const offset = blankImage(3, 3);
paintGrid(offset, masked, { W: "#ffffff" }, 2, 1);
assert.deepEqual(offset.colors.filter(Boolean), ["#ffffff"]);
setPixel(offset, -1, 9, "#000000");
assert.equal(offset.colors.filter(Boolean).length, 1);

// Runs: equal colors in a row become one run, empty pixels none
const striped = blankImage(5, 2);
for (const x of [0, 1, 3]) setPixel(striped, x, 0, "#111111");
setPixel(striped, 4, 0, "#222222");
setPixel(striped, 2, 1, "#111111");
assert.deepEqual(rowRuns(striped), [{ x: 0, y: 0, width: 2, color: "#111111" }, { x: 3, y: 0, width: 1, color: "#111111" }, { x: 4, y: 0, width: 1, color: "#222222" }, { x: 2, y: 1, width: 1, color: "#111111" }]);

// Paste and blend: a mirrored paste puts the left pixel on the right, empty pixels stay out; blending mixes by alpha
const source = blankImage(2, 1);
setPixel(source, 0, 0, "#000000");
const pasted = blankImage(3, 1);
pasteImage(pasted, source, 1, 0, true);
assert.deepEqual(pasted.colors, [null, null, "#000000"]);
const blended = blankImage(2, 1);
setPixel(blended, 0, 0, "#ffffff");
const white = blankImage(2, 1);
white.colors.fill("#000000");
blendImage(blended, white, 0, 0, 0.5);
assert.deepEqual(blended.colors, ["#808080", "#000000"]);
blendImage(blended, white, 5, 5, 1);

console.log("dogs pixels ok");
