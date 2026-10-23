// Check for roughSvg.ts: same seed, same sketch; another seed, another sketch; fills give an own part. Runs with npm test.
import assert from "node:assert/strict";
import { roughPath, type RoughShape, type RoughStyle } from "./roughSvg.ts";

const style: RoughStyle = { roughness: 1.5, bowing: 1, strokeWidth: 2, fill: "none" };
const box = { kind: "rectangle", x: 0, y: 0, width: 100, height: 60 } as const;

assert.deepEqual(roughPath(box, style, 7), roughPath(box, style, 7));
assert.notDeepEqual(roughPath(box, style, 7), roughPath(box, style, 8));
assert.ok(roughPath(box, style, 7).every(part => part.d.startsWith("M") && !part.filled));

// A filled shape has a fill part next to the outline
const filled = roughPath(box, { ...style, fill: "hachure" }, 7);
assert.ok(filled.some(part => part.filled) && filled.some(part => !part.filled));

// Seed 0 is not random (Rough.js would treat 0 as random)
assert.deepEqual(roughPath({ kind: "line", from: [0, 0], to: [50, 50] }, style, 0), roughPath({ kind: "line", from: [0, 0], to: [50, 50] }, style, 0));
assert.equal(roughPath({ kind: "polygon", points: [[0, 0], [10, 0], [5, 8]] }, style, 3).length > 0, true);
assert.equal(roughPath({ kind: "ellipse", x: 10, y: 10, width: 20, height: 10 }, style, 3).length > 0, true);
assert.equal(roughPath({ kind: "path", d: "M0 0 L10 10" }, style, 3).length > 0, true);

// single: one stroke per line like a print instead of the doubled sketch stroke
const line: RoughShape = { kind: "line", from: [0, 0], to: [100, 0] };
const strokes = (single: boolean) => (roughPath(line, { ...style, single }, 5)[0]?.d.match(/M/g) ?? []).length;
assert.equal(strokes(false), 2, "the sketch draws every line twice");
assert.equal(strokes(true), 1, "single draws it once");

console.log("roughSvg ok");
