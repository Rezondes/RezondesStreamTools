// Check of props.ts: every sprite has rows of one width and only keys of the palette, the marker grows from nothing to
// its full size with the paw at the end. Run: node src/themes/dogs/props.check.ts
import assert from "node:assert/strict";
import { MARKER, MARKER_CENTER, markerImage, propPalette, spriteImage, SPRITES } from "./props.ts";

const colors = { ink: "#2e1d14", accent: "#c24535", light: "#ffffff", ball: "#ffd23f", cream: "#fff6e6", edge: "#e9d2bd", brown: "#a8754a", pink: "#f7a6c1" };
const palette = propPalette(colors);

// Sprites: equal rows, every key empty or in the palette
for (const [name, rows] of Object.entries(SPRITES)) {
  assert.ok(rows.every(row => row.length === rows[0].length), `${name}: rows of one width`);
  assert.ok(rows.join("").split("").every(key => key === "." || key in palette), `${name}: keys`);
}
const heart = spriteImage(SPRITES.heart, palette);
assert.deepEqual([heart.width, heart.height], [7, 7]);
assert.equal(heart.colors[1], colors.ink);
assert.equal(heart.colors[0], null);
assert.equal(palette.R, colors.accent);
assert.notEqual(palette.y, colors.ball, "a darker ball tone");

// Marker: empty at 0, the accent disc around its center, the paw only near full size
assert.ok(markerImage(colors, 0).colors.every(color => color === null));
const full = markerImage(colors, 1);
assert.equal(full.colors[MARKER_CENTER * full.width + MARKER_CENTER], colors.light, "the paw in the middle");
const half = markerImage(colors, 0.5);
assert.equal(half.colors[MARKER_CENTER * half.width + MARKER_CENTER], colors.accent, "no paw while small");
assert.equal(full.height, MARKER.size + MARKER.point);

console.log("dogs props ok");
