// Check for field.ts: path building blocks give valid, closed paths, every shape has parts with paths.
// Runs with npm test (alone: node src/themes/plantage/field.check.ts).
import assert from "node:assert/strict";
import { blobs, circle, furrows, hillPath, ICON_NAMES, ICONS, LEAF, PLANE, spikes, type Shape } from "./field.ts";

// Stars: count points give 2 * count points, closed
const star = spikes(50, 50, 40, 20, 5);
assert.match(star, /^M50 10 L/);
assert.equal(star.split("L").length, 10);
assert.ok(star.endsWith(" Z"));
assert.equal(circle(50, 50, 10), "M40 50 a10 10 0 1 0 20 0 a10 10 0 1 0 -20 0 Z");

// Hill: starts at the bottom left, top edge between top - amplitude and top + amplitude, ends at the bottom right
{
  const hill = hillPath(400, 10, 200, 50, 120);
  assert.match(hill, /^M0 120 L0 50 /);
  assert.ok(hill.endsWith("L400 120 Z"));
  const heights = [...hill.matchAll(/L(\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g)].map(match => Number(match[2])).filter(height => height !== 120);
  assert.ok(heights.every(height => height >= 40 && height <= 60));
  assert.equal(heights[0], heights.at(-1));
}

// Blobs: count blobs inside the ellipse, radii between a third and a half of rx, same seed gives the same cluster
{
  const cluster = blobs(3, 7, 100, 80, 60, 40);
  assert.equal(cluster.length, 7);
  for (const blob of cluster) {
    assert.ok(blob.radius >= 60 * 0.32 && blob.radius <= 60 * 0.5);
    assert.ok(Math.abs(blob.x - 100) <= 60 && Math.abs(blob.y - 80) <= 40);
  }
  assert.deepEqual(blobs(3, 7, 100, 80, 60, 40), cluster);
  assert.notDeepEqual(blobs(4, 7, 100, 80, 60, 40), cluster);
}

// Furrows: count + 1 lines from the horizon down to the bottom edge, spreading out from near the vanishing point
{
  const lines = [...furrows(1000, 600, 1080, 4, 500).matchAll(/M(-?[\d.]+) (\d+) L(-?[\d.]+) (\d+)/g)];
  assert.equal(lines.length, 5);
  for (const [, startX, top, endX, bottom] of lines) {
    assert.equal(Number(top), 600);
    assert.equal(Number(bottom), 1080);
    assert.ok(Math.abs(Number(startX) - 500) <= Math.abs(Number(endX) - 500));
  }
}

// Every shape has at least one part, every path starts with M
const shapes: Shape[] = [LEAF, PLANE, ...ICON_NAMES.map(name => ICONS[name])];
for (const shape of shapes) {
  assert.ok(shape.parts.length > 0);
  for (const part of shape.parts) assert.match(part.d, /^M/);
}
assert.deepEqual(ICON_NAMES, ["mango", "blatt", "kiste", "korb", "leiter", "sonne", "baum", "stern"]);

console.log("plantage field ok");
